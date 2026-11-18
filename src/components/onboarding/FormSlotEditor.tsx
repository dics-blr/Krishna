import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Lock, Save, Sparkles } from 'lucide-react';
import {
  isFormSlotCompleted,
  prefillFormFromBioData,
  validateFormCompletion,
} from '../../shared/onboardingLogic';
import type {
  AnyFormId,
  Form01BioData,
  Form02JoiningFormat,
  Form03Mediclaim,
  Form04Checklist,
  Form05EpfForm2,
  Form06EsicForm1,
  Form07Form25,
  Form08Form11,
  Form09GratuityFormF,
  HRFormDefinition,
  OnboardingFormResponses,
} from '../../shared/types';
import { Form01BioDataView } from './forms/Form01BioDataView';
import { Form02JoiningFormatView } from './forms/Form02JoiningFormatView';
import { Form03MediclaimView } from './forms/Form03MediclaimView';
import { Form04PersonalFileChecklistView } from './forms/Form04PersonalFileChecklistView';
import { Form05EpfForm2View } from './forms/Form05EpfForm2View';
import { Form06EsicForm1View } from './forms/Form06EsicForm1View';
import { Form07Form25View } from './forms/Form07Form25View';
import { Form08Form11View } from './forms/Form08Form11View';
import { Form09GratuityFormFView } from './forms/Form09GratuityFormFView';

interface FormSlotEditorProps {
  form: HRFormDefinition;
  formResponses: OnboardingFormResponses;
  isFirstForm: boolean;
  isLastForm: boolean;
  locked?: boolean;
  onUpdateFormResponse: <K extends AnyFormId>(
    formId: K,
    patch: Partial<OnboardingFormResponses[K]>
  ) => void;
  onSaveFormDraft: (formId: AnyFormId) => Promise<void>;
  onAttachDocumentFile: (slotId: string, file: File) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export const FormSlotEditor: React.FC<FormSlotEditorProps> = ({
  form,
  formResponses,
  isFirstForm,
  isLastForm,
  locked = false,
  onUpdateFormResponse,
  onSaveFormDraft,
  onAttachDocumentFile,
  onPrevious,
  onNext,
}) => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [prefillNotice, setPrefillNotice] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const formId = form.id as AnyFormId;
  const completed = isFormSlotCompleted(formId, formResponses);

  useEffect(() => {
    setValidationErrors([]);
    setPrefillNotice(null);
    setSaveNotice(null);
    setSaveError(null);
  }, [form.id]);

