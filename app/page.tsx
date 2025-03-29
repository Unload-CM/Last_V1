'use client';

// 클라이언트 컴포넌트 초기화 함수 제거
// export const clientComponentInit = () => {
//   return { clientModules: {} };
// };

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  ResponsiveContainer,
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  CartesianGrid 
} from 'recharts';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { 
  AlertCircle, 
  Briefcase,
  Clock,
  BarChart2,
  PieChart as PieChartIcon,
  MessageSquare,
  CheckCircle,
  Search as SearchIcon
} from 'lucide-react';
import TopCommenters from '@/components/dashboard/TopCommenters';
import TopIssueFinders from '@/components/dashboard/TopIssueFinders';
import TopIssueResolvers from '@/components/dashboard/TopIssueResolvers';
import DateRangeFilter from '@/components/dashboard/DateRangeFilter';
import { useTranslation } from '@/store/languageStore';
import { Badge } from '@/components/ui/badge';
import {
  getStatusDisplayName,
  getPriorityDisplayName,
  getCategoryDisplayName,
  getDepartmentDisplayName
} from '@/utils/languageDisplay';
import { MONTHS } from './constants/months';

// 색상 배열
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

// 상태와 우선순위 색상 매핑 (Tailwind 색상을 HEX 코드로 변환)
const STATUS_COLORS = {
  'OPEN': '#3b82f6',    // bg-blue-500
  'IN_PROGRESS': '#eab308', // bg-yellow-500
  'RESOLVED': '#22c55e', // bg-green-500
  'CLOSED': '#6b7280',  // bg-gray-500
  // 한국어 매핑 추가
  '미해결': '#3b82f6',    // bg-blue-500
  '진행중': '#eab308', // bg-yellow-500
  '해결됨': '#22c55e', // bg-green-500
  '종료': '#6b7280',  // bg-gray-500
  // 태국어 매핑 추가
  'ยังไม่ได้แก้ไข': '#3b82f6',    // bg-blue-500
  'กำลังดำเนินการ': '#eab308', // bg-yellow-500
  'แก้ไขแล้ว': '#22c55e', // bg-green-500
  'ปิด': '#6b7280',  // bg-gray-500
};

const PRIORITY_COLORS = {
  'CRITICAL': '#ef4444', // bg-red-500
  'HIGH': '#f97316',    // bg-orange-500
  'MEDIUM': '#3b82f6',  // bg-blue-500
  'LOW': '#22c55e',     // bg-green-500
  // 한국어 매핑 추가
  '심각': '#ef4444', // bg-red-500
  '높음': '#f97316',    // bg-orange-500
  '중간': '#3b82f6',  // bg-blue-500
  '낮음': '#22c55e',     // bg-green-500
  // 태국어 매핑 추가
  'วิกฤต': '#ef4444', // bg-red-500
  'สูง': '#f97316',    // bg-orange-500
  'ปานกลาง': '#3b82f6',  // bg-blue-500
  'ต่ำ': '#22c55e',     // bg-green-500
};

