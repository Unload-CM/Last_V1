'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import IssueForm from '@/components/issues/IssueForm';
import Navigation from '@/components/Navigation';
import { toast } from 'sonner';

interface Issue {
  id: number;
  title: string;
  description?: string;
  assigneeId?: number;
  departmentId: number;
  statusId: number;
  priorityId: number;
  categoryId: number;
  dueDate?: string;
}

export default function EditIssuePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const response = await fetch(`/api/issues/${params.id}`);
        if (!response.ok) {
          throw new Error('이슈를 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        setIssue(data.issue);
      } catch (error) {
        console.error('Error fetching issue:', error);
        toast.error('이슈를 불러오는데 실패했습니다.');
        router.push('/issues');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssue();
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Navigation />
        <div className="text-center py-8">로딩 중...</div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="container mx-auto p-6">
        <Navigation />
        <div className="text-center py-8">이슈를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Navigation />
      <IssueForm initialData={issue} isEdit={true} />
    </div>
  );
} 