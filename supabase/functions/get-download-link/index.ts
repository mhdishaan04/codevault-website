// supabase/functions/get-download-link/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to create Supabase client with user's auth context
function createAuthedClient(req: Request): SupabaseClient {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
}

// Helper to create Supabase client with Service Role Key
function createAdminClient(): SupabaseClient {
    return createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
    );
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let supabaseUserClient: SupabaseClient | null = null;
  const supabaseAdmin = createAdminClient(); // Use admin for reliable checks

  try {
    // 1. Authenticate user
    supabaseUserClient = createAuthedClient(req);
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated.');

    console.log(`[dl-link] User ${user.id} requesting download info.`);

    // 2. Get listingId and optional specificStoragePath from request body
    const { listingId, specificStoragePath } = await req.json();
    if (!listingId && !specificStoragePath) { // Need at least one to proceed
       throw new Error('Missing listingId or specificStoragePath in body.');
    }

    // 3. Verify Purchase and get necessary IDs/Paths
    // We need the purchase ID to give back to the client tool
    console.log(`[dl-link] Verifying purchase for listing ${listingId} by user ${user.id}`);
    const { data: purchaseData, error: purchaseError } = await supabaseAdmin
        .from('purchases')
        .select('id, listing_id, buyer_id, code_listings!inner(id, storage_path)') // Ensure listing exists via inner join
        .eq('buyer_id', user.id)
        .eq(listingId ? 'listing_id' : 'code_listings.storage_path', listingId ?? specificStoragePath) // Look up by listingId OR path
        .limit(1) // Expect only one purchase per user per listing
        .maybeSingle();

    if (purchaseError) {
         console.error('[dl-link] Error verifying purchase:', purchaseError);
         throw new Error('Database error during purchase verification.');
    }
    if (!purchaseData) {
        console.warn(`[dl-link] Purchase not found for listing ${listingId} / user ${user.id}`);
        return new Response(JSON.stringify({ error: 'Purchase not found or access denied.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const purchaseId = purchaseData.id;
    const actualListingId = purchaseData.listing_id; // Get the ID even if looked up by path
    const originalStoragePath = purchaseData.code_listings?.storage_path;

    if (!originalStoragePath) {
         console.error(`[dl-link] Original storage path missing for listing ${actualListingId}`);
         throw new Error('Could not find original code path.');
    }

    console.log(`[dl-link] Purchase ${purchaseId} verified for listing ${actualListingId}.`);

    // 4. Determine the specific ENCRYPTED file path and version number
    let encryptedFilePath: string | null = null;
    let versionNumber: number | null = null; // null or 0 means original

    if (specificStoragePath) {
        // Validate the specific path requested belongs to this user/listing/version structure
        const isOriginal = specificStoragePath === originalStoragePath;
        const versionMatch = specificStoragePath.match(/\/v(\d+)\.[^/]+$/); // Regex to find version number at the end
        const seemsValidVersionPath = versionMatch && specificStoragePath.startsWith(`versions/${user.id}/${actualListingId}/`);

        if (isOriginal) {
            encryptedFilePath = originalStoragePath;
            versionNumber = null; // Or 0, decide on convention
            console.log(`[dl-link] Request is for specific original path: "${encryptedFilePath}"`);
        } else if (seemsValidVersionPath) {
             encryptedFilePath = specificStoragePath;
             versionNumber = parseInt(versionMatch[1], 10);
             console.log(`[dl-link] Request is for specific version path: "${encryptedFilePath}", version: ${versionNumber}`);
        } else {
             console.warn(`[dl-link] Specific path "${specificStoragePath}" is invalid or doesn't match purchase context. Access denied.`);
             // Deny access if specific path doesn't match purchase/user context
             return new Response(JSON.stringify({ error: 'Invalid file path specified or access denied.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

    } else {
        // If no specific path, default to the LATEST available version (or original)
        console.log(`[dl-link] No specific path requested, finding latest version for purchase ${purchaseId}`);
        const { data: latestVersionData, error: versionError } = await supabaseAdmin
            .from('code_versions')
            .select('storage_path, version_number')
            .eq('purchase_id', purchaseId)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (versionError) {
            console.error('[dl-link] Error fetching latest version:', versionError.message);
            // Fallback gracefully to original even if DB error occurs
            encryptedFilePath = originalStoragePath;
            versionNumber = null;
            console.log('[dl-link] Falling back to original path due to version fetch error.');
        } else if (latestVersionData) {
            encryptedFilePath = latestVersionData.storage_path;
            versionNumber = latestVersionData.version_number;
            console.log(`[dl-link] Using latest version path: "${encryptedFilePath}", version: ${versionNumber}`);
        } else {
            encryptedFilePath = originalStoragePath;
            versionNumber = null; // Indicate original
            console.log(`[dl-link] No modified versions found, using original path: "${encryptedFilePath}"`);
        }
    }

    // Final check for path
    if (!encryptedFilePath) {
       console.error("[dl-link] FATAL: Could not determine encrypted file path after all checks.");
       return new Response(JSON.stringify({ error: 'Internal error: Could not determine file path.' }), { status: 500, /* ... headers ... */ });
    }

    // --- 5. Return Metadata for the Custom Tool ---
    // DO NOT generate a signed URL here anymore.
    const fileName = encryptedFilePath.split('/').pop() || 'unknownfile'; // Extract filename
    console.log(`[dl-link] Returning metadata: purchaseId=${purchaseId}, version=${versionNumber ?? 'original'}, path=${encryptedFilePath}`);
    return new Response(JSON.stringify({
      encryptedStoragePath: encryptedFilePath, // Path to the encrypted blob in storage
      purchaseId: purchaseId,                 // ID the tool needs to request the key
      versionNumber: versionNumber,           // Version (null/0 for original) tool needs for key request
      fileName: fileName                      // Filename for user feedback/saving
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[dl-link] Error:', error);
    const status = (error.message === 'Missing Authorization header' || error.message === 'User not authenticated.') ? 401 : 500;
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    });
  }
});