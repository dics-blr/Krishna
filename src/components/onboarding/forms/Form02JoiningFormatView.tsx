import React from 'react';
import type { Form02JoiningFormat } from '../../../shared/types';
import { SignaturePadField } from '../SignaturePadField';
import { FormDocumentHeader, inputClass, textareaClass } from './FormDocumentHeader';

interface Form02JoiningFormatViewProps {
  data: Form02JoiningFormat;
  onChange: (patch: Partial<Form02JoiningFormat>) => void;
}

export const Form02JoiningFormatView: React.FC<Form02JoiningFormatViewProps> = ({
  data,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <FormDocumentHeader title="JOINING FORMAT" rightBadge="1 Page" />

      {/* Main Particulars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="f2-name" className="block text-xs font-medium text-slate-700">
            Name : <span className="text-red-600">*</span>
          </label>
          <input
            id="f2-name"
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="f2-father" className="block text-xs font-medium text-slate-700">
            Father’s name : <span className="text-red-600">*</span>
          </label>
          <input
            id="f2-father"
            type="text"
            value={data.fatherName}
            onChange={(e) => onChange({ fatherName: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="f2-desig" className="block text-xs font-medium text-slate-700">
            Designation : <span className="text-red-600">*</span>
          </label>
          <input
            id="f2-desig"
            type="text"
            value={data.designation}
            onChange={(e) => onChange({ designation: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="f2-dob" className="block text-xs font-medium text-slate-700">
            Date of Birth : <span className="text-red-600">*</span>
          </label>
          <input
            id="f2-dob"
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => onChange({ dateOfBirth: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="f2-doj" className="block text-xs font-medium text-slate-700">
            Date of joining : <span className="text-red-600">*</span>
          </label>
          <input
            id="f2-doj"
            type="date"
            value={data.dateOfJoining}
            onChange={(e) => onChange({ dateOfJoining: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="f2-contact" className="block text-xs font-medium text-slate-700">
            Contact Number : <span className="text-red-600">*</span>
          </label>
          <input
            id="f2-contact"
            type="tel"
            value={data.contactNumber}
            onChange={(e) => onChange({ contactNumber: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      {/* Residential Address */}
      <div className="rounded-md border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs font-semibold text-[#0B1F3A] text-center">
          Residential Address
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <div className="p-4 space-y-1.5">
            <label htmlFor="f2-present-addr" className="block text-xs font-semibold text-slate-700">
              Present Address <span className="text-red-600">*</span>
            </label>
            <textarea
              id="f2-present-addr"
              rows={4}
              value={data.presentAddress}
              onChange={(e) => onChange({ presentAddress: e.target.value })}
              className={textareaClass}
            />
          </div>
          <div className="p-4 space-y-1.5">
            <label htmlFor="f2-perm-addr" className="block text-xs font-semibold text-slate-700">
              Permanent Address <span className="text-red-600">*</span>
            </label>
            <textarea
              id="f2-perm-addr"
              rows={4}
              value={data.permanentAddress}
              onChange={(e) => onChange({ permanentAddress: e.target.value })}
              className={textareaClass}
            />
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[#0B1F3A]">
          Contact person name and phone number to contact in case of emergency:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-md border border-slate-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-700">Emergency Contact 1</p>
            <div className="space-y-1">
              <label htmlFor="f2-em1-name" className="block text-xs text-slate-700">
                Name : <span className="text-red-600">*</span>
              </label>
              <input
                id="f2-em1-name"
                type="text"
                value={data.emergency1Name}
                onChange={(e) => onChange({ emergency1Name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f2-em1-mob" className="block text-xs text-slate-700">
                Mobile No. : <span className="text-red-600">*</span>
              </label>
              <input
                id="f2-em1-mob"
                type="tel"
                value={data.emergency1Mobile}
                onChange={(e) => onChange({ emergency1Mobile: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f2-em1-rel" className="block text-xs text-slate-700">
                Relationship :
              </label>
              <input
                id="f2-em1-rel"
                type="text"
                value={data.emergency1Relationship}
                onChange={(e) => onChange({ emergency1Relationship: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="rounded-md border border-slate-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-700">Emergency Contact 2</p>
            <div className="space-y-1">
              <label htmlFor="f2-em2-name" className="block text-xs text-slate-700">
                Name :
              </label>
              <input
                id="f2-em2-name"
                type="text"
                value={data.emergency2Name}
                onChange={(e) => onChange({ emergency2Name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f2-em2-mob" className="block text-xs text-slate-700">
                Mobile No. :
              </label>
              <input
                id="f2-em2-mob"
                type="tel"
                value={data.emergency2Mobile}
                onChange={(e) => onChange({ emergency2Mobile: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f2-em2-rel" className="block text-xs text-slate-700">
                Relationship :
              </label>
              <input
                id="f2-em2-rel"
                type="text"
                value={data.emergency2Relationship}
                onChange={(e) => onChange({ emergency2Relationship: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sign-Off */}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="f2-date" className="block text-xs font-medium text-slate-700">
              Date: <span className="text-red-600">*</span>
            </label>
            <input
              id="f2-date"
              type="date"
              value={data.date}
              onChange={(e) => onChange({ date: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="f2-sign-name" className="block text-xs font-medium text-slate-700">
              Employee Name in Parentheses ( &nbsp; )
            </label>
            <input
              id="f2-sign-name"
              type="text"
              value={data.signatureName}
              onChange={(e) => onChange({ signatureName: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <SignaturePadField
          id="f2-sig"
          label="Signature of Employee"
          required
          value={data.signatureDataUrl}
          onChange={(url) => onChange({ signatureDataUrl: url })}
        />

        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={data.declarationConfirmed}
            onChange={(e) => onChange({ declarationConfirmed: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C]"
          />
          <span className="text-xs text-slate-700">
            I confirm that my joining details, residential addresses, and emergency contact details
            above are accurate. <span className="text-red-600">*</span>
          </span>
        </label>
      </div>
    </div>
  );
};
