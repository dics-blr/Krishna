import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Plus,
  Search,
} from 'lucide-react';
import type { CreateInvitationInput } from '../lib/supabase/repository';
import {
  filterInvitations,
  getEffectiveInvitationStatus,
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
  const [department, setDepartment] = useState('Instrumentation & Controls');
  const [targetRole, setTargetRole] = useState('');
  const [expiryDays, setExpiryDays] = useState(14);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvitationStatusFilter>('all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setStatusFeedback(null);
    onDismissGuidanceNotice?.();

    const validation = validateInvitationInput({
      referenceLabel,
      department,
      targetRole,
      expiryDays,
    });

    if (!validation.valid || !validation.normalized) {
      setFormError(
        validation.error || 'Please provide a valid reference label, department, and target role.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await onCreateInvitation(validation.normalized);
      setReferenceLabel('');
      setTargetRole('');
      setStatusFeedback({
        type: 'success',
        message: `Invitation link created for "${created.referenceLabel}". Copy now (shown once): ${window.location.origin}${created.invitePath}`,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create invitation link.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async (inv: OnboardingInvitation) => {
    const fullUrl = `${window.location.origin}${inv.invitePath}`;
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
      setCopiedToken(inv.token);
      setStatusFeedback({
        type: 'success',
        message: `Copied invitation URL (${fullUrl}) to clipboard.`,
      });
      window.setTimeout(() => {
        setCopiedToken((current) => (current === inv.token ? null : current));
      }, 2000);
    } else {
      setStatusFeedback({
        type: 'error',
        message: `Unable to access clipboard automatically. Copy URL manually: ${fullUrl}`,
      });
    }
  };

  const handleExpire = async (inv: OnboardingInvitation) => {
    setStatusFeedback(null);
    try {
      const updated = await onExpireInvitation(inv.id);
      setStatusFeedback({
        type: 'success',
        message: `Invitation "${updated.referenceLabel}" (${updated.token || updated.tokenHint || updated.id}) has been marked as expired.`,
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
    <div className="space-y-8">
      <div className="space-y-1.5 border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-semibold text-[#0B1F3A] tracking-tight">
          Onboarding Invitation Management
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Generate unique, token-based onboarding links that let incoming employees complete all
          nine HR forms without registering an account. In Stage 1, invitations are stored
          temporarily in client-side in-memory session state and reset when the page is refreshed.
        </p>
      </div>

      {guidanceNotice && (
        <div
          role="status"
          className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-[#0B1F3A] flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
            <span>{guidanceNotice}</span>
          </div>
          {onDismissGuidanceNotice && (
            <button
              type="button"
              onClick={onDismissGuidanceNotice}
              className="text-xs font-medium text-[#1D4ED8] hover:underline shrink-0"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {statusFeedback && (
        <div
          role={statusFeedback.type === 'error' ? 'alert' : 'status'}
          className={`rounded-md border px-4 py-3 text-sm flex items-start justify-between gap-3 ${
            statusFeedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {statusFeedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <span className="break-all">{statusFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            className="text-xs font-medium underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create Invitation Form */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[#0B1F3A] mb-4">
          Create Preview Invitation Link
        </h2>

        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="invite-ref" className="block text-xs font-medium text-slate-700">
              Reference Label
            </label>
            <input
              id="invite-ref"
              type="text"
              value={referenceLabel}
              onChange={(e) => {
                setReferenceLabel(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. Field Controls Batch 01"
              className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="invite-dept" className="block text-xs font-medium text-slate-700">
              Department
            </label>
            <select
              id="invite-dept"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                if (formError) setFormError(null);
              }}
              className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            >
              <option value="Instrumentation & Controls">Instrumentation &amp; Controls</option>
              <option value="Automation Engineering">Automation Engineering</option>
              <option value="Quality & Calibration">Quality &amp; Calibration</option>
              <option value="Operations & Support">Operations &amp; Support</option>
              <option value="Human Resources">Human Resources</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="invite-role" className="block text-xs font-medium text-slate-700">
              Target Role
            </label>
            <input
              id="invite-role"
              type="text"
              value={targetRole}
              onChange={(e) => {
                setTargetRole(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="e.g. Control Systems Engineer"
              className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="invite-expiry" className="block text-xs font-medium text-slate-700">
              Link Validity Window
            </label>
            <select
              id="invite-expiry"
              value={expiryDays}
              onChange={(e) => {
                setExpiryDays(Number(e.target.value));
                if (formError) setFormError(null);
              }}
              className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          {formError && (
            <div
              role="alert"
              className="md:col-span-2 lg:col-span-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="md:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 text-white text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Creating Link...' : 'Generate Preview Invitation Link'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Invitations Table */}
      <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-[#0B1F3A]">
              Issued Preview Links ({filtered.length})
            </h2>
            <p className="text-xs text-slate-500">
              Temporary in-memory session list ({invitations.length} total)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Filter invitation links"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search label, role, or token"
                className="w-full h-9 pl-9 pr-3 rounded-md border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
              />
            </div>

            <select
              aria-label="Filter by invitation status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvitationStatusFilter)}
              className="h-9 px-3 rounded-md border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-medium text-slate-800">
              No invitation links created in this session yet
            </p>
            <p className="text-xs text-slate-500">
              Use the form above to generate a unique token-based onboarding link. Links remain
              available in memory until you refresh or close the browser tab.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-800">No matching invitation links</p>
              <p className="text-xs text-slate-500">
                Adjust your search query or status filter to view issued links.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="px-3 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">Reference, Dept &amp; Role</th>
                  <th className="py-3 px-4">Token &amp; Invitation URL</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((inv) => {
                  const hasRawToken = Boolean(inv.token && inv.invitePath);
                  const isCopied = hasRawToken && copiedToken === inv.token;
                  const effectiveStatus = getEffectiveInvitationStatus(inv);
                  const isExpired = effectiveStatus === 'expired';
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-[#0B1F3A]">{inv.referenceLabel}</div>
                        <div className="text-xs text-slate-500">
                          {inv.department} · {inv.targetRole}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs text-[#0B1F3A]">
                          {inv.token || inv.tokenHint || 'Hashed (issued once)'}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {inv.invitePath || 'One-time link shown at creation'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {inv.createdAt.slice(0, 10)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {inv.expiresAt.slice(0, 10)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isExpired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded border border-red-200 bg-red-50 text-xs font-medium text-red-700">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-2">
                          {hasRawToken && (
                            <button
                              type="button"
                              onClick={() => handleCopyLink(inv)}
                              aria-label={`Copy link for ${inv.referenceLabel}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 whitespace-nowrap"
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
                          )}

                          {!isExpired && (
                            <button
                              type="button"
                              onClick={() => handleExpire(inv)}
                              aria-label={`Expire invitation for ${inv.referenceLabel}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-700 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 whitespace-nowrap"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Expire</span>
                            </button>
                          )}

                          {hasRawToken && (
                            <button
                              type="button"
                              onClick={() => onOpenOnboardingLink(inv.token)}
                              aria-label={`Open onboarding portal for ${inv.referenceLabel}`}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
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
        )}
      </section>
    </div>
  );
};
