import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Plus, Search } from 'lucide-react';
import type { OnboardingInvitation } from '../shared/types';
import type { CreateInvitationInput } from '../lib/supabase/repository';

interface InvitationManagerViewProps {
  invitations: OnboardingInvitation[];
  loading: boolean;
  onCreateInvitation: (input: CreateInvitationInput) => Promise<void>;
  onOpenOnboardingLink: (token: string) => void;
}

export const InvitationManagerView: React.FC<InvitationManagerViewProps> = ({
  invitations,
  loading,
  onCreateInvitation,
  onOpenOnboardingLink,
}) => {
  const [referenceLabel, setReferenceLabel] = useState('');
  const [department, setDepartment] = useState('Instrumentation & Controls');
  const [targetRole, setTargetRole] = useState('');
  const [expiryDays, setExpiryDays] = useState(14);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!referenceLabel.trim() || !department.trim() || !targetRole.trim()) {
      setFormError('Please provide a reference label, department, and role placeholder.');
      return;
    }

    setSubmitting(true);
    try {
      await onCreateInvitation({
        referenceLabel: referenceLabel.trim(),
        department: department.trim(),
        targetRole: targetRole.trim(),
        expiryDays,
      });
      setReferenceLabel('');
      setTargetRole('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create invitation link.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async (inv: OnboardingInvitation) => {
    const fullUrl = `${window.location.origin}${inv.invitePath}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedToken(inv.token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      setCopiedToken(inv.token);
    }
  };

  const filtered = invitations.filter((inv) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      inv.referenceLabel.toLowerCase().includes(q) ||
      inv.department.toLowerCase().includes(q) ||
      inv.targetRole.toLowerCase().includes(q) ||
      inv.token.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div className="space-y-1.5 border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-semibold text-[#0B1F3A] tracking-tight">
          Onboarding Invitation Management
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Generate unique, token-based onboarding links that let incoming employees complete all
          nine HR forms without registering an account. In Stage 1, links are created as
          in-memory preview templates without storing personal candidate data.
        </p>
      </div>

      {/* Create Invitation Form */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[#0B1F3A] mb-4">
          Create Preview Invitation Link
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="invite-ref" className="block text-xs font-medium text-slate-700">
              Non-PII Reference Label
            </label>
            <input
              id="invite-ref"
              type="text"
              value={referenceLabel}
              onChange={(e) => setReferenceLabel(e.target.value)}
              placeholder="e.g. Sample Link — Field Engineer"
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
              onChange={(e) => setDepartment(e.target.value)}
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
              Target Role Placeholder
            </label>
            <input
              id="invite-role"
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
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
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          {formError && (
            <div className="md:col-span-2 lg:col-span-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {formError}
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
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#0B1F3A]">
            Issued Preview Links ({filtered.length})
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Filter invitation links"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, role, or token"
              className="w-full h-9 pl-9 pr-3 rounded-md border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-medium text-slate-800">No matching invitation links</p>
            <p className="text-xs text-slate-500">
              Adjust your search filter or generate a new preview invitation link above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">Reference &amp; Role</th>
                  <th className="py-3 px-4">Invitation Path</th>
                  <th className="py-3 px-4">Access Mode</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((inv) => {
                  const isCopied = copiedToken === inv.token;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-[#0B1F3A]">{inv.referenceLabel}</div>
                        <div className="text-xs text-slate-500">
                          {inv.department} · {inv.targetRole}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        {inv.invitePath}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        Direct Link (No Registration)
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {inv.expiresAt.slice(0, 10)}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(inv)}
                            aria-label={`Copy invitation link for ${inv.referenceLabel}`}
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
                                <span>Copy URL</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenOnboardingLink(inv.token)}
                            aria-label={`Open onboarding portal for ${inv.referenceLabel}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#0B1F3A] hover:bg-[#132D52] text-xs font-medium text-white whitespace-nowrap"
                          >
                            <span>Open Portal</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
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
