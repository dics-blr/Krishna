import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileDown,
  FileText,
  Save,
  ShieldCheck,
  X,
} from 'lucide-react';
import { onboardingRepository } from '../lib/supabase/repository';
import { HR_FORMS_CATALOG } from '../shared/formsCatalog';
import { formatBytes, getFormResponseSummary, isFormSlotCompleted } from '../shared/onboardingLogic';
import type {
  AnyFormId,
  HrOfficeUseEntry,
  HrSubmissionDetail,
  HrUserProfile,
} from '../shared/types';

interface SubmissionDetailModalProps {
  invitationId: string | null;
  hrUser?: HrUserProfile | null;
  authEnforced?: boolean;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  invitationId,
  hrUser = null,
  authEnforced = false,
  onClose,
  onUpdated,
}) => {
  const [detail, setDetail] = useState<HrSubmissionDetail | null>(null);
  const [officeUse, setOfficeUse] = useState<HrOfficeUseEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);
  const [exportingFormId, setExportingFormId] = useState<AnyFormId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!invitationId) {
      setDetail(null);
      setOfficeUse(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSaveMessage(null);

    onboardingRepository
      .getSubmissionDetail(invitationId)
      .then((res) => {
        if (!cancelled) {
          setDetail(res);
          setOfficeUse(res.officeUse);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load submission packet.');
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
  }, [invitationId]);

  if (!invitationId) return null;

  const handleSaveOfficeUse = async (markVerified: boolean) => {
    if (!officeUse || !detail) return;
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const saved = await onboardingRepository.saveOfficeUseEntry(detail.invitation.id, {
        ...officeUse,
        markVerified,
      });
      setOfficeUse(saved);
      setSaveMessage(
        markVerified
          ? 'HR Office Use details saved and packet marked as HR Verified.'
          : 'HR Office Use details saved.'
      );
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save HR verification.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadDocument = async (docId: string) => {
    setError(null);
    try {
      const signed = await onboardingRepository.getDocumentDownloadUrl(docId);
      const anchor = document.createElement('a');
      anchor.href = signed.downloadUrl;
      anchor.download = signed.fileName;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate download URL.');
    }
  };

  const canExportPdf = !authEnforced || hrUser?.role === 'hr_admin';

  const triggerBlobDownload = (blob: Blob, fileName: string) => {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
  };

  const handleExportAllZip = async () => {
    if (!detail || !canExportPdf) return;
    setExportingZip(true);
    setError(null);
    try {
      const { blob, fileName } = await onboardingRepository.exportSubmissionAllFormsZip(
        detail.invitation.id
      );
      triggerBlobDownload(blob, fileName);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to generate all 9 onboarding forms ZIP.'
      );
    } finally {
      setExportingZip(false);
    }
  };

  const handleExportSingleFormPdf = async (formId: AnyFormId) => {
    if (!detail || !canExportPdf) return;
    setExportingFormId(formId);
    setError(null);
    try {
      const { blob, fileName } = await onboardingRepository.exportSubmissionFormPdf(
        detail.invitation.id,
        formId
      );
      triggerBlobDownload(blob, fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate form PDF.');
    } finally {
      setExportingFormId(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submission-detail-title"
      className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-lg border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
          <div className="w-full sm:w-auto sm:flex-1 sm:min-w-0">
            <h2 id="submission-detail-title" className="text-lg font-semibold text-[#0B1F3A] truncate">
              {detail ? `${detail.invitation.referenceLabel} · Packet Review` : 'Submission Review'}
            </h2>
            {detail && (
              <p className="text-xs text-slate-500 font-mono truncate">
                {detail.invitation.department} · {detail.invitation.targetRole} · State:{' '}
                {detail.invitation.submissionState}
                {detail.invitation.receiptCode ? ` · ${detail.invitation.receiptCode}` : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {detail && canExportPdf && (
              <button
                type="button"
                onClick={handleExportAllZip}
                disabled={exportingZip || exportingFormId !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0B1F3A] hover:bg-[#132D52] disabled:opacity-60 text-xs font-medium text-white transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>
                  {exportingZip ? 'Generating ZIP...' : 'Download All 9 PDFs (ZIP)'}
                </span>
              </button>
            )}
            {detail && !canExportPdf && (
              <span className="px-2.5 py-1 rounded border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-500">
                PDF Export Restricted to HR Admin
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close packet review dialog"
              className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-3">
              <div className="h-8 bg-slate-100 rounded animate-pulse" />
              <div className="h-28 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : error && !detail ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {error}
            </div>
          ) : detail && officeUse ? (
            <>
              {error && (
                <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}
              {saveMessage && (
                <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  {saveMessage}
                </div>
              )}

              {/* Nine Forms Status */}
              <section className="space-y-2.5">
                <h3 className="text-sm font-semibold text-[#0B1F3A]">
                  Nine DICS HR Forms Status
                </h3>
                <div className="divide-y divide-slate-200 rounded-md border border-slate-200">
                  {HR_FORMS_CATALOG.map((form) => {
                    const formId = form.id as AnyFormId;
                    const done = isFormSlotCompleted(formId, detail.formResponses);
                    const summary = getFormResponseSummary(formId, detail.formResponses);
                    const isExportingThisForm = exportingFormId === formId;
                    return (
                      <div key={form.id} className="px-4 py-3 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
                        <div className="w-full sm:w-auto min-w-0 sm:flex-1">
                          <span className="font-mono font-semibold text-[#1D4ED8] whitespace-nowrap mr-2">
                            {form.code}
                          </span>
                          <span className="font-medium text-[#0B1F3A]">{form.shortTitle}</span>
                          <p className="text-slate-500 truncate mt-0.5">{summary}</p>
                        </div>
                        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded border font-medium ${
                              done
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-50 text-slate-600'
                            }`}
                          >
                            {done ? 'Completed' : 'Pending'}
                          </span>
                          {canExportPdf && (
                            <button
                              type="button"
                              aria-label={`Download ${form.code} PDF`}
                              disabled={exportingZip || exportingFormId !== null}
                              onClick={() => handleExportSingleFormPdf(formId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-xs font-medium text-slate-700"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                              <span>{isExportingThisForm ? 'Generating...' : 'Download PDF'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Uploaded Documents */}
              <section className="space-y-2.5">
                <h3 className="text-sm font-semibold text-[#0B1F3A]">
                  Supporting Documents ({detail.uploadedDocuments.length})
                </h3>
                {detail.uploadedDocuments.length === 0 ? (
                  <p className="text-xs text-slate-500 border border-slate-200 rounded-md p-3">
                    No files attached to this onboarding packet yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 rounded-md border border-slate-200">
                    {detail.uploadedDocuments.map((doc) => (
                      <div key={doc.id} className="px-4 py-3 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
                          <FileText className="w-4 h-4 text-[#1D4ED8] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[#0B1F3A] truncate">{doc.fileName}</p>
                            <p className="text-slate-500 truncate">
                              {doc.slotLabel} · {formatBytes(doc.sizeBytes)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadDocument(doc.id)}
                          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* HR Office-Use & Verification Section */}
              <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0B1F3A]">
                  <ShieldCheck className="w-4 h-4 text-[#1D4ED8]" />
                  <span>HR Office-Use Verification Fields</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label htmlFor="hr-office-selection" className="block font-medium text-slate-700 mb-1">
                      Form 01 Selection Status
                    </label>
                    <input
                      id="hr-office-selection"
                      type="text"
                      value={officeUse.form01SelectionStatus}
                      onChange={(e) =>
                        setOfficeUse({ ...officeUse, form01SelectionStatus: e.target.value })
                      }
                      placeholder="Selected / On Hold"
                      className="w-full h-9 px-2.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="hr-office-empno" className="block font-medium text-slate-700 mb-1">
                      Assigned Employee No. (Form 03 / Form 04)
                    </label>
                    <input
                      id="hr-office-empno"
                      type="text"
                      value={officeUse.form03EmpNo}
                      onChange={(e) =>
                        setOfficeUse({
                          ...officeUse,
                          form03EmpNo: e.target.value,
                          form04EmpNo: e.target.value,
                        })
                      }
                      placeholder="DICS-EMP-..."
                      className="w-full h-9 px-2.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="hr-office-reporting" className="block font-medium text-slate-700 mb-1">
                      Reporting To
                    </label>
                    <input
                      id="hr-office-reporting"
                      type="text"
                      value={officeUse.form01ReportingTo}
                      onChange={(e) =>
                        setOfficeUse({ ...officeUse, form01ReportingTo: e.target.value })
                      }
                      className="w-full h-9 px-2.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="hr-office-officer" className="block font-medium text-slate-700 mb-1">
                      Authorized Officer / Signatory
                    </label>
                    <input
                      id="hr-office-officer"
                      type="text"
                      value={officeUse.form05AuthorizedOfficer}
                      onChange={(e) =>
                        setOfficeUse({
                          ...officeUse,
                          form05AuthorizedOfficer: e.target.value,
                          form08AuthorizedSignatory: e.target.value,
                        })
                      }
                      className="w-full h-9 px-2.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="hr-office-remarks" className="block font-medium text-slate-700 mb-1">
                      HR Checklist Remarks (Form 04)
                    </label>
                    <textarea
                      id="hr-office-remarks"
                      rows={2}
                      value={officeUse.form04HrRemarks}
                      onChange={(e) =>
                        setOfficeUse({ ...officeUse, form04HrRemarks: e.target.value })
                      }
                      className="w-full p-2.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveOfficeUse(false)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-800"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Office-Use Draft</span>
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveOfficeUse(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0B1F3A] hover:bg-[#132D52] text-xs font-medium text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save &amp; Mark HR Verified</span>
                  </button>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
