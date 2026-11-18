import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SupabaseReadinessInfo } from './src/shared/types.ts';
import { getServerSupabaseEnvStatus, getSupabaseAdminClient } from './src/server/supabaseAdmin.ts';
import { SupabaseServerStore } from './src/server/onboardingBackend.ts';
import { createOnboardingApiRouter } from './src/server/onboardingRouter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function getSupabaseReadiness(): SupabaseReadinessInfo {
  const env = getServerSupabaseEnvStatus();
  const configured = env.fullyConfigured && env.anonKeyConfigured;
  return {
    configured,
    mode: configured ? 'supabase_connected' : 'stage1_preview',
    databaseSchemaFile: 'supabase/migrations/',
    storageBucketName: env.storageBucket,
    authEnforced: configured,
    authNotice: configured
      ? 'Supabase Auth and server-side service-role persistence are configured. All /api/admin/* routes require a valid HR Admin session.'
      : 'Supabase environment placeholders are empty. Running Stage 1 in-memory fallback on the frontend while protected backend API endpoints remain guarded.',
  };
}

function getOnboardingStore(): SupabaseServerStore | null {
  const client = getSupabaseAdminClient();
  if (!client) return null;
  const env = getServerSupabaseEnvStatus();
  return new SupabaseServerStore(client, env.storageBucket);
}

async function createApp() {
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

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DICS Onboarding Portal listening on http://localhost:${PORT}`);
  });
}

createApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
