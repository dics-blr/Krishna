import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Plus,
  Search,
  User,
} from 'lucide-react';
import type { CreateInvitationInput } from '../lib/supabase/repository';
import {
  DICS_DEPARTMENTS,
  DICS_JOB_DESIGNATIONS,
  filterInvitations,
  getEffectiveInvitationStatus,
  validateDepartmentAndDesignation,
  validateInvitationInput,
} from '../shared/onboardingLogic';
import type {
  InvitationStatusFilter,
  OnboardingInvitation,
} from '../shared/types';

interface InvitationManagerViewProps {
  invitations: OnboardingInvitation[];
  loading: boolean;
  guidanceNotice?: string | null;
  onDismissGuidanceNotice?: () => void;
  onCreateInvitation: (input: CreateInvitationInput) => Promise<OnboardingInvitation>;
  onExpireInvitation: (id: string) => Promise<OnboardingInvitation>;
  onOpenOnboardingLink: (token: string) => void;
}

function copyTextFallback(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

export const InvitationManagerView: React.FC<InvitationManagerViewProps> = ({
  invitations,
  loading,
  guidanceNotice,
  onDismissGuidanceNotice,
  onCreateInvitation,
  onExpireInvitation,
  onOpenOnboardingLink,
}) => {
  const [referenceLabel, setReferenceLabel] = useState('');
  const [departmentOption, setDepartmentOption] = useState<string>('Engineering');
  const [customDepartment, setCustomDepartment] = useState('');
  const [designationOption, setDesignationOption] = useState<string>('Engineer');
  const [customDesignation, setCustomDesignation] = useState('');
  const [expiryDays, setExpiryDays] = useState(14);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    inviteUrl?: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvitationStatusFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setStatusFeedback(null);
    onDismissGuidanceNotice?.();

    const deptAndRole = validateDepartmentAndDesignation({
      departmentOption,
      customDepartment,
      designationOption,
      customDesignation,
    });

    if (!deptAndRole.valid) {
      setFormError(deptAndRole.error || 'Please select a valid department and job designation.');
      return;
    }

    const validation = validateInvitationInput({
      referenceLabel,
      department: deptAndRole.department,
      targetRole: deptAndRole.targetRole,
      expiryDays,
    });

    if (!validation.valid || !validation.normalized) {
      setFormError(
        validation.error || 'Please enter a valid employee name or reference.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await onCreateInvitation(validation.normalized);
      const inviteUrl = created.invitePath
        ? `${window.location.origin}${created.invitePath}`
        : undefined;
      setReferenceLabel('');
      setCustomDepartment('');
      setCustomDesignation('');
      setStatusFeedback({
        type: 'success',
        message: `Invitation link created for ${created.referenceLabel} (${created.department} — ${created.targetRole}). Share this personal link with the employee.`,
        inviteUrl,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create invitation link.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyUrl = async (id: string, fullUrl: string) => {
    let copied = false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(fullUrl);
        copied = true;
      } else {
        copied = copyTextFallback(fullUrl);
      }
    } catch {
      copied = copyTextFallback(fullUrl);
    }

    if (copied) {
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 2200);
    } else {
      setStatusFeedback({
        type: 'error',
        message: `Please copy the invitation link manually: ${fullUrl}`,
      });
    }
  };

  const handleExpire = async (inv: OnboardingInvitation) => {
    setStatusFeedback(null);
    try {
      const updated = await onExpireInvitation(inv.id);
      setStatusFeedback({
        type: 'success',
        message: `The invitation for ${updated.referenceLabel} has been marked as expired.`,
      });
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to expire invitation link.',
      });
    }
  };

  const filtered = useMemo(
    () => filterInvitations(invitations, searchQuery, statusFilter),
    [invitations, searchQuery, statusFilter]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1 border-b border-slate-200 pb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
          Candidate Onboarding Access
        </p>
        <h1 className="text-2xl font-semibold text-[#0B1F3A] tracking-tight">
          Employee Invitations
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Create and share personal onboarding links so new employees can complete all nine joining
          forms without creating a password or account.
        </p>
      </div>

      {guidanceNotice && (
        <div
          role="status"
          className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-[#0B1F3A] flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
            <span>{guidanceNotice}</span>
          </div>
          {onDismissGuidanceNotice && (
            <button
              type="button"
              onClick={onDismissGuidanceNotice}
              className="text-xs font-semibold text-[#C2410C] hover:underline shrink-0"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {statusFeedback && (
        <div
          role={statusFeedback.type === 'error' ? 'alert' : 'status'}
          className={`rounded-xl border px-4 py-3.5 text-sm space-y-2 ${
            statusFeedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-950'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {statusFeedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              )}
              <span>{statusFeedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusFeedback(null)}
              className="text-xs font-semibold underline shrink-0"
            >
              Dismiss
            </button>
          </div>
          {statusFeedback.inviteUrl && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pl-6">
              <input
                type="text"
                readOnly
                value={statusFeedback.inviteUrl}
                aria-label="New employee invitation link"
                className="flex-1 h-9 px-3 rounded-lg border border-emerald-300 bg-white text-xs text-slate-800"
              />
              <button
                type="button"
                onClick={() => void handleCopyUrl('banner-copy', statusFeedback.inviteUrl!)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132D52] text-white text-xs font-semibold shrink-0"
              >
                {copiedId === 'banner-copy' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Invitation Link</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Invitation Form */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#C2410C]">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#0B1F3A]">Create Employee Invitation</h2>
            <p className="text-xs text-slate-500">
              Enter employee details and select their department and job designation
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="invite-ref" className="block text-xs font-semibold text-slate-700">
                Employee Name / Reference
              </label>
              <input
                id="invite-ref"
                type="text"
                value={referenceLabel}
                onChange={(e) => {
                  setReferenceLabel(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="e.g. Rajesh Kumar"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-[#EA580C]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="invite-dept" className="block text-xs font-semibold text-slate-700">
                Department
              </label>
              <select
                id="invite-dept"
                value={departmentOption}
                onChange={(e) => {
                  setDepartmentOption(e.target.value);
                  if (formError) setFormError(null);
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-[#EA580C]"
              >
                {DICS_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {departmentOption === 'Other' && (
                <input
                  id="invite-dept-custom"
                  type="text"
                  aria-label="Custom Department Name"
                  value={customDepartment}
                  onChange={(e) => {
                    setCustomDepartment(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Enter department name"
                  className="w-full h-10 px-3 rounded-lg border border-[#EA580C] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="invite-role" className="block text-xs font-semibold text-slate-700">
                Job Designation
              </label>
              <select
                id="invite-role"
                value={designationOption}
                onChange={(e) => {
                  setDesignationOption(e.target.value);
                  if (formError) setFormError(null);
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-[#EA580C]"
              >
                {DICS_JOB_DESIGNATIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {designationOption === 'Other' && (
                <input
                  id="invite-role-custom"
                  type="text"
                  aria-label="Custom Job Designation"
                  value={customDesignation}
                  onChange={(e) => {
                    setCustomDesignation(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Enter job designation"
                  className="w-full h-10 px-3 rounded-lg border border-[#EA580C] text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="invite-expiry" className="block text-xs font-semibold text-slate-700">
                Link Valid For
              </label>
              <select
                id="invite-expiry"
                value={expiryDays}
                onChange={(e) => {
                  setExpiryDays(Number(e.target.value));
                  if (formError) setFormError(null);
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-[#EA580C]"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
          </div>

          {formError && (
            <div
              role="alert"
              className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Creating Invitation...' : 'Create Invitation Link'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Invitations Directory */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-[#0B1F3A]">
              Sent Invitations ({filtered.length})
            </h2>
            <p className="text-xs text-slate-500">
              Manage invitation links, copy access URLs, or expire unused invitations
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Search invitations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, department, or role"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
              />
            </div>

            <select
              aria-label="Filter by invitation status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvitationStatusFilter)}
              className="h-9 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
            >
              <option value="all">All Invitations</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-[#0B1F3A]">No invitations created yet</p>
            <p className="text-xs text-slate-500">
              Use the Create Employee Invitation form above to generate an employee onboarding link.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-[#0B1F3A]">No matching invitations found</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear Search &amp; Filter
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-5">Employee &amp; Department</th>
                    <th className="py-3 px-4">Job Designation</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4">Valid Until</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filtered.map((inv) => {
                    const hasLink = Boolean(inv.token && inv.invitePath);
                    const fullUrl = hasLink ? `${window.location.origin}${inv.invitePath}` : '';
                    const isCopied = copiedId === inv.id;
                    const effectiveStatus = getEffectiveInvitationStatus(inv);
                    const isExpired = effectiveStatus === 'expired';
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2 font-semibold text-[#0B1F3A]">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{inv.referenceLabel}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{inv.department}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{inv.targetRole}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                          {inv.createdAt.slice(0, 10)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                          {inv.expiresAt.slice(0, 10)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isExpired ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md border border-red-200 bg-red-50 text-xs font-semibold text-red-700">
                              Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center justify-end gap-2">
                            {hasLink ? (
                              <button
                                type="button"
                                onClick={() => void handleCopyUrl(inv.id, fullUrl)}
                                aria-label={`Copy link for ${inv.referenceLabel}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#0B1F3A] bg-white hover:bg-slate-50 whitespace-nowrap"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 px-2">
                                Link shared on creation
                              </span>
                            )}

                            {!isExpired && (
                              <button
                                type="button"
                                onClick={() => handleExpire(inv)}
                                aria-label={`Expire invitation for ${inv.referenceLabel}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 whitespace-nowrap"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Expire</span>
                              </button>
                            )}

                            {hasLink && (
                              <button
                                type="button"
                                onClick={() => onOpenOnboardingLink(inv.token)}
                                aria-label={`Open onboarding portal for ${inv.referenceLabel}`}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                                  isExpired
                                    ? 'border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    : 'bg-[#0B1F3A] hover:bg-[#132D52] text-white'
                                }`}
                              >
                                <span>Open Portal</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-200">
              {filtered.map((inv) => {
                const hasLink = Boolean(inv.token && inv.invitePath);
                const fullUrl = hasLink ? `${window.location.origin}${inv.invitePath}` : '';
                const isCopied = copiedId === inv.id;
                const effectiveStatus = getEffectiveInvitationStatus(inv);
                const isExpired = effectiveStatus === 'expired';
                return (
                  <div key={inv.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-sm text-[#0B1F3A]">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{inv.referenceLabel}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{inv.department}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            <span>{inv.targetRole}</span>
                          </span>
                        </div>
                      </div>
                      {isExpired ? (
                        <span className="px-2 py-0.5 rounded-md border border-red-200 bg-red-50 text-[11px] font-semibold text-red-700 shrink-0">
                          Expired
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700 shrink-0">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Valid until {inv.expiresAt.slice(0, 10)}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {hasLink && (
                        <button
                          type="button"
                          onClick={() => void handleCopyUrl(inv.id, fullUrl)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#0B1F3A] bg-white"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                        </button>
                      )}
                      {hasLink && (
                        <button
                          type="button"
                          onClick={() => onOpenOnboardingLink(inv.token)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-semibold"
                        >
                          <span>Open Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {!isExpired && (
                        <button
                          type="button"
                          onClick={() => handleExpire(inv)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Expire</span>
                        </button>
                      )}
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
