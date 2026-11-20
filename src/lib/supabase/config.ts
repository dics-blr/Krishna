import type { SupabaseReadinessInfo } from '../../shared/types';

export function getSupabaseConfig() {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  const url = (env.VITE_SUPABASE_URL ?? '').trim();
  const anonKey = (env.VITE_SUPABASE_ANON_KEY ?? '').trim();
  const configured = Boolean(url && anonKey);

  const readiness: SupabaseReadinessInfo = {
    configured,
    mode: configured ? 'supabase_connected' : 'stage1_preview',
    databaseSchemaFile: 'supabase/migrations/',
    storageBucketName: 'dics-onboarding-documents',
    authEnforced: true,
    authNotice: configured
      ? 'Supabase Auth is active for HR Admin access. Employee onboarding uses token-scoped backend endpoints.'
      : 'HR Portal access requires an authorized HR Administrator login.',
  };

  return {
    url,
    anonKey,
    configured,
    readiness,
  };
}
