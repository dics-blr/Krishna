import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  FolderLock,
  Loader2,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { DOCUMENT_UPLOAD_CATEGORIES } from '../../shared/formsCatalog';
import { formatBytes, validateDocumentFile } from '../../shared/onboardingLogic';
import type { UploadedDocumentItem } from '../../shared/types';

interface DocumentUploadPanelProps {
  invitationToken: string;
  uploadedDocuments: UploadedDocumentItem[];
  locked?: boolean;
  onUploadDocumentFile: (slotId: string, slotLabel: string, file: File) => Promise<void>;
  onRemoveDocument: (docId: string) => Promise<void> | void;
  onPrevious: () => void;
  onNext: () => void;
}

export const DocumentUploadPanel: React.FC<DocumentUploadPanelProps> = ({
  invitationToken,
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
          setUploadError(check.error || 'Invalid file selected.');
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
    <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-7 space-y-6">
      <div className="border-b border-slate-200 pb-5 space-y-1">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <FolderLock className="w-4 h-4 text-[#1D4ED8]" />
          <span>Private Storage Interface</span>
          <span aria-hidden="true">·</span>
          <span>Bucket: dics-onboarding-documents</span>
        </div>
        <h2 className="text-xl font-semibold text-[#0B1F3A]">
          Document Upload Center
        </h2>
        <p className="text-sm text-slate-600">
          Attach supporting PDF, JPG, or PNG files (up to 10 MB per file). Files are scoped to
          invitation <span className="font-mono text-xs">{invitationToken}</span> and stored in the
          private onboarding storage bucket via signed URLs when Supabase is configured.
        </p>
      </div>

      {/* Category Selection */}
      <div className="space-y-1.5">
        <label htmlFor="upload-slot-select" className="block text-xs font-medium text-slate-700">
          Target Document Slot
        </label>
        <select
          id="upload-slot-select"
          value={selectedSlotId}
          disabled={locked}
          onChange={(e) => setSelectedSlotId(e.target.value)}
          className="w-full md:w-96 h-10 px-3 rounded-md border border-slate-300 text-sm text-slate-900 bg-white disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
        >
          {DOCUMENT_UPLOAD_CATEGORIES.map((cat) => (
            <option key={cat.slotId} value={cat.slotId}>
              {cat.label} ({cat.linkedFormCode})
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
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          locked
            ? 'border-slate-200 bg-slate-100/70 opacity-70'
            : isDragging
              ? 'border-[#1D4ED8] bg-blue-50/50'
              : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50'
        }`}
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 text-[#1D4ED8] mx-auto mb-3 animate-spin" />
        ) : (
          <UploadCloud className="w-8 h-8 text-[#1D4ED8] mx-auto mb-3" />
        )}
        <p className="text-sm font-medium text-[#0B1F3A]">
          {locked
            ? 'Onboarding packet submitted — document uploads are locked'
            : uploading
              ? 'Uploading document...'
              : 'Drag and drop onboarding files here, or browse from your device'}
        </p>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Accepted formats: PDF, JPG, PNG · Maximum size: 10 MB per file
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
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#0B1F3A] hover:bg-[#132D52] disabled:opacity-50 text-white text-xs font-medium transition-colors"
        >
          <span>{uploading ? 'Uploading...' : 'Select Files to Attach'}</span>
        </button>
      </div>

      {uploadError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
        >
          {uploadError}
        </div>
      )}

      {/* Uploaded Files List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0B1F3A]">
            Attached Documents ({uploadedDocuments.length})
          </h3>
        </div>

        {uploadedDocuments.length === 0 ? (
          <div className="rounded-md border border-slate-200 p-5 text-center text-xs text-slate-500">
            No files attached yet. Attach at least one document to enable final onboarding submission.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 rounded-md border border-slate-200 overflow-hidden">
            {uploadedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-[#0B1F3A] truncate">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {doc.slotLabel} · <span className="tabular-nums">{formatBytes(doc.sizeBytes)}</span>
                    </p>
                    <p className="font-mono text-[11px] text-slate-500 truncate">
                      Storage path: {doc.storageBucketPath}
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-200 text-xs font-medium text-slate-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50 transition-colors self-start sm:self-center shrink-0"
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
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Form 09</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#1D4ED8] hover:bg-[#1E40AF] text-sm font-medium text-white"
        >
          <span>Continue to Final Review</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
