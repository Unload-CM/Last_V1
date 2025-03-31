import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

interface Employee {
  id: number;
  employeeId: string;
  name: string;
  position: string;
  department: string;
}

// Supabase 데이터를 사용하는 직원 목록 페이지
export default function Employees() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 직원 데이터 로드
  useEffect(() => {
    if (status === 'authenticated') {
      fetchEmployees();
    }
  }, [status]);

  // 직원 목록 가져오기
  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        throw new Error('직원 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setEmployees(data.employees);
    } catch (err) {
      console.error('직원 데이터 로드 오류:', err);
      setError('직원 데이터를 불러오는 중 오류가 발생했습니다.');
      
      // 오류 발생 시 정적 데이터 사용
      setEmployees([
        { id: 1, employeeId: 'EMP001', name: '김관리', position: '관리자', department: '관리부' },
        { id: 2, employeeId: 'EMP002', name: '이기술', position: '엔지니어', department: '기술부' },
        { id: 3, employeeId: 'EMP003', name: '박생산', position: '라인 매니저', department: '생산부' },
        { id: 4, employeeId: 'EMP004', name: '최품질', position: '품질 관리자', department: '품질부' },
        { id: 5, employeeId: 'EMP005', name: '정정비', position: '정비사', department: '정비부' },
        { id: 6, employeeId: 'EMP006', name: '홍사원', position: '사원', department: '생산부' },
        { id: 7, employeeId: 'EMP007', name: '기술자', position: '기술자', department: '기술부' },
        { id: 8, employeeId: 'EMP008', name: '조조장', position: '조장', department: '생산부' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

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
        
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
        )}
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>직원 목록</CardTitle>
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={fetchEmployees}
            >
              새로고침
            </button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center p-4">데이터를 불러오는 중...</div>
            ) : (
              <div className="space-y-4">
                {employees.length === 0 ? (
                  <div className="text-center p-4">직원 데이터가 없습니다.</div>
                ) : (
                  employees.map(employee => (
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
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
} 