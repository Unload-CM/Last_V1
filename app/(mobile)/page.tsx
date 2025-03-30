import { Suspense } from 'react';
import { NoSsr } from '@/components/NoSsr';
import MobileDashboardClient from '@/components/mobile/MobileDashboardClient';
import { Skeleton } from '@/components/ui/skeleton';

export default function MobileDashboard() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4">
        <div className="w-full border rounded-lg">
          <div className="px-4 py-3 border-b">
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="px-4 pb-4 pt-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    }>
      <NoSsr>
        <MobileDashboardClient />
      </NoSsr>
    </Suspense>
  );
} 