import React from 'react';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

// 간소화된 정적 직원 목록 페이지
export default function Employees() {
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
        <title>직원 관리 - 공장 관리 시스템</title>
        <meta name="description" content="직원 관리" />
      </Head>

      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">직원 관리</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>직원 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: 1, name: '김관리', employeeId: 'EMP001', position: '관리자', department: '관리부' },
                { id: 2, name: '이기술', employeeId: 'EMP002', position: '엔지니어', department: '기술부' },
                { id: 3, name: '박생산', employeeId: 'EMP003', position: '라인 매니저', department: '생산부' },
                { id: 4, name: '최품질', employeeId: 'EMP004', position: '품질 관리자', department: '품질부' },
                { id: 5, name: '정정비', employeeId: 'EMP005', position: '정비사', department: '정비부' },
                { id: 6, name: '홍사원', employeeId: 'EMP006', position: '사원', department: '생산부' },
                { id: 7, name: '강기사', employeeId: 'EMP007', position: '기술자', department: '기술부' },
                { id: 8, name: '조조장', employeeId: 'EMP008', position: '조장', department: '생산부' }
              ].map(employee => (
                <div key={employee.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">{employee.name}</h3>
                      <p className="text-sm text-gray-500">{employee.employeeId}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{employee.position}</p>
                      <p className="text-sm text-gray-500">{employee.department}</p>
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