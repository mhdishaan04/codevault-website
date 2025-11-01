// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// --- Add these lines for debugging ---
console.log('Supabase URL from env:', supabaseUrl);
console.log('Supabase Key from env:', supabaseAnonKey);
// --- End of debugging lines ---

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL or Anon Key is missing. Make sure they are defined in your .env file and prefixed with REACT_APP_'
  );
  // Optionally throw an error here too, or just let createClient handle it
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);