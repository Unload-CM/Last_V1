'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FiAward, FiTrendingUp, FiAlertCircle, FiCheckCircle, FiClock, FiList } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import useTranslation from '../utils/i18n';
import LoginForm from '@/components/LoginForm';

// Chart.js 관련 컴포넌트를 브라우저에서만 로드되도록 dynamic import
const Charts = dynamic(() => import('@/components/Charts'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full"><Skeleton className="h-full w-full" /></div>
});

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

export default function DashboardContent() {
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
        // 공통 fetch 옵션
        const fetchOptions = {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        };
        
        try {
          // 최근 이슈 가져오기
          const issuesResponse = await fetch('/api/issues?limit=5', fetchOptions);
          if (!issuesResponse.ok) throw new Error('이슈 데이터를 불러오는데 실패했습니다.');
          const issuesData = await issuesResponse.json();
          setRecentIssues(issuesData.issues);
        } catch (error) {
          console.warn('이슈 데이터 로드 실패, 정적 데이터 사용:', error);
          // 정적 fallback 데이터
          setRecentIssues([
            {
              id: 1,
              issueId: 'ISS-001',
              title: '생산 라인 1 모터 과열',
              status: 'OPEN',
              priority: 'HIGH',
              category: '설비',
              department: '생산부',
              createdAt: new Date().toISOString(),
              creator: {
                id: 1,
                employeeId: 'EMP001',
                name: '김관리',
                position: '관리자',
                department: '관리부'
              },
              assignee: {
                id: 2,
                employeeId: 'EMP002',
                name: '이기술',
                position: '엔지니어',
                department: '기술부'
              }
            }
          ]);
        }
        
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
        
        try {
          // 모든 이슈 가져오기 (요약 계산용)
          const allIssuesResponse = await fetch('/api/issues?limit=100', fetchOptions);
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
        } catch (error) {
          console.warn('이슈 요약 데이터 로드 실패, 정적 데이터 사용:', error);
          // 정적 fallback 데이터
          summary.open = 5;
          summary.inProgress = 3;
          summary.resolved = 8;
          summary.closed = 12;
          summary.total = 28;
          
          categoryCount['설비'] = 12;
          categoryCount['소프트웨어'] = 8;
          categoryCount['안전'] = 4;
          categoryCount['품질'] = 4;
          
          departmentCount['생산부'] = 15;
          departmentCount['기술부'] = 8;
          departmentCount['품질부'] = 5;
        }
        
        setIssueSummary(summary);
        setIssuesByCategory(categoryCount);
        setIssuesByDepartment(departmentCount);
        
        // 이슈 해결 우수자 가져오기 (관리자만)
        try {
          const topResolversResponse = await fetch('/api/issues/top-resolvers?period=month&limit=5&position=관리자', fetchOptions);
          if (!topResolversResponse.ok) throw new Error('우수자 데이터를 불러오는데 실패했습니다.');
          const topResolversData = await topResolversResponse.json();
          setTopResolvers(topResolversData.topResolvers);
        } catch (error) {
          console.warn('우수자 데이터 로드 실패, 정적 데이터 사용:', error);
          // 정적 fallback 데이터
          setTopResolvers([
            {
              id: 2,
              employeeId: 'EMP002',
              name: '이기술',
              position: '엔지니어',
              department: '기술부',
              resolvedCount: 8,
              resolutionPercentage: 85
            },
            {
              id: 3,
              employeeId: 'EMP003',
              name: '박생산',
              position: '관리자',
              department: '생산부',
              resolvedCount: 6,
              resolutionPercentage: 75
            }
          ]);
        }
        
        // 이슈 생성자 통계 가져오기
        try {
          const topCreatorsResponse = await fetch('/api/issues/top-creators?limit=5', fetchOptions);
          if (!topCreatorsResponse.ok) throw new Error('생성자 통계를 불러오는데 실패했습니다.');
          const topCreatorsData = await topCreatorsResponse.json();
          setTopCreators(topCreatorsData.topCreators);
        } catch (error) {
          console.warn('생성자 통계 로드 실패, 정적 데이터 사용:', error);
          // 정적 fallback 데이터
          setTopCreators([
            {
              id: 1,
              employeeId: 'EMP001',
              name: '김관리',
              department: '관리부',
              createdCount: 10
            },
            {
              id: 4,
              employeeId: 'EMP004',
              name: '최품질',
              department: '품질부',
              createdCount: 8
            }
          ]);
        }
        
        // 이슈 담당자 통계 가져오기
        try {
          const topAssigneesResponse = await fetch('/api/issues/top-assignees?limit=3', fetchOptions);
          if (!topAssigneesResponse.ok) throw new Error('담당자 통계를 불러오는데 실패했습니다.');
          const topAssigneesData = await topAssigneesResponse.json();
          setTopAssignees(topAssigneesData.topAssignees);
        } catch (error) {
          console.warn('담당자 통계 로드 실패, 정적 데이터 사용:', error);
          // 정적 fallback 데이터
          setTopAssignees([
            {
              id: 2,
              employeeId: 'EMP002',
              name: '이기술',
              department: '기술부',
              assignedCount: 12
            },
            {
              id: 5,
              employeeId: 'EMP005',
              name: '정정비',
              department: '정비부',
              assignedCount: 7
            }
          ]);
        }
        
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
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
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
  
  // 차트 데이터 준비
  const chartData = {
    issuesByCategory: {
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
    },
    issuesByDepartment: {
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
    }
  };
  
  // 로딩 중일 때 스켈레톤 UI 표시
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="w-full">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-4 mt-4 grid-cols-1 md:grid-cols-2">
          <Card className="w-full">
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          
          <Card className="w-full">
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // 최종 UI 렌더링
  return (
    <div className="container mx-auto p-4">
      {/* 요약 통계 */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FiAlertCircle className="mr-2 text-blue-500" />
              열린 이슈
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issueSummary.open}</div>
          </CardContent>
        </Card>
        
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FiClock className="mr-2 text-yellow-500" />
              진행 중인 이슈
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issueSummary.inProgress}</div>
          </CardContent>
        </Card>
        
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FiCheckCircle className="mr-2 text-green-500" />
              해결된 이슈
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issueSummary.resolved}</div>
          </CardContent>
        </Card>
        
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FiList className="mr-2 text-gray-500" />
              전체 이슈
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issueSummary.total}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* 차트 */}
      <div className="grid gap-4 mt-4 grid-cols-1 md:grid-cols-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <FiTrendingUp className="mr-2" />
              카테고리별 이슈
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {Object.keys(issuesByCategory).length > 0 && (
                <Charts type="pie" data={chartData.issuesByCategory} />
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <FiTrendingUp className="mr-2" />
              부서별 이슈
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {Object.keys(issuesByDepartment).length > 0 && (
                <Charts type="bar" data={chartData.issuesByDepartment} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 최근 이슈 */}
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <FiList className="mr-2" />
            최근 이슈
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left">제목</th>
                  <th className="py-2 px-4 text-left">상태</th>
                  <th className="py-2 px-4 text-left">우선순위</th>
                  <th className="py-2 px-4 text-left">부서</th>
                  <th className="py-2 px-4 text-left">생성일</th>
                </tr>
              </thead>
              <tbody>
                {recentIssues.length > 0 ? (
                  recentIssues.map((issue) => (
                    <tr key={issue.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{issue.title}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(issue.status)}`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityStyle(issue.priority)}`}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="py-2 px-4">{issue.department}</td>
                      <td className="py-2 px-4">{formatDate(issue.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      최근 이슈가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* 우수자 & 통계 */}
      <div className="grid gap-4 mt-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* 이슈 해결 우수자 */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <FiAward className="mr-2 text-yellow-500" />
              이슈 해결 우수자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topResolvers.length > 0 ? (
                topResolvers.map((resolver, index) => (
                  <div key={resolver.id} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{resolver.name}</div>
                      <div className="text-xs text-gray-500">{resolver.department}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{resolver.resolvedCount}건</div>
                      <div className="text-xs text-gray-500">{resolver.resolutionPercentage}%</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-500">
                  데이터가 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* 이슈 생성자 통계 */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <FiTrendingUp className="mr-2 text-blue-500" />
              이슈 생성자 통계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCreators.length > 0 ? (
                topCreators.map((creator, index) => (
                  <div key={creator.id} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{creator.name}</div>
                      <div className="text-xs text-gray-500">{creator.department}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{creator.createdCount}건</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-500">
                  데이터가 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* 이슈 담당자 통계 */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center">
              <FiTrendingUp className="mr-2 text-green-500" />
              이슈 담당자 통계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAssignees.length > 0 ? (
                topAssignees.map((assignee, index) => (
                  <div key={assignee.id} className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{assignee.name}</div>
                      <div className="text-xs text-gray-500">{assignee.department}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{assignee.assignedCount}건</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-500">
                  데이터가 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 오류 메시지 */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
}