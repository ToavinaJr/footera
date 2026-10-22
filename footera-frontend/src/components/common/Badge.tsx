import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'lime' | 'amber' | 'rose' | 'slate' | 'sky';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', size = 'sm' }) => {
  const variantStyles = {
    emerald: 'text-[#047857] bg-[#ecfdf5] border border-[#a7f3d0]',
    lime: 'text-[#14532d] bg-[#d9f99d] border border-[#bef264]',
    amber: 'text-[#b45309] bg-[#fffbeb] border border-[#fde68a]',
    rose: 'text-[#be123c] bg-[#fff1f2] border border-[#fecdd3]',
    slate: 'text-[#334155] bg-[#f1f5f9] border border-[#e2e8f0]',
    sky: 'text-[#0369a1] bg-[#f0f9ff] border border-[#bae6fd]',
  };

  const sizeStyles = {
    sm: 'text-caption px-2.5 py-0.5 font-semibold rounded-full',
    md: 'text-xs px-3 py-1 font-bold rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 tracking-tight whitespace-nowrap shadow-2xs ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
};

export const FormIndicator: React.FC<{ result: 'V' | 'N' | 'D'; size?: 'sm' | 'md' }> = ({
  result,
  size = 'md',
}) => {
  const colors = {
    V: 'bg-[#16a34a] text-white',
    N: 'bg-[#d97706] text-white',
    D: 'bg-[#dc2626] text-white',
  };

  const dimension = size === 'sm' ? 'w-5 h-5 text-micro' : 'w-6 h-6 text-xs';

  return (
    <span
      title={result === 'V' ? 'Victoire' : result === 'N' ? 'Match nul' : 'Défaite'}
      className={`inline-flex items-center justify-center rounded-full font-extrabold ${dimension} ${colors[result]} shadow-2xs select-none`}
    >
      {result}
    </span>
  );
};
