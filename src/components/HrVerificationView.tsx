import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  FileDown,
  Paperclip,
  ShieldCheck,
  User,
} from 'lucide-react';
import { getFriendlySubmissionStatus } from '../shared/onboardingLogic';
import type { HrSubmissionSummary } from '../shared/types';

interface HrVerificationViewProps {
  submissions: HrSubmissionSummary[];
  loading: boolean;
  onInspectSubmission: (invitationId: string) => void;
}

type VerificationTab = 'pending_verification' | 'verified' | 'all';

export const HrVerificationView: React.FC<HrVerificationViewProps> = ({
  submissions,
  loading,
  onInspectSubmission,
}) => {
  const [activeTab, setActiveTab] = useState<VerificationTab>('pending_verification');

  const pendingVerification = useMemo(
    () =>
      submissions.filter(
        (s) =>
          s.invitation.submissionState === 'submitted' ||
          s.invitation.submissionState === 'preview_completed'
      ),
    [submissions]
  );

  const verifiedList = useMemo(
    () => submissions.filter((s) => s.invitation.submissionState === 'hr_verified'),
    [submissions]
  );

  const displayed = useMemo(() => {
    if (activeTab === 'pending_verification') return pendingVerification;
    if (activeTab === 'verified') return verifiedList;
    return submissions;
  }, [activeTab, pendingVerification, verifiedList, submissions]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
          HR Sign-Off &amp; Official PDF Downloads
        </p>
        <h1 className="text-2xl font-semibold text-[#0B1F3A] tracking-tight">
          HR Verification
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Review submitted applications, verify supporting documents, fill HR Office-Use details,
          and download completed employee forms.
        </p>
      </div>

      {/* Verification Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('pending_verification')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'pending_verification'
              ? 'bg-[#C2410C] text-white'
              : 'bg-white border border-slate-200 text-[#0B1F3A] hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Verification ({pendingVerification.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('verified')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'verified'
              ? 'bg-[#0B1F3A] text-white'
              : 'bg-white border border-slate-200 text-[#0B1F3A] hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verified Employees ({verifiedList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'all'
              ? 'bg-[#0B1F3A] text-white'
              : 'bg-white border border-slate-200 text-[#0B1F3A] hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>All Records ({submissions.length})</span>
        </button>
      </div>

      {/* Queue Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center space-y-2">
          <ShieldCheck className="w-9 h-9 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-[#0B1F3A]">
            {activeTab === 'pending_verification'
              ? 'No applications currently waiting for HR verification'
              : activeTab === 'verified'
                ? 'No verified employees recorded yet'
                : 'No onboarding records available yet'}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeTab === 'pending_verification'
              ? 'When an employee completes and submits their nine onboarding forms, they will appear here for HR review and PDF export.'
              : 'Verified applications and filled HR Office-Use records will be listed here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.map((sub) => {
            const statusInfo = getFriendlySubmissionStatus(sub.invitation.submissionState);
            const isVerified = sub.invitation.submissionState === 'hr_verified';
            return (
              <div
                key={sub.invitation.id}
                className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between gap-4 hover:border-[#EA580C]/60 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#0B1F3A] shrink-0" />
                        <h2 className="text-base font-semibold text-[#0B1F3A] truncate">
                          {sub.applicantName || sub.invitation.referenceLabel}
                        </h2>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sub.invitation.department}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sub.invitation.targetRole}</span>
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-xs font-semibold shrink-0 ${
                        isVerified
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : sub.invitation.submissionState === 'submitted' ||
                              sub.invitation.submissionState === 'preview_completed'
                            ? 'border-orange-200 bg-orange-50 text-[#C2410C]'
                            : 'border-slate-200 bg-slate-100 text-slate-700'
                      }`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Forms Completed</span>
                      <span className="font-semibold text-[#0B1F3A] tabular-nums">
                        {sub.completedFormsCount} of 9 forms
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Supporting Files</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#0B1F3A] tabular-nums">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sub.documentsCount} uploaded</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 tabular-nums">
                    {sub.invitation.submittedAt
                      ? `Submitted on ${sub.invitation.submittedAt.slice(0, 10)}`
                      : `Invited on ${sub.invitation.createdAt.slice(0, 10)}`}
                  </span>

                  <button
                    type="button"
                    onClick={() => onInspectSubmission(sub.invitation.id)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      isVerified
                        ? 'bg-[#0B1F3A] hover:bg-[#132D52] text-white'
                        : 'bg-[#C2410C] hover:bg-[#9A3412] text-white'
                    }`}
                  >
                    {isVerified ? (
                      <>
                        <FileDown className="w-3.5 h-3.5" />
                        <span>View &amp; Download PDFs</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Review &amp; Verify</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
