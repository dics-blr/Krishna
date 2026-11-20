import React, { useRef } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { validateDocumentFile } from '../../../shared/onboardingLogic';
import type { Form01BioData } from '../../../shared/types';
import { SignaturePadField } from '../SignaturePadField';
import {
  FormDocumentHeader,
  inputClass,
  OfficeUseBox,
  selectClass,
  textareaClass,
} from './FormDocumentHeader';

interface Form01BioDataViewProps {
  data: Form01BioData;
  onChange: (patch: Partial<Form01BioData>) => void;
  onAttachPhoto?: (file: File) => void;
}

export const Form01BioDataView: React.FC<Form01BioDataViewProps> = ({
  data,
  onChange,
  onAttachPhoto,
}) => {
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [photoError, setPhotoError] = React.useState<string | null>(null);

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
      <FormDocumentHeader title="BIO-DATA FORM" rightBadge="Page 1–3 of Bio Data Form" />

      {/* Page 1: Header + Photograph + Addresses + Personal Particulars */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="space-y-1">
              <label htmlFor="f1-name" className="block text-xs font-medium text-slate-700">
                Name (in Capitals): <span className="text-red-600">*</span>
              </label>
              <input
                id="f1-name"
                type="text"
                value={data.nameInCapitals}
                onChange={(e) => onChange({ nameInCapitals: e.target.value.toUpperCase() })}
                placeholder="FULL NAME IN BLOCK CAPITALS"
                className={`${inputClass} uppercase`}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="f1-position" className="block text-xs font-medium text-slate-700">
                Position applied for: <span className="text-red-600">*</span>
              </label>
              <input
                id="f1-position"
                type="text"
                value={data.positionAppliedFor}
                onChange={(e) => onChange({ positionAppliedFor: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Photograph Box */}
          <div className="lg:col-span-4 rounded-md border border-slate-300 bg-slate-50 p-3 space-y-2">
            <p className="text-xs font-medium text-slate-700">Photograph (Passport Size)</p>
            <input
              ref={photoInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onChange={(e) => handlePhotoSelect(e.target.files)}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-slate-300 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{data.photoFileName ? 'Replace Photograph' : 'Attach Photograph'}</span>
            </button>
            {data.photoFileName && (
              <p className="text-[11px] font-mono text-emerald-700 truncate">
                Attached: {data.photoFileName}
              </p>
            )}
            {photoError && <p className="text-[11px] text-red-600">{photoError}</p>}
          </div>
        </div>

        {/* Present Address & Permanent Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="f1-present-addr" className="block text-xs font-medium text-slate-700">
              Present Address <span className="text-red-600">*</span>
            </label>
            <textarea
              id="f1-present-addr"
              rows={3}
              value={data.presentAddress}
              onChange={(e) => onChange({ presentAddress: e.target.value })}
              className={textareaClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-perm-addr" className="block text-xs font-medium text-slate-700">
              Permanent Address <span className="text-red-600">*</span>
            </label>
            <textarea
              id="f1-perm-addr"
              rows={3}
              value={data.permanentAddress}
              onChange={(e) => onChange({ permanentAddress: e.target.value })}
              className={textareaClass}
            />
          </div>
        </div>

        {/* Paired Personal Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="f1-mobile" className="block text-xs font-medium text-slate-700">
              Mobile No: <span className="text-red-600">*</span>
            </label>
            <input
              id="f1-mobile"
              type="tel"
              value={data.mobileNo}
              onChange={(e) => onChange({ mobileNo: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-email" className="block text-xs font-medium text-slate-700">
              E – Mail: <span className="text-red-600">*</span>
            </label>
            <input
              id="f1-email"
              type="email"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-dob" className="block text-xs font-medium text-slate-700">
              Date of Birth: <span className="text-red-600">*</span>
            </label>
            <input
              id="f1-dob"
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => onChange({ dateOfBirth: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-pob" className="block text-xs font-medium text-slate-700">
              Place of Birth:
            </label>
            <input
              id="f1-pob"
              type="text"
              value={data.placeOfBirth}
              onChange={(e) => onChange({ placeOfBirth: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-height" className="block text-xs font-medium text-slate-700">
              Height (CM’s):
            </label>
            <input
              id="f1-height"
              type="text"
              value={data.heightCm}
              onChange={(e) => onChange({ heightCm: e.target.value })}
              placeholder="CM’s"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-weight" className="block text-xs font-medium text-slate-700">
              Weight (KG’s):
            </label>
            <input
              id="f1-weight"
              type="text"
              value={data.weightKg}
              onChange={(e) => onChange({ weightKg: e.target.value })}
              placeholder="KG’s"
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-blood" className="block text-xs font-medium text-slate-700">
              Blood Group:
            </label>
            <select
              id="f1-blood"
              value={data.bloodGroup}
              onChange={(e) => onChange({ bloodGroup: e.target.value })}
              className={selectClass}
            >
              <option value="">Select</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-tongue" className="block text-xs font-medium text-slate-700">
              Mother Tongue:
            </label>
            <input
              id="f1-tongue"
              type="text"
              value={data.motherTongue}
              onChange={(e) => onChange({ motherTongue: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-marital" className="block text-xs font-medium text-slate-700">
              Marital Status:
            </label>
            <select
              id="f1-marital"
              value={data.maritalStatus}
              onChange={(e) => onChange({ maritalStatus: e.target.value })}
              className={selectClass}
            >
              <option value="">Select</option>
              <option value="Single / Unmarried">Single / Unmarried</option>
              <option value="Married">Married</option>
              <option value="Widow / Widower">Widow / Widower</option>
              <option value="Divorced">Divorced</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-dependents" className="block text-xs font-medium text-slate-700">
              No. Of Dependents:
            </label>
            <input
              id="f1-dependents"
              type="number"
              min={0}
              value={data.noOfDependents}
              onChange={(e) => onChange({ noOfDependents: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-father" className="block text-xs font-medium text-slate-700">
              Father’s Name:
            </label>
            <input
              id="f1-father"
              type="text"
              value={data.fatherName}
              onChange={(e) => onChange({ fatherName: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-father-occ" className="block text-xs font-medium text-slate-700">
              Occupation (Father):
            </label>
            <input
              id="f1-father-occ"
              type="text"
              value={data.fatherOccupation}
              onChange={(e) => onChange({ fatherOccupation: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-mother" className="block text-xs font-medium text-slate-700">
              Mother’s Name:
            </label>
            <input
              id="f1-mother"
              type="text"
              value={data.motherName}
              onChange={(e) => onChange({ motherName: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-mother-occ" className="block text-xs font-medium text-slate-700">
              Occupation (Mother):
            </label>
            <input
              id="f1-mother-occ"
              type="text"
              value={data.motherOccupation}
              onChange={(e) => onChange({ motherOccupation: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-spouse" className="block text-xs font-medium text-slate-700">
              Spouse Name:
            </label>
            <input
              id="f1-spouse"
              type="text"
              value={data.spouseName}
              onChange={(e) => onChange({ spouseName: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-spouse-occ" className="block text-xs font-medium text-slate-700">
              Occupation (Spouse):
            </label>
            <input
              id="f1-spouse-occ"
              type="text"
              value={data.spouseOccupation}
              onChange={(e) => onChange({ spouseOccupation: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-children" className="block text-xs font-medium text-slate-700">
              Children:
            </label>
            <input
              id="f1-children"
              type="text"
              value={data.childrenDetails}
              onChange={(e) => onChange({ childrenDetails: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-uan" className="block text-xs font-medium text-slate-700">
              PF UAN No:
            </label>
            <input
              id="f1-uan"
              type="text"
              value={data.pfUanNo}
              onChange={(e) => onChange({ pfUanNo: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-esic" className="block text-xs font-medium text-slate-700">
              ESIC No:
            </label>
            <input
              id="f1-esic"
              type="text"
              value={data.esicNo}
              onChange={(e) => onChange({ esicNo: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-pan" className="block text-xs font-medium text-slate-700">
              PAN No:
            </label>
            <input
              id="f1-pan"
              type="text"
              value={data.panNo}
              onChange={(e) => onChange({ panNo: e.target.value.toUpperCase() })}
              className={`${inputClass} uppercase`}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="f1-aadhar" className="block text-xs font-medium text-slate-700">
              AADHAR card No:
            </label>
            <input
              id="f1-aadhar"
              type="text"
              value={data.aadharNo}
              onChange={(e) => onChange({ aadharNo: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        {/* Languages Known Table */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold text-[#0B1F3A]">Languages Known:</h4>
            <button
              type="button"
              onClick={() =>
                onChange({
                  languagesKnown: [
                    ...data.languagesKnown,
                    { language: '', speak: false, read: false, write: false },
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
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2 px-3">Language</th>
                  <th className="py-2 px-3 text-center">Speak</th>
                  <th className="py-2 px-3 text-center">Read</th>
                  <th className="py-2 px-3 text-center">Write</th>
                  <th className="py-2 px-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.languagesKnown.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-2">
                      <input
                        type="text"
                        aria-label={`Language row ${idx + 1}`}
                        value={row.language}
                        onChange={(e) => {
                          const next = [...data.languagesKnown];
                          next[idx] = { ...row, language: e.target.value };
                          onChange({ languagesKnown: next });
                        }}
                        className="w-full h-8 px-2 rounded border border-slate-300 text-xs"
                      />
                    </td>
                    {(['speak', 'read', 'write'] as const).map((skill) => (
                      <td key={skill} className="p-2 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Language ${idx + 1} ${skill}`}
                          checked={row[skill]}
                          onChange={(e) => {
                            const next = [...data.languagesKnown];
                            next[idx] = { ...row, [skill]: e.target.checked };
                            onChange({ languagesKnown: next });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-[#C2410C]"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center">
                      {data.languagesKnown.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              languagesKnown: data.languagesKnown.filter((_, i) => i !== idx),
                            })
                          }
                          aria-label={`Remove language row ${idx + 1}`}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Page 2: Educational Qualifications & Work Experience & Disclosures */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold text-[#0B1F3A]">
              Educational Qualifications (Start from SSLC onwards)
            </h4>
            <button
              type="button"
              onClick={() =>
                onChange({
                  educationalQualifications: [
                    ...data.educationalQualifications,
                    {
                      examPassed: '',
                      institutionNameAndAddress: '',
                      subjects: '',
                      periodFrom: '',
                      periodTo: '',
                      marksOrClass: '',
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
            <table className="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2 px-2">Exam passed</th>
                  <th className="py-2 px-2">Name and address of the institution</th>
                  <th className="py-2 px-2">Subjects</th>
                  <th className="py-2 px-2">Period: From</th>
                  <th className="py-2 px-2">Period: To</th>
                  <th className="py-2 px-2">Marks/ Class Obtained</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.educationalQualifications.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-1.5">
                      <input
                        type="text"
                        aria-label={`Exam passed row ${idx + 1}`}
                        value={row.examPassed}
                        onChange={(e) => {
                          const next = [...data.educationalQualifications];
                          next[idx] = { ...row, examPassed: e.target.value };
                          onChange({ educationalQualifications: next });
                        }}
                        className="w-full h-8 px-2 rounded border border-slate-300 text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        aria-label={`Institution row ${idx + 1}`}
                        value={row.institutionNameAndAddress}
                        onChange={(e) => {
                          const next = [...data.educationalQualifications];
                          next[idx] = { ...row, institutionNameAndAddress: e.target.value };
                          onChange({ educationalQualifications: next });
                        }}
                        className="w-full h-8 px-2 rounded border border-slate-300 text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        aria-label={`Subjects row ${idx + 1}`}
                        value={row.subjects}
                        onChange={(e) => {
                          const next = [...data.educationalQualifications];
                          next[idx] = { ...row, subjects: e.target.value };
                          onChange({ educationalQualifications: next });
                        }}
                        className="w-full h-8 px-2 rounded border border-slate-300 text-xs"
                      />
                    </td>
                    <td className="p-1.5 w-24">
                      <input
                        type="text"
                        placeholder="YYYY"
                        value={row.periodFrom}
                        onChange={(e) => {
                          const next = [...data.educationalQualifications];
                          next[idx] = { ...row, periodFrom: e.target.value };
                          onChange({ educationalQualifications: next });
                        }}
                        className="w-full h-8 px-2 rounded border border-slate-300 text-xs"
                      />
                    </td>
                    <td className="p-1.5 w-24">
                      <input
                        type="text"
                        placeholder="YYYY"
                        value={row.periodTo}
                        onChange={(e) => {
                          const next = [...data.educationalQualifications];
                          next[idx] = { ...row, periodTo: e.target.value };
                          onChange({ educationalQualifications: next });
                        }}
                        className="w-full h-8 px-2 rounded border border-slate-300 text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row.marksOrClass}
                        onChange={(e) => {
                          const next = [...data.educationalQualifications];
                          next[idx] = { ...row, marksOrClass: e.target.value };
                          onChange({ educationalQualifications: next });
                        }}
                        className="w-full h-8 px-2 rounded border border-slate-300 text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="f1-edu-break" className="block text-xs font-medium text-slate-700">
              Break in Educational Career, if any:
            </label>
            <select
              id="f1-edu-break"
              value={data.breakInEducation}
              onChange={(e) =>
                onChange({ breakInEducation: e.target.value as '' | 'Yes' | 'No' })
              }
              className={selectClass}
            >
              <option value="">Select (Yes/No)</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div className="md:col-span-2 space-y-1">
            <label htmlFor="f1-edu-break-reason" className="block text-xs font-medium text-slate-700">
              if Yes, please specify reasons:
            </label>
            <input
              id="f1-edu-break-reason"
              type="text"
              value={data.breakInEducationReason}
              onChange={(e) => onChange({ breakInEducationReason: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="f1-extra" className="block text-xs font-medium text-slate-700">
            Extracurricular activities:
          </label>
          <input
            id="f1-extra"
            type="text"
            value={data.extracurricularActivities}
            onChange={(e) => onChange({ extracurricularActivities: e.target.value })}
            className={inputClass}
          />
        </div>

        {/* Work Experience */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold text-[#0B1F3A]">
              Work Experience (Start from present job)
            </h4>
            <button
              type="button"
              onClick={() =>
                onChange({
                  workExperience: [
                    ...data.workExperience,
                    {
                      companyName: '',
                      from: '',
                      to: '',
                      positionHeld: '',
                      salaryDrawn: '',
                      reasonForLeaving: '',
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
            <table className="w-full text-left border-collapse text-xs min-w-[720px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2 px-2">Name of the company</th>
                  <th className="py-2 px-2">From</th>
                  <th className="py-2 px-2">To</th>
                  <th className="py-2 px-2">Position held</th>
                  <th className="py-2 px-2">Salary Drawn</th>
                  <th className="py-2 px-2">Reason for leaving</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.workExperience.map((row, idx) => (
                  <tr key={idx}>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row.companyName}
                        onChange={(e) => {
                          const next = [...data.workExperience];
                          next[idx] = { ...row, companyName: e.target.value };
                          onChange({ workExperience: next });
                        }}
                        className="w-full h-8 px-2 rounded border border-slate-300 text-xs"
                      />
                    </td>
                    <td className="p-1.5 w-28">
                      <input
                        type="text"
                        placeholder="MM/YYYY"
                        value={row.from}
                        onChange={(e) => {
                          const next = [...data.workExperience];
                          next[idx] = { ...row, from: e.target.value };
                          onChange({ workExperience: next });
                        }}
                        className="w-full h-8 px-2 rounded border border-slate-300 text-xs"
                      />
                    </td>
                    <td className="p-1.5 w-28">
                      <input
                        type="text"
                        placeholder="MM/YYYY"
                        value={row.to}
                        onChange={(e) => {
                          const next = [...data.workExperience];
                          next[idx] = { ...row, to: e.target.value };
                          onChange({ workExperience: next });
                        }}
                        className="w-full h-8 px-2 rounded border border-slate-300 text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row.positionHeld}
                        onChange={(e) => {
                          const next = [...data.workExperience];
                          next[idx] = { ...row, positionHeld: e.target.value };
                          onChange({ workExperience: next });
                        }}
                        className="w-full h-8 px-2 rounded border border-slate-300 text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row.salaryDrawn}
                        onChange={(e) => {
                          const next = [...data.workExperience];
                          next[idx] = { ...row, salaryDrawn: e.target.value };
                          onChange({ workExperience: next });
                        }}
                        className="w-full h-8 px-2 rounded border border-slate-300 text-xs"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={row.reasonForLeaving}
                        onChange={(e) => {
                          const next = [...data.workExperience];
                          next[idx] = { ...row, reasonForLeaving: e.target.value };
                          onChange({ workExperience: next });
                        }}
                        className="w-full h-8 px-2 rounded border border-slate-300 text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Questions & Health Disclosures */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label htmlFor="f1-disc" className="block text-xs font-medium text-slate-700">
                Is there any discontinuity in employment; Yes/No
              </label>
              <select
                id="f1-disc"
                value={data.discontinuityInEmployment}
                onChange={(e) =>
                  onChange({ discontinuityInEmployment: e.target.value as '' | 'Yes' | 'No' })
                }
                className={selectClass}
              >
                <option value="">Select (Yes/No)</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label htmlFor="f1-disc-reason" className="block text-xs font-medium text-slate-700">
                if yes, please give reasons.
              </label>
              <input
                id="f1-disc-reason"
                type="text"
                value={data.discontinuityReason}
                onChange={(e) => onChange({ discontinuityReason: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="f1-dismissed" className="block text-xs font-medium text-slate-700">
                Have you ever been dismissed / terminated from employment: Yes / No
              </label>
              <select
                id="f1-dismissed"
                value={data.dismissedOrTerminated}
                onChange={(e) =>
                  onChange({ dismissedOrTerminated: e.target.value as '' | 'Yes' | 'No' })
                }
                className={selectClass}
              >
                <option value="">Select (Yes/No)</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="f1-convicted" className="block text-xs font-medium text-slate-700">
                Or convicted for any criminal or other offences
              </label>
              <select
                id="f1-convicted"
                value={data.convictedForOffences}
                onChange={(e) =>
                  onChange({ convictedForOffences: e.target.value as '' | 'Yes' | 'No' })
                }
                className={selectClass}
              >
                <option value="">Select (Yes/No)</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-convict-details" className="block text-xs font-medium text-slate-700">
              If yes, give details:
            </label>
            <textarea
              id="f1-convict-details"
              rows={2}
              value={data.dismissedOrConvictedDetails}
              onChange={(e) => onChange({ dismissedOrConvictedDetails: e.target.value })}
              className={textareaClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-psych" className="block text-xs font-medium text-slate-700">
              Do you have any psychological issues, If any? Are you on any daily medication? If any, Please Specify.
            </label>
            <textarea
              id="f1-psych"
              rows={2}
              value={data.psychologicalIssuesOrMedication}
              onChange={(e) => onChange({ psychologicalIssuesOrMedication: e.target.value })}
              className={textareaClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="f1-medical" className="block text-xs font-medium text-slate-700">
              Do you have any medical conditions, If any? Please Specify.
            </label>
            <textarea
              id="f1-medical"
              rows={2}
              value={data.medicalConditions}
              onChange={(e) => onChange({ medicalConditions: e.target.value })}
              className={textareaClass}
            />
          </div>
        </div>
      </section>

      {/* Page 3: Emergency Contact + References + Certification + Office Use */}
      <section className="space-y-4 pt-4 border-t border-slate-200">
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-[#0B1F3A]">
            Person to be informed in case of emergency:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="f1-em-name" className="block text-xs font-medium text-slate-700">
                Name: <span className="text-red-600">*</span>
              </label>
              <input
                id="f1-em-name"
                type="text"
                value={data.emergencyContactName}
                onChange={(e) => onChange({ emergencyContactName: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f1-em-rel" className="block text-xs font-medium text-slate-700">
                Relationship:
              </label>
              <input
                id="f1-em-rel"
                type="text"
                value={data.emergencyContactRelationship}
                onChange={(e) => onChange({ emergencyContactRelationship: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f1-em-tel" className="block text-xs font-medium text-slate-700">
                Tel.No. <span className="text-red-600">*</span>
              </label>
              <input
                id="f1-em-tel"
                type="tel"
                value={data.emergencyContactTel}
                onChange={(e) => onChange({ emergencyContactTel: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f1-em-addr" className="block text-xs font-medium text-slate-700">
                Address:
              </label>
              <input
                id="f1-em-addr"
                type="text"
                value={data.emergencyContactAddress}
                onChange={(e) => onChange({ emergencyContactAddress: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold text-[#0B1F3A]">
            Reference: Give name &amp; address, telephone nos. Of two persons, not related to you.
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border border-slate-200 p-3.5 space-y-2.5">
              <p className="text-xs font-semibold text-slate-700">1) Reference 1</p>
              <div className="space-y-1">
                <label htmlFor="f1-ref1-name" className="block text-xs text-slate-700">
                  1) Name: <span className="text-red-600">*</span>
                </label>
                <input
                  id="f1-ref1-name"
                  type="text"
                  value={data.reference1Name}
                  onChange={(e) => onChange({ reference1Name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="f1-ref1-tel" className="block text-xs text-slate-700">
                  Telephone No.: <span className="text-red-600">*</span>
                </label>
                <input
                  id="f1-ref1-tel"
                  type="tel"
                  value={data.reference1Tel}
                  onChange={(e) => onChange({ reference1Tel: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="f1-ref1-addr" className="block text-xs text-slate-700">
                  Address:
                </label>
                <textarea
                  id="f1-ref1-addr"
                  rows={2}
                  value={data.reference1Address}
                  onChange={(e) => onChange({ reference1Address: e.target.value })}
                  className={textareaClass}
                />
              </div>
            </div>

            <div className="rounded-md border border-slate-200 p-3.5 space-y-2.5">
              <p className="text-xs font-semibold text-slate-700">2) Reference 2</p>
              <div className="space-y-1">
                <label htmlFor="f1-ref2-name" className="block text-xs text-slate-700">
                  2) Name: <span className="text-red-600">*</span>
                </label>
                <input
                  id="f1-ref2-name"
                  type="text"
                  value={data.reference2Name}
                  onChange={(e) => onChange({ reference2Name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="f1-ref2-tel" className="block text-xs text-slate-700">
                  Telephone No.: <span className="text-red-600">*</span>
                </label>
                <input
                  id="f1-ref2-tel"
                  type="tel"
                  value={data.reference2Tel}
                  onChange={(e) => onChange({ reference2Tel: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="f1-ref2-addr" className="block text-xs text-slate-700">
                  Address:
                </label>
                <textarea
                  id="f1-ref2-addr"
                  rows={2}
                  value={data.reference2Address}
                  onChange={(e) => onChange({ reference2Address: e.target.value })}
                  className={textareaClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Certification & Applicant Signature */}
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.declarationConfirmed}
              onChange={(e) => onChange({ declarationConfirmed: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C2410C]"
            />
            <span className="text-xs text-slate-800 leading-relaxed">
              I certify that the information given by me are true, complete and correct to the best
              of my knowledge and belief. <span className="text-red-600">*</span>
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="f1-place" className="block text-xs font-medium text-slate-700">
                Place: <span className="text-red-600">*</span>
              </label>
              <input
                id="f1-place"
                type="text"
                value={data.place}
                onChange={(e) => onChange({ place: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="f1-date" className="block text-xs font-medium text-slate-700">
                Date: <span className="text-red-600">*</span>
              </label>
              <input
                id="f1-date"
                type="date"
                value={data.date}
                onChange={(e) => onChange({ date: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <SignaturePadField
            id="f1-sig"
            label="Signature of the Applicant"
            required
            value={data.applicantSignatureDataUrl}
            onChange={(url) => onChange({ applicantSignatureDataUrl: url })}
          />
        </div>

        <OfficeUseBox
          title="(FOR OFFICE USE)"
          description="Completed by GM / HR Department after candidate submission."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
            <div>Selected / not selected: ______________________</div>
            <div>Date: ______________________</div>
            <div>Selected as: ______________________</div>
            <div>reporting to: ______________________</div>
            <div>GM Signature: ______________________</div>
            <div>HR Department Signature: ______________________</div>
          </div>
        </OfficeUseBox>
      </section>
    </div>
  );
};
