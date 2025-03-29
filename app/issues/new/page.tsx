'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import useTranslation from '@/utils/i18n';

// 간단한 Skeleton 컴포넌트 직접 구현
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
      {...props}
    />
  );
}

// 클라이언트 사이드에서만 IssueForm 렌더링
const DynamicIssueForm = dynamic(() => import('@/components/issues/IssueForm'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
});

export default function NewIssuePage() {
  const { t } = useTranslation();
  
  return (
    <div className="container mx-auto px-4 py-2 md:p-6 max-w-full">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">{t('issues.createIssue')}</h1>
      <Suspense fallback={
        <div className="space-y-4 px-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      }>
        <div className="px-4 md:px-0">
          <DynamicIssueForm />
        </div>
      </Suspense>
    </div>
  );
} 