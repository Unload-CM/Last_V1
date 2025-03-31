import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// 설정 페이지 컴포넌트 동적 로드
const SettingsPage = dynamic(() => import('@/app.bak/settings/page'), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto p-4">
      <Skeleton className="h-8 w-64 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-4">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b pb-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-4">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b pb-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
});

export default function Settings() {
  return (
    <>
      <Head>
        <title>설정 - 공장 관리 시스템</title>
        <meta name="description" content="시스템 설정" />
      </Head>
      <SettingsPage />
    </>
  );
} 