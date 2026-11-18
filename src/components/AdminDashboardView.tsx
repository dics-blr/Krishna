import React from 'react';
import {
  ArrowRight,
  Database,
  Eye,
  FileText,
  Info,
  Link2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { getEffectiveInvitationStatus } from '../shared/onboardingLogic';
import type {
  AdminNavSection,
  HRFormDefinition,
  HrSubmissionSummary,
  OnboardingInvitation,
  SupabaseReadinessInfo,
} from '../shared/types';

interface AdminDashboardViewProps {
  forms: HRFormDefinition[];
  invitations: OnboardingInvitation[];
  submissions: HrSubmissionSummary[];
  readiness: SupabaseReadinessInfo | null;
  loading: boolean;
  onNavigateSection: (section: AdminNavSection) => void;
  onOpenOnboardingLink: (token: string) => void;
  onInspectSubmission: (invitationId: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  forms,
  invitations,
  submissions,
  readiness,
  loading,
  onNavigateSection,
  onOpenOnboardingLink,
  onInspectSubmission,
}) => {
  const sampleInvite = invitations.find(
    (inv) => getEffectiveInvitationStatus(inv) === 'active' && Boolean(inv.token && inv.invitePath)
  );
  const completedSubmissionsCount = submissions.filter(
    (s) =>
      s.invitation.submissionState === 'submitted' ||
      s.invitation.submissionState === 'hr_verified' ||
      s.invitation.submissionState === 'preview_completed'
  ).length;
  const isSupabaseConnected = Boolean(readiness?.configured);

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
            Manage nine original DICS Global onboarding forms, issue registration-free candidate
            invitation links, review submitted packets, and complete HR Office-Use verification.
          </p>
        </div>

        {sampleInvite && (
          <button
            type="button"
            onClick={() => onOpenOnboardingLink(sampleInvite.token)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#0B1F3A] hover:bg-[#132D52] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <span>Launch Active Onboarding Link</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Environment & Integration Status Notice */}
      <section
        aria-label="Portal integration status"
        className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-3.5"
      >
        <Info className="w-5 h-5 text-[#1D4ED8] shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm text-slate-700">
          <p className="font-medium text-[#0B1F3A]">
            {isSupabaseConnected
              ? 'Supabase Connected — Live Database, Auth & Private Storage Active'
              : 'Development Fallback Active — Supabase Credentials & Migrations Not Yet Configured'}
          </p>
          <p className="text-slate-600 leading-relaxed">
            {isSupabaseConnected
              ? 'Invitations, employee form drafts, signed document uploads, and HR Office-Use verification entries persist to PostgreSQL and private storage.'
              : 'All nine PDF forms (DICS-HR-01 through DICS-HR-09) and Stage 2 SQL migrations + protected API routes are ready. Because Supabase environment placeholders are currently empty, this browser preview uses the Stage 1 in-memory fallback.'}
          </p>
        </div>
      </section>

      {/* 4 KPI Summary Cells */}
      <section aria-label="Portal readiness metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Digitized HR Forms</span>
            <FileText className="w-4 h-4 text-[#1D4ED8]" />
          </div>
          <div className="text-2xl font-semibold text-[#0B1F3A] font-mono tabular-nums">
            {loading ? '—' : `${forms.filter((f) => f.mappingStatus === 'mapped').length} / 9`}
          </div>
          <p className="text-xs text-slate-600">
            Mapped from the 9 original DICS Global PDFs
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Issued Invitations</span>
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
            <span>{isSupabaseConnected ? 'Completed Submissions' : 'Session Submissions'}</span>
            {isSupabaseConnected ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="text-2xl font-semibold text-[#0B1F3A] font-mono tabular-nums">
            {loading ? '—' : completedSubmissionsCount}
          </div>
          <p className="text-xs text-slate-600">
            {isSupabaseConnected
              ? 'Submitted packets ready for HR Office-Use verification'
              : 'In-memory session submissions (not yet persisted to DB)'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Supabase Integration</span>
            <Database className="w-4 h-4 text-[#1D4ED8]" />
          </div>
          <div className="text-lg font-semibold text-[#0B1F3A]">
            {isSupabaseConnected ? 'Connected' : 'Fallback (Unconfigured)'}
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
                Mapped from the nine original DICS Global onboarding PDF documents
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
                    <span className="text-sm text-slate-700 truncate">{form.shortTitle}</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 whitespace-nowrap shrink-0">
                    {form.mappingStatus === 'mapped' ? 'Mapped from PDF' : 'Pending'}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Invitation & Submissions Queue */}
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
                No invitation links created yet. Generate a link to launch the registration-free
                employee onboarding flow.
              </p>
            ) : (
              <div className="space-y-3">
                {invitations.slice(0, 3).map((inv) => {
                  const isExpired = getEffectiveInvitationStatus(inv) === 'expired';
                  return (
                    <div
                      key={inv.id}
                      className="p-3.5 rounded-md border border-slate-200 bg-slate-50/60 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#0B1F3A] truncate">
                              {inv.referenceLabel}
                            </p>
                            <span
                              className={`text-[11px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${
                                isExpired
                                  ? 'border-red-200 bg-red-50 text-red-700'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {inv.department} · {inv.targetRole}
                          </p>
                        </div>
                        {inv.token && inv.invitePath ? (
                          <button
                            type="button"
                            onClick={() => onOpenOnboardingLink(inv.token)}
                            className="px-2.5 py-1.5 rounded text-xs font-medium text-[#1D4ED8] border border-blue-200 bg-white hover:bg-blue-50 whitespace-nowrap shrink-0"
                          >
                            Open Link
                          </button>
                        ) : (
                          <span className="px-2 py-1 rounded text-[11px] font-medium text-slate-500 border border-slate-200 bg-white whitespace-nowrap shrink-0">
                            Issued once
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[11px] text-slate-600 truncate">
                        {inv.invitePath || inv.tokenHint || 'SHA-256 protected'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-base font-semibold text-[#0B1F3A]">
              Employee Submissions Queue
            </h2>
            {submissions.length === 0 ? (
              <p className="text-sm text-slate-600 leading-relaxed">
                {isSupabaseConnected
                  ? 'No candidate onboarding packets recorded yet. Create an invitation link to begin.'
                  : 'No candidate packets recorded in the current fallback session yet. Create an invitation link to preview onboarding.'}
              </p>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-md overflow-hidden">
                {submissions.slice(0, 5).map((sub) => (
                  <div
                    key={sub.invitation.id}
                    className="p-3 bg-white flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0B1F3A] truncate">
                        {sub.applicantName || sub.invitation.referenceLabel}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {sub.completedFormsCount}/9 forms · {sub.documentsCount} docs ·{' '}
                        {sub.invitation.submissionState}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onInspectSubmission(sub.invitation.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
