'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// 데이터 타입 정의
type ChartDataType = {
  name: string;
  issues: number;
}[];

// 컴포넌트를 동적으로 임포트
const MobileDashboardComponent = dynamic(
  () => import('@/components/MobileDashboardComponent'),
  {
    loading: () => (
      <div className="container mx-auto p-4">
        <div className="w-full">
          <div className="px-4 py-3">
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="px-4 pb-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function MobileDashboard() {
  return <MobileDashboardComponent />;
} 