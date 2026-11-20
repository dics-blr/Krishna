import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  Building2,
  Eye,
  FileText,
  Paperclip,
  Search,
  User,
  UserPlus,
} from 'lucide-react';
import { getFriendlySubmissionStatus } from '../shared/onboardingLogic';
import type { AdminNavSection, HrSubmissionSummary } from '../shared/types';

interface EmployeeSubmissionsViewProps {
  submissions: HrSubmissionSummary[];
  loading: boolean;
  onInspectSubmission: (invitationId: string) => void;
  onNavigateSection: (section: AdminNavSection) => void;
}

type SubmissionFilter = 'all' | 'pending' | 'submitted' | 'verified';

function statusBadgeClasses(tone: 'neutral' | 'warning' | 'info' | 'success'): string {
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

export const EmployeeSubmissionsView: React.FC<EmployeeSubmissionsViewProps> = ({
  submissions,
  loading,
  onInspectSubmission,
  onNavigateSection,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionFilter>('all');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return submissions.filter((sub) => {
      const state = sub.invitation.submissionState;
      if (statusFilter === 'pending' && state !== 'not_submitted' && state !== 'in_progress') {
        return false;
      }
      if (
        statusFilter === 'submitted' &&
        state !== 'submitted' &&
        state !== 'preview_completed'
      ) {
        return false;
      }
      if (statusFilter === 'verified' && state !== 'hr_verified') {
        return false;
      }

      if (!q) return true;
      return (
        (sub.applicantName || '').toLowerCase().includes(q) ||
        sub.invitation.referenceLabel.toLowerCase().includes(q) ||
        sub.invitation.department.toLowerCase().includes(q) ||
        sub.invitation.targetRole.toLowerCase().includes(q)
      );
    });
  }, [submissions, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
            Onboarding Records
          </p>
          <h1 className="text-2xl font-semibold text-[#0B1F3A] tracking-tight">
            Employee Submissions
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Monitor form completion, uploaded supporting documents, and review submitted
            applications from joining employees.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateSection('invitations')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite New Employee</span>
        </button>
      </div>

      {/* Filters Bar */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'All Applications' },
                { id: 'pending', label: 'In Progress / Not Started' },
                { id: 'submitted', label: 'Submitted' },
                { id: 'verified', label: 'Verified' },
              ] as const
            ).map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#0B1F3A] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Search employee submissions"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, department, or role"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-[#0B1F3A]">No employee submissions yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Once an invitation is created, employee progress and completed forms will appear here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-[#0B1F3A]">
              No submissions match your search or filter
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Show All Applications
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-5">Employee</th>
                    <th className="py-3 px-4">Department &amp; Job Designation</th>
                    <th className="py-3 px-4">Forms Completed</th>
                    <th className="py-3 px-4">Documents</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filtered.map((sub) => {
                    const statusInfo = getFriendlySubmissionStatus(sub.invitation.submissionState);
                    const pct = Math.round((sub.completedFormsCount / 9) * 100);
                    return (
                      <tr key={sub.invitation.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2 font-semibold text-[#0B1F3A]">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{sub.applicantName || sub.invitation.referenceLabel}</span>
                          </div>
                          {sub.applicantName &&
                            sub.applicantName !== sub.invitation.referenceLabel && (
                              <p className="text-xs text-slate-500 pl-5">
                                Ref: {sub.invitation.referenceLabel}
                              </p>
                            )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-700 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{sub.invitation.department}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{sub.invitation.targetRole}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="w-32 space-y-1">
                            <span className="text-xs font-medium text-[#0B1F3A] tabular-nums">
                              {sub.completedFormsCount} of 9
                            </span>
                            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full bg-[#EA580C] rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-700 tabular-nums whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {sub.documentsCount} {sub.documentsCount === 1 ? 'file' : 'files'}
                            </span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-xs font-semibold ${statusBadgeClasses(
                              statusInfo.tone
                            )}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => onInspectSubmission(sub.invitation.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#132D52] text-white text-xs font-semibold whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-200">
              {filtered.map((sub) => {
                const statusInfo = getFriendlySubmissionStatus(sub.invitation.submissionState);
                const pct = Math.round((sub.completedFormsCount / 9) * 100);
                return (
                  <div key={sub.invitation.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-sm text-[#0B1F3A]">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {sub.applicantName || sub.invitation.referenceLabel}
                          </span>
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
                        className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold shrink-0 ${statusBadgeClasses(
                          statusInfo.tone
                        )}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-600 tabular-nums">
                          <span>{sub.completedFormsCount} of 9 forms</span>
                          <span>{sub.documentsCount} documents</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-[#EA580C] rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onInspectSubmission(sub.invitation.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-semibold shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
