import React from 'react';
import { Database, FolderLock, Lock, Server } from 'lucide-react';
import type { SupabaseReadinessInfo } from '../shared/types';

interface ArchitectureViewProps {
  readiness: SupabaseReadinessInfo | null;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ readiness }) => {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5 border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-semibold text-[#0B1F3A] tracking-tight">
          Supabase Integration Architecture
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Stage 1 prepares the repository interfaces, SQL schema blueprint, and private storage
          path structure for Supabase PostgreSQL, Supabase Auth, and Supabase Storage without
          relying on SQLite or browser local storage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-[#0B1F3A] font-semibold text-sm">
            <Database className="w-4 h-4 text-[#1D4ED8]" />
            <span>PostgreSQL Schema</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Defined in <span className="font-mono text-slate-800">supabase/schema.sql</span> with
            tables for <span className="font-mono">hr_form_templates</span>,{' '}
            <span className="font-mono">onboarding_invitations</span>,{' '}
            <span className="font-mono">onboarding_form_responses</span>, and{' '}
            <span className="font-mono">onboarding_documents</span>.
          </p>
          <p className="text-xs font-medium text-slate-700">
            Status: {readiness?.configured ? 'Credentials detected' : 'Blueprint ready (unconnected)'}
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-[#0B1F3A] font-semibold text-sm">
            <Lock className="w-4 h-4 text-[#1D4ED8]" />
            <span>Authentication Boundary</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            HR Admin sessions will authenticate via Supabase Auth with role-based RLS policies.
            Employees access onboarding strictly through signed, time-limited invitation tokens
            without creating an account.
          </p>
          <p className="text-xs font-medium text-amber-800">
            Stage 1 Notice: Authentication is not enforced yet in this preview shell.
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-[#0B1F3A] font-semibold text-sm">
            <FolderLock className="w-4 h-4 text-[#1D4ED8]" />
            <span>Private Document Storage</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Configured for private bucket{' '}
            <span className="font-mono text-slate-800">
              {readiness?.storageBucketName || 'dics-onboarding-documents'}
            </span>{' '}
            using deterministic keys{' '}
            <span className="font-mono">onboarding/&#123;token&#125;/&#123;slot&#125;/&#123;file&#125;</span>{' '}
            and server-issued signed URLs.
          </p>
          <p className="text-xs font-medium text-slate-700">
            Stage 1 Upload Mode: In-memory file validation only
          </p>
        </section>
      </div>

      {/* Repository Adapter Summary */}
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-[#0B1F3A]">
          <Server className="w-4 h-4 text-[#1D4ED8]" />
          <span>Data Persistence Separation</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-1.5">
            <p className="font-semibold text-[#0B1F3A]">No SQLite or LocalStorage Database</p>
            <p className="text-slate-600">
              Application data flows through the <span className="font-mono">OnboardingRepository</span>{' '}
              interface (<span className="font-mono">src/lib/supabase/repository.ts</span>) backed by
              Node/Express API endpoints in Stage 1, cleanly replaceable with Supabase JS / server
              clients in Stage 2.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-1.5">
            <p className="font-semibold text-[#0B1F3A]">Environment Variables Prepared</p>
            <p className="text-slate-600">
              <span className="font-mono">VITE_SUPABASE_URL</span>,{' '}
              <span className="font-mono">VITE_SUPABASE_ANON_KEY</span>,{' '}
              <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span>, and{' '}
              <span className="font-mono">SUPABASE_STORAGE_BUCKET</span> are documented in{' '}
              <span className="font-mono">.env.example</span>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
