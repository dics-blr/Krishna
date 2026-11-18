import React from 'react';
import type { Form07Form25 } from '../../../shared/types';
import { SignaturePadField } from '../SignaturePadField';
import { FormDocumentHeader, inputClass, textareaClass } from './FormDocumentHeader';

interface Form07Form25ViewProps {
  data: Form07Form25;
  onChange: (patch: Partial<Form07Form25>) => void;
}

export const Form07Form25View: React.FC<Form07Form25ViewProps> = ({
  data,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <FormDocumentHeader
        title="FORM NO -25 [(See Rule 126)]"
        subtitle="FORM OF NOMINATION"
        rightBadge="Rule 126"
        showCompanyAddress={false}
      />

      {/* Exact Declaration Statement */}
      <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4 space-y-4">
        <p className="text-xs text-slate-800 leading-relaxed italic">
          “I here by declear that in the event of my death before resuming work,the balance of my
          pay due for a period of leave with wages not availed of shall be paid to
          <span className="font-semibold not-italic text-[#0B1F3A]">
            {' '}
            {data.nomineeName || '________________________'}{' '}
          </span>
          who to my
          <span className="font-semibold not-italic text-[#0B1F3A]">
            {' '}
            {data.relationshipWithEmployee || '________________'}{' '}
          </span>
          &amp; Resides at:
          <span className="font-semibold not-italic text-[#0B1F3A]">
            {' '}
            {data.nomineeAddress || '________________________________________'}
          </span>
          ”
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <label htmlFor="f7-nominee" className="block text-xs font-medium text-slate-700">
              Paid to (Nominee Full Name) <span className="text-red-600">*</span>
            </label>
            <input
              id="f7-nominee"
              type="text"
              value={data.nomineeName}
              onChange={(e) => onChange({ nomineeName: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f7-rel" className="block text-xs font-medium text-slate-700">
              who to my (Relationship) <span className="text-red-600">*</span>
            </label>
            <input
              id="f7-rel"
              type="text"
              value={data.relationshipWithEmployee}
              onChange={(e) => onChange({ relationshipWithEmployee: e.target.value })}
              placeholder="e.g. Spouse / Father / Mother"
              className={inputClass}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="f7-addr" className="block text-xs font-medium text-slate-700">
              &amp; Resides at: (Nominee Full Residential Address) <span className="text-red-600">*</span>
            </label>
            <textarea
              id="f7-addr"
              rows={3}
              value={data.nomineeAddress}
              onChange={(e) => onChange({ nomineeAddress: e.target.value })}
              className={textareaClass}
            />
          </div>
        </div>
      </div>

      {/* Witnesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="f7-w1" className="block text-xs font-medium text-slate-700">
            1. Witness: <span className="text-red-600">*</span>
          </label>
          <input
            id="f7-w1"
            type="text"
            value={data.witness1Details}
            onChange={(e) => onChange({ witness1Details: e.target.value })}
            placeholder="Full Name / Address"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="f7-w2" className="block text-xs font-medium text-slate-700">
            2. Witness: <span className="text-red-600">*</span>
          </label>
          <input
            id="f7-w2"
            type="text"
            value={data.witness2Details}
            onChange={(e) => onChange({ witness2Details: e.target.value })}
            placeholder="Full Name / Address"
            className={inputClass}
          />
        </div>
      </div>

      {/* Date & Signature */}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
        <div className="max-w-xs space-y-1">
          <label htmlFor="f7-date" className="block text-xs font-medium text-slate-700">
            Date: <span className="text-red-600">*</span>
          </label>
          <input
            id="f7-date"
            type="date"
            value={data.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className={inputClass}
          />
        </div>

        <SignaturePadField
          id="f7-sig"
          label="Signature / Thumb Impression"
          required
          value={data.signatureDataUrl}
          onChange={(url) => onChange({ signatureDataUrl: url })}
        />

        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={data.declarationConfirmed}
            onChange={(e) => onChange({ declarationConfirmed: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1D4ED8]"
          />
          <span className="text-xs text-slate-800">
            I confirm this nomination under Form No -25 [(See Rule 126)].{' '}
            <span className="text-red-600">*</span>
          </span>
        </label>
      </div>
    </div>
  );
};
