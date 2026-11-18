import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';
import { onboardingRepository } from '../../lib/supabase/repository';
import { DOCUMENT_UPLOAD_CATEGORIES, HR_FORMS_CATALOG } from '../../shared/formsCatalog';
import {
  calculateOnboardingProgress,
  createInitialSessionState,
  isFormSlotCompleted,
} from '../../shared/onboardingLogic';
import type {
  AnyFormId,
  OnboardingFormResponses,
  OnboardingInvitation,
  OnboardingSessionState,
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
  const sessionRef = useRef<OnboardingSessionState>(session);
  sessionRef.current = session;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const initial = createInitialSessionState(token);
    setSession(initial);
    sessionRef.current = initial;
    setActiveStep('overview');

    onboardingRepository
      .loadOnboardingSession(token)
      .then((hydrated) => {
        if (!cancelled) {
          setInvitation(hydrated.invitation);
          setSession(hydrated.session);
          sessionRef.current = hydrated.session;
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
  const isLocked = Boolean(session.submittedAt);

  const handleUpdateFormResponse = <K extends AnyFormId>(
    formId: K,
    patch: Partial<OnboardingFormResponses[K]>
  ) => {
    setSession((prev) => {
      const next: OnboardingSessionState = {
        ...prev,
        formResponses: {
          ...prev.formResponses,
          [formId]: {
            ...prev.formResponses[formId],
            ...patch,
          },
        },
      };
      sessionRef.current = next;
      return next;
    });
  };

  const handleSaveFormDraft = async (formId: AnyFormId) => {
    const latestPayload = sessionRef.current.formResponses[formId];
    const saved = await onboardingRepository.saveFormDraft(token, formId, latestPayload);
    handleUpdateFormResponse(formId, { updatedAt: saved.updatedAt } as Partial<
      OnboardingFormResponses[typeof formId]
    >);
  };

  const handleUploadDocumentFile = async (slotId: string, slotLabel: string, file: File) => {
    const uploaded = await onboardingRepository.uploadOnboardingDocument(
      token,
      slotId,
      slotLabel,
      file
    );
    setSession((prev) => ({
      ...prev,
      uploadedDocuments: [...prev.uploadedDocuments, uploaded],
    }));
  };

  const handleAttachInlineFormFile = (slotId: string, file: File) => {
    const category =
      DOCUMENT_UPLOAD_CATEGORIES.find((c) => c.slotId === slotId) ??
      DOCUMENT_UPLOAD_CATEGORIES[DOCUMENT_UPLOAD_CATEGORIES.length - 1];
    void handleUploadDocumentFile(category.slotId, category.label, file).catch(() => {
      // Inline form attachments can still be retried in DocumentUploadPanel
    });
  };

  const handleRemoveDocument = async (docId: string) => {
    await onboardingRepository.deleteOnboardingDocument(token, docId);
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
    void onboardingRepository.saveFinalDeclaration(token, accepted).catch(() => {
      // Final submission endpoint re-validates declaration state
    });
  };

  const handleSubmitPreview = async () => {
    // Persist any unsaved form payloads first before calling submit
    const receipt = await onboardingRepository.submitPreviewOnboarding(token, sessionRef.current);
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
                  {loadError?.toLowerCase().includes('expired')
                    ? 'Onboarding Invitation Expired'
                    : 'Onboarding Invitation Unavailable'}
                </h1>
                <p className="text-sm text-slate-600">
                  {loadError || 'This unique onboarding invitation link could not be verified.'}
                </p>
              </div>
            </div>
            <p className="font-mono text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded p-2.5 break-all">
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
            <div className="lg:col-span-8 xl:col-span-9 min-w-0 space-y-4">
              {isLocked && (
                <div
                  role="status"
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 flex items-center gap-2.5"
                >
                  <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Packet submitted (Receipt{' '}
                    <span className="font-mono font-semibold">{session.receiptCode}</span>). All
                    nine forms and document attachments are locked against further edits.
                  </span>
                </div>
              )}

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
                      invitation link. Complete all nine original DICS Global HR forms, attach your
                      supporting documents, and verify your packet on the final review page.
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
                      {HR_FORMS_CATALOG.map((form) => {
                        const isComplete = isFormSlotCompleted(
                          form.id as AnyFormId,
                          session.formResponses
                        );
                        return (
                          <button
                            key={form.id}
                            type="button"
                            onClick={() => setActiveStep(form.id as OnboardingStepKey)}
                            className={`text-left rounded-md border p-3.5 transition-colors space-y-1 ${
                              isComplete
                                ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-400'
                                : 'border-slate-200 hover:border-[#1D4ED8] hover:bg-blue-50/30'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-semibold text-[#1D4ED8]">
                                {form.code}
                              </span>
                              {isComplete ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                            <p className="text-xs font-medium text-[#0B1F3A] leading-snug">
                              {form.shortTitle}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {form.sourceFilename}
                            </p>
                          </button>
                        );
                      })}
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
                      <span>{isLocked ? 'Inspect Form 01' : 'Start Form 01'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </section>
              )}

              {activeForm && (
                <FormSlotEditor
                  form={activeForm}
                  formResponses={session.formResponses}
                  isFirstForm={activeFormIndex === 0}
                  isLastForm={activeFormIndex === HR_FORMS_CATALOG.length - 1}
                  locked={isLocked}
                  onUpdateFormResponse={handleUpdateFormResponse}
                  onSaveFormDraft={handleSaveFormDraft}
                  onAttachDocumentFile={handleAttachInlineFormFile}
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
                  locked={isLocked}
                  onUploadDocumentFile={handleUploadDocumentFile}
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
