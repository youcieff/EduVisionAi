"use client";
import React from 'react';

const SkeletonCard = () => (
  <div className="glass rounded-xl overflow-hidden border border-[var(--glass-border)] animate-pulse">
    <div className="h-48 bg-[var(--skeleton-bg)]" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-[var(--skeleton-bg)] rounded-lg w-3/4" />
      <div className="flex justify-end">
        <div className="h-6 bg-[var(--skeleton-bg)] rounded w-20" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 bg-[var(--skeleton-bg)] rounded-lg flex-1" />
        <div className="h-9 bg-[var(--skeleton-bg)] rounded-lg w-12" />
      </div>
    </div>
  </div>
);

const SkeletonStat = () => (
  <div className="glass p-6 rounded-xl border border-[var(--glass-border)] animate-pulse">
    <div className="h-4 bg-[var(--skeleton-bg)] rounded w-1/2 mb-3" />
    <div className="h-8 bg-[var(--skeleton-bg)] rounded w-1/3" />
  </div>
);

const SkeletonDetail = () => (
  <div className="min-h-screen pt-20 px-2 md:px-6 pb-12 animate-pulse bg-[var(--bg-main)]">
    <div className="max-w-[1400px] mx-auto py-8">
      {/* Header Skeleton Matching 7/5 grid */}
      <div className="glass p-6 rounded-3xl border border-[var(--glass-border)] mb-8 h-48 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          <div className="lg:col-span-7 space-y-4">
            <div className="h-4 bg-[var(--skeleton-bg)] rounded-full w-32" />
            <div className="h-10 bg-[var(--skeleton-bg)] rounded-2xl w-3/4" />
            <div className="flex items-center gap-3 mt-4">
              <div className="w-12 h-12 rounded-full bg-[var(--skeleton-bg)]" />
              <div className="h-4 bg-[var(--skeleton-bg)] rounded w-24" />
            </div>
          </div>
          <div className="lg:col-span-5">
             <div className="glass bg-[var(--bg-deep)]/30 rounded-2xl border border-[var(--glass-border)] p-3 h-24 w-full" />
          </div>
        </div>
      </div>

      {/* Main Grid Skeleton 2/3 and 1/3 */}
      <div className="grid md:grid-cols-3 gap-8 items-start mb-12">
        <div className="md:col-span-2 space-y-6">
          {/* Tabs Navigation Placeholder (Increased presence) */}
          <div className="glass h-16 rounded-[1.5rem] border border-[var(--glass-border)] w-full max-w-3xl" />
          
          {/* Content Area Placeholder (Primary focus) */}
          <div className="glass p-8 rounded-2xl border border-[var(--glass-border)] h-[600px] w-full" />
        </div>
        
        {/* Sidebar Sidebar */}
        <div className="space-y-6 hidden md:block">
          <div className="glass p-6 rounded-3xl border border-[var(--glass-border)] h-40" />
          <div className="glass p-6 rounded-3xl border border-[var(--glass-border)] h-80" />
        </div>
      </div>
    </div>
  </div>
);

export { SkeletonCard, SkeletonStat, SkeletonDetail };
