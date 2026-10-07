import React from 'react';

interface NftCardSkeletonProps {
  count?: number;
}

export const NftCardSkeleton: React.FC<NftCardSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative aspect-square rounded-[2rem] bg-gray-200/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 overflow-hidden animate-pulse flex flex-col justify-end p-4 shadow-sm"
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent animate-shimmer" />

          {/* Skeleton Badge Top Right */}
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-300 dark:bg-white/10" />

          {/* Skeleton Title & Collection lines */}
          <div className="space-y-2 relative z-10">
            <div className="w-3/4 h-4 rounded-lg bg-gray-300 dark:bg-white/15" />
            <div className="w-1/2 h-3 rounded-md bg-gray-300/70 dark:bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
};
