import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FiAlertCircle, FiCheckCircle, FiClock, FiList } from 'react-icons/fi';
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
      const response = await fetch('/api/dashboard');
      
      if (!response.ok) {
        throw new Error('대시보드 데이터를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      
      setIssueSummary(data.issueSummary);
      setRecentIssues(data.recentIssues);
      setDepartmentSummary(data.issuesByDepartment);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      
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

  // 로딩 중이거나 인증되지 않은 경우 로딩 UI 표시
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold">{t('common.loading')}</h1>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{t('dashboard.title')} - CoilMaster</title>
        <meta name="description" content={t('dashboard.description')} />
      </Head>

      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">{t('dashboard.title')}</h1>
        
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
                <p>{t('common.loading')}</p>
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
                <p>{t('dashboard.noIssues')}</p>
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
                <p>{t('common.loading')}</p>
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
                <p>{t('dashboard.noDepartmentData')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 