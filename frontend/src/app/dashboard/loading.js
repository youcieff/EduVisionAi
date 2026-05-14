"use client";
import { SkeletonCard, SkeletonStat } from '../../components/common/Skeleton';
import PremiumBackground from '../../components/PremiumBackground';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 pb-12 relative">
      <PremiumBackground />
      <div className="max-w-7xl mx-auto relative z-10 animate-pulse">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="glass h-12 rounded-xl border border-[var(--glass-border)]" />
            <div className="grid sm:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
          <div className="space-y-6 hidden md:block">
            <div className="glass p-6 rounded-3xl border border-[var(--glass-border)] h-40" />
            <div className="glass p-6 rounded-3xl border border-[var(--glass-border)] h-80" />
          </div>
        </div>
      </div>
    </div>
  );
}
