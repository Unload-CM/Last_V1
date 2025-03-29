import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// 홈페이지 대시보드를 동적으로 임포트
const DynamicDashboard = dynamic(
  () => import('@/components/DashboardContent'),
  {
    loading: () => (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function Home() {
  return <DynamicDashboard />;
}