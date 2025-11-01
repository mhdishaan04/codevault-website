// supabase/functions/modify-code/index.ts

console.log('[modify-code] SCRIPT STARTING - Top level.'); // <-- ADDED VERY EARLY LOG

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
    importKeyFromBase64,
    decryptData,
    separateIvAndCiphertext,
    generateAesKey,
    exportKeyToBase64,
    encryptData,
    combineIvAndCiphertext
} from '../_shared/cryptoUtils.ts'; // Ensure this path is correct

// --- Check for required env vars early ---
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const anonKey = Deno.env.get('SUPABASE_ANON_KEY'); // Also need anon key for user client helper

if (!supabaseUrl || !serviceKey || !geminiApiKey || !anonKey) {
  console.error("[modify-code] CRITICAL STARTUP ERROR: Missing required environment variables (Supabase URL/Service Key/Anon Key or Gemini Key).");
}

// --- CORRECTED GEMINI API URL ---
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Consider making this more specific
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Helper to create Supabase client with User context ---
function createAuthedClient(req: Request): SupabaseClient {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        throw new Error('Missing Authorization header');
    }
    if (!supabaseUrl || !anonKey) {
         throw new Error("Supabase URL or Anon Key missing for user client.");
    }
    return createClient(supabaseUrl, anonKey,
        { global: { headers: { Authorization: authHeader } } }
    );
}

