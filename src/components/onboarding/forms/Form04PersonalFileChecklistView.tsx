import React from 'react';
import { PERSONAL_FILE_CHECKLIST_ITEMS } from '../../../shared/formsCatalog';
import type { ChecklistItemStatus, Form04Checklist } from '../../../shared/types';
import {
  FormDocumentHeader,
  inputClass,
  OfficeUseBox,
  selectClass,
  textareaClass,
} from './FormDocumentHeader';

interface Form04PersonalFileChecklistViewProps {
  data: Form04Checklist;
  onChange: (patch: Partial<Form04Checklist>) => void;
}

export const Form04PersonalFileChecklistView: React.FC<Form04PersonalFileChecklistViewProps> = ({
  data,
  onChange,
}) => {
  const handleItemStatus = (key: string, status: ChecklistItemStatus) => {
    onChange({
      itemStatuses: {
        ...data.itemStatuses,
        [key]: status,
      },
    });
  };

  return (
    <div className="space-y-6">
      <FormDocumentHeader
        title="CHECK LIST FOR PERSONAL FILE"
        subtitle="Document No.: DICS/HR/EPFC · Effective Date & Revision Date managed by HR"
        rightBadge="DICS/HR/EPFC"
        showCompanyAddress={false}
      />

      {/* Document Control + Employee Metadata */}
      <div className="rounded-md border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border-b border-slate-200 text-xs">
          <div>
            <span className="text-slate-500">Document No.: </span>
            <span className="font-mono font-semibold text-[#0B1F3A]">DICS/HR/EPFC</span>
          </div>
          <div>
            <span className="text-slate-500">Effective Date: </span>
            <span className="text-slate-600">[HR Office Use]</span>
          </div>
          <div>
            <span className="text-slate-500">Revision Date: </span>
            <span className="text-slate-600">[HR Office Use]</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="f4-emp-name" className="block text-xs font-medium text-slate-700">
              Employee Name: <span className="text-red-600">*</span>
            </label>
            <input
              id="f4-emp-name"
              type="text"
              value={data.employeeName}
              onChange={(e) => onChange({ employeeName: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f4-doj" className="block text-xs font-medium text-slate-700">
              D.O.J.:
            </label>
            <input
              id="f4-doj"
              type="date"
              value={data.dateOfJoining}
              onChange={(e) => onChange({ dateOfJoining: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">
              Emp.No.: (HR Use)
            </label>
            <input
              type="text"
              disabled
              value=""
              placeholder="Assigned by HR"
              className={`${inputClass} bg-slate-50 text-slate-500`}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="f4-desig" className="block text-xs font-medium text-slate-700">
              Designation: <span className="text-red-600">*</span>
            </label>
            <input
              id="f4-desig"
              type="text"
              value={data.designation}
              onChange={(e) => onChange({ designation: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="f4-dept" className="block text-xs font-medium text-slate-700">
              Department: <span className="text-red-600">*</span>
            </label>
            <input
              id="f4-dept"
              type="text"
              value={data.department}
              onChange={(e) => onChange({ department: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* 16-Item Personal File Checklist Table */}
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-left border-collapse text-xs min-w-[680px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <th className="py-2.5 px-3 w-16">SL.NO.</th>
              <th className="py-2.5 px-3">Particulars</th>
              <th className="py-2.5 px-3 w-44">Pre Employment (Employee Readiness)</th>
              <th className="py-2.5 px-3 w-40">Post Employment (HR Verification)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {PERSONAL_FILE_CHECKLIST_ITEMS.map((group) => {
              const isGrouped = group.items.length > 1 || group.items[0].label !== group.title;
              if (!isGrouped) {
                const item = group.items[0];
                return (
                  <tr key={group.slNo}>
                    <td className="p-2.5 font-mono text-slate-600">{group.slNo}</td>
                    <td className="p-2.5 text-slate-800">{item.label}</td>
                    <td className="p-2">
                      <select
                        aria-label={`${item.label} pre-employment status`}
                        value={data.itemStatuses[item.key] || ''}
                        onChange={(e) =>
                          handleItemStatus(item.key, e.target.value as ChecklistItemStatus)
                        }
                        className={selectClass}
                      >
                        <option value="">Select</option>
                        <option value="Submitted">Submitted / Ready</option>
                        <option value="Will Submit">Will Submit at Joining</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </td>
                    <td className="p-2.5 text-slate-400 italic">HR Verification</td>
                  </tr>
                );
              }

              return (
                <React.Fragment key={group.slNo}>
                  <tr className="bg-slate-50/80">
                    <td className="p-2.5 font-mono font-semibold text-[#0B1F3A]">{group.slNo}</td>
                    <td colSpan={3} className="p-2.5 font-semibold text-[#0B1F3A]">
                      {group.title}
                    </td>
                  </tr>
                  {group.items.map((sub) => (
                    <tr key={sub.key}>
                      <td className="p-2.5 text-slate-400" />
                      <td className="p-2.5 pl-6 text-slate-800">{sub.label}</td>
                      <td className="p-2">
                        <select
                          aria-label={`${sub.label} pre-employment status`}
                          value={data.itemStatuses[sub.key] || ''}
                          onChange={(e) =>
                            handleItemStatus(sub.key, e.target.value as ChecklistItemStatus)
                          }
                          className={selectClass}
                        >
                          <option value="">Select</option>
                          <option value="Submitted">Submitted / Ready</option>
                          <option value="Will Submit">Will Submit at Joining</option>
                          <option value="Not Applicable">Not Applicable</option>
                        </select>
                      </td>
                      <td className="p-2.5 text-slate-400 italic">HR Verification</td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Employee Notes + Confirmation */}
      <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="space-y-1">
          <label htmlFor="f4-emp-remarks" className="block text-xs font-medium text-slate-700">
            Candidate Document Readiness Notes (Optional — e.g., pending relieving letter or certificates)
          </label>
          <textarea
            id="f4-emp-remarks"
            rows={2}
            value={data.employeeRemarks}
            onChange={(e) => onChange({ employeeRemarks: e.target.value })}
            className={textareaClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.employeeConfirmed}
              onChange={(e) => onChange({ employeeConfirmed: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C]"
            />
            <span className="text-xs text-slate-800">
              I have reviewed the Personal File Checklist items (DICS/HR/EPFC) and confirmed my
              document readiness for Pre-Employment / Joining verification.{' '}
              <span className="text-red-600">*</span>
            </span>
          </label>

          <div className="space-y-1">
            <label htmlFor="f4-date" className="block text-xs font-medium text-slate-700">
              Confirmation Date <span className="text-red-600">*</span>
            </label>
            <input
              id="f4-date"
              type="date"
              value={data.employeeConfirmDate}
              onChange={(e) => onChange({ employeeConfirmDate: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* HR Office Use Only Sign-Off */}
      <OfficeUseBox
        title="Remarks by the HR personnel entering the data & Verification Sign-Off"
        description="[Deficiency in the above-mentioned documents/data, if any, to be mentioned in detail] — Completed by HR Admin after physical/digital verification."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="rounded border border-slate-200 bg-white p-3 space-y-1">
            <p className="font-semibold text-slate-700">Data Entered by</p>
            <p>Name : ________________________</p>
            <p>Signature : ________________________ Date : ____________</p>
          </div>
          <div className="rounded border border-slate-200 bg-white p-3 space-y-1">
            <p className="font-semibold text-slate-700">Data Checked By</p>
            <p>Name : ________________________</p>
            <p>Signature : ________________________ Date : ____________</p>
          </div>
        </div>
      </OfficeUseBox>
    </div>
  );
};
