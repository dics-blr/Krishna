import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { isFormSlotCompleted } from '../../shared/onboardingLogic';
import type { FormSlotDraft, HRFormDefinition } from '../../shared/types';

interface FormSlotEditorProps {
  form: HRFormDefinition;
  draft: FormSlotDraft;
  isFirstForm: boolean;
  isLastForm: boolean;
  onUpdateDraft: (formId: string, patch: Partial<FormSlotDraft>) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export const FormSlotEditor: React.FC<FormSlotEditorProps> = ({
  form,
  draft,
  isFirstForm,
  isLastForm,
  onUpdateDraft,
  onPrevious,
  onNext,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const completed = isFormSlotCompleted(draft);

  const handleSaveAndContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!draft.templateFieldOne.trim()) {
      setValidationError(
        `Please enter a sample reference value in Placeholder Field 01 for ${form.code}.`
      );
      return;
    }

    if (!draft.reviewedAndConfirmed) {
      setValidationError(
        `Please check the template confirmation box before continuing from ${form.code}.`
      );
      return;
    }

    onUpdateDraft(form.id, { updatedAt: new Date().toISOString() });
    onNext();
  };

  return (
    <form
      onSubmit={handleSaveAndContinue}
      className="rounded-lg border border-slate-200 bg-white p-5 sm:p-7 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span className="text-[#1D4ED8] font-semibold">{form.code}</span>
            <span aria-hidden="true">·</span>
            <span>Form {form.formNumber} of 9</span>
          </div>
          <h2 className="text-xl font-semibold text-[#0B1F3A]">{form.title}</h2>
        </div>

        <div className="shrink-0">
          {completed ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Slot Completed</span>
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded px-2.5 py-1">
              Pending Entry
            </span>
          )}
        </div>
      </div>

      {/* Unmapped Notice */}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          {form.summary} The fields below are neutral Stage 1 structural placeholders so you can
          verify navigation, draft state, and progress tracking across all nine forms.
        </p>
      </div>

      {/* Structural Section Outline */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Document Structure Slots
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {form.sectionSlots.map((sec) => (
            <div key={sec.id} className="rounded-md border border-slate-200 p-3.5 space-y-1">
              <p className="text-xs font-semibold text-[#0B1F3A]">{sec.heading}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{sec.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder Interactive Inputs */}
      <div className="space-y-4 pt-2 border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor={`${form.id}-field-1`}
              className="block text-xs font-medium text-slate-700"
            >
              Placeholder Field 01 (Mapped Entry Slot) <span className="text-red-600">*</span>
            </label>
            <input
              id={`${form.id}-field-1`}
              type="text"
              value={draft.templateFieldOne}
              onChange={(e) => {
                setValidationError(null);
                onUpdateDraft(form.id, {
                  templateFieldOne: e.target.value,
                  updatedAt: new Date().toISOString(),
                });
              }}
              placeholder={`Enter Stage 1 preview input for ${form.code}`}
              className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`${form.id}-field-2`}
              className="block text-xs font-medium text-slate-700"
            >
              Placeholder Field 02 (Optional Reference Slot)
            </label>
            <input
              id={`${form.id}-field-2`}
              type="text"
              value={draft.templateFieldTwo}
              onChange={(e) =>
                onUpdateDraft(form.id, {
                  templateFieldTwo: e.target.value,
                  updatedAt: new Date().toISOString(),
                })
              }
              placeholder="Optional secondary template entry"
              className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={`${form.id}-notes`}
            className="block text-xs font-medium text-slate-700"
          >
            Additional Notes / Document Mapping Remarks
          </label>
          <textarea
            id={`${form.id}-notes`}
            rows={3}
            value={draft.applicantNotes}
            onChange={(e) =>
              onUpdateDraft(form.id, {
                applicantNotes: e.target.value,
                updatedAt: new Date().toISOString(),
              })
            }
            placeholder="Optional notes for this form slot..."
            className="w-full px-3 py-2 rounded-md border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          />
        </div>

        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={draft.reviewedAndConfirmed}
              onChange={(e) => {
                setValidationError(null);
                onUpdateDraft(form.id, {
                  reviewedAndConfirmed: e.target.checked,
                  updatedAt: new Date().toISOString(),
                });
              }}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1D4ED8] focus:ring-[#1D4ED8]"
            />
            <span className="text-xs text-slate-700 leading-relaxed">
              Mark <span className="font-mono font-medium">{form.code}</span> template slot as
              reviewed and ready for final onboarding review.
            </span>
          </label>
        </div>
      </div>

      {validationError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
        >
          {validationError}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onPrevious}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isFirstForm ? 'Back to Overview' : `Previous (Form ${form.formNumber - 1})`}</span>
        </button>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#1D4ED8] hover:bg-[#1E40AF] text-sm font-medium text-white transition-colors"
        >
          <span>
            {isLastForm
              ? 'Save & Continue to Document Upload'
              : `Save & Continue to Form ${String(form.formNumber + 1).padStart(2, '0')}`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
