import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// 대시보드 컴포넌트 동적 로드 (클라이언트 사이드 렌더링)
const DashboardContent = dynamic(() => import('@/components/DashboardContent'), {
  ssr: false,
  loading: () => (
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
  )
});

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>대시보드 - 공장 관리 시스템</title>
        <meta name="description" content="대시보드" />
      </Head>
      <DashboardContent />
    </>
  );
} 