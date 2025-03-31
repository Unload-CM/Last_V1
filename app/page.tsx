'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// 정적 스켈레톤 UI
const LoadingSkeleton = () => (
  <div className="container mx-auto p-4">
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white shadow rounded-lg p-4">
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-8 w-1/4" />
        </div>
      ))}
    </div>
    
    <div className="grid gap-4 mt-4 grid-cols-1 md:grid-cols-2">
      <div className="bg-white shadow rounded-lg p-4">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="bg-white shadow rounded-lg p-4">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  </div>
);

// 대시보드 컴포넌트는 클라이언트에서만 로드
const MainDashboard = dynamic(() => import('@/components/DashboardContent'), {
  ssr: false,
  loading: () => <LoadingSkeleton />
});

export default function Page() {
  return <MainDashboard />;
}