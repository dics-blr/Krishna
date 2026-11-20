import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { DOCUMENT_UPLOAD_CATEGORIES } from '../../shared/formsCatalog';
import { formatBytes, validateDocumentFile } from '../../shared/onboardingLogic';
import type { UploadedDocumentItem } from '../../shared/types';

interface DocumentUploadPanelProps {
  uploadedDocuments: UploadedDocumentItem[];
  locked?: boolean;
  onUploadDocumentFile: (slotId: string, slotLabel: string, file: File) => Promise<void>;
  onRemoveDocument: (docId: string) => Promise<void> | void;
  onPrevious: () => void;
  onNext: () => void;
}

export const DocumentUploadPanel: React.FC<DocumentUploadPanelProps> = ({
  uploadedDocuments,
  locked = false,
  onUploadDocumentFile,
  onRemoveDocument,
  onPrevious,
  onNext,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState(
    DOCUMENT_UPLOAD_CATEGORIES[0].slotId
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selectedCategory =
    DOCUMENT_UPLOAD_CATEGORIES.find((c) => c.slotId === selectedSlotId) ??
    DOCUMENT_UPLOAD_CATEGORIES[0];

  const handleFiles = async (fileList: FileList | null) => {
    if (locked || !fileList || fileList.length === 0) return;
    setUploadError(null);
    setUploading(true);

    try {
      for (const file of Array.from(fileList)) {
        const check = validateDocumentFile({
          name: file.name,
          sizeBytes: file.size,
          mimeType: file.type,
        });

        if (!check.valid) {
          setUploadError(check.error || 'Please choose a valid PDF, JPG, or PNG file.');
          continue;
        }

        await onUploadDocumentFile(selectedCategory.slotId, selectedCategory.label, file);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to upload selected document.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7 space-y-6">
      <div className="border-b border-slate-200 pb-5 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
          Step 10 · Attachments
        </p>
        <h2 className="text-xl font-semibold text-[#0B1F3A]">
          Supporting Documents Upload
        </h2>
        <p className="text-sm text-slate-600">
          Upload clear scans or photos of your supporting documents (PDF, JPG, or PNG up to 10 MB
          each).
        </p>
      </div>

      {/* Category Selection */}
      <div className="space-y-1.5">
        <label htmlFor="upload-slot-select" className="block text-xs font-semibold text-slate-700">
          Document Type
        </label>
        <select
          id="upload-slot-select"
          value={selectedSlotId}
          disabled={locked}
          onChange={(e) => setSelectedSlotId(e.target.value)}
          className="w-full md:w-96 h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
        >
          {DOCUMENT_UPLOAD_CATEGORIES.map((cat) => (
            <option key={cat.slotId} value={cat.slotId}>
              {cat.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">{selectedCategory.description}</p>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          if (locked) return;
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          locked
            ? 'border-slate-200 bg-slate-100/70 opacity-70'
            : isDragging
              ? 'border-[#EA580C] bg-orange-50/60'
              : 'border-slate-300 bg-slate-50/70 hover:bg-slate-50'
        }`}
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 text-[#C2410C] mx-auto mb-3 animate-spin" />
        ) : (
          <UploadCloud className="w-8 h-8 text-[#C2410C] mx-auto mb-3" />
        )}
        <p className="text-sm font-semibold text-[#0B1F3A]">
          {locked
            ? 'Your onboarding application has been submitted — document uploads are locked'
            : uploading
              ? 'Uploading document...'
              : 'Drag and drop files here, or browse from your device'}
        </p>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Accepted formats: PDF, JPG, PNG · Maximum 10 MB per file
        </p>

        <input
          ref={fileInputRef}
          id="onboarding-file-input"
          type="file"
          multiple
          disabled={locked || uploading}
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={(e) => {
            void handleFiles(e.target.files);
          }}
          className="sr-only"
        />
        <button
          type="button"
          disabled={locked || uploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F3A] hover:bg-[#132D52] disabled:opacity-50 text-white text-xs font-semibold transition-colors"
        >
          <span>{uploading ? 'Uploading...' : 'Choose Files'}</span>
        </button>
      </div>

      {uploadError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
        >
          {uploadError}
        </div>
      )}

      {/* Uploaded Files List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#0B1F3A]">
          Uploaded Documents ({uploadedDocuments.length})
        </h3>

        {uploadedDocuments.length === 0 ? (
          <div className="rounded-lg border border-slate-200 p-5 text-center text-xs text-slate-500">
            No documents uploaded yet. Please attach at least one supporting document before
            submitting.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden">
            {uploadedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-[#0B1F3A] truncate">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {doc.slotLabel} · <span className="tabular-nums">{formatBytes(doc.sizeBytes)}</span>
                    </p>
                  </div>
                </div>

                {!locked && (
                  <button
                    type="button"
                    onClick={() => {
                      void onRemoveDocument(doc.id);
                    }}
                    aria-label={`Remove ${doc.fileName}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50 transition-colors self-start sm:self-center shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onPrevious}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-[#0B1F3A] bg-white hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Gratuity Form F</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-sm font-semibold text-white transition-colors"
        >
          <span>Continue to Final Review</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
