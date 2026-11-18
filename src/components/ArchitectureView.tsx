import React from 'react';
import { Database, FolderLock, Lock, Server } from 'lucide-react';
import type { SupabaseReadinessInfo } from '../shared/types';

interface ArchitectureViewProps {
  readiness: SupabaseReadinessInfo | null;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ readiness }) => {
  const configured = Boolean(readiness?.configured);

  return (
    <div className="space-y-8">
      <div className="space-y-1.5 border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-semibold text-[#0B1F3A] tracking-tight">
          Supabase Integration Architecture
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Stage 2 implements ordered PostgreSQL migrations, non-recursive HR RLS policies,
          protected Express API routes, private Storage signed URLs, and a development-safe Stage 1
          in-memory fallback when environment placeholders are empty.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-[#0B1F3A] font-semibold text-sm">
            <Database className="w-4 h-4 text-[#1D4ED8]" />
            <span>Ordered SQL Migrations</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Defined under <span className="font-mono text-slate-800">supabase/migrations/</span>:
            schema tables (<span className="font-mono">202611180001</span>), 9 HR template seeds (
            <span className="font-mono">202611180002</span>), and non-recursive RLS (
            <span className="font-mono">202611180003</span>).
          </p>
          <p className="text-xs font-medium text-slate-700">
            Status: {configured ? 'Credentials active' : 'Migrations prepared (not yet executed on live DB)'}
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-[#0B1F3A] font-semibold text-sm">
            <Lock className="w-4 h-4 text-[#1D4ED8]" />
            <span>Authentication &amp; RLS Boundary</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            HR Admins sign in via Supabase Auth and verify against{' '}
            <span className="font-mono">public.hr_admin_users</span>. Direct anonymous DB queries
            are revoked; employees access drafts only through token-scoped Express routes.
          </p>
          <p className={`text-xs font-medium ${configured ? 'text-emerald-700' : 'text-amber-800'}`}>
            {configured
              ? 'Auth Enforced: /api/admin/* requires Bearer JWT'
              : 'Placeholder Mode: Running Stage 1 fallback until Supabase secrets are set'}
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-[#0B1F3A] font-semibold text-sm">
            <FolderLock className="w-4 h-4 text-[#1D4ED8]" />
            <span>Private Document Storage</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Private bucket{' '}
            <span className="font-mono text-slate-800">
              {readiness?.storageBucketName || 'dics-onboarding-documents'}
            </span>{' '}
            uses deterministic paths{' '}
            <span className="font-mono">onboarding/&#123;token&#125;/&#123;slot&#125;/&#123;file&#125;</span>{' '}
            with server-issued signed upload &amp; download URLs.
          </p>
          <p className="text-xs font-medium text-slate-700">
            Upload Mode: {configured ? 'Signed URL Upload to Private Bucket' : 'In-Memory Preview Fallback'}
          </p>
        </section>
      </div>

      {/* Repository Adapter Summary */}
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-[#0B1F3A]">
          <Server className="w-4 h-4 text-[#1D4ED8]" />
          <span>Data Persistence &amp; Secret Separation</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-1.5">
            <p className="font-semibold text-[#0B1F3A]">Repository Switch &amp; Fallback</p>
            <p className="text-slate-600">
              <span className="font-mono">src/lib/supabase/repository.ts</span> selects{' '}
              <span className="font-mono">SupabaseApiRepository</span> when{' '}
              <span className="font-mono">VITE_SUPABASE_URL</span> &amp;{' '}
              <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> are present, and falls back
              to <span className="font-mono">Stage1InMemoryRepository</span> when placeholders are empty.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-md p-4 space-y-1.5">
            <p className="font-semibold text-[#0B1F3A]">Server-Only Service Role Secret</p>
            <p className="text-slate-600">
              <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> is read exclusively in{' '}
              <span className="font-mono">src/server/supabaseAdmin.ts</span> and{' '}
              <span className="font-mono">server.ts</span> — never prefixed with{' '}
              <span className="font-mono">VITE_</span> or bundled into browser assets.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
