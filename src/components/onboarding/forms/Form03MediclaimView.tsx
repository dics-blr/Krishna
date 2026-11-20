import React from 'react';
import type { Form03Mediclaim } from '../../../shared/types';
import { SignaturePadField } from '../SignaturePadField';
import { FormDocumentHeader, inputClass, selectClass } from './FormDocumentHeader';

interface Form03MediclaimViewProps {
  data: Form03Mediclaim;
  onChange: (patch: Partial<Form03Mediclaim>) => void;
}

export const Form03MediclaimView: React.FC<Form03MediclaimViewProps> = ({
  data,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <FormDocumentHeader title="MEDICLAIM DECLARATION FORM" rightBadge="1 Page" />

      {/* Employee Details Table */}
      <div className="rounded-md border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-12 items-center p-3 gap-2">
            <label htmlFor="f3-emp-name" className="sm:col-span-4 text-xs font-medium text-slate-700">
              Name of the Employee <span className="text-red-600">*</span>
            </label>
            <div className="sm:col-span-8">
              <input
                id="f3-emp-name"
                type="text"
                value={data.employeeName}
                onChange={(e) => onChange({ employeeName: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 items-center p-3 gap-2 bg-slate-50/60">
            <label htmlFor="f3-emp-no" className="sm:col-span-4 text-xs font-medium text-slate-700">
              Emp. No. <span className="text-[11px] text-slate-500">(HR Use if not allotted)</span>
            </label>
            <div className="sm:col-span-8">
              <input
                id="f3-emp-no"
                type="text"
                value={data.empNo}
                onChange={(e) => onChange({ empNo: e.target.value })}
                placeholder="Leave blank if to be allotted by HR"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 items-center p-3 gap-2">
            <label htmlFor="f3-doj" className="sm:col-span-4 text-xs font-medium text-slate-700">
              Date of Joining <span className="text-red-600">*</span>
            </label>
            <div className="sm:col-span-8">
              <input
                id="f3-doj"
                type="date"
                value={data.dateOfJoining}
                onChange={(e) => onChange({ dateOfJoining: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 items-center p-3 gap-2">
            <label htmlFor="f3-desig" className="sm:col-span-4 text-xs font-medium text-slate-700">
              Designation <span className="text-red-600">*</span>
            </label>
            <div className="sm:col-span-8">
              <input
                id="f3-desig"
                type="text"
                value={data.designation}
                onChange={(e) => onChange({ designation: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 items-center p-3 gap-2">
            <label htmlFor="f3-dept" className="sm:col-span-4 text-xs font-medium text-slate-700">
              Department <span className="text-red-600">*</span>
            </label>
            <div className="sm:col-span-8">
              <input
                id="f3-dept"
                type="text"
                value={data.department}
                onChange={(e) => onChange({ department: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Family Particulars Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[#0B1F3A]">
          Family Particulars for Mediclaim Insurance
        </h4>
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left border-collapse text-xs min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-2.5 px-3 w-16">Sl. No.</th>
                <th className="py-2.5 px-3">Name of the Family Member</th>
                <th className="py-2.5 px-3 w-28">Relationship</th>
                <th className="py-2.5 px-3 w-40">Date of Birth</th>
                <th className="py-2.5 px-3 w-32">Gender</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.familyMembers.map((row, idx) => (
                <tr key={row.slNo}>
                  <td className="p-2.5 font-mono text-slate-600">{row.slNo}</td>
                  <td className="p-2">
                    <input
                      type="text"
                      aria-label={`Family member ${row.relationship} name`}
                      value={row.memberName}
                      onChange={(e) => {
                        const next = [...data.familyMembers];
                        next[idx] = { ...row, memberName: e.target.value };
                        onChange({ familyMembers: next });
                      }}
                      placeholder={idx === 0 ? 'Required (Self)' : 'Optional if applicable'}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-2.5 font-medium text-[#0B1F3A]">
                    {row.relationship}
                    {idx === 0 && <span className="text-red-600 ml-0.5">*</span>}
                  </td>
                  <td className="p-2">
                    <input
                      type="date"
                      aria-label={`Family member ${row.relationship} date of birth`}
                      value={row.dateOfBirth}
                      onChange={(e) => {
                        const next = [...data.familyMembers];
                        next[idx] = { ...row, dateOfBirth: e.target.value };
                        onChange({ familyMembers: next });
                      }}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      aria-label={`Family member ${row.relationship} gender`}
                      value={row.gender}
                      onChange={(e) => {
                        const next = [...data.familyMembers];
                        next[idx] = {
                          ...row,
                          gender: e.target.value as '' | 'Male' | 'Female' | 'Other',
                        };
                        onChange({ familyMembers: next });
                      }}
                      className={selectClass}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs font-semibold text-[#0B1F3A] pt-1">
          NOTE: AS PER MEDICAL INSURANCE POLICY
        </p>
      </div>

      {/* Confirmation & Signature */}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={data.policyNoteConfirmed}
            onChange={(e) => onChange({ policyNoteConfirmed: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C]"
          />
          <span className="text-xs text-slate-800">
            I confirm the Mediclaim declaration family particulars above as per medical insurance
            policy. <span className="text-red-600">*</span>
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div className="space-y-1">
            <label htmlFor="f3-date" className="block text-xs font-medium text-slate-700">
              Date
            </label>
            <input
              id="f3-date"
              type="date"
              value={data.declarationDate}
              onChange={(e) => onChange({ declarationDate: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <SignaturePadField
          id="f3-sig"
          label="Signature of the Employee"
          required
          value={data.employeeSignatureDataUrl}
          onChange={(url) => onChange({ employeeSignatureDataUrl: url })}
        />
      </div>
    </div>
  );
};
