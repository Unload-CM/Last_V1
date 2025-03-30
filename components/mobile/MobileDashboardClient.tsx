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

// 간소화된 월 데이터 - 언어별 월 이름
const MONTHS_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 샘플 데이터 - 데이터베이스 접속이 안될 경우 대체
const SAMPLE_MONTHLY_DATA = [
  { month: 1, count: 5 },
  { month: 2, count: 8 },
  { month: 3, count: 12 },
  { month: 4, count: 7 },
  { month: 5, count: 10 },
  { month: 6, count: 15 },
  { month: 7, count: 9 },
  { month: 8, count: 14 },
  { month: 9, count: 11 },
  { month: 10, count: 6 },
  { month: 11, count: 13 },
  { month: 12, count: 10 }
];

// 데이터 타입 정의
type ChartDataType = {
  name: string;
  issues: number;
}[];

export default function MobileDashboardClient() {
  const { data: session, status } = useSession();
  const [language, setLanguage] = useState('ko');
  const [monthlyData, setMonthlyData] = useState<ChartDataType>([]);
  const [loading, setLoading] = useState(true);

  // 쿠키에서 언어 설정 가져오기
  const getCookieLanguage = () => {
    if (typeof window !== 'undefined' && document) {
      return document.cookie
        .split('; ')
        .find(row => row.startsWith('language='))
        ?.split('=')[1] || 'ko';
    }
    return 'ko';
  };

  // 월 이름 가져오기 함수
  const getMonthName = (monthIndex: number, language: string) => {
    if (language === 'ko') return MONTHS_KO[monthIndex-1];
    if (language === 'th') return MONTHS_TH[monthIndex-1];
    return MONTHS_EN[monthIndex-1];
  };

  // 샘플 데이터 준비
  const prepareSampleData = (lang: string) => {
    return SAMPLE_MONTHLY_DATA.map(item => ({
      name: getMonthName(item.month, lang),
      issues: item.count
    }));
  };

  // 데이터 로드 함수
  const fetchDashboardData = async (lang: string) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfDay = new Date(now);
      
      const response = await fetch(
        `/api/dashboard?from=${startOfMonth.toISOString()}&to=${endOfDay.toISOString()}&lang=${lang}`,
        { 
          headers: { 'Cache-Control': 'no-cache, no-store' },
          cache: 'no-store'
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.monthlyIssueCreation && data.monthlyIssueCreation.length > 0) {
          return data.monthlyIssueCreation.map((item: {month: number; count: number}) => ({
            name: getMonthName(item.month, lang),
            issues: item.count
          }));
        }
      }
      return null;
    } catch (error) {
      console.error('대시보드 데이터 로드 중 오류:', error);
      return null;
    }
  };

  useEffect(() => {
    // 언어 설정 가져오기
    const lang = getCookieLanguage();
    setLanguage(lang);
    
    // 샘플 데이터로 기본 설정
    setMonthlyData(prepareSampleData(lang));
    
    // 인증 상태에 따라 처리
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      setLoading(false);
      return;
    }
    
    // 인증된 경우 데이터 로드
    if (status === 'authenticated') {
      const loadData = async () => {
        const apiData = await fetchDashboardData(lang);
        if (apiData) {
          setMonthlyData(apiData);
        }
        setLoading(false);
      };
      
      loadData();
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

  // 최종 UI 렌더링
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
                  <YAxis allowDecimals={false} />
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