// supabase/functions/modify-code/index.ts

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
} from '../_shared/cryptoUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Keeping Gemini 2.0 Flash as requested ---
// Note: Ensure 'gemini-2.0-flash' is valid in your region/access tier.
const GEMINI_MODEL = "gemini-2.0-flash"; 

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // --- 1. Environment Variable Check ---
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !serviceKey || !geminiApiKey || !anonKey) {
            console.error("Missing Env Vars");
            throw new Error("Server Misconfiguration: Missing API Keys.");
        }

        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;

        // --- 2. Initialize Clients ---
        const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
        
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const supabaseUserClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });

        // --- 3. Authenticate User ---
        const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
        if (userError || !user) throw new Error('User not authenticated.');

        // --- 4. Parse Request with Debug Logging ---
        const reqClone = req.clone();
        const rawBody = await reqClone.text();
        console.log(`[modify-code] Raw Body: ${rawBody}`);

        let body;
        try {
            body = JSON.parse(rawBody);
        } catch (e) {
            throw new Error(`Failed to parse JSON body: ${e.message}`);
        }

        // Allow fallback property names in case client cache is old
        const listingId = body.listingId;
        // Accept either requestText (new) or modificationRequest (old)
        const requestText = body.requestText || body.modificationRequest;
        // Accept either storagePath (new) or baseStoragePath (old)
        const storagePath = body.storagePath || body.baseStoragePath;

        console.log("[modify-code] Parsed:", { listingId, requestText, storagePath });

        if (!listingId || !requestText || !storagePath) {
            throw new Error(`Missing required parameters. Received: listingId=${!!listingId}, requestText=${!!requestText}, storagePath=${!!storagePath}`);
        }

        // --- 5. Verify Purchase & Ownership ---
        const { data: purchaseData, error: purchaseError } = await supabaseAdmin
            .from('purchases')
            .select('id')
            .eq('buyer_id', user.id)
            .eq('listing_id', listingId)
            .maybeSingle();

        if (purchaseError || !purchaseData) {
            throw new Error('Purchase not found or access denied.');
        }
        const purchaseId = purchaseData.id;

        // --- 6. Get Decryption Key ---
        let encryptionKeyBase64: string | null = null;
        const versionMatch = storagePath.match(/\/v(\d+)\.[^/]+\.enc$/);
        const versionNumber = versionMatch ? parseInt(versionMatch[1], 10) : 0;

        if (versionNumber > 0) {
             const { data: vData, error: vError } = await supabaseAdmin
                .from('code_versions')
                .select('encryption_key')
                .eq('purchase_id', purchaseId)
                .eq('version_number', versionNumber)
                .single();
            if (vError || !vData) throw new Error(`Version ${versionNumber} not found.`);
            encryptionKeyBase64 = vData.encryption_key;
        } else {
            const { data: lData, error: lError } = await supabaseAdmin
                .from('code_listings')
                .select('encryption_key')
                .eq('id', listingId)
                .single();
            if (lError || !lData) throw new Error('Original listing data not found.');
            encryptionKeyBase64 = lData.encryption_key;
        }

        if (!encryptionKeyBase64) throw new Error('Decryption key not found.');

        // --- 7. Download & Decrypt ---
        const { data: blobData, error: downloadError } = await supabaseAdmin.storage
            .from('code-files')
            .download(storagePath);

        if (downloadError || !blobData) throw new Error('Failed to download file from storage.');

        const combinedBuffer = await blobData.arrayBuffer();
        const cryptoKey = await importKeyFromBase64(encryptionKeyBase64);
        const { iv, encryptedData } = separateIvAndCiphertext(combinedBuffer);
        const plainCode = await decryptData(encryptedData, cryptoKey, iv);

        // --- 8. Call Gemini API ---
        const prompt = `
          You are an expert programmer. Modify the code below based on the user's request.
          
          IMPORTANT RULES:
          1. Return ONLY the modified code.
          2. Do NOT wrap it in markdown code blocks (no \`\`\`).
          3. Do NOT add explanations or comments unless they are in the code itself.
          
          USER REQUEST: "${requestText}"
          
          ORIGINAL CODE:
          ${plainCode}
        `;

        console.log(`[modify-code] Calling Gemini model: ${GEMINI_MODEL}`);
        const geminiResponse = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            console.error('Gemini API Error:', errText);
            throw new Error(`AI Generation Failed: ${geminiResponse.statusText} (${errText})`);
        }

        const geminiJson = await geminiResponse.json();
        let modifiedCode = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!modifiedCode) throw new Error('AI returned no code.');
        
        // Cleanup markdown
        modifiedCode = modifiedCode.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');

        // --- 9. Encrypt & Save New Version ---
        const nextVersionNumber = (await getLatestVersionNumber(supabaseAdmin, purchaseId)) + 1;
        
        const originalName = storagePath.split('/').pop()!.replace('.enc', '');
        const ext = originalName.includes('.') ? originalName.split('.').pop() : 'txt';
        const newStoragePath = `versions/${user.id}/${listingId}/v${nextVersionNumber}.${ext}.enc`;

        const newKey = await generateAesKey();
        const newKeyBase64 = await exportKeyToBase64(newKey);
        const { iv: newIv, encryptedData: newCipher } = await encryptData(modifiedCode, newKey);
        const uploadBuffer = combineIvAndCiphertext(newIv, newCipher);

        const { error: uploadError } = await supabaseAdmin.storage
            .from('code-files')
            .upload(newStoragePath, uploadBuffer, { contentType: 'application/octet-stream' });

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        const { error: dbError } = await supabaseAdmin
            .from('code_versions')
            .insert({
                purchase_id: purchaseId,
                version_number: nextVersionNumber,
                storage_path: newStoragePath,
                encryption_key: newKeyBase64,
                modification_request: requestText
            });

        if (dbError) {
             await supabaseAdmin.storage.from('code-files').remove([newStoragePath]);
             throw new Error(`Database insert failed: ${dbError.message}`);
        }

        return new Response(JSON.stringify({ 
            success: true, 
            newVersionNumber: nextVersionNumber,
            path: newStoragePath
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        console.error('Modify Code Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
        });
    }
});

async function getLatestVersionNumber(supabase: SupabaseClient, purchaseId: string): Promise<number> {
    const { data, error } = await supabase
        .from('code_versions')
        .select('version_number')
        .eq('purchase_id', purchaseId)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();
    
    if (error) throw error;
    return data ? data.version_number : 0;
}