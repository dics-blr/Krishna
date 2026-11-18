import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HR_FORMS_CATALOG } from './src/shared/formsCatalog.ts';
import {
  calculateOnboardingProgress,
  generatePreviewToken,
  isInvitationAccessible,
} from './src/shared/onboardingLogic.ts';
import type {
  OnboardingInvitation,
  OnboardingSessionState,
  SupabaseReadinessInfo,
} from './src/shared/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

// Stage 1 in-memory sample invitation templates (no real employee PII or fake submissions).
const stage1Invitations: OnboardingInvitation[] = [
  {
    id: 'inv-template-01',
    token: 'dics-stage1-preview',
    referenceLabel: 'Sample Onboarding Link — General Role Template',
    department: 'Instrumentation & Controls',
    targetRole: 'Role Placeholder (Template Preview)',
    status: 'preview',
    createdAt: '2026-11-18T00:00:00.000Z',
    expiresAt: '2026-12-31T23:59:59.000Z',
    invitePath: '/onboard/dics-stage1-preview',
    submissionState: 'not_submitted',
  },
];

function getSupabaseReadiness(): SupabaseReadinessInfo {
  const configured = Boolean(
    process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY
  );
  return {
    configured,
    mode: configured ? 'supabase_connected' : 'stage1_preview',
    databaseSchemaFile: 'supabase/schema.sql',
    storageBucketName: process.env.SUPABASE_STORAGE_BUCKET || 'dics-onboarding-documents',
    authNotice:
      'Stage 1 preview mode does not enforce production HR authentication. Token access and HR Admin auth are prepared for Stage 2 Supabase integration.',
  };
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      portal: 'DICS – Employee Onboarding Portal',
      organization: 'Digital Instruments & Control Systems (DICS Global)',
      location: 'Bengaluru, India',
      stage: 'stage1-initial-structure',
      supabase: getSupabaseReadiness(),
    });
  });

  app.get('/api/forms', (_req, res) => {
    res.json({ forms: HR_FORMS_CATALOG });
  });

  app.get('/api/invitations', (_req, res) => {
    res.json({ invitations: stage1Invitations });
  });

  app.post('/api/invitations', (req, res) => {
    const body = req.body as {
      referenceLabel?: unknown;
      department?: unknown;
      targetRole?: unknown;
      expiryDays?: unknown;
    };

    const referenceLabel =
      typeof body.referenceLabel === 'string' ? body.referenceLabel.trim() : '';
    const department =
      typeof body.department === 'string' ? body.department.trim() : '';
    const targetRole =
      typeof body.targetRole === 'string' ? body.targetRole.trim() : '';
    const expiryDays =
      typeof body.expiryDays === 'number' && body.expiryDays >= 1 && body.expiryDays <= 90
        ? Math.floor(body.expiryDays)
        : 14;

    if (!referenceLabel || !department || !targetRole) {
      res.status(400).json({
        error: 'Reference label, department, and target role placeholder are required.',
      });
      return;
    }

    const token = generatePreviewToken(referenceLabel);
    const now = new Date();
    const expires = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    const invitation: OnboardingInvitation = {
      id: `inv-${Date.now().toString(36)}`,
      token,
      referenceLabel,
      department,
      targetRole,
      status: 'active',
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      invitePath: `/onboard/${token}`,
      submissionState: 'not_submitted',
    };

    stage1Invitations.unshift(invitation);
    res.status(201).json({ invitation });
  });

  app.get('/api/onboarding/:token', (req, res) => {
    const { token } = req.params;
    const invitation = stage1Invitations.find((item) => item.token === token);
    const access = isInvitationAccessible(invitation);

    if (!access.accessible || !invitation) {
      res.status(invitation ? 410 : 404).json({
        error: access.reason || 'Onboarding invitation link not found.',
      });
      return;
    }

    res.json({
      invitation,
      forms: HR_FORMS_CATALOG,
    });
  });

  app.post('/api/onboarding/:token/preview-submit', (req, res) => {
    const { token } = req.params;
    const invitation = stage1Invitations.find((item) => item.token === token);
    const access = isInvitationAccessible(invitation);

    if (!access.accessible || !invitation) {
      res.status(invitation ? 410 : 404).json({
        error: access.reason || 'Onboarding invitation link not found.',
      });
      return;
    }

    const body = req.body as { session?: OnboardingSessionState };
    if (!body.session) {
      res.status(400).json({ error: 'Onboarding session payload is required.' });
      return;
    }

    const progress = calculateOnboardingProgress(body.session);
    if (!progress.readyForSubmission) {
      res.status(400).json({
        error:
          'All nine form slots, at least one document upload, and the final confirmation checkbox are required before preview submission.',
      });
      return;
    }

    const submittedAt = new Date().toISOString();
    const receiptCode = `DICS-PREVIEW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    res.json({
      receipt: {
        receiptCode,
        submittedAt,
        mode: 'stage1_preview',
        message:
          'Stage 1 dry-run verification succeeded. No personal data was persisted to a database in this initial stage.',
      },
    });
  });

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
