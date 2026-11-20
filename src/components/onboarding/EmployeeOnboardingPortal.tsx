import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileText,
  Lock,
  UploadCloud,
  User,
} from 'lucide-react';
import { onboardingRepository } from '../../lib/supabase/repository';
import { DOCUMENT_UPLOAD_CATEGORIES, HR_FORMS_CATALOG } from '../../shared/formsCatalog';
import {
  calculateOnboardingProgress,
  createInitialSessionState,
  getFormProgressState,
  getFriendlyFormTitle,
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
  showAdminReturn?: boolean;
  onReturnToAdmin: () => void;
}

export const EmployeeOnboardingPortal: React.FC<EmployeeOnboardingPortalProps> = ({
  token,
  showAdminReturn = false,
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
          setLoadError(
            err instanceof Error ? err.message : 'Unable to open your onboarding invitation link.'
          );
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
      // Inline form attachments can still be retried in Supporting Documents
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
    const receipt = await onboardingRepository.submitPreviewOnboarding(token, sessionRef.current);
    setSession((prev) => ({
      ...prev,
      submittedAt: receipt.submittedAt,
      receiptCode: receipt.receiptCode,
    }));
  };

  const activeFormIndex = HR_FORMS_CATALOG.findIndex((f) => f.id === activeStep);
  const activeForm = activeFormIndex >= 0 ? HR_FORMS_CATALOG[activeFormIndex] : null;

  // Determine the single clearest next action for the employee
  const nextIncompleteForm = HR_FORMS_CATALOG.find(
    (form) => getFormProgressState(form.id as AnyFormId, session.formResponses) !== 'completed'
  );

  const recommendedNextStep: OnboardingStepKey = isLocked
    ? 'review'
    : nextIncompleteForm
      ? (nextIncompleteForm.id as OnboardingStepKey)
      : !progress.hasUploadedDocument
        ? 'documents'
        : 'review';

  const recommendedActionLabel = isLocked
    ? 'View Submission Confirmation'
    : nextIncompleteForm
      ? `${
          getFormProgressState(nextIncompleteForm.id as AnyFormId, session.formResponses) ===
          'in_progress'
            ? 'Continue'
            : 'Start'
        } ${nextIncompleteForm.formNumber}. ${getFriendlyFormTitle(nextIncompleteForm.id)}`
      : !progress.hasUploadedDocument
        ? 'Upload Supporting Documents'
        : 'Proceed to Final Review & Submit';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Corporate Bar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="sm:hidden">
            <LogoPlaceholder compact />
          </div>
          <div className="hidden sm:block">
            <LogoPlaceholder />
          </div>
          <span className="hidden md:inline-block h-5 w-px bg-slate-200" aria-hidden="true" />
          <span className="hidden md:inline text-xs font-medium text-slate-600 truncate">
            Employee Onboarding Portal
          </span>
        </div>

        {showAdminReturn && (
          <button
            type="button"
            onClick={onReturnToAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-[#0B1F3A] bg-white hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>HR Admin Portal</span>
          </button>
        )}
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 space-y-4">
            <div className="h-6 w-64 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-96 max-w-full bg-slate-100 rounded animate-pulse" />
            <div className="h-32 w-full bg-slate-100 rounded animate-pulse" />
          </div>
        ) : loadError || !invitation ? (
          <div className="max-w-lg mx-auto rounded-xl border border-red-200 bg-white p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-lg font-semibold text-[#0B1F3A]">
                  {loadError?.toLowerCase().includes('expired')
                    ? 'Invitation Link Expired'
                    : 'Invitation Link Unavailable'}
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {loadError ||
                    'This onboarding invitation link could not be verified. Please contact the DICS Global HR team for assistance.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onReturnToAdmin}
              className="px-4 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-semibold hover:bg-[#132D52]"
            >
              Return to Home
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar Progress Tracker */}
            <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-6">
              <ProgressTracker
                activeStep={activeStep}
                session={session}
                progress={progress}
                onSelectStep={setActiveStep}
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-8 xl:col-span-9 min-w-0 space-y-4">
              {isLocked && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-xs text-emerald-950 flex items-center gap-3"
                >
                  <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Your onboarding application has been submitted (Confirmation Number:{' '}
                    <span className="font-semibold">{session.receiptCode}</span>). All forms and
                    documents are locked for HR verification.
                  </span>
                </div>
              )}

              {activeStep === 'overview' && (
                <div className="space-y-6">
                  {/* Welcome Banner & Employee Context */}
                  <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="bg-[#0B1F3A] text-white px-6 py-6 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#FDBA74]">
                        Digital Instruments &amp; Control Systems · Bengaluru
                      </p>
                      <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                        Welcome to DICS Global
                      </h1>
                      <p className="text-sm text-slate-200 leading-relaxed max-w-2xl">
                        Please complete your joining forms and upload your supporting documents
                        before submitting your onboarding application. You can save your progress at
                        any time and continue later.
                      </p>
                    </div>

                    {/* Employee Details */}
                    <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 border-b border-slate-200 bg-slate-50/70 text-xs">
                      <div className="flex items-start gap-2.5">
                        <User className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-slate-500 block">Employee Name</span>
                          <span className="font-semibold text-[#0B1F3A] text-sm block truncate">
                            {session.formResponses['form-01'].nameInCapitals ||
                              invitation.referenceLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Building2 className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-slate-500 block">Department</span>
                          <span className="font-semibold text-[#0B1F3A] text-sm block truncate">
                            {invitation.department}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Briefcase className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-slate-500 block">Job Designation</span>
                          <span className="font-semibold text-[#0B1F3A] text-sm block truncate">
                            {invitation.targetRole}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Calendar className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-slate-500 block">Link Valid Until</span>
                          <span className="font-semibold text-[#0B1F3A] text-sm tabular-nums block">
                            {invitation.expiresAt.slice(0, 10)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Simple 3-step onboarding instructions + Highlighted Next Step */}
                    <div className="p-5 sm:p-6 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex items-start gap-2.5">
                          <ClipboardList className="w-4 h-4 text-[#0B1F3A] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-[#0B1F3A]">1. Fill All 9 Forms</p>
                            <p className="text-slate-500 mt-0.5">
                              Complete personal, joining, mediclaim, and nomination forms below.
                            </p>
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex items-start gap-2.5">
                          <UploadCloud className="w-4 h-4 text-[#0B1F3A] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-[#0B1F3A]">2. Upload Documents</p>
                            <p className="text-slate-500 mt-0.5">
                              Attach photo, Aadhaar, PAN, education, and previous job records.
                            </p>
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white p-3.5 flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-[#0B1F3A] shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-[#0B1F3A]">3. Review &amp; Submit</p>
                            <p className="text-slate-500 mt-0.5">
                              Verify everything is complete and submit your application to HR.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Next Action Highlight Bar */}
                      <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C2410C]">
                            {isLocked ? 'Submission Complete' : 'Recommended Next Step'}
                          </span>
                          <p className="text-sm font-semibold text-[#0B1F3A]">
                            {recommendedActionLabel}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveStep(recommendedNextStep)}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                        >
                          <span>
                            {isLocked
                              ? 'View Confirmation'
                              : nextIncompleteForm
                                ? getFormProgressState(
                                    nextIncompleteForm.id as AnyFormId,
                                    session.formResponses
                                  ) === 'in_progress'
                                  ? 'Continue Form'
                                  : 'Start Form'
                                : !progress.hasUploadedDocument
                                  ? 'Upload Documents'
                                  : 'Review & Submit'}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* Nine Joining Forms Cards */}
                  <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h2 className="text-base font-semibold text-[#0B1F3A]">
                          Onboarding Forms Checklist
                        </h2>
                        <p className="text-xs text-slate-500">
                          Select any form below to fill or review your details
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveStep('documents')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C2410C] hover:text-[#9A3412] self-start sm:self-auto"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Go to Supporting Documents ({progress.uploadedDocumentsCount})</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {HR_FORMS_CATALOG.map((form) => {
                        const formId = form.id as AnyFormId;
                        const formState = getFormProgressState(formId, session.formResponses);
                        const isNext = nextIncompleteForm?.id === form.id && !isLocked;

                        const statusLabel =
                          formState === 'completed'
                            ? 'Completed'
                            : formState === 'in_progress'
                              ? 'In Progress'
                              : 'Not Started';

                        const actionLabel = isLocked
                          ? 'View Form'
                          : formState === 'completed'
                            ? 'View Form'
                            : formState === 'in_progress'
                              ? 'Continue Form'
                              : 'Start Form';

                        return (
                          <button
                            key={form.id}
                            type="button"
                            onClick={() => setActiveStep(form.id as OnboardingStepKey)}
                            className={`text-left rounded-xl border p-4 transition-colors flex flex-col justify-between gap-3 ${
                              isNext
                                ? 'border-[#EA580C] bg-orange-50/40 ring-1 ring-[#EA580C]/20'
                                : formState === 'completed'
                                  ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-400'
                                  : 'border-slate-200 bg-white hover:border-[#0B1F3A]/40 hover:bg-slate-50/70'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center tabular-nums ${
                                    formState === 'completed'
                                      ? 'bg-emerald-600 text-white'
                                      : isNext
                                        ? 'bg-[#C2410C] text-white'
                                        : 'bg-[#0B1F3A] text-white'
                                  }`}
                                >
                                  {form.formNumber}
                                </span>

                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                                    formState === 'completed'
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                      : formState === 'in_progress'
                                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                                        : 'border-slate-200 bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {statusLabel}
                                </span>
                              </div>

                              <p className="text-sm font-semibold text-[#0B1F3A] leading-snug">
                                {form.formNumber}. {getFriendlyFormTitle(form.id)}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-100">
                              <span className="inline-flex items-center gap-1 text-slate-500 font-normal">
                                <FileText className="w-3.5 h-3.5" />
                                <span>
                                  {form.pageCount} {form.pageCount === 1 ? 'page' : 'pages'}
                                </span>
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 ${
                                  formState === 'completed'
                                    ? 'text-emerald-700'
                                    : isNext
                                      ? 'text-[#C2410C]'
                                      : 'text-[#0B1F3A]'
                                }`}
                              >
                                <span>{actionLabel}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>
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
