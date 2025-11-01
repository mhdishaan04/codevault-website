import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { crypto } from 'https://deno.land/std@0.204.0/crypto/mod.ts';
import { Buffer } from 'https://deno.land/std@0.168.0/node/buffer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Helper: AES-GCM 256-bit Encryption ---
async function encryptCode(codeContent: string) {
  const key = crypto.getRandomValues(new Uint8Array(32)); // 32 bytes = 256 bits
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM
  
  const encodedCode = new TextEncoder().encode(codeContent);
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt']),
    encodedCode
  );
  
  const encryptedData = new Uint8Array(encryptedBuffer);
  const combinedBuffer = new Uint8Array(iv.length + encryptedData.length);
  combinedBuffer.set(iv);
  combinedBuffer.set(encryptedData, iv.length);

  return {
    encryptedFile: combinedBuffer,
    base64Key: Buffer.from(key).toString('base64'),
  };
}
// --- End Helper ---


serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get form data from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const sellerId = formData.get('sellerId') as string;
    const pyRequirementsStr = formData.get('pyRequirements') as string;
    
    // --- *** THIS IS THE NEW LINE *** ---
    const sellerEmail = formData.get('sellerEmail') as string;
    // --- *** END OF NEW LINE *** ---
    
    let pyRequirements: string[] = [];
    if (pyRequirementsStr) {
      try {
        pyRequirements = JSON.parse(pyRequirementsStr);
        if (!Array.isArray(pyRequirements)) {
            pyRequirements = [];
        }
      } catch (e) {
        pyRequirements = [];
      }
    }

    if (!file || !title || !description || !price || !sellerId || !sellerEmail) {
      throw new Error('Missing required form data.');
    }

    // 1. Read file content
    const codeContent = await file.text();

    // 2. Encrypt the code and generate a key
    const { encryptedFile, base64Key } = await encryptCode(codeContent);

    // 3. Upload the encrypted file to Supabase Storage
    const storagePath = `${sellerId}/${Date.now()}_${file.name}.enc`;
    
    const { error: storageError } = await supabase.storage
      .from('code-files')
      .upload(storagePath, encryptedFile.buffer, {
        contentType: 'application/octet-stream',
      });

    if (storageError) {
      throw new Error(`Storage Error: ${storageError.message}`);
    }

    // 4. Insert metadata into the 'code_listings' table
    const { error: dbError } = await supabase
      .from('code_listings')
      .insert({
        title: title,
        description: description,
        price: price,
        seller_id: sellerId,
        storage_path: storagePath,
        encryption_key: base64Key,
        py_requirements: pyRequirements,
        // --- *** THIS IS THE NEW LINE *** ---
        seller_email: sellerEmail 
        // --- *** END OF NEW LINE *** ---
      });

    if (dbError) {
      await supabase.storage.from('code-files').remove([storagePath]);
      throw new Error(`Database Error: ${dbError.message}`);
    }

    // 5. Return success
    return new Response(JSON.stringify({ success: true, path: storagePath }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in upload-and-encrypt:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});