import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ClipboardCheck,
  FileText,
  Upload,
} from 'lucide-react';
import { HR_FORMS_CATALOG } from '../../shared/formsCatalog';
import { isFormSlotCompleted } from '../../shared/onboardingLogic';
import type { OnboardingSessionState, ProgressBreakdown } from '../../shared/types';

export type OnboardingStepKey =
  | 'overview'
  | `form-${string}`
  | 'documents'
  | 'review';

interface ProgressTrackerProps {
  activeStep: OnboardingStepKey;
  session: OnboardingSessionState;
  progress: ProgressBreakdown;
  onSelectStep: (step: OnboardingStepKey) => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  activeStep,
  session,
  progress,
  onSelectStep,
}) => {
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false);

  const handleStepSelect = (step: OnboardingStepKey) => {
    onSelectStep(step);
    setMobileStepsOpen(false);
  };

  return (
    <aside
      aria-label="Onboarding progress tracker"
      className="rounded-lg border border-slate-200 bg-white overflow-hidden"
    >
      <div className="p-4 border-b border-slate-200 space-y-2.5 bg-slate-50/70">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[#0B1F3A]">Onboarding Progress</h2>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[#1D4ED8] tabular-nums">
              {progress.percentComplete}%
            </span>
            <button
              type="button"
              onClick={() => setMobileStepsOpen((prev) => !prev)}
              aria-expanded={mobileStepsOpen}
              className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-medium text-slate-700"
            >
              <span>Steps</span>
              {mobileStepsOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div
          role="progressbar"
          aria-valuenow={progress.percentComplete}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall onboarding completion"
          className="h-2 w-full rounded-sm bg-slate-200 overflow-hidden"
        >
          <div
            className="h-full bg-[#1D4ED8] transition-all duration-200"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>

        <p className="text-xs text-slate-600 tabular-nums">
          {progress.completedFormsCount} of {progress.totalFormsCount} HR forms completed ·{' '}
          {progress.uploadedDocumentsCount} file(s) attached
        </p>
      </div>

      <nav
        aria-label="Onboarding steps"
        className={`p-2 space-y-0.5 ${mobileStepsOpen ? 'block' : 'hidden lg:block'}`}
      >
        <button
          type="button"
          onClick={() => handleStepSelect('overview')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium text-left transition-colors ${
            activeStep === 'overview'
              ? 'bg-[#0B1F3A] text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>00. Invitation Overview</span>
        </button>

        <div className="pt-2 pb-1 px-3 text-[11px] font-semibold text-slate-500">
          Nine Original HR Forms
        </div>

        {HR_FORMS_CATALOG.map((form) => {
          const isComplete = isFormSlotCompleted(session.formsById[form.id]);
          const isActive = activeStep === form.id;
          return (
            <button
              key={form.id}
              type="button"
              onClick={() => handleStepSelect(form.id as OnboardingStepKey)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-xs font-medium text-left transition-colors ${
                isActive
                  ? 'bg-[#0B1F3A] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">
                <span className="font-mono tabular-nums mr-1.5">
                  {String(form.formNumber).padStart(2, '0')}.
                </span>
                Form {String(form.formNumber).padStart(2, '0')} Slot
              </span>
              {isComplete ? (
                <CheckCircle2
                  aria-label={`Form ${form.formNumber} completed`}
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-300' : 'text-emerald-600'
                  }`}
                />
              ) : (
                <Circle
                  aria-label={`Form ${form.formNumber} pending`}
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-slate-300' : 'text-slate-300'
                  }`}
                />
              )}
            </button>
          );
        })}

        <div className="pt-2 pb-1 px-3 text-[11px] font-semibold text-slate-500">
          Attachments &amp; Submission
        </div>

        <button
          type="button"
          onClick={() => handleStepSelect('documents')}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md text-xs font-medium text-left transition-colors ${
            activeStep === 'documents'
              ? 'bg-[#0B1F3A] text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <Upload className="w-4 h-4 shrink-0" />
            <span>Document Upload</span>
          </span>
          {progress.hasUploadedDocument ? (
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${
                activeStep === 'documents' ? 'text-emerald-300' : 'text-emerald-600'
              }`}
            />
          ) : (
            <Circle className="w-4 h-4 shrink-0 text-slate-300" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleStepSelect('review')}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md text-xs font-medium text-left transition-colors ${
            activeStep === 'review'
              ? 'bg-[#0B1F3A] text-white'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <ClipboardCheck className="w-4 h-4 shrink-0" />
            <span>Final Review &amp; Submit</span>
          </span>
          {progress.isSubmitted ? (
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${
                activeStep === 'review' ? 'text-emerald-300' : 'text-emerald-600'
              }`}
            />
          ) : (
            <Circle className="w-4 h-4 shrink-0 text-slate-300" />
          )}
        </button>
      </nav>
    </aside>
  );
};