// 대시보드 컴포넌트
const Dashboard = () => {
  const { t, language } = useTranslation();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<{from: Date, to: Date}>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // 이번 달 1일
    to: new Date() // 오늘
  });
  const dataLoadedRef = useRef(false);
  const isDataLoadingRef = useRef(false);
  const dateFilterRef = useRef(dateFilter); // 날짜 필터의 이전 값을 저장할 ref
  const dateFilterChangeRef = useRef(false); // 날짜 필터 변경 여부를 추적하는 ref
  
  // 랭킹 데이터 상태 (한 번만 로드)
  const [rankingData, setRankingData] = useState({
    topCommenters: [],
    topIssueFinders: [],
    topIssueResolvers: [],
    isLoading: true
  });

  // 상태에 따른 색상 스타일
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'resolved':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 우선순위에 따른 색상 스타일
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-blue-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // 클라이언트 컴포넌트에서 데이터 로드를 위한 useEffect 사용
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        
        // 날짜 파라미터 설정
        const fromDate = new Date(dateFilter.from);
        fromDate.setHours(0, 0, 0, 0);
        
        const toDate = new Date(dateFilter.to);
        toDate.setHours(23, 59, 59, 999);
        
        params.append('from', fromDate.toISOString());
        params.append('to', toDate.toISOString());
        params.append('lang', language);
        
        const response = await fetch(`/api/dashboard?${params.toString()}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error('데이터를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setDashboardData(data);
        
        // 랭킹 데이터도 함께 로드
        await loadRankingData(dateFilter.from, dateFilter.to);
      } catch (error) {
        console.error('대시보드 데이터 로드 오류:', error);
        toast.error(t('dashboard.loadingError'));
      } finally {
        setIsLoading(false);
        dataLoadedRef.current = true;
      }
    };
    
    if (!dataLoadedRef.current || dateFilterChangeRef.current) {
      fetchDashboardData();
      dateFilterChangeRef.current = false;
    }
  }, [language, t, dateFilter]);

  // 날짜 필터 변경 핸들러
  const handleDateFilterChange = (from: Date, to: Date) => {
    // 이전 값과 동일하면 중복 로드 방지
    if (dateFilter.from?.getTime() === from.getTime() && dateFilter.to?.getTime() === to.getTime()) {
      return;
    }
    
    setDateFilter({ from, to });
    dateFilterChangeRef.current = true;
  };
     
  // 랭킹 데이터 로드 (한 번만 실행)
  const loadRankingData = async (startDate?: Date, endDate?: Date) => {
    try {
      setRankingData(prev => ({ ...prev, isLoading: true }));
      
      // 날짜 형식 변환
      let dateQueryParams = '';
      if (startDate && endDate) {
        // ISO 형식으로 변환 (시간 정보 포함)
        const fromDate = new Date(startDate);
        fromDate.setHours(0, 0, 0, 0);
        
        const toDate = new Date(endDate);
        toDate.setHours(23, 59, 59, 999);
        
        dateQueryParams = `&from=${fromDate.toISOString()}&to=${toDate.toISOString()}`;
      }
      
      // 언어 파라미터 추가
      const langParam = `&lang=${language}`;
      
      // 모든 API 요청에 캐시 방지 헤더 추가
      const requestOptions = {
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      };
      
      // 모든 API 요청 동시에 실행
      const [commentersResponse, findersResponse, resolversResponse] = await Promise.all([
        fetch(`/api/dashboard/top-commenters?refresh=true${dateQueryParams}${langParam}`, requestOptions),
        fetch(`/api/dashboard/top-issue-finders?refresh=true${dateQueryParams}${langParam}`, requestOptions),
        fetch(`/api/dashboard/top-issue-resolvers?refresh=true${dateQueryParams}${langParam}`, requestOptions)
      ]);
      
      // 각 응답이 정상적인 경우에만 JSON 파싱
      const commentersData = commentersResponse.ok ? await commentersResponse.json() : [];
      const findersData = findersResponse.ok ? await findersResponse.json() : [];
      const resolversData = resolversResponse.ok ? await resolversResponse.json() : [];
      
      // 상태 업데이트
      setRankingData({
        topCommenters: commentersData,
        topIssueFinders: findersData,
        topIssueResolvers: resolversData,
        isLoading: false
      });
    } catch (error) {
      console.error('랭킹 데이터 로딩 중 오류:', error);
      setRankingData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // 로딩 중이거나 데이터가 없는 경우의 로딩 화면
  if (isLoading && !dashboardData) {
    // 로딩 UI 반환
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          <div className="flex items-center space-x-2 animate-pulse">
            <div className="h-10 w-48 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-7 bg-gray-200 w-48 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                  <BarChart2 className="h-12 w-12 text-gray-300" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 여기서부터 실제 대시보드 UI 렌더링
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-3xl font-bold mb-4 sm:mb-0">{t('dashboard.title')}</h1>
        <DateRangeFilter
          onFilterChange={handleDateFilterChange}
          initialFromDate={dateFilter.from}
          initialToDate={dateFilter.to}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 월별 이슈 생성 차트 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <BarChart2 className="h-5 w-5 mr-2" />
              {t('dashboard.monthlyIssues')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dashboardData?.monthlyIssueCreation?.map((item: any) => ({
                    name: MONTHS[language][item.month - 1],
                    count: item.count
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value) => [value, t('dashboard.issueCount')]}
                  />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    name={t('dashboard.issueCount')} 
                    fill="#8884d8" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 상태별 이슈 차트 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <PieChartIcon className="h-5 w-5 mr-2" />
              {t('dashboard.issuesByStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData?.issuesByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {dashboardData?.issuesByStatus?.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 우선순위별 이슈 차트 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <PieChartIcon className="h-5 w-5 mr-2" />
              {t('dashboard.issuesByPriority')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData?.issuesByPriority}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="priority"
                    label={({ priority, count }) => `${priority}: ${count}`}
                  >
                    {dashboardData?.issuesByPriority?.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PRIORITY_COLORS[entry.priority] || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [value, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 랭킹 정보 */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center text-lg">
              <AlertCircle className="h-5 w-5 mr-2" />
              {t('dashboard.rankingInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {/* 상위 코멘터 */}
              <div className="mt-2">
                <h3 className="text-md font-medium mb-2 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" /> {t('dashboard.topCommenters')}
                </h3>
                <TopCommenters 
                  data={rankingData.topCommenters} 
                  isLoading={rankingData.isLoading}
                />
              </div>
              
              {/* 상위 이슈 발견자 */}
              <div className="mt-4">
                <h3 className="text-md font-medium mb-2 flex items-center">
                  <SearchIcon className="h-4 w-4 mr-1" /> {t('dashboard.topIssueFinders')}
                </h3>
                <TopIssueFinders 
                  data={rankingData.topIssueFinders} 
                  isLoading={rankingData.isLoading}
                />
              </div>
              
              {/* 상위 이슈 해결자 */}
              <div className="mt-4">
                <h3 className="text-md font-medium mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" /> {t('dashboard.topIssueResolvers')}
                </h3>
                <TopIssueResolvers 
                  data={rankingData.topIssueResolvers} 
                  isLoading={rankingData.isLoading}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// 다이나믹 임포트로 서버 컴포넌트 문제 방지
export default dynamic(() => Promise.resolve(Dashboard), {
  ssr: false,
});