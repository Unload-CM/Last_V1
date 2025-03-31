import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FiAlertCircle, FiCheckCircle, FiClock, FiList, FiRefreshCw } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useTranslation } from '@/store/languageStore';

// 타입 정의
interface IssueSummary {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  total: number;
}

interface Issue {
  id: number;
  issueId: string;
  title: string;
  status: string;
  statusLabel: string;
  priority: string;
  priorityLabel: string;
  category: string;
  categoryLabel: string;
  department: string;
  departmentLabel: string;
  createdAt: string;
  creator?: {
    id: number;
    employeeId: string;
    name: string;
  };
  assignee?: {
    id: number;
    employeeId: string;
    name: string;
  };
}

interface DepartmentSummary {
  id: number;
  name: string;
  label: string;
  count: number;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issueSummary, setIssueSummary] = useState<IssueSummary>({
    open: 0,
    inProgress: 0, 
    resolved: 0,
    closed: 0,
    total: 0
  });
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [departmentSummary, setDepartmentSummary] = useState<DepartmentSummary[]>([]);

  // 인증 상태 확인
  useEffect(() => {
    // 아직 세션을 확인 중이면 기다림
    if (status === 'loading') return;
    
    // 인증되지 않았으면 로그인 페이지로 리다이렉트
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // 데이터 로드
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // API 요청 시 credentials 옵션 추가 (쿠키 전송을 위해)
      const response = await fetch('/api/dashboard', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증되지 않은 사용자입니다. 다시 로그인해주세요.');
        }
        throw new Error('대시보드 데이터를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      
      setIssueSummary(data.issueSummary);
      setRecentIssues(data.recentIssues);
      setDepartmentSummary(data.issuesByDepartment);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
      setError(error instanceof Error ? error.message : '데이터를 불러오는 중 오류가 발생했습니다.');
      
      // 폴백 데이터
      setIssueSummary({
        open: 5,
        inProgress: 3,
        resolved: 8,
        closed: 12,
        total: 28
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 데이터 새로고침 함수
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // 로딩 중이거나 인증되지 않은 경우 로딩 UI 표시
  if (status === 'loading') {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-[80vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold">{t('common.loading')}</h1>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    // 인증되지 않은 경우는 useEffect에서 리다이렉트 처리
    return null;
  }

  return (
    <>
      <Head>
        <title>{t('dashboard.title')} - CoilMaster</title>
        <meta name="description" content={t('dashboard.description')} />
      </Head>

      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
          
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={`${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? t('common.loading') : t('common.refresh')}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {/* 요약 카드 */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('issues.status.open')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FiAlertCircle className="mr-2 text-red-500" />
                <span className="text-2xl font-bold">{issueSummary.open}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('issues.status.inProgress')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FiClock className="mr-2 text-yellow-500" />
                <span className="text-2xl font-bold">{issueSummary.inProgress}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('issues.status.resolved')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FiCheckCircle className="mr-2 text-green-500" />
                <span className="text-2xl font-bold">{issueSummary.resolved}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('issues.total')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FiList className="mr-2 text-blue-500" />
                <span className="text-2xl font-bold">{issueSummary.total}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 최근 이슈 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('dashboard.recentIssues')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : recentIssues.length > 0 ? (
                recentIssues.map(issue => (
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
                        {issue.statusLabel}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {issue.departmentLabel} • 
                      <span className={`
                        ml-2
                        ${issue.priority === 'HIGH' ? 'text-red-600' : 
                          issue.priority === 'MEDIUM' ? 'text-yellow-600' :
                          'text-green-600'}
                      `}>
                        {issue.priorityLabel}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-gray-500">{t('dashboard.noIssues')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      
        {/* 부서별 이슈 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.issuesByDepartment')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : departmentSummary.length > 0 ? (
                departmentSummary.map(dept => (
                  <div key={dept.id} className="flex justify-between items-center">
                    <span>{dept.label}</span>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full" 
                          style={{ width: `${issueSummary.total > 0 ? (dept.count / issueSummary.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="font-medium">{dept.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-gray-500">{t('dashboard.noDepartmentData')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 