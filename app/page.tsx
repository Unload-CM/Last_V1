'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FiAward, FiTrendingUp, FiAlertCircle, FiCheckCircle, FiClock, FiList } from 'react-icons/fi';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title 
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import useTranslation from '../utils/i18n';
import LoginForm from '@/components/LoginForm';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// 이슈 타입 정의
interface Issue {
  id: number;
  issueId: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  department: string;
  createdAt: string;
  creator: {
    id: number;
    employeeId: string;
    name: string;
    position: string;
    department: string;
  };
  assignee: {
    id: number;
    employeeId: string;
    name: string;
    position: string;
    department: string;
  };
}

// 이슈 요약 타입 정의
interface IssueSummary {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  total: number;
}

// 이슈 해결 우수자 타입 정의
interface TopResolver {
  id: number;
  employeeId: string;
  name: string;
  position: string;
  department: string;
  resolvedCount: number;
  resolutionPercentage: number;
}

// 이슈 생성자 통계 타입 정의
interface TopCreator {
  id: number;
  employeeId: string;
  name: string;
  department: string;
  createdCount: number;
}

// 이슈 담당자 통계 타입 정의
interface TopAssignee {
  id: number;
  employeeId: string;
  name: string;
  department: string;
  assignedCount: number;
}

export default function Home() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  
  // 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [issueSummary, setIssueSummary] = useState<IssueSummary>({
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    total: 0
  });
  const [issuesByCategory, setIssuesByCategory] = useState<{[key: string]: number}>({});
  const [issuesByDepartment, setIssuesByDepartment] = useState<{[key: string]: number}>({});
  const [topResolvers, setTopResolvers] = useState<TopResolver[]>([]);
  const [topCreators, setTopCreators] = useState<TopCreator[]>([]);
  const [topAssignees, setTopAssignees] = useState<TopAssignee[]>([]);
  
  // 데이터 로드
  useEffect(() => {
    // 인증 상태에 따라 처리
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      setIsLoading(false);
      return;
    }
    
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 최근 이슈 가져오기
        const issuesResponse = await fetch('/api/issues?limit=5');
        if (!issuesResponse.ok) throw new Error('이슈 데이터를 불러오는데 실패했습니다.');
        const issuesData = await issuesResponse.json();
        setRecentIssues(issuesData.issues);
        
        // 이슈 요약 계산
        const summary: IssueSummary = {
          open: 0,
          inProgress: 0,
          resolved: 0,
          closed: 0,
          total: 0
        };
        
        const categoryCount: {[key: string]: number} = {};
        const departmentCount: {[key: string]: number} = {};
        
        // 모든 이슈 가져오기 (요약 계산용)
        const allIssuesResponse = await fetch('/api/issues?limit=100');
        if (!allIssuesResponse.ok) throw new Error('이슈 데이터를 불러오는데 실패했습니다.');
        const allIssuesData = await allIssuesResponse.json();
        
        allIssuesData.issues.forEach((issue: Issue) => {
          // 상태별 카운트
          if (issue.status === 'OPEN') summary.open++;
          else if (issue.status === 'IN_PROGRESS') summary.inProgress++;
          else if (issue.status === 'RESOLVED') summary.resolved++;
          else if (issue.status === 'CLOSED') summary.closed++;
          
          // 카테고리별 카운트
          categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
          
          // 부서별 카운트
          departmentCount[issue.department] = (departmentCount[issue.department] || 0) + 1;
        });
        
        summary.total = allIssuesData.pagination.total;
        setIssueSummary(summary);
        setIssuesByCategory(categoryCount);
        setIssuesByDepartment(departmentCount);
        
        // 이슈 해결 우수자 가져오기 (관리자만)
        const topResolversResponse = await fetch('/api/issues/top-resolvers?period=month&limit=5&position=관리자');
        if (!topResolversResponse.ok) throw new Error('우수자 데이터를 불러오는데 실패했습니다.');
        const topResolversData = await topResolversResponse.json();
        setTopResolvers(topResolversData.topResolvers);
        
        // 이슈 생성자 통계 가져오기
        const topCreatorsResponse = await fetch('/api/issues/top-creators?limit=5');
        if (!topCreatorsResponse.ok) throw new Error('생성자 통계를 불러오는데 실패했습니다.');
        const topCreatorsData = await topCreatorsResponse.json();
        setTopCreators(topCreatorsData.topCreators);

        // 이슈 담당자 통계 가져오기
        const topAssigneesResponse = await fetch('/api/issues/top-assignees?limit=3');
        if (!topAssigneesResponse.ok) throw new Error('담당자 통계를 불러오는데 실패했습니다.');
        const topAssigneesData = await topAssigneesResponse.json();
        setTopAssignees(topAssigneesData.topAssignees);
        
      } catch (err) {
        console.error('대시보드 데이터 로드 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);
  
  // 차트 데이터 생성
  const issuesByCategoryData = {
    labels: Object.keys(issuesByCategory),
    datasets: [
      {
        data: Object.values(issuesByCategory),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const issuesByDepartmentData = {
    labels: Object.keys(issuesByDepartment),
    datasets: [
      {
        label: '부서별 이슈',
        data: Object.values(issuesByDepartment),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };
  
  // 상태 표시 스타일
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // 우선순위 표시 스타일
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // 로그인하지 않은 사용자에게 로그인 폼 표시
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">로그인</CardTitle>
              <p className="text-sm text-muted-foreground">계정 정보로 로그인하세요</p>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // 로딩 중일 때 스켈레톤 UI 표시
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }
  
  // 최종 UI 렌더링 - 헤더와 대시보드 요약
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 및 요약 정보 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground">
            공장 관리 시스템의 전체 현황을 한눈에 확인하세요.
          </p>
        </div>
      </div>
      
      {/* 요약 카드 - 이슈 상태별 수치 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">열린 이슈</CardTitle>
            <FiAlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issueSummary.open}</div>
            <p className="text-xs text-muted-foreground">
              전체 이슈의 {issueSummary.total > 0 ? Math.round((issueSummary.open / issueSummary.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">진행 중 이슈</CardTitle>
            <FiClock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issueSummary.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              전체 이슈의 {issueSummary.total > 0 ? Math.round((issueSummary.inProgress / issueSummary.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">해결된 이슈</CardTitle>
            <FiCheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issueSummary.resolved}</div>
            <p className="text-xs text-muted-foreground">
              전체 이슈의 {issueSummary.total > 0 ? Math.round((issueSummary.resolved / issueSummary.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">완료된 이슈</CardTitle>
            <FiList className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issueSummary.closed}</div>
            <p className="text-xs text-muted-foreground">
              전체 이슈의 {issueSummary.total > 0 ? Math.round((issueSummary.closed / issueSummary.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* 중간 섹션 - 차트와 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리별 이슈 차트 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>카테고리별 이슈</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              {Object.keys(issuesByCategory).length > 0 ? (
                <Pie data={issuesByCategoryData} />
              ) : (
                <p className="text-muted-foreground text-center">데이터가 없습니다</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* 부서별 이슈 차트 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>부서별 이슈</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              {Object.keys(issuesByDepartment).length > 0 ? (
                <Bar
                  data={issuesByDepartmentData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-muted-foreground text-center">데이터가 없습니다</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 하단 섹션 - 더 많은 통계와 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 최근 이슈 목록 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>최근 이슈</CardTitle>
          </CardHeader>
          <CardContent>
            {recentIssues.length > 0 ? (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 text-left font-medium">ID</th>
                      <th className="pb-2 text-left font-medium">제목</th>
                      <th className="pb-2 text-left font-medium">상태</th>
                      <th className="pb-2 text-left font-medium">우선순위</th>
                      <th className="pb-2 text-left font-medium">작성일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentIssues.map((issue) => (
                      <tr key={issue.id} className="border-b">
                        <td className="py-3 pr-2 text-sm">{issue.issueId}</td>
                        <td className="py-3 pr-2 text-sm font-medium">{issue.title}</td>
                        <td className="py-3 pr-2">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusStyle(issue.status)}`}>
                            {issue.status}
                          </span>
                        </td>
                        <td className="py-3 pr-2">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityStyle(issue.priority)}`}>
                            {issue.priority}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {formatDate(issue.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">이슈가 없습니다</p>
            )}
          </CardContent>
        </Card>
        
        {/* 우수 해결자 목록 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>이슈 해결 우수자</CardTitle>
              <FiAward className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            {topResolvers.length > 0 ? (
              <div className="space-y-4">
                {topResolvers.map((resolver) => (
                  <div key={resolver.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{resolver.name}</span>
                        <span className="text-xs text-muted-foreground">{resolver.department}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{resolver.resolvedCount}건</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        {resolver.resolutionPercentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">데이터가 없습니다</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}