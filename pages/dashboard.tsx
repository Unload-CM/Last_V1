import React from 'react';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FiAlertCircle, FiCheckCircle, FiClock, FiList } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

// 간소화된 정적 대시보드
export default function Dashboard() {
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
        <title>대시보드 - 공장 관리 시스템</title>
        <meta name="description" content="대시보드" />
      </Head>

      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">대시보드</h1>
        
        {/* 요약 카드 */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">미처리 이슈</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FiAlertCircle className="mr-2 text-red-500" />
                <span className="text-2xl font-bold">5</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">처리 중 이슈</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FiClock className="mr-2 text-yellow-500" />
                <span className="text-2xl font-bold">3</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">해결된 이슈</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FiCheckCircle className="mr-2 text-green-500" />
                <span className="text-2xl font-bold">8</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">전체 이슈</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FiList className="mr-2 text-blue-500" />
                <span className="text-2xl font-bold">28</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 최근 이슈 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>최근 이슈</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: 1, title: '생산 라인 1 모터 과열', status: 'OPEN', priority: 'HIGH', department: '생산부' },
                { id: 2, title: '소프트웨어 업데이트 필요', status: 'IN_PROGRESS', priority: 'MEDIUM', department: '기술부' },
                { id: 3, title: '품질 검사 장비 고장', status: 'RESOLVED', priority: 'HIGH', department: '품질부' },
                { id: 4, title: '안전 매뉴얼 업데이트', status: 'CLOSED', priority: 'LOW', department: '관리부' },
                { id: 5, title: '생산 라인 2 정기 점검', status: 'OPEN', priority: 'MEDIUM', department: '생산부' }
              ].map(issue => (
                <div key={issue.id} className="border-b pb-2 last:border-0">
                  <div className="flex justify-between">
                    <span className="font-medium">{issue.title}</span>
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
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {issue.department} • 
                    <span className={`
                      ml-2
                      ${issue.priority === 'HIGH' ? 'text-red-600' : 
                        issue.priority === 'MEDIUM' ? 'text-yellow-600' :
                        'text-green-600'}
                    `}>
                      {issue.priority === 'HIGH' ? '높음' : 
                       issue.priority === 'MEDIUM' ? '중간' : '낮음'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      
        {/* 부서별 이슈 */}
        <Card>
          <CardHeader>
            <CardTitle>부서별 이슈</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: 1, name: '생산부', count: 15 },
                { id: 2, name: '기술부', count: 8 },
                { id: 3, name: '품질부', count: 5 }
              ].map(dept => (
                <div key={dept.id} className="flex justify-between items-center">
                  <span>{dept.name}</span>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full" 
                        style={{ width: `${(dept.count / 28) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="font-medium">{dept.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 