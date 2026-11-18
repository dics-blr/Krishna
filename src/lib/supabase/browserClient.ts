import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

let cachedBrowserClient: SupabaseClient | null | undefined;

/**
 * Returns the browser-side Supabase client initialized strictly with the public
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables for HR Admin authentication.
 * Never accesses or embeds SUPABASE_SERVICE_ROLE_KEY.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (cachedBrowserClient !== undefined) {
    return cachedBrowserClient;
  }

  const { url, anonKey, configured } = getSupabaseConfig();
  if (!configured) {
    cachedBrowserClient = null;
    return null;
  }

  cachedBrowserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return cachedBrowserClient;
}
