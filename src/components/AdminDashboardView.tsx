import React from 'react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileText,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import {
  getEffectiveInvitationStatus,
  getFriendlySubmissionStatus,
} from '../shared/onboardingLogic';
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

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso.slice(0, 10);
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusPillClasses(tone: 'neutral' | 'warning' | 'info' | 'success'): string {
  switch (tone) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'info':
      return 'border-orange-200 bg-orange-50 text-[#C2410C]';
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'neutral':
    default:
      return 'border-slate-200 bg-slate-100 text-slate-700';
  }
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  invitations,
  submissions,
  loading,
  onNavigateSection,
  onInspectSubmission,
}) => {
  const totalInvitations = invitations.length;

  const pendingSubmissionsCount = submissions.filter(
    (s) =>
      s.invitation.submissionState === 'not_submitted' ||
      s.invitation.submissionState === 'in_progress'
  ).length;

  const submittedApplicationsCount = submissions.filter(
    (s) =>
      s.invitation.submissionState === 'submitted' ||
      s.invitation.submissionState === 'preview_completed' ||
      s.invitation.submissionState === 'hr_verified'
  ).length;

  const pendingVerificationCount = submissions.filter(
    (s) =>
      s.invitation.submissionState === 'submitted' ||
      s.invitation.submissionState === 'preview_completed'
  ).length;

  const verifiedEmployeesCount = submissions.filter(
    (s) => s.invitation.submissionState === 'hr_verified'
  ).length;

  const activeInvitationsCount = invitations.filter(
    (inv) => getEffectiveInvitationStatus(inv) === 'active'
  ).length;

  const summaryCards = [
    {
      label: 'Total Invitations',
      value: totalInvitations,
      subtitle: `${activeInvitationsCount} active`,
      icon: Mail,
      accentBg: 'bg-slate-100 text-[#0B1F3A]',
      onClick: () => onNavigateSection('invitations'),
    },
    {
      label: 'Pending Submissions',
      value: pendingSubmissionsCount,
      subtitle: 'In progress or not started',
      icon: Clock,
      accentBg: 'bg-amber-50 text-amber-700',
      onClick: () => onNavigateSection('submissions'),
    },
    {
      label: 'Submitted Applications',
      value: submittedApplicationsCount,
      subtitle: 'Completed by employees',
      icon: FileText,
      accentBg: 'bg-orange-50 text-[#C2410C]',
      onClick: () => onNavigateSection('submissions'),
    },
    {
      label: 'Pending HR Verification',
      value: pendingVerificationCount,
      subtitle: 'Awaiting HR sign-off',
      icon: ShieldCheck,
      accentBg: 'bg-orange-50 text-[#EA580C]',
      onClick: () => onNavigateSection('verification'),
    },
    {
      label: 'Verified Employees',
      value: verifiedEmployeesCount,
      subtitle: 'Approved & finalized',
      icon: CheckCircle2,
      accentBg: 'bg-emerald-50 text-emerald-700',
      onClick: () => onNavigateSection('verification'),
    },
  ];

  // Build real chronological recent activity from invitations and submissions
  const recentActivity = [...submissions]
    .map((sub) => {
      const state = sub.invitation.submissionState;
      const name = sub.applicantName || sub.invitation.referenceLabel;
      const timestamp = sub.invitation.submittedAt || sub.invitation.createdAt;
      let headline = `Invitation sent to ${name}`;
      let detail = `${sub.invitation.department} · ${sub.invitation.targetRole}`;

      if (state === 'hr_verified') {
        headline = `${name} verified by HR`;
        detail = `${sub.invitation.department} · Onboarding completed`;
      } else if (state === 'submitted' || state === 'preview_completed') {
        headline = `${name} submitted onboarding forms`;
        detail = `${sub.completedFormsCount} of 9 forms · Ready for HR verification`;
      } else if (state === 'in_progress') {
        headline = `${name} started onboarding`;
        detail = `${sub.completedFormsCount} of 9 forms completed`;
      }

      return {
        id: sub.invitation.id,
        headline,
        detail,
        timestamp,
        state,
      };
    })
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
            Digital Instruments &amp; Control Systems · Bengaluru
          </p>
          <h1 className="text-2xl font-semibold text-[#0B1F3A] tracking-tight">
            HR Onboarding Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Track new employee invitations, application progress, and HR verification at a glance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateSection('verification')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0B1F3A] transition-colors whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4 text-[#C2410C]" />
            <span>Review Pending ({pendingVerificationCount})</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('invitations')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Employee</span>
          </button>
        </div>
      </div>

      {/* 5 Summary Metric Cards */}
      <section aria-label="Onboarding summary metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className="text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-[#EA580C]/60 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600">{card.label}</span>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${card.accentBg}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-bold text-[#0B1F3A] tabular-nums">
                {loading ? '—' : card.value}
              </div>
              <p className="text-xs text-slate-500">{card.subtitle}</p>
            </button>
          );
        })}
      </section>

      {/* Main Two-Column Section: Employee Status Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Employee Status Overview */}
        <section className="lg:col-span-8 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[#0B1F3A]">
                Employee Status Overview
              </h2>
              <p className="text-xs text-slate-500">
                Latest candidate onboarding progress and verification status
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('submissions')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#C2410C] hover:text-[#9A3412] whitespace-nowrap shrink-0"
            >
              <span>View All Submissions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                <UserPlus className="w-5 h-5 text-[#0B1F3A]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#0B1F3A]">
                  No employee invitations issued yet
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create your first invitation link to allow a new hire to complete their nine
                  joining forms online.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateSection('invitations')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create First Invitation</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {submissions.slice(0, 6).map((sub) => {
                const statusInfo = getFriendlySubmissionStatus(sub.invitation.submissionState);
                const pct = Math.round((sub.completedFormsCount / 9) * 100);
                return (
                  <div
                    key={sub.invitation.id}
                    className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B1F3A]">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {sub.applicantName || sub.invitation.referenceLabel}
                          </span>
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${statusPillClasses(
                            statusInfo.tone
                          )}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{sub.invitation.department}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{sub.invitation.targetRole}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="w-32 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-600 tabular-nums">
                          <span>{sub.completedFormsCount} of 9 forms</span>
                          <span>{sub.documentsCount} docs</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-[#EA580C] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onInspectSubmission(sub.invitation.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0B1F3A] whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Activity & Quick Actions */}
        <section className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[#0B1F3A]">Recent Activity</h2>
              <span className="text-xs text-slate-500">Latest updates</span>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="p-6 text-xs text-slate-500 text-center">
                Activity updates will appear here as invitations are sent and employees submit forms.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {recentActivity.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onInspectSubmission(item.id)}
                    className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3"
                  >
                    <span
                      className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        item.state === 'hr_verified'
                          ? 'bg-emerald-600'
                          : item.state === 'submitted' || item.state === 'preview_completed'
                            ? 'bg-[#EA580C]'
                            : 'bg-[#0B1F3A]'
                      }`}
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-semibold text-[#0B1F3A] leading-snug">
                        {item.headline}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug">{item.detail}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                      {formatShortDate(item.timestamp)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0B1F3A] flex items-center justify-center text-white shrink-0">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#0B1F3A]">Standard Joining Forms</h3>
                <p className="text-xs text-slate-500">All 9 DICS Global joining &amp; statutory forms</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review all nine joining forms completed by new hires, verify supporting documents, and
              download official filled PDFs individually or as a ZIP package.
            </p>
            <button
              type="button"
              onClick={() => onNavigateSection('forms')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C2410C] hover:text-[#9A3412]"
            >
              <span>View HR Forms Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
