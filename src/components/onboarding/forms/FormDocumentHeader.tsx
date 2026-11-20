import React from 'react';
import { DICS_COMPANY_HEADER } from '../../../shared/formsCatalog';

export const inputClass =
  'w-full h-9 px-3 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-[#EA580C]';

export const textareaClass =
  'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-[#EA580C]';

export const selectClass =
  'w-full h-9 px-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-[#EA580C]';

interface FormDocumentHeaderProps {
  title: string;
  subtitle?: string;
  showCompanyAddress?: boolean;
  rightBadge?: string;
}

export const FormDocumentHeader: React.FC<FormDocumentHeaderProps> = ({
  title,
  subtitle,
  showCompanyAddress = true,
  rightBadge,
}) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-[#0B1F3A] tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-600 mt-0.5">{subtitle}</p>}
        </div>
        {rightBadge && (
          <span className="inline-flex items-center px-2.5 py-1 rounded border border-slate-300 bg-white text-[11px] font-semibold text-[#0B1F3A] shrink-0">
            {rightBadge}
          </span>
        )}
      </div>
      {showCompanyAddress && (
        <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 space-y-0.5">
          <p className="font-semibold text-[#C2410C]">{DICS_COMPANY_HEADER.companyName}</p>
          <p>{DICS_COMPANY_HEADER.address}</p>
          <p>
            Phone: {DICS_COMPANY_HEADER.phone}, Email ID: {DICS_COMPANY_HEADER.email}
          </p>
        </div>
      )}
    </div>
  );
};

interface OfficeUseBoxProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const OfficeUseBox: React.FC<OfficeUseBoxProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <section
      aria-label={title}
      className="rounded-md border border-dashed border-slate-300 bg-slate-50/80 p-4 space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</h4>
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-200/80 text-[11px] font-medium text-slate-700">
          HR / Office Use Only — Left Blank by Employee
        </span>
      </div>
      <p className="text-xs text-slate-500">{description}</p>
      <div className="opacity-80">{children}</div>
    </section>
  );
};
