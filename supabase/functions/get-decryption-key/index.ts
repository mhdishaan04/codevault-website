// supabase/functions/get-decryption-key/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Define interfaces for expected data shapes (optional but good practice)
interface VersionData {
  encryption_key: string | null;
  purchases: { buyer_id: string } | null; // Join from purchases table
}

interface PurchaseData {
    buyer_id: string;
    code_listings: { encryption_key: string | null } | null; // Join from code_listings
}


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
        Deno.env.get('SUPABASE_ANON_KEY') ?? '', // Use anon key for user context client
        { global: { headers: { Authorization: authHeader } } }
    );
}

// Helper to create Supabase client with Service Role Key
function createAdminClient(): SupabaseClient {
    return createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } } // No need to persist session for admin client
    );
}


serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let supabaseUserClient: SupabaseClient | null = null;
  const supabaseAdmin = createAdminClient(); // Admin client needed to fetch keys securely

  try {
    // 1. Authenticate the user making the request
    supabaseUserClient = createAuthedClient(req);
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated.');

    console.log(`[get-key] User ${user.id} requesting key.`);

    // 2. Get purchaseId and optional versionNumber from request body
    // versionNumber = null or 0 means the original listing
    const { purchaseId, versionNumber } = await req.json();
    if (!purchaseId) {
      throw new Error('Missing purchaseId in request body.');
    }
    const parsedVersion = versionNumber ? parseInt(versionNumber, 10) : 0;

    let encryptionKey: string | null = null;
    let purchaseVerified = false;

    // 3. Fetch the key based on whether it's for a version or the original
    if (parsedVersion > 0) {
      // Fetch key from code_versions, joining purchases to verify ownership
      console.log(`[get-key] Fetching key for purchase ${purchaseId}, version ${parsedVersion}`);
      const { data, error } = await supabaseAdmin
        .from('code_versions')
        .select(`
          encryption_key,
          purchases!inner ( buyer_id )
        `)
        .eq('purchase_id', purchaseId)
        .eq('version_number', parsedVersion)
        .single<VersionData>(); // Use interface type

      if (error && error.code !== 'PGRST116') throw error; // Ignore 'not found' error here

      // Verify the buyer_id from the JOINED purchase record
      if (data && data.purchases?.buyer_id === user.id) {
        encryptionKey = data.encryption_key;
        purchaseVerified = true;
      }
    } else {
      // Fetch key from code_listings, joining purchases to verify ownership
      console.log(`[get-key] Fetching key for original purchase ${purchaseId}`);
      const { data, error } = await supabaseAdmin
        .from('purchases')
        .select(`
          buyer_id,
          code_listings!inner ( encryption_key )
        `)
        .eq('id', purchaseId)
        .single<PurchaseData>(); // Use interface type

      if (error && error.code !== 'PGRST116') throw error; // Ignore 'not found' error here

      if (data && data.buyer_id === user.id) {
        encryptionKey = data.code_listings?.encryption_key;
        purchaseVerified = true;
      }
    }

    // 4. Validate results
    if (!purchaseVerified) {
      console.warn(`[get-key] Purchase ${purchaseId} not found or doesn't belong to user ${user.id}`);
      return new Response(JSON.stringify({ error: 'Purchase not found or access denied.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!encryptionKey) {
      console.error(`[get-key] Encryption key is MISSING in DB for purchase ${purchaseId}, version ${parsedVersion}`);
      return new Response(JSON.stringify({ error: 'Encryption key not found for this item. Please contact support.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 5. Return the key
    console.log(`[get-key] Success: Returning key for user ${user.id}, purchase ${purchaseId}, version ${parsedVersion}`);
    return new Response(JSON.stringify({ encryptionKey: encryptionKey }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[get-key] Error:', error);
    // Distinguish auth errors from others
    const status = (error.message === 'Missing Authorization header' || error.message === 'User not authenticated.') ? 401 : 500;
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    });
  }
});