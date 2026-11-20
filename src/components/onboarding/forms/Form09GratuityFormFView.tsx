import React from 'react';
import { Plus } from 'lucide-react';
import type { Form09GratuityFormF } from '../../../shared/types';
import { SignaturePadField } from '../SignaturePadField';
import {
  FormDocumentHeader,
  inputClass,
  OfficeUseBox,
  selectClass,
  textareaClass,
} from './FormDocumentHeader';

interface Form09GratuityFormFViewProps {
  data: Form09GratuityFormF;
  onChange: (patch: Partial<Form09GratuityFormF>) => void;
}

export const Form09GratuityFormFView: React.FC<Form09GratuityFormFViewProps> = ({
  data,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <FormDocumentHeader
        title="Payment of Gratuity (Central) Rules — FORM ‘F’"
        subtitle="See sub-rule (1) of Rule 6 · Nomination"
        rightBadge="FORM 'F' (Pages 1–3)"
        showCompanyAddress={false}
      />

      {/* Page 1: Establishment, Employee Nomination Clauses & Nominees Table */}
      <section className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="f9-to" className="block text-xs font-medium text-slate-700">
            To, (Give here name or description of the establishment with full address)
          </label>
          <textarea
            id="f9-to"
            rows={2}
            value={data.establishmentNameAndAddress}
            onChange={(e) => onChange({ establishmentNameAndAddress: e.target.value })}
            className={textareaClass}
          />
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50/70 p-4 space-y-3 text-xs text-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4 space-y-1">
              <label htmlFor="f9-sal" className="block text-xs font-medium text-slate-700">
                I, Shri/Shrimati/Kumari
              </label>
              <select
                id="f9-sal"
                value={data.salutation}
                onChange={(e) =>
                  onChange({ salutation: e.target.value as Form09GratuityFormF['salutation'] })
                }
                className={selectClass}
              >
                <option value="Shri">Shri</option>
                <option value="Shrimati">Shrimati</option>
                <option value="Kumari">Kumari</option>
              </select>
            </div>
            <div className="sm:col-span-8 space-y-1">
              <label htmlFor="f9-fullname" className="block text-xs font-medium text-slate-700">
                (Name in full here) <span className="text-red-600">*</span>
              </label>
              <input
                id="f9-fullname"
                type="text"
                value={data.employeeFullNameHeader}
                onChange={(e) => onChange({ employeeFullNameHeader: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <p className="leading-relaxed">
            whose particulars are given in the statement below, hereby nominate the person(s)
            mentioned below to receive the gratuity payable after my death as also the gratuity
            standing to my credit in the event of my death before that amount has become payable, or
            having become payable has not been paid and direct that the said amount of gratuity
            shall be paid in proportion indicated against the name(s) of the nominee(s).
          </p>

          <div className="space-y-2 pt-1">
            <p className="text-[11px] text-slate-500 font-medium">
              Check applicable clauses (Note.—Strike out the words/paragraphs not applicable):
            </p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.certifyNomineesAreFamily}
                onChange={(e) => onChange({ certifyNomineesAreFamily: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C]"
              />
              <span>
                2. I hereby certify that the person(s) mentioned is/are a member(s) of my family
                within the meaning of clause (h) of Section 2 of the Payment of Gratuity Act, 1972.
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.declareNoFamily}
                onChange={(e) => onChange({ declareNoFamily: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C]"
              />
              <span>
                3. I hereby declare that I have no family within the meaning of clause (h) of Section
                2 of the said Act.
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.fatherMotherNotDependent}
                onChange={(e) => onChange({ fatherMotherNotDependent: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C]"
              />
              <span>4 (a) My father/mother/parents is/are not dependent on me.</span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.husbandParentsNotDependent}
                onChange={(e) => onChange({ husbandParentsNotDependent: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C]"
              />
              <span>4 (b) My husband’s father/mother/parents is/are not dependent on my husband.</span>
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pl-6">
              <span>
                5. I have excluded my husband from my family by a notice dated the
              </span>
              <input
                type="date"
                aria-label="Exclusion notice date (if applicable)"
                value={data.excludedHusbandNoticeDate}
                onChange={(e) => onChange({ excludedHusbandNoticeDate: e.target.value })}
                className="h-8 px-2 rounded border border-slate-300 text-xs bg-white"
              />
              <span>to the controlling authority in terms of the proviso to clause (h) of Section 2 of the said Act.</span>
            </div>
            <p className="pl-6">6. Nomination made herein invalidates my previous nomination.</p>
          </div>
        </div>

        {/* Nominee(s) Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-[#0B1F3A]">Nominee(s)</h4>
            <button
              type="button"
              onClick={() =>
                onChange({
                  nominees: [
                    ...data.nominees,
                    { nomineeNameAndAddress: '', relationship: '', age: '', shareProportion: '' },
                  ],
                })
              }
              className="inline-flex items-center gap-1 text-xs font-medium text-[#C2410C] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full text-left border-collapse text-xs min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2 px-2 w-12">#</th>
                  <th className="py-2 px-2">(1) Name in full with full address of nominee(s) <span className="text-red-600">*</span></th>
                  <th className="py-2 px-2">(2) Relationship with the employee <span className="text-red-600">*</span></th>
                  <th className="py-2 px-2 w-24">(3) Age of nominee</th>
                  <th className="py-2 px-2 w-36">(4) Proportion by which the gratuity will be shared <span className="text-red-600">*</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.nominees.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-mono text-slate-600">{idx + 1}.</td>
                    <td className="p-1.5">
                      <textarea
                        rows={2}
                        aria-label={`Form F nominee ${idx + 1} name and address`}
                        value={row.nomineeNameAndAddress}
                        onChange={(e) => {
                          const next = [...data.nominees];
                          next[idx] = { ...row, nomineeNameAndAddress: e.target.value };
                          onChange({ nominees: next });
                        }}
                        className={textareaClass}
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        aria-label={`Form F nominee ${idx + 1} relationship`}
                        value={row.relationship}
                        onChange={(e) => {
                          const next = [...data.nominees];
                          next[idx] = { ...row, relationship: e.target.value };
                          onChange({ nominees: next });
                        }}
                        className={inputClass}
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row.age}
                        onChange={(e) => {
                          const next = [...data.nominees];
                          next[idx] = { ...row, age: e.target.value };
                          onChange({ nominees: next });
                        }}
                        className={inputClass}
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        aria-label={`Form F nominee ${idx + 1} share`}
                        placeholder="e.g. 100%"
                        value={row.shareProportion}
                        onChange={(e) => {
                          const next = [...data.nominees];
                          next[idx] = { ...row, shareProportion: e.target.value };
                          onChange({ nominees: next });
                        }}
                        className={inputClass}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Page 2: Statement (1-8) + Employee Signature + Witnesses + Certificate by Employer */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">Statement</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="f9-st-name" className="block text-xs font-medium text-slate-700">
              1. Name of employee in full <span className="text-red-600">*</span>
            </label>
            <input
              id="f9-st-name"
              type="text"
              value={data.statementEmployeeName}
              onChange={(e) => onChange({ statementEmployeeName: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f9-st-sex" className="block text-xs font-medium text-slate-700">
              2. Sex <span className="text-red-600">*</span>
            </label>
            <select
              id="f9-st-sex"
              value={data.statementSex}
              onChange={(e) => onChange({ statementSex: e.target.value })}
              className={selectClass}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Transgender">Transgender</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="f9-st-relig" className="block text-xs font-medium text-slate-700">
              3. Religion
            </label>
            <input
              id="f9-st-relig"
              type="text"
              value={data.statementReligion}
              onChange={(e) => onChange({ statementReligion: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f9-st-marital" className="block text-xs font-medium text-slate-700">
              4. Whether unmarried/married/widow/widower <span className="text-red-600">*</span>
            </label>
            <select
              id="f9-st-marital"
              value={data.statementMaritalStatus}
              onChange={(e) =>
                onChange({
                  statementMaritalStatus: e.target.value as Form09GratuityFormF['statementMaritalStatus'],
                })
              }
              className={selectClass}
            >
              <option value="">Select</option>
              <option value="unmarried">unmarried</option>
              <option value="married">married</option>
              <option value="widow">widow</option>
              <option value="widower">widower</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="f9-st-dept" className="block text-xs font-medium text-slate-700">
              5. Department/Branch/Section where employed <span className="text-red-600">*</span>
            </label>
            <input
              id="f9-st-dept"
              type="text"
              value={data.statementDepartmentBranch}
              onChange={(e) => onChange({ statementDepartmentBranch: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f9-st-post" className="block text-xs font-medium text-slate-700">
              6. Post held with Ticket No. or Serial No., if any
            </label>
            <input
              id="f9-st-post"
              type="text"
              value={data.statementPostHeldAndTicketNo}
              onChange={(e) => onChange({ statementPostHeldAndTicketNo: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="f9-st-doj" className="block text-xs font-medium text-slate-700">
              7. Date of appointment
            </label>
            <input
              id="f9-st-doj"
              type="date"
              value={data.statementDateOfAppointment}
              onChange={(e) => onChange({ statementDateOfAppointment: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        {/* 8. Permanent address */}
        <div className="rounded-md border border-slate-200 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-700">8. Permanent address:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label htmlFor="f9-village" className="block text-xs text-slate-600">
                Village
              </label>
              <input
                id="f9-village"
                type="text"
                value={data.permanentVillage}
                onChange={(e) => onChange({ permanentVillage: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f9-thana" className="block text-xs text-slate-600">
                Thana
              </label>
              <input
                id="f9-thana"
                type="text"
                value={data.permanentThana}
                onChange={(e) => onChange({ permanentThana: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f9-subdiv" className="block text-xs text-slate-600">
                Sub-division
              </label>
              <input
                id="f9-subdiv"
                type="text"
                value={data.permanentSubDivision}
                onChange={(e) => onChange({ permanentSubDivision: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f9-po" className="block text-xs text-slate-600">
                Post Office
              </label>
              <input
                id="f9-po"
                type="text"
                value={data.permanentPostOffice}
                onChange={(e) => onChange({ permanentPostOffice: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f9-district" className="block text-xs text-slate-600">
                District <span className="text-red-600">*</span>
              </label>
              <input
                id="f9-district"
                type="text"
                value={data.permanentDistrict}
                onChange={(e) => onChange({ permanentDistrict: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f9-state" className="block text-xs text-slate-600">
                State <span className="text-red-600">*</span>
              </label>
              <input
                id="f9-state"
                type="text"
                value={data.permanentState}
                onChange={(e) => onChange({ permanentState: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Employee Place, Date & Signature */}
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="f9-emp-place" className="block text-xs font-medium text-slate-700">
                Place: <span className="text-red-600">*</span>
              </label>
              <input
                id="f9-emp-place"
                type="text"
                value={data.employeePlace}
                onChange={(e) => onChange({ employeePlace: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f9-emp-date" className="block text-xs font-medium text-slate-700">
                Date: <span className="text-red-600">*</span>
              </label>
              <input
                id="f9-emp-date"
                type="date"
                value={data.employeeDate}
                onChange={(e) => onChange({ employeeDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <SignaturePadField
            id="f9-emp-sig"
            label="Signature/Thumb-impression of the Employee"
            required
            value={data.employeeSignatureDataUrl}
            onChange={(url) => onChange({ employeeSignatureDataUrl: url })}
          />
        </div>

        {/* Declaration by Witnesses */}
        <div className="rounded-md border border-slate-200 p-4 space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">
              Declaration by Witnesses
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Nomination signed/thumb-impressed before me
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 rounded border border-slate-200 p-3">
              <div className="space-y-1">
                <label htmlFor="f9-w1-name" className="block text-xs font-medium text-slate-700">
                  1. Name in full and full address of witness <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="f9-w1-name"
                  rows={2}
                  value={data.witness1NameAndAddress}
                  onChange={(e) => onChange({ witness1NameAndAddress: e.target.value })}
                  className={textareaClass}
                />
              </div>
              <SignaturePadField
                id="f9-w1-sig"
                label="Signature of Witness 1"
                required
                value={data.witness1SignatureDataUrl}
                onChange={(url) => onChange({ witness1SignatureDataUrl: url })}
              />
            </div>

            <div className="space-y-3 rounded border border-slate-200 p-3">
              <div className="space-y-1">
                <label htmlFor="f9-w2-name" className="block text-xs font-medium text-slate-700">
                  2. Name in full and full address of witness <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="f9-w2-name"
                  rows={2}
                  value={data.witness2NameAndAddress}
                  onChange={(e) => onChange({ witness2NameAndAddress: e.target.value })}
                  className={textareaClass}
                />
              </div>
              <SignaturePadField
                id="f9-w2-sig"
                label="Signature of Witness 2"
                required
                value={data.witness2SignatureDataUrl}
                onChange={(url) => onChange({ witness2SignatureDataUrl: url })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="f9-w-place" className="block text-xs font-medium text-slate-700">
                Place:
              </label>
              <input
                id="f9-w-place"
                type="text"
                value={data.witnessPlace}
                onChange={(e) => onChange({ witnessPlace: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f9-w-date" className="block text-xs font-medium text-slate-700">
                Date:
              </label>
              <input
                id="f9-w-date"
                type="date"
                value={data.witnessDate}
                onChange={(e) => onChange({ witnessDate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={data.declarationConfirmed}
              onChange={(e) => onChange({ declarationConfirmed: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C]"
            />
            <span className="text-xs text-slate-800">
              I confirm that the above Gratuity Form ‘F’ nomination and witness declarations have
              been duly completed. <span className="text-red-600">*</span>
            </span>
          </label>
        </div>

        {/* Certificate by Employer */}
        <OfficeUseBox
          title="Certificate by the Employer"
          description="Completed by Employer / Officer Authorised after employee submission."
        >
          <p className="text-xs text-slate-600 leading-relaxed">
            Certified that the particulars of the above nomination have been verified and recorded
            in this establishment.
          </p>
          <p className="text-xs text-slate-600 pt-1">
            Employer’s Reference No., if any: ____________ | Date: ____________ | Signature of the
            employer/Officer authorised &amp; Designation | Name and address of the establishment or
            rubber stamp thereof.
          </p>
        </OfficeUseBox>

        {/* Page 3: Acknowledgement by Employee (Pending HR Certification) */}
        <div className="rounded-md border border-dashed border-amber-300 bg-amber-50/50 p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-[#0B1F3A]">
              Page 3 — Acknowledgement by the Employee
            </h4>
            <span className="text-[11px] font-medium text-amber-800 bg-amber-100 border border-amber-200 rounded px-2 py-0.5">
              Pending Employer Certification
            </span>
          </div>
          <p className="text-xs text-slate-700 italic">
            “Received the duplicate copy of nomination in Form ‘F’ filed by me and duly certified
            by the employer.”
          </p>
          <p className="text-[11px] text-slate-500">
            Completed after HR/Employer certifies the nomination above and provides the duplicate
            copy to the employee. Note.—Strike out the words/paragraphs not applicable.
          </p>
        </div>
      </section>
    </div>
  );
};
