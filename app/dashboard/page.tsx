import Navigation from '@/components/Navigation';
import DashboardContent from '@/components/DashboardContent';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <DashboardContent />
      </main>
    </div>
  );
} 