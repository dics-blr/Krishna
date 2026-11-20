import 'dotenv/config';
import express, { type Express } from 'express';
import type { SupabaseReadinessInfo } from '../shared/types.ts';
import { getServerSupabaseEnvStatus, getSupabaseAdminClient } from './supabaseAdmin.ts';
import { SupabaseServerStore } from './onboardingBackend.ts';
import { createOnboardingApiRouter } from './onboardingRouter.ts';

export function getSupabaseReadiness(): SupabaseReadinessInfo {
  const env = getServerSupabaseEnvStatus();
  const configured = env.fullyConfigured && env.anonKeyConfigured;
  const publicUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const publicAnonKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  return {
    configured,
    mode: configured ? 'supabase_connected' : 'stage1_preview',
    databaseSchemaFile: 'supabase/migrations/',
    storageBucketName: env.storageBucket,
    authEnforced: true,
    authNotice: configured
      ? 'Supabase Auth and server-side service-role persistence are configured. All /api/admin/* routes require a valid HR Admin session.'
      : 'HR Portal access requires an authorized HR Administrator login. Configure Supabase runtime secrets to enable live sign-in.',
    publicAuthConfig: publicUrl && publicAnonKey ? { url: publicUrl, anonKey: publicAnonKey } : null,
  };
}

export function getOnboardingStore(): SupabaseServerStore | null {
  const client = getSupabaseAdminClient();
  if (!client) return null;
  const env = getServerSupabaseEnvStatus();
  return new SupabaseServerStore(client, env.storageBucket);
}

export function createApiApp(): Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    const readiness = getSupabaseReadiness();
    res.json({
      status: 'ok',
      portal: 'DICS – Employee Onboarding Portal',
      organization: 'Digital Instruments & Control Systems (DICS Global)',
      location: 'Bengaluru, India',
      stage: readiness.configured ? 'stage2-supabase-connected' : 'stage2-fallback-preview',
      supabase: readiness,
    });
  });

  app.use('/api', createOnboardingApiRouter(getOnboardingStore));

  return app;
}
