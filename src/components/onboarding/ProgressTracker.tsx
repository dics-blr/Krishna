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
import { getFormProgressState, getFriendlyFormTitle } from '../../shared/onboardingLogic';
import type { AnyFormId, OnboardingSessionState, ProgressBreakdown } from '../../shared/types';

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
      aria-label="Onboarding checklist steps"
      className="rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      <div className="p-4 border-b border-slate-200 space-y-2.5 bg-[#0B1F3A] text-white">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Your Progress</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#FDBA74] tabular-nums">
              {progress.percentComplete}%
            </span>
            <button
              type="button"
              onClick={() => setMobileStepsOpen((prev) => !prev)}
              aria-expanded={mobileStepsOpen}
              className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-white/20 bg-white/10 text-xs font-medium text-white"
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
          aria-label="Overall onboarding progress"
          className="h-2 w-full rounded-full bg-white/20 overflow-hidden"
        >
          <div
            className="h-full bg-[#EA580C] rounded-full transition-all duration-200"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>

        <p className="text-xs text-slate-300 tabular-nums">
          {progress.completedFormsCount} of {progress.totalFormsCount} forms ·{' '}
          {progress.uploadedDocumentsCount}{' '}
          {progress.uploadedDocumentsCount === 1 ? 'document' : 'documents'}
        </p>
      </div>

      <nav
        aria-label="Onboarding steps"
        className={`p-2.5 space-y-0.5 ${mobileStepsOpen ? 'block' : 'hidden lg:block'}`}
      >
        <button
          type="button"
          onClick={() => handleStepSelect('overview')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
            activeStep === 'overview'
              ? 'bg-[#C2410C] text-white'
              : 'text-[#0B1F3A] hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Onboarding Overview</span>
        </button>

        <div className="pt-2.5 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Joining Forms
        </div>

        {HR_FORMS_CATALOG.map((form) => {
          const state = getFormProgressState(form.id as AnyFormId, session.formResponses);
          const isActive = activeStep === form.id;
          return (
            <button
              key={form.id}
              type="button"
              onClick={() => handleStepSelect(form.id as OnboardingStepKey)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                isActive
                  ? 'bg-[#C2410C] text-white font-semibold'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-[#0B1F3A]'
              }`}
            >
              <span className="truncate">
                <span className="tabular-nums mr-1.5 font-semibold">{form.formNumber}.</span>
                {getFriendlyFormTitle(form.id)}
              </span>
              {state === 'completed' ? (
                <CheckCircle2
                  aria-label={`${getFriendlyFormTitle(form.id)} completed`}
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-emerald-600'
                  }`}
                />
              ) : state === 'in_progress' ? (
                <span
                  aria-label={`${getFriendlyFormTitle(form.id)} in progress`}
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isActive ? 'bg-white' : 'bg-[#EA580C]'
                  }`}
                />
              ) : (
                <Circle
                  aria-label={`${getFriendlyFormTitle(form.id)} not started`}
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white/70' : 'text-slate-300'
                  }`}
                />
              )}
            </button>
          );
        })}

        <div className="pt-2.5 pb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Documents &amp; Submission
        </div>

        <button
          type="button"
          onClick={() => handleStepSelect('documents')}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
            activeStep === 'documents'
              ? 'bg-[#C2410C] text-white'
              : 'text-[#0B1F3A] hover:bg-slate-100'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <Upload className="w-4 h-4 shrink-0" />
            <span>Supporting Documents</span>
          </span>
          {progress.hasUploadedDocument ? (
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${
                activeStep === 'documents' ? 'text-white' : 'text-emerald-600'
              }`}
            />
          ) : (
            <Circle
              className={`w-4 h-4 shrink-0 ${
                activeStep === 'documents' ? 'text-white/70' : 'text-slate-300'
              }`}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleStepSelect('review')}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-colors ${
            activeStep === 'review'
              ? 'bg-[#C2410C] text-white'
              : 'text-[#0B1F3A] hover:bg-slate-100'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <ClipboardCheck className="w-4 h-4 shrink-0" />
            <span>Final Review &amp; Submit</span>
          </span>
          {progress.isSubmitted ? (
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${
                activeStep === 'review' ? 'text-white' : 'text-emerald-600'
              }`}
            />
          ) : (
            <Circle
              className={`w-4 h-4 shrink-0 ${
                activeStep === 'review' ? 'text-white/70' : 'text-slate-300'
              }`}
            />
          )}
        </button>
      </nav>
    </aside>
  );
};
