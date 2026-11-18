import React, { useState } from 'react';
import { FileCheck2, FileSpreadsheet, Paperclip } from 'lucide-react';
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
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-2xl font-semibold text-[#0B1F3A] tracking-tight">
            Nine Original HR Forms Registry
          </h1>
          <p className="text-sm text-slate-600">
            Structural container architecture for DICS Global&apos;s nine employee onboarding
            documents. Form fields and statutory copy remain unmapped placeholders until the
            original files are provided.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenSampleOnboarding}
          className="px-4 py-2 rounded-md border border-[#1D4ED8] text-xs font-medium text-[#1D4ED8] hover:bg-blue-50 whitespace-nowrap shrink-0"
        >
          Preview Forms in Employee Portal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 9 Separate Form Selector List */}
        <div className="lg:col-span-5 rounded-lg border border-slate-200 bg-white divide-y divide-slate-200 overflow-hidden">
          {forms.map((form) => {
            const isSelected = form.id === activeForm?.id;
            return (
              <button
                key={form.id}
                type="button"
                onClick={() => setSelectedFormId(form.id)}
                className={`w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 transition-colors ${
                  isSelected ? 'bg-[#0B1F3A] text-white' : 'bg-white hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="min-w-0">
                  <div
                    className={`font-mono text-xs tabular-nums ${
                      isSelected ? 'text-blue-200' : 'text-[#1D4ED8]'
                    }`}
                  >
                    {form.code}
                  </div>
                  <div className="text-sm font-medium truncate">{form.title}</div>
                </div>
                <span
                  className={`text-xs whitespace-nowrap shrink-0 ${
                    isSelected ? 'text-slate-200' : 'text-slate-500'
                  }`}
                >
                  Slot {String(form.formNumber).padStart(2, '0')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Schema Inspector */}
        {activeForm && (
          <section className="lg:col-span-7 rounded-lg border border-slate-200 bg-white p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <FileSpreadsheet className="w-4 h-4 text-[#1D4ED8]" />
                  <span>{activeForm.code}</span>
                  <span aria-hidden="true">·</span>
                  <span>Form {activeForm.formNumber} of 9</span>
                </div>
                <h2 className="text-lg font-semibold text-[#0B1F3A]">{activeForm.title}</h2>
              </div>

              <span className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded px-2.5 py-1 whitespace-nowrap">
                Awaiting Original Document
              </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">{activeForm.summary}</p>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Prepared Section Structure
              </h3>
              <div className="space-y-2.5">
                {activeForm.sectionSlots.map((sec) => (
                  <div
                    key={sec.id}
                    className="rounded-md border border-slate-200 bg-slate-50/70 p-3.5 space-y-1"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-[#0B1F3A]">
                      <FileCheck2 className="w-4 h-4 text-[#1D4ED8] shrink-0" />
                      <span>{sec.heading}</span>
                    </div>
                    <p className="text-xs text-slate-600 pl-6">{sec.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 p-4 flex items-start gap-3">
              <Paperclip className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-[#0B1F3A]">
                  Linked Document Upload Slot
                </p>
                <p className="text-xs text-slate-600">
                  {activeForm.attachmentSlotLabel} · Mapped to private bucket path{' '}
                  <span className="font-mono">
                    onboarding/&#123;token&#125;/{activeForm.attachmentSlotId}/
                  </span>
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
