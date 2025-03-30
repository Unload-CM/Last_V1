import { Suspense } from 'react';
import DashboardClient from '@/components/DashboardClient';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  return (
    <Suspense fallback={
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
    }>
      <DashboardClient />
    </Suspense>
  );
}