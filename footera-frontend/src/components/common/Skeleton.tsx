import React from 'react';
import { FootballLoader } from './FootballPitch';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`skeleton-shimmer rounded-xl bg-slate-200/80 ${className}`}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="relative p-5 bg-white border border-[#e2ece0] rounded-3xl space-y-4 shadow-xs" aria-busy="true">
      <FootballLoader />
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
};
