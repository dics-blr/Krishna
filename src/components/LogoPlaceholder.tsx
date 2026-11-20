import React, { useState } from 'react';

interface LogoPlaceholderProps {
  compact?: boolean;
  variant?: 'on-light' | 'on-dark' | 'hero';
}

export const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({
  compact = false,
  variant = 'on-light',
}) => {
  const [imageError, setImageError] = useState(false);

  const heightClass =
    variant === 'hero' ? 'h-12' : compact ? 'h-8' : 'h-10';

  const logoElement = imageError ? (
    <span className="inline-flex items-center px-2.5 py-1 rounded bg-[#0B1F3A] text-white font-semibold text-sm tracking-tight">
      DICS Global
    </span>
  ) : (
    <img
      src="/assets/dics-logo.png"
      alt="DICS Global — Digital Instruments & Control Systems"
      width={487}
      height={166}
      onError={() => setImageError(true)}
      className={`${heightClass} w-auto max-w-full object-contain select-none`}
    />
  );

  if (variant === 'on-dark') {
    return (
      <div className="inline-flex items-center rounded-lg bg-white px-3 py-2 shadow-xs">
        {logoElement}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center min-w-0">
      {logoElement}
    </div>
  );
};
