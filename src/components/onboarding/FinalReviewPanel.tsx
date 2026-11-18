import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  Send,
} from 'lucide-react';
import { HR_FORMS_CATALOG } from '../../shared/formsCatalog';
import { formatBytes, isFormSlotCompleted } from '../../shared/onboardingLogic';
import type { OnboardingSessionState, ProgressBreakdown } from '../../shared/types';
import type { OnboardingStepKey } from './ProgressTracker';

interface FinalReviewPanelProps {
  session: OnboardingSessionState;
  progress: ProgressBreakdown;
  onToggleDeclaration: (accepted: boolean) => void;
  onJumpToStep: (step: OnboardingStepKey) => void;
  onSubmitPreview: () => Promise<void>;
  onPrevious: () => void;
}

export const FinalReviewPanel: React.FC<FinalReviewPanelProps> = ({
  session,
  progress,
  onToggleDeclaration,
  onJumpToStep,
  onSubmitPreview,
  onPrevious,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!progress.readyForSubmission) {
      setSubmitError(
        'Complete all nine HR form slots, attach at least one file, and check the final confirmation box before submitting.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitPreview();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Preview submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (session.submittedAt && session.receiptCode) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-[#0B1F3A]">
              Stage 1 Preview Submission Verified
            </h2>
            <p className="text-sm text-slate-600">
              All nine form containers and staged attachments passed Stage 1 completeness checks.
              No personal employee data was written to a production database in this initial stage.
            </p>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Preview Receipt Reference</span>
            <span className="font-mono font-semibold text-[#0B1F3A]">{session.receiptCode}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Invitation Token</span>
            <span className="font-mono text-slate-800">{session.invitationToken}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Verified Timestamp</span>
            <span className="font-mono text-slate-800 tabular-nums">
              {session.submittedAt.replace('T', ' ').slice(0, 19)} UTC
            </span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => onJumpToStep('overview')}
            className="px-4 py-2 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Return to Invitation Overview
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-5 sm:p-7 space-y-6"
    >
      <div className="border-b border-slate-200 pb-5 space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <FileCheck2 className="w-4 h-4 text-[#1D4ED8]" />
          <span>Final Verification</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {progress.completedFormsCount}/9 Forms Ready
          </span>
        </div>
        <h2 className="text-xl font-semibold text-[#0B1F3A]">
          Final Review &amp; Onboarding Submission
        </h2>
        <p className="text-sm text-slate-600">
          Review the status of all nine HR form slots and your attached documents before running
          final submission.
        </p>
      </div>

      {/* 9-Form Checklist */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#0B1F3A]">
          Nine Original HR Forms Summary
        </h3>
        <div className="divide-y divide-slate-200 rounded-md border border-slate-200 overflow-hidden">
          {HR_FORMS_CATALOG.map((form) => {
            const draft = session.formsById[form.id];
            const complete = isFormSlotCompleted(draft);
            return (
              <div
                key={form.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-[#1D4ED8] tabular-nums">
                      {form.code}
                    </span>
                    <span className="text-sm font-medium text-[#0B1F3A] truncate">
                      {form.title}
                    </span>
                  </div>
                  {draft?.templateFieldOne && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      Entry: {draft.templateFieldOne}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {complete ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Incomplete</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onJumpToStep(form.id as OnboardingStepKey)}
                    className="text-xs font-medium text-[#1D4ED8] hover:underline whitespace-nowrap"
                  >
                    {complete ? 'Edit' : 'Complete Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attached Documents Summary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0B1F3A]">
            Attached Documents ({session.uploadedDocuments.length})
          </h3>
          <button
            type="button"
            onClick={() => onJumpToStep('documents')}
            className="text-xs font-medium text-[#1D4ED8] hover:underline"
          >
            Manage Uploads
          </button>
        </div>

        {session.uploadedDocuments.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
            No supporting document has been attached yet. Attach at least one file in the Document
            Upload step before submission.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 rounded-md border border-slate-200">
            {session.uploadedDocuments.map((doc) => (
              <div key={doc.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-slate-800 truncate">{doc.fileName}</span>
                <span className="font-mono text-slate-500 tabular-nums shrink-0">
                  {formatBytes(doc.sizeBytes)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Neutral Confirmation Checkbox */}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={session.finalDeclarationAccepted}
            onChange={(e) => {
              setSubmitError(null);
              onToggleDeclaration(e.target.checked);
            }}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1D4ED8] focus:ring-[#1D4ED8]"
          />
          <span className="text-xs text-slate-700 leading-relaxed">
            I confirm that all nine form slots and attached document entries have been reviewed for
            this Stage 1 onboarding portal preview submission. (Final statutory declaration wording
            will be mapped from the original DICS Global documents in Stage 2.)
          </span>
        </label>
      </div>

      {submitError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
        >
          {submitError}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onPrevious}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Document Upload</span>
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#0B1F3A] hover:bg-[#132D52] disabled:opacity-60 text-sm font-medium text-white transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'Submitting Preview...' : 'Submit Onboarding Preview'}</span>
        </button>
      </div>
    </form>
  );
};
