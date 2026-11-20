import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FileText,
  Paperclip,
} from 'lucide-react';
import { getFriendlyFormTitle } from '../shared/onboardingLogic';
import type { HRFormDefinition } from '../shared/types';

interface FormsRegistryViewProps {
  forms: HRFormDefinition[];
  onOpenSampleOnboarding: () => void;
}

export const FormsRegistryView: React.FC<FormsRegistryViewProps> = ({
  forms,
  onOpenSampleOnboarding,
}) => {
  const [selectedFormId, setSelectedFormId] = useState<string>(forms[0]?.id ?? 'form-01');
  const activeForm = forms.find((f) => f.id === selectedFormId) ?? forms[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
            Standard Joining Documentation
          </p>
          <h1 className="text-2xl font-semibold text-[#0B1F3A] tracking-tight">
            HR Forms
          </h1>
          <p className="text-sm text-slate-600">
            Browse the nine standard DICS Global joining, statutory, and declaration forms completed
            by every new employee.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenSampleOnboarding}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-colors"
        >
          <span>Open Employee Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 9 Forms Directory */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white divide-y divide-slate-200 overflow-hidden">
          {forms.map((form) => {
            const isSelected = form.id === activeForm?.id;
            const friendlyTitle = getFriendlyFormTitle(form.id);
            return (
              <button
                key={form.id}
                type="button"
                onClick={() => setSelectedFormId(form.id)}
                className={`w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 transition-colors ${
                  isSelected
                    ? 'bg-[#0B1F3A] text-white'
                    : 'bg-white hover:bg-slate-50 text-[#0B1F3A]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 tabular-nums ${
                      isSelected
                        ? 'bg-[#C2410C] text-white'
                        : 'bg-slate-100 text-[#0B1F3A]'
                    }`}
                  >
                    {form.formNumber}
                  </span>
                  <span className="text-sm font-semibold truncate">{friendlyTitle}</span>
                </div>
                <span
                  className={`text-xs whitespace-nowrap shrink-0 tabular-nums ${
                    isSelected ? 'text-slate-200' : 'text-slate-500'
                  }`}
                >
                  {form.pageCount} {form.pageCount === 1 ? 'Page' : 'Pages'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Form Details */}
        {activeForm && (
          <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#C2410C]">
                  <FileText className="w-4 h-4" />
                  <span>Form {activeForm.formNumber} of 9</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {activeForm.pageCount} {activeForm.pageCount === 1 ? 'Page' : 'Pages'}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-[#0B1F3A]">
                  {getFriendlyFormTitle(activeForm.id)}
                </h2>
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready for Employees</span>
              </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">{activeForm.summary}</p>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sections Included
              </h3>
              <div className="space-y-2.5">
                {activeForm.sectionSlots.map((sec) => (
                  <div
                    key={sec.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-1"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#0B1F3A]">
                      <FileCheck2 className="w-4 h-4 text-[#C2410C] shrink-0" />
                      <span>{sec.heading}</span>
                    </div>
                    <p className="text-xs text-slate-600 pl-6">{sec.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 flex items-start gap-3">
              <Paperclip className="w-4 h-4 text-[#0B1F3A] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[#0B1F3A]">Supporting Attachments</p>
                <p className="text-xs text-slate-600">{activeForm.attachmentSlotLabel}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
