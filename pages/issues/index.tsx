import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// 이슈 목록 컴포넌트 동적 로드
const IssuesPage = dynamic(() => import('@/app.bak/issues/page'), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto p-4">
      <Skeleton className="h-8 w-64 mb-6" />
      <div className="bg-white shadow rounded-lg p-4">
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border-b pb-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-1" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
});

export default function Issues() {
  return (
    <>
      <Head>
        <title>이슈 관리 - 공장 관리 시스템</title>
        <meta name="description" content="이슈 관리" />
      </Head>
      <IssuesPage />
    </>
  );
} 