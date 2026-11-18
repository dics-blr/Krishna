import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedAdminClient: SupabaseClient | null | undefined;

export interface ServerSupabaseEnvStatus {
  urlConfigured: boolean;
  anonKeyConfigured: boolean;
  serviceRoleConfigured: boolean;
  fullyConfigured: boolean;
  storageBucket: string;
}

export function getServerSupabaseEnvStatus(): ServerSupabaseEnvStatus {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const storageBucket = (
    process.env.SUPABASE_STORAGE_BUCKET || 'dics-onboarding-documents'
  ).trim();

  return {
    urlConfigured: Boolean(url),
    anonKeyConfigured: Boolean(anonKey),
    serviceRoleConfigured: Boolean(serviceRoleKey),
    fullyConfigured: Boolean(url && serviceRoleKey),
    storageBucket,
  };
}

/**
 * Server-only Supabase client initialized with SUPABASE_SERVICE_ROLE_KEY.
 * Must NEVER be imported by frontend browser bundles.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (cachedAdminClient !== undefined) {
    return cachedAdminClient;
  }

  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!url || !serviceRoleKey) {
    cachedAdminClient = null;
    return null;
  }

  cachedAdminClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedAdminClient;
}
