import React from 'react';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

// 간소화된 정적 이슈 목록 페이지
export default function Issues() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 인증 상태 확인
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // 로딩 중이거나 인증되지 않은 경우 로딩 UI 표시
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">로딩 중...</h1>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>이슈 관리 - 공장 관리 시스템</title>
        <meta name="description" content="이슈 관리" />
      </Head>
      
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">이슈 관리</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>이슈 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: 1, title: '생산 라인 1 모터 과열', status: 'OPEN', priority: 'HIGH', department: '생산부', createdAt: '2024-03-29', assignee: '이기술' },
                { id: 2, title: '소프트웨어 업데이트 필요', status: 'IN_PROGRESS', priority: 'MEDIUM', department: '기술부', createdAt: '2024-03-28', assignee: '강기사' },
                { id: 3, title: '품질 검사 장비 고장', status: 'RESOLVED', priority: 'HIGH', department: '품질부', createdAt: '2024-03-27', assignee: '최품질' },
                { id: 4, title: '안전 매뉴얼 업데이트', status: 'CLOSED', priority: 'LOW', department: '관리부', createdAt: '2024-03-26', assignee: '김관리' },
                { id: 5, title: '생산 라인 2 정기 점검', status: 'OPEN', priority: 'MEDIUM', department: '생산부', createdAt: '2024-03-25', assignee: '박생산' },
                { id: 6, title: '정비 장비 교체 필요', status: 'OPEN', priority: 'HIGH', department: '정비부', createdAt: '2024-03-24', assignee: '정정비' },
                { id: 7, title: '생산량 감소 조사', status: 'IN_PROGRESS', priority: 'HIGH', department: '생산부', createdAt: '2024-03-23', assignee: '조조장' },
                { id: 8, title: '원자재 품질 이슈', status: 'OPEN', priority: 'HIGH', department: '품질부', createdAt: '2024-03-22', assignee: '최품질' }
              ].map(issue => (
                <div key={issue.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">{issue.title}</h3>
                      <p className="text-sm text-gray-500">
                        {issue.department} • {issue.createdAt}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`
                        px-2 py-1 rounded-full text-xs
                        ${issue.status === 'OPEN' ? 'bg-blue-100 text-blue-800' : 
                          issue.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                          issue.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {issue.status === 'OPEN' ? '미처리' : 
                        issue.status === 'IN_PROGRESS' ? '처리중' :
                        issue.status === 'RESOLVED' ? '해결됨' : '종료'}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">담당: {issue.assignee}</p>
                      <span className={`
                        inline-block mt-1 text-xs
                        ${issue.priority === 'HIGH' ? 'text-red-600 font-medium' : 
                          issue.priority === 'MEDIUM' ? 'text-yellow-600' :
                          'text-green-600'}
                      `}>
                        {issue.priority === 'HIGH' ? '우선순위: 높음' : 
                        issue.priority === 'MEDIUM' ? '우선순위: 중간' : 
                        '우선순위: 낮음'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 