// --- Helper to create Supabase client with Service Role Key ---
function createAdminClient(): SupabaseClient {
    if (!supabaseUrl || !serviceKey) {
        throw new Error("Supabase URL or Service Role Key missing for admin client.");
    }
    return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

// --- Interfaces ---
interface VersionWithKey {
    encryption_key: string | null;
}
interface ListingWithKey {
    encryption_key: string | null;
}
interface LatestVersionNumber {
    version_number: number | null;
}

// --- Main Serve Handler ---
serve(async (req) => {
    // --- ADDED LOG ---
    console.log(`[modify-code] SERVE HANDLER STARTED - Method: ${req.method}`);

    if (req.method === 'OPTIONS') {
        console.log('[modify-code] Handling OPTIONS request.');
        return new Response('ok', { headers: corsHeaders });
    }

    // Initialize clients within the handler if possible, to catch env var errors better
    let supabaseUserClient: SupabaseClient;
    let supabaseAdmin: SupabaseClient;

    try {
        // Check Env Vars again just before creating clients inside handler
         if (!supabaseUrl || !serviceKey || !geminiApiKey || !anonKey) {
            console.error("[modify-code] Handler Check: Missing required environment variables.");
            throw new Error('Server configuration error.');
        }

        supabaseUserClient = createAuthedClient(req); // Client for getting user
        supabaseAdmin = createAdminClient(); // Admin client for DB/Storage operations

        console.log('[modify-code] Clients initialized.');

        // 1. Get User
        const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
        if (userError) {
            console.error('[modify-code] Auth getUser error:', userError);
            throw userError;
        }
        if (!user) {
             console.warn('[modify-code] Auth getUser: No user found.');
             throw new Error('User not authenticated.');
        }
        console.log(`[modify-code] User ${user.id} authenticated.`);

        // 2. Get Request Body
        const body = await req.json();
        const { listingId, requestText, storagePath } = body;
         console.log('[modify-code] Request body parsed:', { listingId: !!listingId, requestText: !!requestText, storagePath: !!storagePath });
        if (!listingId || !requestText || !storagePath) {
            throw new Error('Missing listingId, requestText, or storagePath in body.');
        }
        console.log(`[modify-code] Request details - listingId: ${listingId}, path: ${storagePath}`);

        // 3. Verify Purchase
        console.log(`[modify-code] Verifying purchase for user ${user.id}, listing ${listingId}`);
        const { data: purchaseData, error: purchaseError } = await supabaseAdmin
            .from('purchases')
            .select('id')
            .eq('buyer_id', user.id)
            .eq('listing_id', listingId)
            .single();

        if (purchaseError) {
            console.error('[modify-code] Purchase verification error:', purchaseError);
            if (purchaseError.code === 'PGRST116') throw new Error('Purchase not found for this listing.');
            throw new Error(`Could not verify purchase: ${purchaseError.message}`);
        }
        const purchaseId = purchaseData.id;
        console.log(`[modify-code] Verified purchaseId: ${purchaseId}`);

        // 4. Fetch Encryption Key for the code to be modified
        let encryptionKeyBase64: string | null = null;
        const versionMatch = storagePath.match(/\/v(\d+)\.[^/]+\.enc$/);
        const versionNumberToModify = versionMatch ? parseInt(versionMatch[1], 10) : 0;

        console.log(`[modify-code] Fetching key for path: ${storagePath} (version: ${versionNumberToModify || 'original'})`);
        if (versionNumberToModify > 0) {
            const { data: versionKeyData, error: versionKeyError } = await supabaseAdmin
                .from('code_versions')
                .select('encryption_key')
                .eq('purchase_id', purchaseId)
                .eq('version_number', versionNumberToModify)
                .maybeSingle<VersionWithKey>();

            if (versionKeyError) throw new Error(`DB error fetching key for version ${versionNumberToModify}: ${versionKeyError.message}`);
            if (!versionKeyData) throw new Error(`Version ${versionNumberToModify} not found for purchase ${purchaseId}.`);
            encryptionKeyBase64 = versionKeyData.encryption_key;
        } else {
            const { data: listingKeyData, error: listingKeyError } = await supabaseAdmin
                .from('code_listings')
                .select('encryption_key')
                .eq('id', listingId)
                .single<ListingWithKey>();

            if (listingKeyError) throw new Error(`Could not find original listing data: ${listingKeyError.message}`);
            encryptionKeyBase64 = listingKeyData.encryption_key;
        }

        if (!encryptionKeyBase64) {
            throw new Error(`Encryption key not found for the specified code path: ${storagePath}`);
        }
        console.log('[modify-code] Encryption key fetched.');

        // 5. Download the ENCRYPTED code
        console.log(`[modify-code] Downloading encrypted code from: "${storagePath}"`);
        const { data: blobData, error: downloadError } = await supabaseAdmin
            .storage
            .from('code-files')
            .download(storagePath);

        if (downloadError || !blobData) {
            console.error('[modify-code] Storage download error:', downloadError);
            throw new Error(`Failed to retrieve code file for modification: ${downloadError?.message || 'Storage error'}`);
        }
        const combinedBuffer = await blobData.arrayBuffer();
        console.log(`[modify-code] Downloaded encrypted code (size: ${combinedBuffer.byteLength})`);

        // 6. Decrypt the Code
        console.log('[modify-code] Decrypting code...');
        let codeToModify = '';
        const cryptoKey = await importKeyFromBase64(encryptionKeyBase64);
        const { iv, encryptedData } = separateIvAndCiphertext(combinedBuffer);
        codeToModify = await decryptData(encryptedData, cryptoKey, iv);
        console.log(`[modify-code] Decryption successful (plaintext length: ${codeToModify.length}).`);

        // 7. Prepare prompt and call Gemini API
        console.log('[modify-code] Preparing prompt for Gemini...');
        const prompt = `You are an expert programmer. Modify the following code based ONLY on the user request. Output ONLY the modified code, no explanations or markdown formatting.

Original Code:
\`\`\`
${codeToModify}
\`\`\`

User Request: ${requestText}

Modified Code:`;

        const geminiResponse = await fetch(GEMINI_API_URL, { // URL is now corrected
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });
        console.log(`[modify-code] Gemini API response status: ${geminiResponse.status}`);

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error('[modify-code] Gemini API error:', geminiResponse.status, errorBody);
            // Throwing the error here will be caught by the main try...catch
            throw new Error(`Gemini API request failed: ${errorBody.substring(0, 200)}`);
        }
        const geminiResult = await geminiResponse.json();

        // 8. Process Gemini Result
        let modifiedCode = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
        if (!modifiedCode) {
            console.error('[modify-code] Modified code from Gemini is empty:', geminiResult);
            throw new Error('AI failed to return modified code content.');
        }
        if (modifiedCode.startsWith('```') && modifiedCode.endsWith('```')) {
           modifiedCode = modifiedCode.substring(modifiedCode.indexOf('\n') + 1, modifiedCode.lastIndexOf('\n')).trim();
        }
        console.log(`[modify-code] Extracted modified code (length: ${modifiedCode.length})`);

        // --- VERSIONING ---
        // 9. Determine Next Version Number
        console.log(`[modify-code] Fetching latest version number for purchaseId: ${purchaseId}`);
        const { data: versionData, error: versionError } = await supabaseAdmin
            .from('code_versions')
            .select('version_number')
            .eq('purchase_id', purchaseId)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle<LatestVersionNumber>();

        if (versionError) {
            console.error("[modify-code] Error fetching latest version number:", versionError);
            throw new Error("Could not determine next version number.");
        }
        const nextVersionNumber = (versionData?.version_number || 0) + 1;
        console.log(`[modify-code] Next version number is: ${nextVersionNumber}`);

        // 10. Define New Storage Path (with .enc)
        const baseStoragePath = storagePath.replace(/\.enc$/, '');
        const fileExtMatch = baseStoragePath.match(/\.([^./]+)$/);
        const fileExt = fileExtMatch ? fileExtMatch[1] : 'txt';
        const newVersionStoragePath = `versions/${user.id}/${listingId}/v${nextVersionNumber}.${fileExt}.enc`;
        console.log(`[modify-code] Generated new encrypted version path: "${newVersionStoragePath}"`);

        // 11. Encrypt the Modified Code
        console.log('[modify-code] Encrypting modified code...');
        let newEncryptionKeyBase64 = '';
        let encryptedUploadBuffer: ArrayBuffer;
        const newKey = await generateAesKey();
        newEncryptionKeyBase64 = await exportKeyToBase64(newKey);
        const { iv: newIv, encryptedData: newEncryptedData } = await encryptData(modifiedCode, newKey);
        encryptedUploadBuffer = combineIvAndCiphertext(newIv, newEncryptedData);
        console.log(`[modify-code] Encryption successful (key generated, size: ${encryptedUploadBuffer.byteLength})`);

        // 12. Upload Encrypted Modified Code
        console.log(`[modify-code] Uploading encrypted v${nextVersionNumber} to: "${newVersionStoragePath}"`);
        const { data: uploadData, error: uploadError } = await supabaseAdmin
            .storage
            .from('code-files')
            .upload(newVersionStoragePath, encryptedUploadBuffer, {
                contentType: 'application/octet-stream',
                upsert: false
            });

        if (uploadError) {
            console.error("[modify-code] Failed to upload new version file:", uploadError);
            throw new Error(`Failed to save modified code version: ${uploadError.message}`);
        }
        console.log(`[modify-code] Upload successful to: ${uploadData?.path || newVersionStoragePath}`);

        // 13. Insert Record into code_versions Table (with NEW KEY)
        console.log(`[modify-code] Inserting v${nextVersionNumber} record into code_versions`);
        const { data: insertVersionData, error: insertVersionError } = await supabaseAdmin
            .from('code_versions')
            .insert({
                purchase_id: purchaseId,
                storage_path: newVersionStoragePath, // Path to encrypted file
                modification_request: requestText,
                version_number: nextVersionNumber,
                encryption_key: newEncryptionKeyBase64 // <-- Save the new key
            })
            .select('storage_path')
            .single();

        if (insertVersionError) {
            console.error("[modify-code] Failed to insert into code_versions:", insertVersionError);
            console.log(`[modify-code] Attempting cleanup of orphaned storage file: ${newVersionStoragePath}`);
            await supabaseAdmin.storage.from('code-files').remove([newVersionStoragePath]).catch(cleanupErr => {
                console.error('[modify-code] Orphaned file cleanup failed:', cleanupErr);
            });
            throw new Error(`Failed to record code version metadata: ${insertVersionError.message}`);
        }
        // --- END VERSIONING ---

        console.log(`[modify-code] Successfully processed and saved encrypted version ${nextVersionNumber}.`);

        // 14. Return Success
        return new Response(JSON.stringify({
            success: true,
            message: `Code modified and saved as Version ${nextVersionNumber}.`,
            newVersion: {
                versionNumber: nextVersionNumber,
                storagePath: newVersionStoragePath // Path to the *encrypted* file
            }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

    } catch (error) {
        console.error('[modify-code] HANDLER ERROR:', error);
        let status = 500;
        if (error instanceof TypeError && error.message.includes('invalid URL')) status = 400;
        if (error.message.includes('Authentication') || error.message.includes('Authorization')) status = 401;
        if (error.message.includes('not found') || error.code === 'PGRST116') status = 404;
        if (error.message.includes('decrypt') || error.message.includes('encrypt')) status = 500; // Crypto error
        // Use includes for Gemini error message check
        if (error.message.includes('Gemini API request failed')) status = 502; // Bad Gateway (external service)
        if (error.message.includes('Missing')) status = 400; // Bad request

        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: status,
        });
    }
});

console.log('[modify-code] SCRIPT LOADED - serve handler defined.');