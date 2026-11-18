import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
} from 'lucide-react';
import { onboardingRepository } from '../../lib/supabase/repository';
import { HR_FORMS_CATALOG } from '../../shared/formsCatalog';
import {
  calculateOnboardingProgress,
  createInitialSessionState,
} from '../../shared/onboardingLogic';
import type {
  FormSlotDraft,
  OnboardingInvitation,
  OnboardingSessionState,
  UploadedDocumentItem,
} from '../../shared/types';
import { LogoPlaceholder } from '../LogoPlaceholder';
import { DocumentUploadPanel } from './DocumentUploadPanel';
import { FinalReviewPanel } from './FinalReviewPanel';
import { FormSlotEditor } from './FormSlotEditor';
import { type OnboardingStepKey, ProgressTracker } from './ProgressTracker';

interface EmployeeOnboardingPortalProps {
  token: string;
  onReturnToAdmin: () => void;
}

export const EmployeeOnboardingPortal: React.FC<EmployeeOnboardingPortalProps> = ({
  token,
  onReturnToAdmin,
}) => {
  const [invitation, setInvitation] = useState<OnboardingInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<OnboardingStepKey>('overview');
  const [session, setSession] = useState<OnboardingSessionState>(() =>
    createInitialSessionState(token)
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setSession(createInitialSessionState(token));
    setActiveStep('overview');

    onboardingRepository
      .getInvitationByToken(token)
      .then((inv) => {
        if (!cancelled) {
          setInvitation(inv);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Unable to verify invitation link.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const progress = useMemo(() => calculateOnboardingProgress(session), [session]);

  const handleUpdateDraft = (formId: string, patch: Partial<FormSlotDraft>) => {
    setSession((prev) => ({
      ...prev,
      formsById: {
        ...prev.formsById,
        [formId]: {
          ...prev.formsById[formId],
          ...patch,
        },
      },
    }));
  };

  const handleAddDocument = (doc: UploadedDocumentItem) => {
    setSession((prev) => ({
      ...prev,
      uploadedDocuments: [...prev.uploadedDocuments, doc],
    }));
  };

  const handleRemoveDocument = (docId: string) => {
    setSession((prev) => ({
      ...prev,
      uploadedDocuments: prev.uploadedDocuments.filter((d) => d.id !== docId),
    }));
  };

  const handleToggleDeclaration = (accepted: boolean) => {
    setSession((prev) => ({
      ...prev,
      finalDeclarationAccepted: accepted,
    }));
  };

  const handleSubmitPreview = async () => {
    const receipt = await onboardingRepository.submitPreviewOnboarding(token, session);
    setSession((prev) => ({
      ...prev,
      submittedAt: receipt.submittedAt,
      receiptCode: receipt.receiptCode,
    }));
  };

  const activeFormIndex = HR_FORMS_CATALOG.findIndex((f) => f.id === activeStep);
  const activeForm = activeFormIndex >= 0 ? HR_FORMS_CATALOG[activeFormIndex] : null;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col">
      {/* Top Corporate Bar (No employee registration required) */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        <div className="sm:hidden">
          <LogoPlaceholder compact />
        </div>
        <div className="hidden sm:block">
          <LogoPlaceholder />
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <span className="hidden md:inline text-xs text-slate-500">
            Bengaluru, India · Direct Invitation Access
          </span>
          <button
            type="button"
            onClick={onReturnToAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>HR Admin View</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 space-y-4">
            <div className="h-6 w-64 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-96 max-w-full bg-slate-100 rounded animate-pulse" />
            <div className="h-32 w-full bg-slate-100 rounded animate-pulse" />
          </div>
        ) : loadError || !invitation ? (
          <div className="max-w-xl mx-auto rounded-lg border border-red-200 bg-white p-6 sm:p-8 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h1 className="text-lg font-semibold text-[#0B1F3A]">
                  Onboarding Invitation Unavailable
                </h1>
                <p className="text-sm text-slate-600">
                  {loadError || 'This unique onboarding invitation link could not be verified.'}
                </p>
              </div>
            </div>
            <p className="font-mono text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded p-2.5">
              Requested token: {token}
            </p>
            <button
              type="button"
              onClick={onReturnToAdmin}
              className="px-4 py-2 rounded-md bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132D52]"
            >
              Return to HR Admin Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar: Onboarding Progress Tracker */}
            <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-6">
              <ProgressTracker
                activeStep={activeStep}
                session={session}
                progress={progress}
                onSelectStep={setActiveStep}
              />
            </div>

            {/* Right Main Step Viewport */}
            <div className="lg:col-span-8 xl:col-span-9 min-w-0">
              {activeStep === 'overview' && (
                <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-7 space-y-6">
                  <div className="border-b border-slate-200 pb-5 space-y-1.5">
                    <p className="text-xs font-medium text-[#1D4ED8]">
                      DICS – Employee Onboarding Portal · No Registration Required
                    </p>
                    <h1 className="text-2xl font-semibold text-[#0B1F3A] tracking-tight">
                      Welcome to Digital Instruments &amp; Control Systems
                    </h1>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      You have accessed this onboarding workspace directly via your unique
                      invitation link. Complete each of the nine HR form modules, attach any
                      supporting files, and verify everything on the final review page.
                    </p>
                  </div>

                  {/* Invitation Context */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-md border border-slate-200 bg-slate-50/70 p-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Invitation Reference</span>
                      <span className="font-medium text-[#0B1F3A]">
                        {invitation.referenceLabel}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Department &amp; Role</span>
                      <span className="font-medium text-[#0B1F3A]">
                        {invitation.department} · {invitation.targetRole}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-500 block">Link Valid Until</span>
                        <span className="font-mono text-slate-800 tabular-nums">
                          {invitation.expiresAt.slice(0, 10)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Packet Summary */}
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-[#0B1F3A]">
                      Onboarding Checklist (9 HR Forms + Document Upload)
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {HR_FORMS_CATALOG.map((form) => (
                        <button
                          key={form.id}
                          type="button"
                          onClick={() => setActiveStep(form.id as OnboardingStepKey)}
                          className="text-left rounded-md border border-slate-200 p-3.5 hover:border-[#1D4ED8] hover:bg-blue-50/30 transition-colors space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-semibold text-[#1D4ED8]">
                              {form.code}
                            </span>
                            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <p className="text-xs font-medium text-[#0B1F3A] leading-snug">
                            {form.title}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-[#1D4ED8]" />
                      <span>
                        Current progress: {progress.completedFormsCount} of 9 forms completed
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveStep('form-01')}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-medium transition-colors"
                    >
                      <span>Start Form 01</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </section>
              )}

              {activeForm && (
                <FormSlotEditor
                  form={activeForm}
                  draft={session.formsById[activeForm.id]}
                  isFirstForm={activeFormIndex === 0}
                  isLastForm={activeFormIndex === HR_FORMS_CATALOG.length - 1}
                  onUpdateDraft={handleUpdateDraft}
                  onPrevious={() => {
                    if (activeFormIndex === 0) {
                      setActiveStep('overview');
                    } else {
                      setActiveStep(
                        HR_FORMS_CATALOG[activeFormIndex - 1].id as OnboardingStepKey
                      );
                    }
                  }}
                  onNext={() => {
                    if (activeFormIndex === HR_FORMS_CATALOG.length - 1) {
                      setActiveStep('documents');
                    } else {
                      setActiveStep(
                        HR_FORMS_CATALOG[activeFormIndex + 1].id as OnboardingStepKey
                      );
                    }
                  }}
                />
              )}

              {activeStep === 'documents' && (
                <DocumentUploadPanel
                  invitationToken={token}
                  uploadedDocuments={session.uploadedDocuments}
                  onAddDocument={handleAddDocument}
                  onRemoveDocument={handleRemoveDocument}
                  onPrevious={() => setActiveStep('form-09')}
                  onNext={() => setActiveStep('review')}
                />
              )}

              {activeStep === 'review' && (
                <FinalReviewPanel
                  session={session}
                  progress={progress}
                  onToggleDeclaration={handleToggleDeclaration}
                  onJumpToStep={setActiveStep}
                  onSubmitPreview={handleSubmitPreview}
                  onPrevious={() => setActiveStep('documents')}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
