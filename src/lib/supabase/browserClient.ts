import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';

let cachedBrowserClient: SupabaseClient | null | undefined;
let runtimePublicConfig: { url: string; anonKey: string } | null = null;

export function configureSupabasePublicEnv(url?: string | null, anonKey?: string | null): void {
  const cleanUrl = (url ?? '').trim();
  const cleanAnonKey = (anonKey ?? '').trim();
  if (!cleanUrl || !cleanAnonKey) return;
  if (
    runtimePublicConfig?.url === cleanUrl &&
    runtimePublicConfig?.anonKey === cleanAnonKey
  ) {
    return;
  }
  runtimePublicConfig = { url: cleanUrl, anonKey: cleanAnonKey };
  // Reset cached client if it previously resolved to null or changed config
  if (!cachedBrowserClient) {
    cachedBrowserClient = undefined;
  }
}

/**
 * Returns the browser-side Supabase client initialized strictly with the public
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables for HR Admin authentication.
 * Never accesses or embeds SUPABASE_SERVICE_ROLE_KEY.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (cachedBrowserClient !== undefined) {
    return cachedBrowserClient;
  }

  const buildConfig = getSupabaseConfig();
  const url = buildConfig.url || runtimePublicConfig?.url || '';
  const anonKey = buildConfig.anonKey || runtimePublicConfig?.anonKey || '';
  if (!url || !anonKey) {
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
