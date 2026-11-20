import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { HR_FORMS_CATALOG } from '../../shared/formsCatalog';
import {
  formatBytes,
  getFormProgressState,
  getFormResponseSummary,
  getFriendlyFormTitle,
} from '../../shared/onboardingLogic';
import type { AnyFormId, OnboardingSessionState, ProgressBreakdown } from '../../shared/types';
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
        'Please complete all nine onboarding forms, upload at least one supporting document, and check the final confirmation box before submitting.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitPreview();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (session.submittedAt && session.receiptCode) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-700" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-[#0B1F3A]">
              Onboarding Application Submitted Successfully
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Thank you! All nine onboarding forms and your supporting documents have been received
              and locked. Our HR team will review your submission shortly.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Confirmation Number</span>
            <span className="font-semibold text-[#0B1F3A] text-sm">{session.receiptCode}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Submitted On</span>
            <span className="font-semibold text-[#0B1F3A] text-sm tabular-nums">
              {session.submittedAt.replace('T', ' ').slice(0, 16)}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => onJumpToStep('overview')}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#0B1F3A] hover:bg-slate-50"
          >
            Back to Onboarding Overview
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7 space-y-6"
    >
      <div className="border-b border-slate-200 pb-5 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
          Final Step · Review &amp; Submit
        </p>
        <h2 className="text-xl font-semibold text-[#0B1F3A]">
          Final Review &amp; Submission
        </h2>
        <p className="text-sm text-slate-600">
          Verify that all nine joining forms and your supporting documents are complete before
          sending your application to HR.
        </p>
      </div>

      {/* 9-Form Checklist */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#0B1F3A]">
          Onboarding Forms Summary
        </h3>
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden">
          {HR_FORMS_CATALOG.map((form) => {
            const formId = form.id as AnyFormId;
            const formState = getFormProgressState(formId, session.formResponses);
            const summary = getFormResponseSummary(formId, session.formResponses);
            const friendlyTitle = getFriendlyFormTitle(form.id);
            return (
              <div
                key={form.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#C2410C] tabular-nums shrink-0">
                      {form.formNumber}.
                    </span>
                    <span className="text-sm font-semibold text-[#0B1F3A] truncate">
                      {friendlyTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5 pl-4">{summary}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {formState === 'completed' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </span>
                  ) : formState === 'in_progress' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>In Progress</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Not Started</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onJumpToStep(form.id as OnboardingStepKey)}
                    className="text-xs font-semibold text-[#C2410C] hover:underline whitespace-nowrap"
                  >
                    {formState === 'completed'
                      ? 'View Form'
                      : formState === 'in_progress'
                        ? 'Continue Form'
                        : 'Start Form'}
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
            Uploaded Documents ({session.uploadedDocuments.length})
          </h3>
          <button
            type="button"
            onClick={() => onJumpToStep('documents')}
            className="text-xs font-semibold text-[#C2410C] hover:underline"
          >
            Manage Documents
          </button>
        </div>

        {session.uploadedDocuments.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
            No supporting document has been uploaded yet. Please attach at least one document in
            Supporting Documents before submitting.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
            {session.uploadedDocuments.map((doc) => (
              <div key={doc.id} className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-[#0B1F3A] truncate">{doc.fileName}</span>
                <span className="text-slate-500 tabular-nums shrink-0">
                  {formatBytes(doc.sizeBytes)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Checkbox */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={session.finalDeclarationAccepted}
            onChange={(e) => {
              setSubmitError(null);
              onToggleDeclaration(e.target.checked);
            }}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C] focus:ring-[#EA580C]"
          />
          <span className="text-xs text-slate-700 leading-relaxed">
            I confirm that all information entered across all nine onboarding forms and all uploaded
            supporting documents are true, accurate, and complete to the best of my knowledge.
          </span>
        </label>
      </div>

      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
        >
          {submitError}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onPrevious}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-[#0B1F3A] bg-white hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Supporting Documents</span>
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 text-sm font-semibold text-white transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'Submitting Application...' : 'Submit Onboarding Application'}</span>
        </button>
      </div>
    </form>
  );
};
