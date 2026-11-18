import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { validateDocumentFile } from '../../../shared/onboardingLogic';
import type { Form08Form11 } from '../../../shared/types';
import { SignaturePadField } from '../SignaturePadField';
import {
  FormDocumentHeader,
  inputClass,
  OfficeUseBox,
  selectClass,
} from './FormDocumentHeader';

interface Form08Form11ViewProps {
  data: Form08Form11;
  onChange: (patch: Partial<Form08Form11>) => void;
  onAttachKycFile?: (file: File) => void;
}

export const Form08Form11View: React.FC<Form08Form11ViewProps> = ({
  data,
  onChange,
  onAttachKycFile,
}) => {
  const kycInputRef = useRef<HTMLInputElement | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycError, setKycError] = useState<string | null>(null);

  const hasPreviousPfOrEps =
    data.earlierMemberEpf1952 === 'Yes' || data.earlierMemberEps1995 === 'Yes';

  const handleKycFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setKycError(null);
    let attachedCount = 0;
    for (const file of Array.from(files)) {
      const check = validateDocumentFile({
        name: file.name,
        sizeBytes: file.size,
        mimeType: file.type,
      });
      if (!check.valid) {
        setKycError(check.error || 'Invalid KYC file.');
        continue;
      }
      onAttachKycFile?.(file);
      attachedCount += 1;
    }
    if (attachedCount > 0) {
      setKycStatus(`${attachedCount} KYC file(s) staged in Document Upload Center.`);
    }
    if (kycInputRef.current) kycInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <FormDocumentHeader
        title="New Form No.-11 – Declaration Form"
        subtitle="(To be retained by the employer for future reference) · EMPLOYEES’ PROVIDENT FUND ORGANISATION · Employees’ Provident Funds Scheme, 1952 (Paragraph 34 & 57) & Employees’ Pension Scheme, 1995 (Paragraph 24) · (Declaration by a person taking up employment in any establishment on which EPF Scheme, 1952 and /or EPS, 1995 is applicable)"
        rightBadge="EPFO Form-11 (Revised)"
        showCompanyAddress={false}
      />

      {/* Numbered Table 1 - 11 */}
      <div className="rounded-md border border-slate-200 divide-y divide-slate-200">
        {/* 1 */}
        <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          <label htmlFor="f8-name" className="md:col-span-5 text-xs font-medium text-slate-700">
            1. Name of the member <span className="text-red-600">*</span>
          </label>
          <div className="md:col-span-7">
            <input
              id="f8-name"
              type="text"
              value={data.memberName}
              onChange={(e) => onChange({ memberName: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        {/* 2 */}
        <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
          <div className="md:col-span-5 space-y-1.5">
            <span className="block text-xs font-medium text-slate-700">
              2. Father’s Name / Spouse’s Name (Please tick whichever is applicable){' '}
              <span className="text-red-600">*</span>
            </span>
            <div className="flex items-center gap-4 text-xs">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="f8-rel-type"
                  checked={data.relationType === 'Father'}
                  onChange={() => onChange({ relationType: 'Father' })}
                />
                <span>Father’s Name</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="f8-rel-type"
                  checked={data.relationType === 'Spouse'}
                  onChange={() => onChange({ relationType: 'Spouse' })}
                />
                <span>Spouse’s Name</span>
              </label>
            </div>
          </div>
          <div className="md:col-span-7">
            <input
              type="text"
              aria-label="Father or Spouse Name"
              value={data.fatherOrSpouseName}
              onChange={(e) => onChange({ fatherOrSpouseName: e.target.value })}
              placeholder={`Enter ${data.relationType}'s Name`}
              className={inputClass}
            />
          </div>
        </div>

        {/* 3 */}
        <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          <label htmlFor="f8-dob" className="md:col-span-5 text-xs font-medium text-slate-700">
            3. Date of Birth: (DD / MM / YYYY) <span className="text-red-600">*</span>
          </label>
          <div className="md:col-span-7">
            <input
              id="f8-dob"
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => onChange({ dateOfBirth: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        {/* 4 */}
        <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          <label htmlFor="f8-gender" className="md:col-span-5 text-xs font-medium text-slate-700">
            4. Gender: (Male/Female/Transgender) <span className="text-red-600">*</span>
          </label>
          <div className="md:col-span-7">
            <select
              id="f8-gender"
              value={data.gender}
              onChange={(e) =>
                onChange({ gender: e.target.value as Form08Form11['gender'] })
              }
              className={selectClass}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Transgender">Transgender</option>
            </select>
          </div>
        </div>

        {/* 5 */}
        <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          <label htmlFor="f8-marital" className="md:col-span-5 text-xs font-medium text-slate-700">
            5. Marital Status: (Married/Unmarried/Widow/Widower/Divorcee){' '}
            <span className="text-red-600">*</span>
          </label>
          <div className="md:col-span-7">
            <select
              id="f8-marital"
              value={data.maritalStatus}
              onChange={(e) =>
                onChange({ maritalStatus: e.target.value as Form08Form11['maritalStatus'] })
              }
              className={selectClass}
            >
              <option value="">Select</option>
              <option value="Married">Married</option>
              <option value="Unmarried">Unmarried</option>
              <option value="Widow">Widow</option>
              <option value="Widower">Widower</option>
              <option value="Divorcee">Divorcee</option>
            </select>
          </div>
        </div>

        {/* 6 */}
        <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
          <span className="md:col-span-5 text-xs font-medium text-slate-700">
            6. (a) Email ID &amp; (b) Mobile No.: <span className="text-red-600">*</span>
          </span>
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="email"
              aria-label="Email ID"
              placeholder="(a) Email ID"
              value={data.emailId}
              onChange={(e) => onChange({ emailId: e.target.value })}
              className={inputClass}
            />
            <input
              type="tel"
              aria-label="Mobile No."
              placeholder="(b) Mobile No."
              value={data.mobileNo}
              onChange={(e) => onChange({ mobileNo: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        {/* 7 */}
        <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          <label htmlFor="f8-epf" className="md:col-span-8 text-xs font-medium text-slate-700">
            7. Whether earlier a member of Employees’ Provident Fund Scheme, 1952{' '}
            <span className="text-red-600">*</span>
          </label>
          <div className="md:col-span-4">
            <select
              id="f8-epf"
              value={data.earlierMemberEpf1952}
              onChange={(e) =>
                onChange({ earlierMemberEpf1952: e.target.value as '' | 'Yes' | 'No' })
              }
              className={selectClass}
            >
              <option value="">Select Yes / No</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        {/* 8 */}
        <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          <label htmlFor="f8-eps" className="md:col-span-8 text-xs font-medium text-slate-700">
            8. Whether earlier a member of Employees’ Pension Scheme, 1995{' '}
            <span className="text-red-600">*</span>
          </label>
          <div className="md:col-span-4">
            <select
              id="f8-eps"
              value={data.earlierMemberEps1995}
              onChange={(e) =>
                onChange({ earlierMemberEps1995: e.target.value as '' | 'Yes' | 'No' })
              }
              className={selectClass}
            >
              <option value="">Select Yes / No</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        {/* 9 */}
        <div className="p-3.5 space-y-3 bg-slate-50/40">
          <p className="text-xs font-semibold text-[#0B1F3A]">
            9. Previous employment details: [if Yes to 7 AND/OR 8 above]
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label htmlFor="f8-uan" className="block text-xs text-slate-700">
                a) Universal Account Number:
              </label>
              <input
                id="f8-uan"
                type="text"
                disabled={!hasPreviousPfOrEps}
                value={data.previousUan}
                onChange={(e) => onChange({ previousUan: e.target.value })}
                className={`${inputClass} disabled:bg-slate-100`}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f8-pf-acct" className="block text-xs text-slate-700">
                b) Previous PF Account Number:
              </label>
              <input
                id="f8-pf-acct"
                type="text"
                disabled={!hasPreviousPfOrEps}
                value={data.previousPfAccountNo}
                onChange={(e) => onChange({ previousPfAccountNo: e.target.value })}
                className={`${inputClass} disabled:bg-slate-100`}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f8-exit" className="block text-xs text-slate-700">
                c) Date of exit from previous employment:
              </label>
              <input
                id="f8-exit"
                type="date"
                disabled={!hasPreviousPfOrEps}
                value={data.previousExitDate}
                onChange={(e) => onChange({ previousExitDate: e.target.value })}
                className={`${inputClass} disabled:bg-slate-100`}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f8-scheme-cert" className="block text-xs text-slate-700">
                d) Scheme Certificate No. (if issued)
              </label>
              <input
                id="f8-scheme-cert"
                type="text"
                disabled={!hasPreviousPfOrEps}
                value={data.schemeCertificateNo}
                onChange={(e) => onChange({ schemeCertificateNo: e.target.value })}
                className={`${inputClass} disabled:bg-slate-100`}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f8-ppo" className="block text-xs text-slate-700">
                e) Pension Payment Order (PPO) No. (if issued)
              </label>
              <input
                id="f8-ppo"
                type="text"
                disabled={!hasPreviousPfOrEps}
                value={data.ppoNo}
                onChange={(e) => onChange({ ppoNo: e.target.value })}
                className={`${inputClass} disabled:bg-slate-100`}
              />
            </div>
          </div>
        </div>

        {/* 10 */}
        <div className="p-3.5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
            <label htmlFor="f8-iw" className="md:col-span-8 text-xs font-semibold text-[#0B1F3A]">
              10. a) International Worker: <span className="text-red-600">*</span>
            </label>
            <div className="md:col-span-4">
              <select
                id="f8-iw"
                value={data.internationalWorker}
                onChange={(e) =>
                  onChange({ internationalWorker: e.target.value as '' | 'Yes' | 'No' })
                }
                className={selectClass}
              >
                <option value="">Select Yes / No</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          {data.internationalWorker === 'Yes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="space-y-1">
                <label className="block text-xs text-slate-700">
                  b) If yes, state country of origin
                </label>
                <input
                  type="text"
                  value={data.countryOfOrigin}
                  onChange={(e) => onChange({ countryOfOrigin: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-700">c) Passport No.</label>
                <input
                  type="text"
                  value={data.passportNo}
                  onChange={(e) => onChange({ passportNo: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-700">d) Passport Valid From</label>
                <input
                  type="date"
                  value={data.passportValidFrom}
                  onChange={(e) => onChange({ passportValidFrom: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-slate-700">Passport Valid To</label>
                <input
                  type="date"
                  value={data.passportValidTo}
                  onChange={(e) => onChange({ passportValidTo: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>

        {/* 11 */}
        <div className="p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[#0B1F3A]">
              11. KYC Details: (attach self attested copies of following KYCs)
            </p>
            <div>
              <input
                ref={kycInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(e) => handleKycFiles(e.target.files)}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => kycInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Attach Self-Attested KYC Files</span>
              </button>
            </div>
          </div>

          {kycStatus && <p className="text-xs text-emerald-700">{kycStatus}</p>}
          {kycError && <p className="text-xs text-red-600">{kycError}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="f8-bank" className="block text-xs text-slate-700">
                a) Bank Account No. <span className="text-red-600">*</span>
              </label>
              <input
                id="f8-bank"
                type="text"
                value={data.bankAccountNo}
                onChange={(e) => onChange({ bankAccountNo: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f8-ifsc" className="block text-xs text-slate-700">
                IFS Code <span className="text-red-600">*</span>
              </label>
              <input
                id="f8-ifsc"
                type="text"
                value={data.ifscCode}
                onChange={(e) => onChange({ ifscCode: e.target.value.toUpperCase() })}
                className={`${inputClass} uppercase`}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f8-aadhar" className="block text-xs text-slate-700">
                b) AADHAR Number <span className="text-red-600">*</span>
              </label>
              <input
                id="f8-aadhar"
                type="text"
                value={data.aadharNumber}
                onChange={(e) => onChange({ aadharNumber: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f8-pan" className="block text-xs text-slate-700">
                c) Permanent Account Number (PAN), if available
              </label>
              <input
                id="f8-pan"
                type="text"
                value={data.panNumber}
                onChange={(e) => onChange({ panNumber: e.target.value.toUpperCase() })}
                className={`${inputClass} uppercase`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* UNDERTAKING */}
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
          <h4 className="font-bold text-[#0B1F3A] underline">UNDERTAKING</h4>
          <p>1) Certified that the particulars are true to the best of my knowledge.</p>
          <p>
            2) I authorize EPFO to use my Aadhar for verification/authentication/eKYC purpose for
            service delivery.
          </p>
          <p>
            3) Kindly transfer the funds and service details, if applicable, from the previous PF
            account as declared above to the present P.F. Account. (The transfer would be possible
            only if the identified KYC detail approved by previous employer has been verified by
            present employer using his Digital Signature Certificate)
          </p>
          <p>
            4) In case of changes in above details, the same will be intimated to employer at the
            earliest.
          </p>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={data.undertakingAccepted}
            onChange={(e) => onChange({ undertakingAccepted: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1D4ED8]"
          />
          <span className="text-xs font-medium text-[#0B1F3A]">
            I accept and confirm clauses (1) to (4) of the UNDERTAKING above.{' '}
            <span className="text-red-600">*</span>
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="f8-date" className="block text-xs font-medium text-slate-700">
              Date: <span className="text-red-600">*</span>
            </label>
            <input
              id="f8-date"
              type="date"
              value={data.date}
              onChange={(e) => onChange({ date: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="f8-place" className="block text-xs font-medium text-slate-700">
              Place: <span className="text-red-600">*</span>
            </label>
            <input
              id="f8-place"
              type="text"
              value={data.place}
              onChange={(e) => onChange({ place: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <SignaturePadField
          id="f8-sig"
          label="Signature of Member"
          required
          value={data.memberSignatureDataUrl}
          onChange={(url) => onChange({ memberSignatureDataUrl: url })}
        />
      </div>

      {/* DECLARATION BY PRESENT EMPLOYER */}
      <OfficeUseBox
        title="DECLARATION BY PRESENT EMPLOYER"
        description="Completed by HR / Authorized Employer Signatory after onboarding verification."
      >
        <div className="space-y-1.5 text-xs text-slate-600">
          <p>
            A. The member Mr./Ms./Mrs. _______________ has joined on _______________ and has been
            allotted PF Number _______________.
          </p>
          <p>
            B. In case the person was earlier not a member of EPF Scheme, 1952 and EPS, 1995: (Post
            allotment of UAN) UAN allotted &amp; UAN KYC upload/DSC status checkboxes.
          </p>
          <p>
            C. In case the person was earlier a member of EPF Scheme, 1952 and EPS, 1995: UAN/Previous
            Member ID tagging &amp; DSC/Form-13 transfer status checkboxes.
          </p>
          <p className="pt-1 font-medium">
            Date: ______________ | Signature of Employer with Seal of Establishment
          </p>
        </div>
      </OfficeUseBox>
    </div>
  );
};
