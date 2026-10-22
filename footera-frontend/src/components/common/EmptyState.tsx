import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-3xl border border-dashed border-[#ccd9c7] bg-white">
      <div className="w-12 h-12 rounded-2xl bg-[#eaf4ed] flex items-center justify-center text-[#0e5632] mb-3.5 shadow-2xs">
        <Icon className="w-6 h-6 stroke-[2.2]" />
      </div>
      <h3 className="text-base font-extrabold text-[#092c1a]">{title}</h3>
      <p className="text-xs md:text-sm text-slate-500 max-w-sm mt-1">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 min-h-[44px] text-xs font-bold text-white bg-[#0e5632] hover:bg-[#0a3d24] rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
