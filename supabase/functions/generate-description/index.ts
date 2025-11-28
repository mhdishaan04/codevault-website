import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Get Gemini Key from Supabase secrets ---
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
if (!GEMINI_API_KEY) {
  console.error("CRITICAL: GEMINI_API_KEY environment variable is not set.");
}
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Read JSON body securely
    let body;
    try {
        body = await req.json();
    } catch (parseError) {
        throw new Error(`Failed to parse request body: ${parseError.message}`);
    }

    const { codeContent } = body;

    // --- LOGGING FOR DEBUGGING ---
    if (!codeContent || typeof codeContent !== 'string' || codeContent.trim().length === 0) {
      console.error("Missing or empty codeContent. Received body keys:", Object.keys(body));
      if (typeof codeContent === 'string') {
          console.error("codeContent length:", codeContent.length);
      }
      throw new Error('No code content provided. Please upload a valid non-empty code file.');
    }
    // -----------------------------
    
    const prompt = `
      Analyze the following code. Return ONLY a valid JSON object with two keys:
      1. "description": A concise, one-sentence description of what this code does.
      2. "requirements": An array of strings listing all non-standard, third-party libraries 
         that need to be installed (e.g., "numpy", "pandas", "yt_dlp", "flask"). 
         If there are no such libraries, return an empty array [].

      Do not include standard libraries like 'os', 'sys', 'json', 'crypto', 'path'.
      Do not add any markdown formatting like \`\`\`json.

      Code:
      """
      ${codeContent}
      """
    `;

    const geminiResponse = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        }),
    });

    if (!geminiResponse.ok) {
        const errorBody = await geminiResponse.text();
        console.error('Gemini API error:', geminiResponse.status, errorBody);
        throw new Error(`Gemini API request failed: ${errorBody.substring(0, 200)}`);
    }

    const geminiResult = await geminiResponse.json();
    const responseText = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    let aiResponse;
    try {
         aiResponse = JSON.parse(responseText);
    } catch (e) {
         console.error("AI returned invalid JSON string:", responseText);
         throw new Error("AI returned malformed JSON.");
    }

    if (!aiResponse.description || !Array.isArray(aiResponse.requirements)) {
        console.error("AI returned invalid JSON format structure. Received:", responseText);
        throw new Error('AI returned an invalid JSON format.');
    }
    
    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error generating description/requirements:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Changed to 400 for client errors
    });
  }
});