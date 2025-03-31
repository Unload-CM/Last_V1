import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FiAward, FiTrendingUp, FiAlertCircle, FiCheckCircle, FiClock, FiList } from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// 차트 컴포넌트를 클라이언트 사이드에서만 렌더링되도록 동적 임포트
const PieChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), { ssr: false });
const BarChart = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });

// 정적 대시보드 데이터
const STATIC_DATA = {
  issueSummary: {
    open: 5,
    inProgress: 3, 
    resolved: 8,
    closed: 12,
    total: 28
  },
  recentIssues: [
    { id: 1, issueId: 'ISS-001', title: '생산 라인 1 모터 과열', status: 'OPEN', priority: 'HIGH', department: '생산부', createdAt: '2023-12-10T09:30:00Z', 
      creator: { id: 1, employeeId: 'EMP001', name: '김영수', position: '기술자', department: '생산부' },
      assignee: { id: 5, employeeId: 'EMP005', name: '박정훈', position: '관리자', department: '생산부' }
    },
    { id: 2, issueId: 'ISS-002', title: '소프트웨어 업데이트 필요', status: 'IN_PROGRESS', priority: 'MEDIUM', department: '기술부', createdAt: '2023-12-11T10:15:00Z',
      creator: { id: 2, employeeId: 'EMP002', name: '이민지', position: '개발자', department: '기술부' },
      assignee: { id: 2, employeeId: 'EMP002', name: '이민지', position: '개발자', department: '기술부' }
    },
    { id: 3, issueId: 'ISS-003', title: '품질 검사 장비 고장', status: 'RESOLVED', priority: 'HIGH', department: '품질부', createdAt: '2023-12-08T14:20:00Z',
      creator: { id: 3, employeeId: 'EMP003', name: '최재영', position: '검사원', department: '품질부' },
      assignee: { id: 6, employeeId: 'EMP006', name: '강동원', position: '기술자', department: '기술부' }
    },
    { id: 4, issueId: 'ISS-004', title: '안전 매뉴얼 업데이트', status: 'CLOSED', priority: 'LOW', department: '관리부', createdAt: '2023-12-05T09:45:00Z',
      creator: { id: 4, employeeId: 'EMP004', name: '정수진', position: '관리자', department: '관리부' },
      assignee: { id: 4, employeeId: 'EMP004', name: '정수진', position: '관리자', department: '관리부' }
    },
    { id: 5, issueId: 'ISS-005', title: '생산 라인 2 정기 점검', status: 'OPEN', priority: 'MEDIUM', department: '생산부', createdAt: '2023-12-12T08:50:00Z',
      creator: { id: 1, employeeId: 'EMP001', name: '김영수', position: '기술자', department: '생산부' },
      assignee: { id: 7, employeeId: 'EMP007', name: '송민석', position: '관리자', department: '생산부' }
    }
  ],
  issuesByCategory: {
    '기계 고장': 12,
    '소프트웨어 오류': 8,
    '품질 문제': 5,
    '안전 이슈': 3
  },
  issuesByDepartment: {
    '생산부': 15,
    '기술부': 8,
    '품질부': 5,
    '관리부': 2
  },
  topResolvers: [
    { id: 1, employeeId: 'EMP007', name: '송민석', position: '관리자', department: '생산부', resolvedCount: 8, resolutionPercentage: 28.57 },
    { id: 2, employeeId: 'EMP006', name: '강동원', position: '기술자', department: '기술부', resolvedCount: 6, resolutionPercentage: 21.43 },
    { id: 3, employeeId: 'EMP005', name: '박정훈', position: '관리자', department: '생산부', resolvedCount: 5, resolutionPercentage: 17.86 }
  ],
  topCreators: [
    { id: 1, employeeId: 'EMP001', name: '김영수', department: '생산부', createdCount: 10 },
    { id: 2, employeeId: 'EMP003', name: '최재영', department: '품질부', createdCount: 8 },
    { id: 3, employeeId: 'EMP002', name: '이민지', department: '기술부', createdCount: 7 },
    { id: 4, employeeId: 'EMP004', name: '정수진', department: '관리부', createdCount: 3 }
  ],
  topAssignees: [
    { id: 1, employeeId: 'EMP007', name: '송민석', department: '생산부', assignedCount: 12 },
    { id: 2, employeeId: 'EMP006', name: '강동원', department: '기술부', assignedCount: 9 },
    { id: 3, employeeId: 'EMP005', name: '박정훈', department: '생산부', assignedCount: 7 }
  ]
};

