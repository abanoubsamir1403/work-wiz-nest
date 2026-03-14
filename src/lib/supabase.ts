import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// support both the older "anon" naming and the publishable key that might
// already be set in this project (.env uses VITE_SUPABASE_PUBLISHABLE_KEY).
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ensure environment variables are present during build/runtime
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // provide clear instructions to help developers debug
  throw new Error(
    'Missing Supabase configuration: please set VITE_SUPABASE_URL and either VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY in your environment (e.g. .env file)'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
