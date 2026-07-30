import { createClient } from '@supabase/supabase-js';

// Defensive cleanup of the URL in case it has trailing slashes or /rest/v1/ suffix
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
supabaseUrl = supabaseUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// Defensive client creation to avoid crashes if environment variables are missing
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}
