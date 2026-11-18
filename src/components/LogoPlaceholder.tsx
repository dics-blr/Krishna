import React from 'react';

interface LogoPlaceholderProps {
  compact?: boolean;
}

export const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({ compact = false }) => {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        aria-label="DICS Global logo placeholder"
        className={`shrink-0 border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-500 font-mono text-[10px] tracking-tight ${
          compact ? 'h-8 w-14 px-1.5 rounded' : 'h-9 w-16 px-2 rounded-md'
        }`}
      >
        LOGO
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[#0B1F3A] tracking-tight leading-tight">
          DICS Global
        </div>
        {!compact && (
          <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
            Digital Instruments &amp; Control Systems
          </div>
        )}
      </div>
    </div>
  );
};
