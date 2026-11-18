import type { SupabaseReadinessInfo } from '../../shared/types';

export function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL ?? '';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
  const configured = Boolean(url && anonKey);

  const readiness: SupabaseReadinessInfo = {
    configured,
    mode: configured ? 'supabase_connected' : 'stage1_preview',
    databaseSchemaFile: 'supabase/schema.sql',
    storageBucketName: 'dics-onboarding-documents',
    authNotice:
      'Stage 1 preview mode does not enforce production authentication. HR Admin login and signed storage URLs are prepared for Stage 2 Supabase Auth integration.',
  };

  return {
    url,
    anonKey,
    configured,
    readiness,
  };
}
