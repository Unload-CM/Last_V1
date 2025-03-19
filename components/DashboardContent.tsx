'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '../utils/i18n';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { FiAward, FiTrendingUp, FiAlertCircle, FiCheckCircle, FiClock, FiList } from 'react-icons/fi';

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

export default function DashboardContent() {
  const { t } = useTranslation();
  
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
  
  // 데이터 로드
  useEffect(() => {
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
        
      } catch (err) {
        console.error('대시보드 데이터 로드 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
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
  
  // 상태 레이블
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN':
        return '열림';
      case 'IN_PROGRESS':
        return '진행 중';
      case 'RESOLVED':
        return '해결됨';
      case 'CLOSED':
        return '종료';
      default:
        return status;
    }
  };
  
  // 우선순위 레이블
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return '심각';
      case 'HIGH':
        return '높음';
      case 'MEDIUM':
        return '중간';
      case 'LOW':
        return '낮음';
      default:
        return priority;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">대시보드</h1>
      
      {/* 이슈 해결 우수자 */}
      <div className="card">
        <h2 className="text-lg font-medium mb-4 flex items-center">
          <FiAward className="mr-2 text-yellow-500" />
          이슈 해결 우수 관리자
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {topResolvers.map((resolver, index) => (
            <div key={resolver.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mr-2">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-medium">{resolver.name}</h3>
                  <p className="text-sm text-gray-500">{resolver.department}</p>
                </div>
              </div>
              <div className="mt-2">
                <div className="text-sm">
                  <span className="font-medium">{resolver.resolvedCount}건</span> 해결
                </div>
                <div className="text-xs text-gray-500">
                  전체의 {Math.round(resolver.resolutionPercentage)}%
                </div>
              </div>
            </div>
          ))}
          {topResolvers.length === 0 && (
            <div className="col-span-5 text-center py-4 text-gray-500">
              데이터가 없습니다
            </div>
          )}
        </div>
      </div>
      
      {/* 이슈 요약 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">미해결 이슈</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{issueSummary.open}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiClock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">진행 중 이슈</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{issueSummary.inProgress}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">해결된 이슈</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{issueSummary.resolved}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiList className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">전체 이슈</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{issueSummary.total}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 차트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">카테고리별 이슈</h2>
          <div className="h-64">
            <Pie data={issuesByCategoryData} />
          </div>
        </div>
        
        <div className="card bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">부서별 이슈</h2>
          <div className="h-64">
            <Bar 
              data={issuesByDepartmentData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>
      </div>
      
      {/* 최근 이슈 */}
      <div className="card bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium mb-4">최근 이슈</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  우선순위
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  담당자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  생성일
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {issue.issueId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {issue.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusStyle(issue.status)}`}>
                      {getStatusLabel(issue.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityStyle(issue.priority)}`}>
                      {getPriorityLabel(issue.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {issue.assignee.name} ({issue.assignee.department})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(issue.createdAt)}
                  </td>
                </tr>
              ))}
              {recentIssues.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    최근 이슈가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}