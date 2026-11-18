import React from 'react';
import {
  ArrowRight,
  Database,
  FileText,
  Info,
  Link2,
  ShieldAlert,
} from 'lucide-react';
import type {
  AdminNavSection,
  HRFormDefinition,
  OnboardingInvitation,
  SupabaseReadinessInfo,
} from '../shared/types';

interface AdminDashboardViewProps {
  forms: HRFormDefinition[];
  invitations: OnboardingInvitation[];
  readiness: SupabaseReadinessInfo | null;
  loading: boolean;
  onNavigateSection: (section: AdminNavSection) => void;
  onOpenOnboardingLink: (token: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  forms,
  invitations,
  readiness,
  loading,
  onNavigateSection,
  onOpenOnboardingLink,
}) => {
  const sampleInvite = invitations[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-medium text-[#1D4ED8]">
            Digital Instruments &amp; Control Systems (DICS Global) · Bengaluru, India
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0B1F3A] tracking-tight text-balance">
            HR Onboarding Administration
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Stage 1 portal architecture for digitizing nine original DICS Global employee
            onboarding forms, issuing registration-free invitation links, and preparing
            Supabase database and private storage integration.
          </p>
        </div>

        {sampleInvite && (
          <button
            type="button"
            onClick={() => onOpenOnboardingLink(sampleInvite.token)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#0B1F3A] hover:bg-[#132D52] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <span>Launch Sample Onboarding View</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stage 1 Transparency Notice */}
      <section
        aria-label="Stage 1 implementation notice"
        className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-3.5"
      >
        <Info className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm text-slate-700">
          <p className="font-medium text-[#0B1F3A]">
            Stage 1 Initial Application Structure (No Live Employee Data Connected)
          </p>
          <p className="text-slate-600 leading-relaxed">
            Original form text, statutory fields, and company policies are intentionally omitted
            until the nine source HR documents are supplied. No fabricated employee submissions are
            generated, and HR authentication is not yet enforced in this preview shell.
          </p>
        </div>
      </section>

      {/* 4 KPI Summary Cells */}
      <section aria-label="Portal readiness metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Digitized Form Slots</span>
            <FileText className="w-4 h-4 text-[#1D4ED8]" />
          </div>
          <div className="text-2xl font-semibold text-[#0B1F3A] font-mono tabular-nums">
            {loading ? '—' : `${forms.length} / 9`}
          </div>
          <p className="text-xs text-slate-600">
            Separate form containers awaiting source mapping
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Invitation Link Templates</span>
            <Link2 className="w-4 h-4 text-[#1D4ED8]" />
          </div>
          <div className="text-2xl font-semibold text-[#0B1F3A] font-mono tabular-nums">
            {loading ? '—' : invitations.length}
          </div>
          <p className="text-xs text-slate-600">
            Token-accessible without employee registration
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Live Employee Submissions</span>
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-semibold text-[#0B1F3A] font-mono tabular-nums">
            0
          </div>
          <p className="text-xs text-slate-600">
            No fake submissions generated in Stage 1
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Supabase Integration</span>
            <Database className="w-4 h-4 text-[#1D4ED8]" />
          </div>
          <div className="text-lg font-semibold text-[#0B1F3A]">
            {readiness?.configured ? 'Configured' : 'Schema Prepared'}
          </div>
          <p className="text-xs text-slate-600 font-mono truncate">
            {readiness?.storageBucketName || 'dics-onboarding-documents'}
          </p>
        </div>
      </section>

      {/* Two-Column Operational Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Nine Form Modules Summary */}
        <section className="lg:col-span-7 rounded-lg border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#0B1F3A]">
                Nine Original HR Form Modules
              </h2>
              <p className="text-xs text-slate-500">
                Structural slots prepared for DICS Global onboarding packet digitization
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('forms')}
              className="text-xs font-medium text-[#1D4ED8] hover:underline whitespace-nowrap shrink-0"
            >
              Inspect All 9 Forms
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-9 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              forms.map((form) => (
                <div
                  key={form.id}
                  className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-medium text-[#0B1F3A] tabular-nums shrink-0">
                      {form.code}
                    </span>
                    <span className="text-sm text-slate-700 truncate">{form.title}</span>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
                    Template Pending
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Invitation & Submissions Empty State */}
        <section className="lg:col-span-5 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-[#0B1F3A]">
                Invitation Links
              </h2>
              <button
                type="button"
                onClick={() => onNavigateSection('invitations')}
                className="text-xs font-medium text-[#1D4ED8] hover:underline whitespace-nowrap"
              >
                Create Link
              </button>
            </div>

            {invitations.length === 0 ? (
              <p className="text-sm text-slate-600">
                No invitation links created yet. Generate a preview link to test the
                registration-free onboarding flow.
              </p>
            ) : (
              <div className="space-y-3">
                {invitations.slice(0, 3).map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-md border border-slate-200 bg-slate-50/60 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0B1F3A] truncate">
                          {inv.referenceLabel}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {inv.department} · {inv.targetRole}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenOnboardingLink(inv.token)}
                        className="px-2.5 py-1.5 rounded text-xs font-medium text-[#1D4ED8] border border-blue-200 bg-white hover:bg-blue-50 whitespace-nowrap shrink-0"
                      >
                        Open Link
                      </button>
                    </div>
                    <p className="font-mono text-[11px] text-slate-600 truncate">
                      {inv.invitePath}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-2.5">
            <h2 className="text-base font-semibold text-[#0B1F3A]">
              Employee Submissions Queue
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              No live employee submissions exist in Stage 1. Once Supabase tables and private
              storage policies are connected in Stage 2, candidate packets submitted via unique
              invitation links will appear here for HR review.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
