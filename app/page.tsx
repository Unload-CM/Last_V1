'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
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
  CheckCircle
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

export default function Dashboard() {
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
        
        const response = await fetch(`/api/dashboard?${params.toString()}`);
        
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
  async function loadRankingData(startDate?: Date, endDate?: Date) {
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
      
      // 각 응답을 개별적으로 처리
      const commentersResponse = await fetch(`/api/dashboard/top-commenters?refresh=true${dateQueryParams}${langParam}`, { 
        cache: 'no-store'
      });
      const findersResponse = await fetch(`/api/dashboard/top-issue-finders?refresh=true${dateQueryParams}${langParam}`, { 
        cache: 'no-store'
      });
      const resolversResponse = await fetch(`/api/dashboard/top-issue-resolvers?refresh=true${dateQueryParams}${langParam}`, { 
        cache: 'no-store'
      });
      
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
  }

  if (isLoading && !dashboardData) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-primary border-r-transparent align-middle"></div>
          <p className="mt-2">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-10">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <p className="mt-2">{t('dashboard.loadingError')}</p>
        </div>
      </div>
    );
  }

  // 차트에 사용할 데이터 형식으로 변환
  const statusData = dashboardData.statusDistribution?.map((item: any) => ({
    name: item.name,
    value: item.count,
  })) || [];

  const priorityData = dashboardData.priorityDistribution?.map((item: any) => ({
    name: item.name,
    value: item.count,
  })) || [];

  const departmentData = dashboardData.departmentDistribution?.map((item: any) => ({
    name: item.name,
    value: item.count,
  })) || [];

  // 월별 데이터가 없는 경우 빈 배열로 처리
  const monthlyData = dashboardData.monthlyIssueCreation ? 
    dashboardData.monthlyIssueCreation.map((item: any) => ({
      name: MONTHS[language as keyof typeof MONTHS]?.[item.month - 1] || `Month ${item.month}`,
      issues: item.count,
    })) : [];

  return (
    <div className="container mx-auto py-1 md:py-3">
      <div className="grid gap-2 md:gap-3 mt-1 md:mt-2">
        <div className="flex flex-col space-y-1 md:space-y-2">
          <h1 className="text-xl md:text-2xl font-bold mb-0 pl-4 md:pl-0">{t('dashboard.title')}</h1>
          <div className="flex flex-wrap items-center">
            <DateRangeFilter onFilterChange={handleDateFilterChange} />
          </div>
        </div>
        
        {/* 대시보드 그리드 */}
        <div className="flex flex-col md:grid md:grid-cols-3 gap-3 md:gap-6">
          {/* 이슈 발견자 랭킹 */}
          <Card className="w-full order-1 !mt-0 md:order-none md:shadow shadow-sm">
            <CardHeader className="md:px-6 px-4 md:py-6 py-3">
              <CardTitle className="flex items-center md:text-xl text-lg">
                <AlertCircle className="h-5 w-5 mr-2" />
                {t('dashboard.topIssueFinders')}
              </CardTitle>
            </CardHeader>
            <CardContent className="md:px-6 px-4 md:pb-6 pb-4">
              <TopIssueFinders 
                data={rankingData.topIssueFinders} 
                isLoading={rankingData.isLoading} 
              />
            </CardContent>
          </Card>
          
          {/* 이슈 해결자 랭킹 */}
          <Card className="w-full order-2 md:order-none md:shadow shadow-sm">
            <CardHeader className="md:px-6 px-4 md:py-6 py-3">
              <CardTitle className="flex items-center md:text-xl text-lg">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                {t('dashboard.topIssueResolvers')}
              </CardTitle>
            </CardHeader>
            <CardContent className="md:px-6 px-4 md:pb-6 pb-4">
              <TopIssueResolvers 
                data={rankingData.topIssueResolvers} 
                isLoading={rankingData.isLoading} 
              />
            </CardContent>
          </Card>
          
          {/* 댓글 작성 랭킹 */}
          <Card className="w-full order-3 md:order-none md:shadow shadow-sm">
            <CardHeader className="md:px-6 px-4 md:py-6 py-3">
              <CardTitle className="flex items-center md:text-xl text-lg">
                <MessageSquare className="h-5 w-5 mr-2" />
                {t('dashboard.topCommenters')}
              </CardTitle>
            </CardHeader>
            <CardContent className="md:px-6 px-4 md:pb-6 pb-4">
              <TopCommenters 
                data={rankingData.topCommenters} 
                isLoading={rankingData.isLoading} 
              />
            </CardContent>
          </Card>
          
          {/* 월별 이슈 생성 추이 */}
          <Card className="w-full md:col-span-2 order-6 md:order-none md:shadow shadow-sm">
            <CardHeader className="md:px-6 px-4 md:py-6 py-3">
              <CardTitle className="flex items-center md:text-xl text-lg">
                <BarChart2 className="h-5 w-5 mr-2" />
                {t('dashboard.monthlyIssueCreation')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('dashboard.monthlyIssueDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="md:px-6 px-4 md:pb-6 pb-4">
              <div className="md:h-72 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="name" />
                    <YAxis 
                      allowDecimals={false}
                      domain={[0, (dataMax: number) => Math.max(1, Math.ceil(dataMax))]}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="issues" name={t('dashboard.issuesCount')} fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* 요약 카드 */}
          <div className="w-full grid grid-cols-2 gap-4 order-7 md:order-none">
            <Card className="md:shadow shadow-sm">
              <CardHeader className="pb-2 md:px-6 px-4 md:py-4 py-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('dashboard.totalIssues')}
                </CardTitle>
              </CardHeader>
              <CardContent className="md:px-6 px-4 md:pb-4 pb-2">
                <div className="text-2xl font-bold">{dashboardData.totalIssues || 0}</div>
              </CardContent>
            </Card>
            
            <Card className="md:shadow shadow-sm">
              <CardHeader className="pb-2 md:px-6 px-4 md:py-4 py-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('dashboard.openIssues')}
                </CardTitle>
              </CardHeader>
              <CardContent className="md:px-6 px-4 md:pb-4 pb-2">
                <div className="text-2xl font-bold">
                  {dashboardData.openIssuesCount || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:shadow shadow-sm">
              <CardHeader className="pb-2 md:px-6 px-4 md:py-4 py-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('dashboard.inProgressIssues')}
                </CardTitle>
              </CardHeader>
              <CardContent className="md:px-6 px-4 md:pb-4 pb-2">
                <div className="text-2xl font-bold">
                  {dashboardData.inProgressIssuesCount || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:shadow shadow-sm">
              <CardHeader className="pb-2 md:px-6 px-4 md:py-4 py-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('dashboard.resolvedIssues')}
                </CardTitle>
              </CardHeader>
              <CardContent className="md:px-6 px-4 md:pb-4 pb-2">
                <div className="text-2xl font-bold">
                  {dashboardData.resolvedIssuesCount || 0}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 상태 분포 */}
          <Card className="w-full order-4 md:order-none md:shadow shadow-sm">
            <CardHeader className="md:px-6 px-4 md:py-6 py-3">
              <CardTitle className="flex items-center md:text-xl text-lg">
                <PieChartIcon className="h-5 w-5 mr-2" />
                {t('dashboard.statusDistribution')}
              </CardTitle>
            </CardHeader>
            <CardContent className="md:px-6 px-4 md:pb-6 pb-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      fill="#82ca9d"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* 우선순위 분포 */}
          <Card className="w-full order-5 md:order-none md:shadow shadow-sm">
            <CardHeader className="md:px-6 px-4 md:py-6 py-3">
              <CardTitle className="flex items-center md:text-xl text-lg">
                <PieChartIcon className="h-5 w-5 mr-2" />
                {t('dashboard.priorityDistribution')}
              </CardTitle>
            </CardHeader>
            <CardContent className="md:px-6 px-4 md:pb-6 pb-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      fill="#82ca9d"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {priorityData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PRIORITY_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* 부서별 분포 */}
          <Card className="w-full order-8 md:order-none md:shadow shadow-sm">
            <CardHeader className="md:px-6 px-4 md:py-6 py-3">
              <CardTitle className="flex items-center md:text-xl text-lg">
                <Briefcase className="h-5 w-5 mr-2" />
                {t('dashboard.departmentDistribution')}
              </CardTitle>
            </CardHeader>
            <CardContent className="md:px-6 px-4 md:pb-6 pb-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentData}
                    layout="vertical"
                    margin={{ left: 60, right: 20 }}
                  >
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={50}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => {
                        return value?.length > 6 ? value.substring(0, 6) + '...' : value;
                      }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="value" 
                      name={t('dashboard.issuesCount')} 
                      fill="#4ade80" 
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* 최근 이슈 */}
          <Card className="w-full md:col-span-3 order-9 md:order-none md:shadow shadow-sm">
            <CardHeader className="md:px-6 px-4 md:py-6 py-3">
              <CardTitle className="flex items-center md:text-xl text-lg">
                <Clock className="h-5 w-5 mr-2" />
                {t('dashboard.recentIssues')}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[500px] overflow-y-auto md:px-6 px-4 md:pb-6 pb-4">
              <div className="space-y-4">
                {dashboardData.recentIssues && dashboardData.recentIssues.length > 0 ? (
                  dashboardData.recentIssues.map((issue: any) => (
                    <div key={issue.id} className="border rounded-md p-3 shadow-sm hover:shadow-md transition-shadow">
                      <Link 
                        href={`/issues/${issue.id}`}
                        className="font-medium hover:underline block text-base"
                      >
                        {issue.title}
                      </Link>
                      
                      {/* 이슈 내용 */}
                      {issue.description && (
                        <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {issue.description}
                        </div>
                      )}
                      
                      <div className="mt-3 flex flex-wrap gap-2">
                        {/* 상태 */}
                        {issue.status && (
                          <Badge className={getStatusColor(issue.status?.name || 'open')}>
                            {getStatusDisplayName(issue.status, language)}
                          </Badge>
                        )}
                        
                        {/* 우선순위 */}
                        {issue.priority && (
                          <Badge className={getPriorityColor(issue.priority?.name || 'medium')}>
                            {getPriorityDisplayName(issue.priority, language)}
                          </Badge>
                        )}
                        
                        {/* 카테고리 */}
                        <span className="text-sm text-gray-600">
                          {getCategoryDisplayName(issue.category, language)}
                        </span>
                      </div>
                      
                      {/* 생성일 및 작성자 정보 */}
                      <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                        <div>
                          <span className="mr-1">{t('common.createdBy')}:</span>
                          <span>
                            {issue.creator?.koreanName || issue.creator?.employeeId || t('common.unknown')}
                          </span>
                        </div>
                        <div>{format(new Date(issue.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('dashboard.noRecentIssues')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 