  const handlePatch = <K extends AnyFormId>(
    targetId: K,
    patch: Partial<OnboardingFormResponses[K]>
  ) => {
    if (locked) return;
    setValidationErrors([]);
    setPrefillNotice(null);
    setSaveNotice(null);
    setSaveError(null);
    onUpdateFormResponse(targetId, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  };

  const handlePrefillFromBioData = () => {
    if (locked || formId === 'form-01') return;
    const targetId = formId as Exclude<AnyFormId, 'form-01'>;
    const prefilled = prefillFormFromBioData(
      targetId,
      formResponses['form-01'],
      formResponses[targetId]
    );
    onUpdateFormResponse(targetId, {
      ...prefilled,
      updatedAt: new Date().toISOString(),
    });
    setValidationErrors([]);
    setSaveNotice(null);
    setPrefillNotice(
      'Empty common employee fields have been prefilled from Form 01 (Bio-Data Form). Existing entries were preserved.'
    );
  };

  const handleExplicitSaveDraft = async () => {
    if (locked) return;
    setSaveError(null);
    setSaveNotice(null);
    setSaving(true);
    try {
      await onSaveFormDraft(formId);
      setSaveNotice(`Draft saved for ${form.code}.`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) {
      onNext();
      return;
    }

    setValidationErrors([]);
    setSaveError(null);

    const check = validateFormCompletion(formId, formResponses);
    if (!check.valid) {
      setValidationErrors(check.missingFields);
      return;
    }

    setSaving(true);
    try {
      await onSaveFormDraft(formId);
      onNext();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save form response.');
    } finally {
      setSaving(false);
    }
  };

  const renderFormView = () => {
    switch (formId) {
      case 'form-01':
        return (
          <Form01BioDataView
            data={formResponses['form-01']}
            onChange={(patch: Partial<Form01BioData>) => handlePatch('form-01', patch)}
            onAttachPhoto={(file) => onAttachDocumentFile('upload-slot-photograph', file)}
          />
        );
      case 'form-02':
        return (
          <Form02JoiningFormatView
            data={formResponses['form-02']}
            onChange={(patch: Partial<Form02JoiningFormat>) => handlePatch('form-02', patch)}
          />
        );
      case 'form-03':
        return (
          <Form03MediclaimView
            data={formResponses['form-03']}
            onChange={(patch: Partial<Form03Mediclaim>) => handlePatch('form-03', patch)}
          />
        );
      case 'form-04':
        return (
          <Form04PersonalFileChecklistView
            data={formResponses['form-04']}
            onChange={(patch: Partial<Form04Checklist>) => handlePatch('form-04', patch)}
          />
        );
      case 'form-05':
        return (
          <Form05EpfForm2View
            data={formResponses['form-05']}
            onChange={(patch: Partial<Form05EpfForm2>) => handlePatch('form-05', patch)}
          />
        );
      case 'form-06':
        return (
          <Form06EsicForm1View
            data={formResponses['form-06']}
            onChange={(patch: Partial<Form06EsicForm1>) => handlePatch('form-06', patch)}
            onAttachPhoto={(file) => onAttachDocumentFile('upload-slot-photograph', file)}
          />
        );
      case 'form-07':
        return (
          <Form07Form25View
            data={formResponses['form-07']}
            onChange={(patch: Partial<Form07Form25>) => handlePatch('form-07', patch)}
          />
        );
      case 'form-08':
        return (
          <Form08Form11View
            data={formResponses['form-08']}
            onChange={(patch: Partial<Form08Form11>) => handlePatch('form-08', patch)}
            onAttachKycFile={(file) => onAttachDocumentFile('upload-slot-kyc-id', file)}
          />
        );
      case 'form-09':
        return (
          <Form09GratuityFormFView
            data={formResponses['form-09']}
            onChange={(patch: Partial<Form09GratuityFormF>) => handlePatch('form-09', patch)}
          />
        );
    }
  };

  const hasBioDataName = formResponses['form-01'].nameInCapitals.trim().length > 0;

  return (
    <form
      onSubmit={handleSaveAndContinue}
      noValidate
      className="rounded-lg border border-slate-200 bg-white p-5 sm:p-7 space-y-6"
    >
      {/* Top Form Banner */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
            <span className="text-[#1D4ED8] font-semibold">{form.code}</span>
            <span aria-hidden="true">·</span>
            <span>Form {form.formNumber} of 9</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-slate-600">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{form.sourceFilename}</span>
            </span>
          </div>
          <h2 className="text-xl font-semibold text-[#0B1F3A]">{form.title}</h2>
          <p className="text-xs text-slate-500">{form.documentReference}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!locked && formId !== 'form-01' && formId !== 'form-07' && (
            <button
              type="button"
              onClick={handlePrefillFromBioData}
              disabled={!hasBioDataName}
              title={
                hasBioDataName
                  ? 'Copy common employee particulars from Form 01 into blank fields'
                  : 'Complete Name in Form 01 first to enable prefill'
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-blue-200 bg-blue-50/70 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium text-[#1D4ED8] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Common Details from Form 01</span>
            </button>
          )}

          {locked ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Submitted &amp; Locked</span>
            </span>
          ) : completed ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2.5 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5">
              Pending Required Entries
            </span>
          )}
        </div>
      </div>

      {prefillNotice && (
        <div
          role="status"
          className="rounded-md border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs text-[#0B1F3A]"
        >
          {prefillNotice}
        </div>
      )}

      {saveNotice && (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800"
        >
          {saveNotice}
        </div>
      )}

      {saveError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
        >
          {saveError}
        </div>
      )}

      {/* Mapped Document Form View */}
      <fieldset disabled={locked} className="min-w-0">
        {renderFormView()}
      </fieldset>

      {/* Validation Error Alert */}
      {validationErrors.length > 0 && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 space-y-1.5"
        >
          <p className="font-semibold">
            Please complete the following required entries in {form.code} ({form.shortTitle}) before
            continuing:
          </p>
          <ul className="list-disc pl-5 space-y-0.5">
            {validationErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {!locked && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                void handleExplicitSaveDraft();
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 text-sm font-medium text-white transition-colors"
          >
            <span>
              {locked
                ? isLastForm
                  ? 'View Document Uploads'
                  : `Next: Form ${String(form.formNumber + 1).padStart(2, '0')}`
                : isLastForm
                  ? 'Save & Continue to Document Upload'
                  : `Save & Continue to Form ${String(form.formNumber + 1).padStart(2, '0')}`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
};
