import React from 'react';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

// 간소화된 정적 설정 페이지
export default function Settings() {
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
        <title>설정 - 공장 관리 시스템</title>
        <meta name="description" content="시스템 설정" />
      </Head>
      
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">시스템 설정</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>일반 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-medium">시스템 언어</h3>
                  <p className="text-sm text-gray-500">현재 설정: 한국어</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium">시간대</h3>
                  <p className="text-sm text-gray-500">현재 설정: (UTC+09:00) 서울</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium">날짜 형식</h3>
                  <p className="text-sm text-gray-500">현재 설정: YYYY-MM-DD</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium">알림 설정</h3>
                  <p className="text-sm text-gray-500">현재 설정: 활성화</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>이슈 관리 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-medium">이슈 상태</h3>
                  <p className="text-sm text-gray-500">미처리, 처리중, 해결됨, 종료</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium">우선순위</h3>
                  <p className="text-sm text-gray-500">높음, 중간, 낮음</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium">카테고리</h3>
                  <p className="text-sm text-gray-500">설비, 소프트웨어, 안전, 품질, 생산</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium">자동 배정</h3>
                  <p className="text-sm text-gray-500">현재 설정: 비활성화</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>부서 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-medium">관리부</h3>
                  <p className="text-sm text-gray-500">직원 수: 3명</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium">생산부</h3>
                  <p className="text-sm text-gray-500">직원 수: 12명</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium">기술부</h3>
                  <p className="text-sm text-gray-500">직원 수: 5명</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium">품질부</h3>
                  <p className="text-sm text-gray-500">직원 수: 4명</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium">정비부</h3>
                  <p className="text-sm text-gray-500">직원 수: 3명</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>백업 및 데이터</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-medium">자동 백업</h3>
                  <p className="text-sm text-gray-500">현재 설정: 매일 오전 3시</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium">마지막 백업</h3>
                  <p className="text-sm text-gray-500">2024-03-30 03:00</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium">데이터베이스 크기</h3>
                  <p className="text-sm text-gray-500">234 MB</p>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium">보관 정책</h3>
                  <p className="text-sm text-gray-500">30일</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
} 