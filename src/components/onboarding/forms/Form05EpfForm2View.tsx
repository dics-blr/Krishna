import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import type { Form05EpfForm2 } from '../../../shared/types';
import { SignaturePadField } from '../SignaturePadField';
import {
  FormDocumentHeader,
  inputClass,
  OfficeUseBox,
  selectClass,
  textareaClass,
} from './FormDocumentHeader';

interface Form05EpfForm2ViewProps {
  data: Form05EpfForm2;
  onChange: (patch: Partial<Form05EpfForm2>) => void;
}

export const Form05EpfForm2View: React.FC<Form05EpfForm2ViewProps> = ({
  data,
  onChange,
}) => {
  const [showGuidance, setShowGuidance] = useState(false);

  return (
    <div className="space-y-6">
      <FormDocumentHeader
        title="FORM 2 (Revised) — NOMINATION AND DECLARATION FORM"
        subtitle="FOR UNEXEMPTED/EXEMPTED ESTABLISHMENTS · Declaration and Nomination Form under the Employees’ Provident Funds and Employees’ Pension Scheme (Paragraphs 33 & 61 (1) of the Employees Provident Fund Scheme, 1952 and Paragraph 18 of the Employees’ Pension scheme, 1995)"
        rightBadge="Form -2"
        showCompanyAddress={false}
      />

      {/* Subscriber Particulars 1-8 */}
      <section className="space-y-4">
        <h4 className="text-xs font-semibold text-[#0B1F3A] uppercase tracking-wider">
          Member / Subscriber Particulars (Items 1 – 8)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="f5-name" className="block text-xs font-medium text-slate-700">
              1. Name (in Block letters) : <span className="text-red-600">*</span>
            </label>
            <input
              id="f5-name"
              type="text"
              value={data.nameInBlockLetters}
              onChange={(e) => onChange({ nameInBlockLetters: e.target.value.toUpperCase() })}
              className={`${inputClass} uppercase`}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f5-father" className="block text-xs font-medium text-slate-700">
              2. Father’s/Husband’s Name : <span className="text-red-600">*</span>
            </label>
            <input
              id="f5-father"
              type="text"
              value={data.fatherOrHusbandName}
              onChange={(e) => onChange({ fatherOrHusbandName: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f5-dob" className="block text-xs font-medium text-slate-700">
              3. Date of Birth : <span className="text-red-600">*</span>
            </label>
            <input
              id="f5-dob"
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => onChange({ dateOfBirth: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f5-sex" className="block text-xs font-medium text-slate-700">
              4. Sex : <span className="text-red-600">*</span>
            </label>
            <select
              id="f5-sex"
              value={data.sex}
              onChange={(e) => onChange({ sex: e.target.value })}
              className={selectClass}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Transgender">Transgender</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="f5-marital" className="block text-xs font-medium text-slate-700">
              5. Marital Status : <span className="text-red-600">*</span>
            </label>
            <select
              id="f5-marital"
              value={data.maritalStatus}
              onChange={(e) => onChange({ maritalStatus: e.target.value })}
              className={selectClass}
            >
              <option value="">Select</option>
              <option value="Married">Married</option>
              <option value="Unmarried">Unmarried</option>
              <option value="Widow / Widower">Widow / Widower</option>
              <option value="Divorcee">Divorcee</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="f5-acct" className="block text-xs font-medium text-slate-700">
              6. Account No. :
            </label>
            <input
              id="f5-acct"
              type="text"
              value={data.accountNo}
              onChange={(e) => onChange({ accountNo: e.target.value })}
              placeholder="If already allotted"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f5-perm" className="block text-xs font-medium text-slate-700">
              7. Address — Permanent : <span className="text-red-600">*</span>
            </label>
            <textarea
              id="f5-perm"
              rows={2}
              value={data.permanentAddress}
              onChange={(e) => onChange({ permanentAddress: e.target.value })}
              className={textareaClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f5-temp" className="block text-xs font-medium text-slate-700">
              7. Address — Temporary :
            </label>
            <textarea
              id="f5-temp"
              rows={2}
              value={data.temporaryAddress}
              onChange={(e) => onChange({ temporaryAddress: e.target.value })}
              className={textareaClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f5-doj-epf" className="block text-xs font-medium text-slate-700">
              8. Date of Joining — EPF :
            </label>
            <input
              id="f5-doj-epf"
              type="date"
              value={data.dateOfJoiningEpf}
              onChange={(e) => onChange({ dateOfJoiningEpf: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f5-doj-eps" className="block text-xs font-medium text-slate-700">
              8. Date of Joining — EPS :
            </label>
            <input
              id="f5-doj-eps"
              type="date"
              value={data.dateOfJoiningEps}
              onChange={(e) => onChange({ dateOfJoiningEps: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* PART - A (EPF) */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-[#0B1F3A]">PART – A (EPF)</h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            I hereby nominate the person(s) /cancel the nomination made by me previously and nominate
            the person(s) mentioned below to receive the amount standing to my credit in the
            Employees’ Provident Fund in the event of my death :
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() =>
              onChange({
                partANominees: [
                  ...data.partANominees,
                  {
                    nomineeNameAndAddress: '',
                    relationship: '',
                    dateOfBirth: '',
                    shareProportion: '',
                    minorGuardianDetails: '',
                  },
                ],
              })
            }
            className="inline-flex items-center gap-1 text-xs font-medium text-[#C2410C] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Nominee Row</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left border-collapse text-xs min-w-[740px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-2 px-2">1. Name &amp; Address of the nominee/nominees <span className="text-red-600">*</span></th>
                <th className="py-2 px-2">2. Nominee’s relationship with the member <span className="text-red-600">*</span></th>
                <th className="py-2 px-2">3. Date of Birth</th>
                <th className="py-2 px-2">4. Total amount of share of Accumulations in Provident Fund to be paid to each nominee <span className="text-red-600">*</span></th>
                <th className="py-2 px-2">5. If the nominee is a minor, name &amp; relationship &amp; address of the guardian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.partANominees.map((row, idx) => (
                <tr key={idx}>
                  <td className="p-1.5">
                    <textarea
                      rows={2}
                      aria-label={`Part A nominee ${idx + 1} name and address`}
                      value={row.nomineeNameAndAddress}
                      onChange={(e) => {
                        const next = [...data.partANominees];
                        next[idx] = { ...row, nomineeNameAndAddress: e.target.value };
                        onChange({ partANominees: next });
                      }}
                      className={textareaClass}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      aria-label={`Part A nominee ${idx + 1} relationship`}
                      value={row.relationship}
                      onChange={(e) => {
                        const next = [...data.partANominees];
                        next[idx] = { ...row, relationship: e.target.value };
                        onChange({ partANominees: next });
                      }}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="date"
                      value={row.dateOfBirth}
                      onChange={(e) => {
                        const next = [...data.partANominees];
                        next[idx] = { ...row, dateOfBirth: e.target.value };
                        onChange({ partANominees: next });
                      }}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      aria-label={`Part A nominee ${idx + 1} share`}
                      placeholder="e.g. 100%"
                      value={row.shareProportion}
                      onChange={(e) => {
                        const next = [...data.partANominees];
                        next[idx] = { ...row, shareProportion: e.target.value };
                        onChange({ partANominees: next });
                      }}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-1.5">
                    <textarea
                      rows={2}
                      value={row.minorGuardianDetails}
                      onChange={(e) => {
                        const next = [...data.partANominees];
                        next[idx] = { ...row, minorGuardianDetails: e.target.value };
                        onChange({ partANominees: next });
                      }}
                      className={textareaClass}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3.5 text-xs">
          <p className="text-[11px] text-slate-500 font-medium">
            *Check applicable certifications (Strike out whichever is not applicable):
          </p>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.partACertifyNoFamily}
              onChange={(e) => onChange({ partACertifyNoFamily: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C]"
            />
            <span>
              1 * Certified that I have no family as defined in para 2(g) of the Employees’ Provident
              Fund Scheme, 1952 and should I acquire a Family hereafter, the above nomination should
              be deemed as cancelled.
            </span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.partACertifyParentsDependent}
              onChange={(e) => onChange({ partACertifyParentsDependent: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C]"
            />
            <span>2 * Certified that my father/mother is/are dependent upon me.</span>
          </label>
        </div>

        <SignaturePadField
          id="f5-parta-sig"
          label="Signature or thumb impression of the subscriber (Part – A EPF)"
          required
          value={data.partASubscriberSignatureDataUrl}
          onChange={(url) => onChange({ partASubscriberSignatureDataUrl: url })}
        />
      </section>

      {/* Part B (EPS) (Para 18) */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-[#0B1F3A]">Part B (EPS) (Para 18)</h4>
          <p className="text-xs text-slate-700 leading-relaxed">
            I hereby furnish below particulars of the members of my family who would be eligible to
            receive widow/children pension in the event of my death.
          </p>
        </div>

        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left border-collapse text-xs min-w-[650px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-2 px-2 w-14">S.No. (1)</th>
                <th className="py-2 px-2">Name of the family members (2)</th>
                <th className="py-2 px-2">Address (3)</th>
                <th className="py-2 px-2 w-36">Date of Birth (4)</th>
                <th className="py-2 px-2">Relationship with the member (5)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.partBFamilyMembers.map((row, idx) => (
                <tr key={row.slNo}>
                  <td className="p-2 font-mono text-slate-600">{row.slNo}</td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.familyMemberName}
                      onChange={(e) => {
                        const next = [...data.partBFamilyMembers];
                        next[idx] = { ...row, familyMemberName: e.target.value };
                        onChange({ partBFamilyMembers: next });
                      }}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.address}
                      onChange={(e) => {
                        const next = [...data.partBFamilyMembers];
                        next[idx] = { ...row, address: e.target.value };
                        onChange({ partBFamilyMembers: next });
                      }}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="date"
                      value={row.dateOfBirth}
                      onChange={(e) => {
                        const next = [...data.partBFamilyMembers];
                        next[idx] = { ...row, dateOfBirth: e.target.value };
                        onChange({ partBFamilyMembers: next });
                      }}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={row.relationship}
                      onChange={(e) => {
                        const next = [...data.partBFamilyMembers];
                        next[idx] = { ...row, relationship: e.target.value };
                        onChange({ partBFamilyMembers: next });
                      }}
                      className={inputClass}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <label className="flex items-start gap-2 cursor-pointer text-xs rounded-md border border-slate-200 bg-slate-50 p-3">
          <input
            type="checkbox"
            checked={data.partBCertifyNoFamily}
            onChange={(e) => onChange({ partBCertifyNoFamily: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C]"
          />
          <span>
            ** Certified that I have no family, as defined in para 2(vii) of Employees’ Pension
            Scheme, 1995 and should I acquire a family hereafter I shall furnish particulars thereon
            in the above form.
          </span>
        </label>

        <div className="space-y-2">
          <p className="text-xs text-slate-700 leading-relaxed">
            I hereby nominate the following person for receiving the monthly widow pension
            (admissible under para 16 2(a)(i) and (ii) in the event of my death without leaving any
            eligible family member for receiving Pension.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label htmlFor="f5-widow-name" className="block text-xs font-medium text-slate-700">
                Name and Address of the Nominee
              </label>
              <textarea
                id="f5-widow-name"
                rows={2}
                value={data.partBWidowPensionNomineeNameAddress}
                onChange={(e) =>
                  onChange({ partBWidowPensionNomineeNameAddress: e.target.value })
                }
                className={textareaClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f5-widow-dob" className="block text-xs font-medium text-slate-700">
                Date of Birth
              </label>
              <input
                id="f5-widow-dob"
                type="date"
                value={data.partBWidowPensionNomineeDob}
                onChange={(e) => onChange({ partBWidowPensionNomineeDob: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f5-widow-rel" className="block text-xs font-medium text-slate-700">
                Relationship with the member
              </label>
              <input
                id="f5-widow-rel"
                type="text"
                value={data.partBWidowPensionNomineeRelationship}
                onChange={(e) =>
                  onChange({ partBWidowPensionNomineeRelationship: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="f5-b-date" className="block text-xs font-medium text-slate-700">
                Date : <span className="text-red-600">*</span>
              </label>
              <input
                id="f5-b-date"
                type="date"
                value={data.partBDate}
                onChange={(e) => onChange({ partBDate: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f5-b-place" className="block text-xs font-medium text-slate-700">
                Place : <span className="text-red-600">*</span>
              </label>
              <input
                id="f5-b-place"
                type="text"
                value={data.partBPlace}
                onChange={(e) => onChange({ partBPlace: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <SignaturePadField
            id="f5-partb-sig"
            label="Signature or thumb impression of the subscriber (Part B EPS)"
            required
            value={data.partBSubscriberSignatureDataUrl}
            onChange={(url) => onChange({ partBSubscriberSignatureDataUrl: url })}
          />

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.declarationConfirmed}
              onChange={(e) => onChange({ declarationConfirmed: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C]"
            />
            <span className="text-xs text-slate-800">
              I confirm that the above EPF &amp; EPS Nomination and Declaration entries in Form 2
              (Revised) are true and complete. (**Strike out whichever is not applicable.){' '}
              <span className="text-red-600">*</span>
            </span>
          </label>
        </div>

        <OfficeUseBox
          title="CERTIFICATE BY EMPLOYER"
          description="Completed by Employer / Authorised Officer after employee submission."
        >
          <p className="text-xs text-slate-600 leading-relaxed">
            Certified that the above declaration and nomination has been signed/thumb impressed
            before me by Shri/Smt./Kum. _________________________ employed in my establishment after
            he/she has read the entries/entries have been read over to him/her by me and got
            confirmed by him/her.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-slate-600">
            <div>Place : ______________ Dated the : ______________</div>
            <div>Signature of the employer or other Authorised Officers / Designation / Rubber Stamp</div>
          </div>
        </OfficeUseBox>

        {/* Pages 3-4 Statutory Guidance */}
        <div className="rounded-md border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGuidance((prev) => !prev)}
            className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-[#0B1F3A]"
          >
            <span>GUIDANCE FOR FILLING THE FORM No - 2 (Pages 3–4 Statutory Instructions)</span>
            {showGuidance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showGuidance && (
            <div className="p-4 text-xs text-slate-600 space-y-2.5 leading-relaxed bg-white border-t border-slate-200">
              <p className="font-semibold text-[#0B1F3A]">
                Employee’s Provident Fund Scheme, 1952 (EPF) — Para 33 &amp; Para 61: Nomination
              </p>
              <p>
                1. Each member shall make in his declaration in Form 2, a nomination conferring the
                right to receive the amount that may stand to his credit in the Fund in the event of
                his death before the amount standing to his credit has become payable, or where the
                amount has become payable before payment has been made.
              </p>
              <p>
                2. A member may in this nomination distribute the amount that may stand to his
                credit in the Fund amongst his nominees at his own discretion.
              </p>
              <p>
                3. If a member has a family at the time of making a nomination, the nomination shall
                be in favour of one or more persons belonging to his family. Any nomination made by
                such member in favour of a person not belonging to his family shall be invalid.
              </p>
              <p>
                4. If at the time of making a nomination the member has no family, the nomination
                may be in favour of any person or persons but if the member subsequently acquires a
                family, such nomination shall forthwith be deemed to be invalid and the member shall
                make a fresh nomination in favour of one or more persons belonging to his family.
              </p>
              <p className="font-semibold text-[#0B1F3A] pt-1">
                Para 2(g) &amp; Para 2(vii) Family Definition &amp; EPS 1995 NOTE:
              </p>
              <p>
                NOTE: Members can nominate a person to receive benefits under the Employees’ Pension
                Scheme 1995 where a member is unmarried or does not have any family. Such nominee
                shall be paid pension equal to widow pension in case of death of member.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
