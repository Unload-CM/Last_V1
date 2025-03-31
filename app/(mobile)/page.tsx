'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// 모바일 대시보드를 별도 컴포넌트로 분리
const MobileDashboardComponent = dynamic(() => import('@/components/MobileDashboardComponent'), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow rounded-lg p-4">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
});

export default function MobilePage() {
  return <MobileDashboardComponent />;
} 