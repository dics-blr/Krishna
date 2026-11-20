import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Upload } from 'lucide-react';
import { validateDocumentFile } from '../../../shared/onboardingLogic';
import type { Form06EsicForm1 } from '../../../shared/types';
import { SignaturePadField } from '../SignaturePadField';
import {
  FormDocumentHeader,
  inputClass,
  OfficeUseBox,
  selectClass,
  textareaClass,
} from './FormDocumentHeader';

interface Form06EsicForm1ViewProps {
  data: Form06EsicForm1;
  onChange: (patch: Partial<Form06EsicForm1>) => void;
  onAttachPhoto?: (file: File) => void;
}

export const Form06EsicForm1View: React.FC<Form06EsicForm1ViewProps> = ({
  data,
  onChange,
  onAttachPhoto,
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPhotoError(null);
    const file = files[0];
    const check = validateDocumentFile({
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
    });
    if (!check.valid) {
      setPhotoError(check.error || 'Invalid photograph file.');
      return;
    }
    onChange({ photoFileName: file.name });
    onAttachPhoto?.(file);
  };

  return (
    <div className="space-y-6">
      <FormDocumentHeader
        title="FORM – I : DECLARATION FORM (ESIC)"
        subtitle="To be filled in by the employee after reading instructions overleaf. Two Postcard Size photographs are to be attached with this form. This form is free of cost."
        rightBadge="ESIC FORM – I"
        showCompanyAddress={false}
      />

      {/* (A) INSURED PERSON'S PARTICULARS & (B) EMPLOYER'S PARTICULARS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] border-b border-slate-200 pb-1.5">
            (A) INSURED PERSON’S PARTICULARS
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="f6-ins-no" className="block text-xs font-medium text-slate-700">
                1. Insurance No.
              </label>
              <input
                id="f6-ins-no"
                type="text"
                value={data.insuranceNo}
                onChange={(e) => onChange({ insuranceNo: e.target.value })}
                placeholder="If already allotted"
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="f6-name" className="block text-xs font-medium text-slate-700">
                2. Name (in block letters) <span className="text-red-600">*</span>
              </label>
              <input
                id="f6-name"
                type="text"
                value={data.nameInBlockLetters}
                onChange={(e) => onChange({ nameInBlockLetters: e.target.value.toUpperCase() })}
                className={`${inputClass} uppercase`}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="f6-father" className="block text-xs font-medium text-slate-700">
                3. Father’s/Husband’s Name <span className="text-red-600">*</span>
              </label>
              <input
                id="f6-father"
                type="text"
                value={data.fatherOrHusbandName}
                onChange={(e) => onChange({ fatherOrHusbandName: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="f6-dob" className="block text-xs font-medium text-slate-700">
                4. Date of Birth <span className="text-red-600">*</span>
              </label>
              <input
                id="f6-dob"
                type="date"
                value={data.dateOfBirth}
                onChange={(e) => onChange({ dateOfBirth: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="f6-marital" className="block text-xs font-medium text-slate-700 whitespace-nowrap">
                5. Marital Status <span className="text-red-600">*</span>
              </label>
              <select
                id="f6-marital"
                value={data.maritalStatus}
                onChange={(e) =>
                  onChange({ maritalStatus: e.target.value as '' | 'M' | 'U' | 'W' })
                }
                className={selectClass}
              >
                <option value="">Select</option>
                <option value="M">M (Married)</option>
                <option value="U">U (Unmarried)</option>
                <option value="W">W (Widow)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="f6-sex" className="block text-xs font-medium text-slate-700 whitespace-nowrap">
                6. Sex <span className="text-red-600">*</span>
              </label>
              <select
                id="f6-sex"
                value={data.sex}
                onChange={(e) => onChange({ sex: e.target.value as '' | 'M' | 'F' })}
                className={selectClass}
              >
                <option value="">Select</option>
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 rounded border border-slate-200 p-3">
              <label htmlFor="f6-pres-addr" className="block text-xs font-semibold text-slate-700">
                7. Present Address <span className="text-red-600">*</span>
              </label>
              <textarea
                id="f6-pres-addr"
                rows={2}
                value={data.presentAddress}
                onChange={(e) => onChange({ presentAddress: e.target.value })}
                className={textareaClass}
              />
              <input
                type="text"
                aria-label="Present Address Pin Code"
                placeholder="Pin Code *"
                value={data.presentPinCode}
                onChange={(e) => onChange({ presentPinCode: e.target.value })}
                className={inputClass}
              />
              <input
                type="text"
                aria-label="Present Telephone or e-mail address"
                placeholder="Telephone / e-mail address"
                value={data.presentPhoneOrEmail}
                onChange={(e) => onChange({ presentPhoneOrEmail: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="space-y-2 rounded border border-slate-200 p-3">
              <label htmlFor="f6-perm-addr" className="block text-xs font-semibold text-slate-700">
                8. Permanent Address <span className="text-red-600">*</span>
              </label>
              <textarea
                id="f6-perm-addr"
                rows={2}
                value={data.permanentAddress}
                onChange={(e) => onChange({ permanentAddress: e.target.value })}
                className={textareaClass}
              />
              <input
                type="text"
                aria-label="Permanent Address Pin Code"
                placeholder="Pin Code *"
                value={data.permanentPinCode}
                onChange={(e) => onChange({ permanentPinCode: e.target.value })}
                className={inputClass}
              />
              <input
                type="text"
                aria-label="Permanent Telephone or e-mail address"
                placeholder="Telephone / e-mail address"
                value={data.permanentPhoneOrEmail}
                onChange={(e) => onChange({ permanentPhoneOrEmail: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="f6-branch" className="block text-xs font-medium text-slate-700">
                Branch Office
              </label>
              <input
                id="f6-branch"
                type="text"
                value={data.branchOffice}
                onChange={(e) => onChange({ branchOffice: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f6-dispensary" className="block text-xs font-medium text-slate-700">
                Dispensary
              </label>
              <input
                id="f6-dispensary"
                type="text"
                value={data.dispensary}
                onChange={(e) => onChange({ dispensary: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* (B) EMPLOYER'S PARTICULARS */}
        <section className="lg:col-span-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] border-b border-slate-200 pb-1.5">
            (B) EMPLOYER’S PARTICULARS
          </h4>

          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 space-y-1.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-700">Items 9–11 (Employer Office Use)</p>
            <p>9. Employer’s Code No.: [To be completed by HR]</p>
            <p>10. Date of Appointment: [To be completed by HR]</p>
            <p>11. Name &amp; Address of the Employer: DIGITAL INSTRUMENTS &amp; CONTROL SYSTEMS, Peenya Industrial Estate, Bengaluru - 560058</p>
          </div>

          <div className="rounded-md border border-slate-200 p-3.5 space-y-3">
            <label className="flex items-start gap-2 cursor-pointer text-xs font-medium text-[#0B1F3A]">
              <input
                type="checkbox"
                checked={data.hasPreviousEmployment}
                onChange={(e) => onChange({ hasPreviousEmployment: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C]"
              />
              <span>
                12. In case of any previous employment please fill up the details as under:-
              </span>
            </label>

            {data.hasPreviousEmployment && (
              <div className="space-y-2.5 pt-1">
                <input
                  type="text"
                  placeholder="a) Previous Ins. No."
                  value={data.previousInsNo}
                  onChange={(e) => onChange({ previousInsNo: e.target.value })}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="b) Emplr’s. Code No."
                  value={data.previousEmployerCodeNo}
                  onChange={(e) => onChange({ previousEmployerCodeNo: e.target.value })}
                  className={inputClass}
                />
                <textarea
                  rows={2}
                  placeholder="c) Name & address of the Employer"
                  value={data.previousEmployerNameAndAddress}
                  onChange={(e) => onChange({ previousEmployerNameAndAddress: e.target.value })}
                  className={textareaClass}
                />
                <input
                  type="text"
                  placeholder="Telephone / e-mail address"
                  value={data.previousEmployerPhoneOrEmail}
                  onChange={(e) => onChange({ previousEmployerPhoneOrEmail: e.target.value })}
                  className={inputClass}
                />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* (C) Nominee u/s 71 */}
      <section className="space-y-3 pt-4 border-t border-slate-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">
          (C) Details of Nominee u/s 71 of ESI Act 1948/Rule 56(2) of ESI (Central) Rules, 1950 for
          payment of cash benefit in the event of death.
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label htmlFor="f6-nom-name" className="block text-xs font-medium text-slate-700">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              id="f6-nom-name"
              type="text"
              value={data.nomineeName}
              onChange={(e) => onChange({ nomineeName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="f6-nom-rel" className="block text-xs font-medium text-slate-700">
              Relationship <span className="text-red-600">*</span>
            </label>
            <input
              id="f6-nom-rel"
              type="text"
              value={data.nomineeRelationship}
              onChange={(e) => onChange({ nomineeRelationship: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="f6-nom-addr" className="block text-xs font-medium text-slate-700">
              Address <span className="text-red-600">*</span>
            </label>
            <input
              id="f6-nom-addr"
              type="text"
              value={data.nomineeAddress}
              onChange={(e) => onChange({ nomineeAddress: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.declarationConfirmed}
              onChange={(e) => onChange({ declarationConfirmed: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C]"
            />
            <span className="text-xs text-slate-800 leading-relaxed">
              I hereby declare that the particulars given by me are correct to the best of my
              knowledge and belief. I undertake to intimate the Corporation any changes in the
              membership of my family within 15 days of such change.{' '}
              <span className="text-red-600">*</span>
            </span>
          </label>

          <SignaturePadField
            id="f6-ip-sig"
            label="Signature/T.I. of IP (Insured Person)"
            required
            value={data.ipSignatureDataUrl}
            onChange={(url) => onChange({ ipSignatureDataUrl: url })}
          />
          <p className="text-[11px] text-slate-500">
            Counter signature by the employer (Signature with seal): [Completed by HR Office]
          </p>
        </div>
      </section>

      {/* (D) FAMILY PARTICULARS */}
      <section className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">
            (D) FAMILY PARTICULARS OF INSURED PERSON
          </h4>
          <button
            type="button"
            onClick={() =>
              onChange({
                familyMembers: [
                  ...data.familyMembers,
                  {
                    slNo: data.familyMembers.length + 1,
                    name: '',
                    dobOrAge: '',
                    relationship: '',
                    residingWithEmployee: '',
                    residenceTown: '',
                    residenceState: '',
                  },
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
          <table className="w-full text-left border-collapse text-xs min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-2 px-2 w-12">Sl. No.</th>
                <th className="py-2 px-2">Name</th>
                <th className="py-2 px-2">Date of Birth/Age as on date of filling form</th>
                <th className="py-2 px-2">Relationship with the Employee</th>
                <th className="py-2 px-2">Whether residing with him/her?</th>
                <th className="py-2 px-2">If ‘No’, Town</th>
                <th className="py-2 px-2">If ‘No’, State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.familyMembers.map((row, idx) => (
                <tr key={row.slNo}>
                  <td className="p-2 font-mono text-slate-600">{row.slNo}.</td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => {
                        const next = [...data.familyMembers];
                        next[idx] = { ...row, name: e.target.value };
                        onChange({ familyMembers: next });
                      }}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY or Age"
                      value={row.dobOrAge}
                      onChange={(e) => {
                        const next = [...data.familyMembers];
                        next[idx] = { ...row, dobOrAge: e.target.value };
                        onChange({ familyMembers: next });
                      }}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.relationship}
                      onChange={(e) => {
                        const next = [...data.familyMembers];
                        next[idx] = { ...row, relationship: e.target.value };
                        onChange({ familyMembers: next });
                      }}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-1.5">
                    <select
                      value={row.residingWithEmployee}
                      onChange={(e) => {
                        const next = [...data.familyMembers];
                        next[idx] = {
                          ...row,
                          residingWithEmployee: e.target.value as '' | 'Yes' | 'No',
                        };
                        onChange({ familyMembers: next });
                      }}
                      className={selectClass}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.residenceTown}
                      onChange={(e) => {
                        const next = [...data.familyMembers];
                        next[idx] = { ...row, residenceTown: e.target.value };
                        onChange({ familyMembers: next });
                      }}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.residenceState}
                      onChange={(e) => {
                        const next = [...data.familyMembers];
                        next[idx] = { ...row, residenceState: e.target.value };
                        onChange({ familyMembers: next });
                      }}
                      className={inputClass}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Temporary Identity Card + Photograph Upload */}
      <section className="rounded-md border border-slate-200 p-4 space-y-3 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-[#0B1F3A]">
              ESI Corporation Temporary Identity Card
            </h4>
            <p className="text-[11px] text-slate-500">
              (valid for 3 months from the date of appointment) · Space for photograph (Self &amp; Family)
            </p>
          </div>
          <div>
            <input
              ref={photoRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onChange={(e) => handlePhotoSelect(e.target.files)}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{data.photoFileName ? 'Replace Photo' : 'Attach Family/IP Photo'}</span>
            </button>
          </div>
        </div>
        {data.photoFileName && (
          <p className="text-xs font-mono text-emerald-700">Attached: {data.photoFileName}</p>
        )}
        {photoError && <p className="text-xs text-red-600">{photoError}</p>}
      </section>

      {/* Page 2: Instructions & Branch Office Use Only */}
      <div className="rounded-md border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowInstructions((prev) => !prev)}
          className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-[#0B1F3A]"
        >
          <span>INSTRUCTIONS (Overleaf Page 2 — ESIC Regulations 11 &amp; 12, Family Definition, Sections 84 &amp; 85)</span>
          {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showInstructions && (
          <div className="p-4 text-xs text-slate-600 space-y-2 leading-relaxed bg-white border-t border-slate-200">
            <p>1. Submission of Form-I is governed by regulations 11 &amp; 12 of ESI (General) Regulations, 1950.</p>
            <p>2. “Family” means all or any of the following relatives of an Insured Person namely:— (i) a spouse (ii) a minor legitimate or adopted child dependant upon the I.P.; (iii) a child who is wholly dependant on the earnings of the I.P. and who is (a) receiving education, till he or she attains the age of 21 years (b) an unmarried daughter; (iv) a child who is infirm by reason of any physical or mental abnormality or injury and is wholly dependant on the earnings of the I.P. so long as the infirmity continues; (v) dependant parents (Please see Section 2 clause 11 of the ESI Act 1948 for details).</p>
            <p>3. Identity Card is Non-transferable.</p>
            <p>4. Loss of Identity Card be reported to Employer/Branch Manager immediately.</p>
            <p>5. Submission of false information attracts penal action under Section 84 of ESI Act, 1948.</p>
            <p>6. This form duly filled in must reach the concerned Branch Office within 10 days of appointment of an Employee. Delay attracts penal action under Section 85 of the Act, against employer.</p>
            <p>7. As an Insured Person you and your dependent family members are entitled to full medical care. Other cash benefits include Sickness, Temporary Disablement, Permanent Disablement, Dependents, and Maternity Benefit.</p>
            <p>8. For more details please visit website of ESIC at www.esic.org.in or contact Regional office or Branch Office.</p>
          </div>
        )}
      </div>

      <OfficeUseBox
        title="FOR BRANCH OFFICE USE ONLY (External ESIC Authority)"
        description="Left blank by employee and employer; completed only by the ESIC Branch Office."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
          <div>1. Date of Allotment of Ins. No. : _________________</div>
          <div>2. Date of Issue of TIC : _________________</div>
          <div>3. Name/No. of Disp. : _________________</div>
          <div>4. Whether reciprocal Medical arrangements involved? : _________________</div>
          <div className="sm:col-span-2">Signature of Branch Manager : _________________</div>
        </div>
      </OfficeUseBox>
    </div>
  );
};
