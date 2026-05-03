import React from 'react';

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden animate-pulse ${className}`}>
      <div className="h-40 bg-white/5" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-white/5 rounded-lg w-3/4" />
        <div className="h-3 bg-white/5 rounded-lg w-1/2" />
        <div className="h-3 bg-white/5 rounded-lg w-2/3" />
      </div>
    </div>
  );
};
