import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Download,
  FileDown,
  FileText,
  Save,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { onboardingRepository } from '../lib/supabase/repository';
import { HR_FORMS_CATALOG } from '../shared/formsCatalog';
import {
  formatBytes,
  getFormResponseSummary,
  getFriendlyFormTitle,
  getFriendlySubmissionStatus,
  isFormSlotCompleted,
} from '../shared/onboardingLogic';
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
          setError(err instanceof Error ? err.message : 'Unable to load employee submission.');
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
      if (markVerified) {
        setDetail((prev) =>
          prev
            ? {
                ...prev,
                invitation: { ...prev.invitation, submissionState: 'hr_verified' },
              }
            : prev
        );
      }
      setSaveMessage(
        markVerified
          ? 'HR Office-Use details saved and employee onboarding marked as Verified.'
          : 'HR Office-Use details saved as draft.'
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
      setError(err instanceof Error ? err.message : 'Unable to download document.');
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
        err instanceof Error ? err.message : 'Unable to download all 9 onboarding forms ZIP.'
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
      setError(err instanceof Error ? err.message : 'Unable to download form PDF.');
    } finally {
      setExportingFormId(null);
    }
  };

  const statusInfo = detail
    ? getFriendlySubmissionStatus(detail.invitation.submissionState)
    : null;

  const displayName =
    detail?.formResponses['form-01']?.nameInCapitals ||
    detail?.invitation.referenceLabel ||
    'Employee Onboarding Review';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submission-detail-title"
      className="fixed inset-0 z-50 bg-[#061326]/60 backdrop-blur-[1px] flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0B1F3A] text-white flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
          <div className="w-full sm:w-auto sm:flex-1 sm:min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <User className="w-4 h-4 text-[#FDBA74] shrink-0" />
              <h2 id="submission-detail-title" className="text-lg font-semibold text-white truncate">
                {displayName}
              </h2>
              {statusInfo && (
                <span className="px-2 py-0.5 rounded-md bg-white/15 text-white text-[11px] font-semibold">
                  {statusInfo.label}
                </span>
              )}
            </div>
            {detail && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#FDBA74]" />
                  <span>{detail.invitation.department}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-[#FDBA74]" />
                  <span>{detail.invitation.targetRole}</span>
                </span>
                {detail.invitation.receiptCode && (
                  <span className="text-slate-300">
                    Receipt: {detail.invitation.receiptCode}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {detail && canExportPdf && (
              <button
                type="button"
                onClick={handleExportAllZip}
                disabled={exportingZip || exportingFormId !== null}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 text-xs font-semibold text-white transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>
                  {exportingZip ? 'Preparing ZIP...' : 'Download All PDFs (ZIP)'}
                </span>
              </button>
            )}
            {detail && !canExportPdf && (
              <span className="px-2.5 py-1 rounded bg-white/10 text-[11px] font-medium text-slate-200">
                PDF Export Restricted to HR Admin
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close submission review dialog"
              className="p-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/40">
          {loading ? (
            <div className="space-y-3">
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          ) : error && !detail ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {error}
            </div>
          ) : detail && officeUse ? (
            <>
              {error && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}
              {saveMessage && (
                <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  {saveMessage}
                </div>
              )}

              {/* Nine Forms Status & PDF Exports */}
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#0B1F3A]">
                    Onboarding Forms (9 Forms)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Download original filled DICS HR PDF templates
                  </span>
                </div>
                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white overflow-hidden">
                  {HR_FORMS_CATALOG.map((form) => {
                    const formId = form.id as AnyFormId;
                    const done = isFormSlotCompleted(formId, detail.formResponses);
                    const summary = getFormResponseSummary(formId, detail.formResponses);
                    const isExportingThisForm = exportingFormId === formId;
                    const friendlyTitle = getFriendlyFormTitle(form.id);
                    return (
                      <div
                        key={form.id}
                        className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs"
                      >
                        <div className="w-full sm:w-auto min-w-0 sm:flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#C2410C] tabular-nums">
                              {form.formNumber}.
                            </span>
                            <span className="font-semibold text-[#0B1F3A] text-sm">
                              {friendlyTitle}
                            </span>
                          </div>
                          <p className="text-slate-500 truncate mt-0.5 pl-4">{summary}</p>
                        </div>
                        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 shrink-0">
                          <span
                            className={`px-2.5 py-0.5 rounded-md border font-semibold ${
                              done
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 bg-slate-100 text-slate-600'
                            }`}
                          >
                            {done ? 'Completed' : 'Pending'}
                          </span>
                          {canExportPdf && (
                            <button
                              type="button"
                              aria-label={`Download ${friendlyTitle} PDF`}
                              disabled={exportingZip || exportingFormId !== null}
                              onClick={() => handleExportSingleFormPdf(formId)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-xs font-semibold text-[#0B1F3A]"
                            >
                              <FileDown className="w-3.5 h-3.5 text-[#C2410C]" />
                              <span>{isExportingThisForm ? 'Preparing...' : 'Download PDF'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Supporting Documents */}
              <section className="space-y-2.5">
                <h3 className="text-sm font-semibold text-[#0B1F3A]">
                  Supporting Documents ({detail.uploadedDocuments.length})
                </h3>
                {detail.uploadedDocuments.length === 0 ? (
                  <p className="text-xs text-slate-500 border border-slate-200 bg-white rounded-xl p-4">
                    No supporting documents have been uploaded by the employee yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white overflow-hidden">
                    {detail.uploadedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                          <FileText className="w-4 h-4 text-[#C2410C] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[#0B1F3A] truncate">{doc.fileName}</p>
                            <p className="text-slate-500 truncate">
                              {doc.slotLabel} · {formatBytes(doc.sizeBytes)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadDocument(doc.id)}
                          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0B1F3A] hover:bg-slate-50 shrink-0"
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
              <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0B1F3A]">
                  <ShieldCheck className="w-4 h-4 text-[#C2410C]" />
                  <span>HR Office-Use Verification</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label
                      htmlFor="hr-office-selection"
                      className="block font-semibold text-slate-700 mb-1"
                    >
                      Selection Status
                    </label>
                    <input
                      id="hr-office-selection"
                      type="text"
                      value={officeUse.form01SelectionStatus}
                      onChange={(e) =>
                        setOfficeUse({ ...officeUse, form01SelectionStatus: e.target.value })
                      }
                      placeholder="Selected / On Hold"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="hr-office-empno"
                      className="block font-semibold text-slate-700 mb-1"
                    >
                      Assigned Employee Number
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
                      placeholder="e.g. DICS-EMP-104"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="hr-office-reporting"
                      className="block font-semibold text-slate-700 mb-1"
                    >
                      Reporting Manager
                    </label>
                    <input
                      id="hr-office-reporting"
                      type="text"
                      value={officeUse.form01ReportingTo}
                      onChange={(e) =>
                        setOfficeUse({ ...officeUse, form01ReportingTo: e.target.value })
                      }
                      placeholder="Manager name or title"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="hr-office-officer"
                      className="block font-semibold text-slate-700 mb-1"
                    >
                      Authorized HR Officer
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
                      placeholder="Name of verifying HR officer"
                      className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="hr-office-remarks"
                      className="block font-semibold text-slate-700 mb-1"
                    >
                      HR Verification Remarks
                    </label>
                    <textarea
                      id="hr-office-remarks"
                      rows={2}
                      value={officeUse.form04HrRemarks}
                      onChange={(e) =>
                        setOfficeUse({ ...officeUse, form04HrRemarks: e.target.value })
                      }
                      placeholder="Notes on submitted documents or joining verification"
                      className="w-full p-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveOfficeUse(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0B1F3A]"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Draft</span>
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveOfficeUse(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-xs font-semibold text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save &amp; Mark Verified</span>
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
