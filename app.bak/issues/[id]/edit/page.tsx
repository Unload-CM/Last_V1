'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import IssueForm from '@/components/issues/IssueForm';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { useMediaQuery } from '@/hooks/use-media-query';

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
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        console.log('[편집] 이슈 데이터 요청:', params.id);
        const response = await fetch(`/api/issues/${params.id}`);
        console.log('[편집] 응답 상태:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error('이슈를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        console.log('[편집] 응답 데이터:', data);
        console.log('[편집] 데이터 구조:', {
          id: data?.id,
          title: data?.title,
          hasStatus: !!data?.status,
          hasPriority: !!data?.priority
        });
        
        // 직접 데이터를 설정
        setIssue(data);
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
        <div className="text-center py-8">로딩 중...</div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">이슈를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className={`
      ${isMobile 
        ? "p-0" // 모바일에서는 패딩 제거
        : "container py-4 md:py-6 lg:py-8"
      }
    `}>
      <Card className={`
        ${isMobile 
          ? "rounded-none shadow-none mx-0" // 모바일에서는 라운드 처리와 그림자 제거, 좌우 마진 제거
          : "rounded-lg shadow-md"
        }
      `}>
        <CardContent className={`
          ${isMobile 
            ? "p-3" // 모바일에서는 내부 패딩 최소화
            : "p-6"
          }
        `}>
          <IssueForm initialData={issue} isEdit={true} />
        </CardContent>
      </Card>
    </div>
  );
} 