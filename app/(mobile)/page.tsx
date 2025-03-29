'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import LoginForm from '@/components/LoginForm';
import { MONTHS } from '../constants/months';

export default function MobileDashboard() {
  const { data: session, status } = useSession();
  const [language, setLanguage] = useState('ko');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 인증 상태 체크
    if (status === 'loading') return;
    
    // 로그인하지 않은 사용자는 데이터를 로드하지 않음
    if (status === 'unauthenticated') {
      setLoading(false);
      return;
    }
    
    async function fetchData() {
      try {
        // 현재 날짜 기준으로 이번 달의 시작일과 현재 날짜를 구합니다
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        
        // 쿠키에서 언어 설정 가져오기
        const cookieLanguage = document.cookie
          .split('; ')
          .find(row => row.startsWith('language='))
          ?.split('=')[1] || 'ko';
        
        setLanguage(cookieLanguage);
        
        // API를 통해 대시보드 데이터를 가져옵니다
        const response = await fetch(`/api/dashboard?from=${startOfMonth.toISOString()}&to=${endOfDay.toISOString()}&lang=${cookieLanguage}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store'
          }
        });

        if (!response.ok) {
          throw new Error('대시보드 데이터를 불러오는데 실패했습니다');
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  // 로그인하지 않은 사용자에게 로그인 폼 표시
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">로그인</CardTitle>
            <p className="text-sm text-muted-foreground">계정 정보로 로그인하세요</p>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  // 로딩 중일 때 스켈레톤 UI 표시
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full">
          <CardHeader className="px-4 py-3">
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-lg text-red-500">오류 발생</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!dashboardData) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-lg">데이터 없음</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            표시할 데이터가 없습니다.
          </CardContent>
        </Card>
      </div>
    );
  }

  // 월별 데이터 가공
  const monthlyData = dashboardData.monthlyIssueCreation ? 
    dashboardData.monthlyIssueCreation.map((item: any) => ({
      name: MONTHS[language as keyof typeof MONTHS]?.[item.month - 1] || `Month ${item.month}`,
      issues: item.count,
    }))
  : [];

  return (
    <div className="container mx-auto py-1">
      <div className="grid gap-2 mt-1">
        <Card className="w-full md:col-span-2 shadow-sm">
          <CardHeader className="px-4 py-3">
            <CardTitle className="flex items-center text-lg">
              <BarChart2 className="h-5 w-5 mr-2" />
              {language === 'ko' ? '월별 이슈 생성' :
               language === 'th' ? 'การสร้างปัญหารายเดือน' :
               'Monthly Issue Creation'}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="name" />
                  <YAxis 
                    allowDecimals={false}
                    domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax))]}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="issues" 
                    name={language === 'ko' ? '이슈 수' :
                         language === 'th' ? 'จำนวนปัญหา' :
                         'Issues Count'} 
                    fill="#8884d8" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 