// 차트 설정
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
    }
  }
};

// 대시보드 컴포넌트
export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드 렌더링 여부 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 인증 상태 확인
  useEffect(() => {
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

  // 카테고리별 이슈 차트 데이터
  const issuesByCategoryData = {
    labels: Object.keys(STATIC_DATA.issuesByCategory),
    datasets: [
      {
        data: Object.values(STATIC_DATA.issuesByCategory),
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

  // 부서별 이슈 차트 데이터
  const issuesByDepartmentData = {
    labels: Object.keys(STATIC_DATA.issuesByDepartment),
    datasets: [
      {
        label: '부서별 이슈',
        data: Object.values(STATIC_DATA.issuesByDepartment),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // 상태 표시 스타일
  const getStatusStyle = (status) => {
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
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'LOW':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // 상태 표시 텍스트
  const getStatusText = (status) => {
    switch (status) {
      case 'OPEN':
        return '미처리';
      case 'IN_PROGRESS':
        return '처리중';
      case 'RESOLVED':
        return '해결됨';
      case 'CLOSED':
        return '종료';
      default:
        return '기타';
    }
  };

  // 우선순위 표시 텍스트
  const getPriorityText = (priority) => {
    switch (priority) {
      case 'HIGH':
        return '높음';
      case 'MEDIUM':
        return '중간';
      case 'LOW':
        return '낮음';
      default:
        return '기타';
    }
  };

  return (
    <>
      <Head>
        <title>대시보드 - 공장 관리 시스템</title>
        <meta name="description" content="대시보드" />
      </Head>

      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">대시보드</h1>
        
        {/* 요약 카드 */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">미처리 이슈</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FiAlertCircle className="mr-2 text-red-500" />
                <span className="text-2xl font-bold">{STATIC_DATA.issueSummary.open}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">처리 중 이슈</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FiClock className="mr-2 text-yellow-500" />
                <span className="text-2xl font-bold">{STATIC_DATA.issueSummary.inProgress}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">해결된 이슈</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FiCheckCircle className="mr-2 text-green-500" />
                <span className="text-2xl font-bold">{STATIC_DATA.issueSummary.resolved}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">전체 이슈</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <FiList className="mr-2 text-blue-500" />
                <span className="text-2xl font-bold">{STATIC_DATA.issueSummary.total}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 차트 섹션 */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-6">
          {/* 카테고리별 이슈 차트 */}
          <Card>
            <CardHeader>
              <CardTitle>카테고리별 이슈</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {isClient && (
                <PieChart 
                  data={issuesByCategoryData} 
                  options={chartOptions} 
                />
              )}
            </CardContent>
          </Card>
          
          {/* 부서별 이슈 차트 */}
          <Card>
            <CardHeader>
              <CardTitle>부서별 이슈</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {isClient && (
                <BarChart 
                  data={issuesByDepartmentData}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* 이슈 해결 우수자 */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>이슈 해결 우수자</CardTitle>
            <FiAward className="text-yellow-500 text-xl" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {STATIC_DATA.topResolvers.map((resolver) => (
                <div key={resolver.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <div className="font-medium">{resolver.name}</div>
                    <div className="text-sm text-gray-500">{resolver.position} • {resolver.department}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{resolver.resolvedCount}건</div>
                    <div className="text-sm text-gray-500">{resolver.resolutionPercentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* 최근 이슈 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>최근 이슈</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {STATIC_DATA.recentIssues.map(issue => (
                <div key={issue.id} className="border-b pb-2 last:border-0">
                  <div className="flex justify-between">
                    <span className="font-medium">{issue.title}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusStyle(issue.status)}`}>
                      {getStatusText(issue.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {issue.department} • 
                    <span className={`ml-2 ${getPriorityStyle(issue.priority)}`}>
                      {getPriorityText(issue.priority)}
                    </span>
                    <span className="ml-2">• {formatDate(issue.createdAt)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    담당: {issue.assignee.name} | 생성: {issue.creator.name}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* 부서별 이슈 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>부서별 이슈 분포</CardTitle>
            <FiTrendingUp className="text-blue-500 text-xl" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(STATIC_DATA.issuesByDepartment).map(([dept, count], idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span>{dept}</span>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full" 
                        style={{ width: `${(count / STATIC_DATA.issueSummary.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
} 