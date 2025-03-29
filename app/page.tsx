'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { toast } from 'sonner';
import Link from 'next/link';
import { AlertCircle, Briefcase, Clock, BarChart2, PieChart as PieChartIcon } from 'lucide-react';

// 색상 배열
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function HomePage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 사용자 인증 확인 (세션 확인)
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        setIsAuthenticated(!!data?.user);
      } catch (error) {
        console.error('세션 확인 중 오류:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      // 인증된 사용자만 대시보드 데이터 로드
      const fetchDashboardData = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/api/dashboard');
          if (!response.ok) {
            throw new Error('데이터를 불러오는데 실패했습니다.');
          }
          const data = await response.json();
          setDashboardData(data);
        } catch (error) {
          console.error('대시보드 데이터 로드 오류:', error);
          toast.error('대시보드 데이터를 불러오는데 실패했습니다.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [isAuthenticated]);

  // 로그인 화면
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">인덕터 공장 관리 시스템</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              로그인
            </Button>
            <Button 
              onClick={() => router.push('/admin-login')}
              variant="outline"
              className="w-full"
            >
              관리자 로그인
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 로딩 화면
  if (isLoading || !dashboardData) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-primary border-r-transparent align-middle"></div>
          <p className="mt-2">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 대시보드 데이터에서 차트 데이터 추출
  const statusData = dashboardData.statusDistribution?.map((item: any) => ({
    name: item.name,
    value: item.count,
  })) || [];

  const priorityData = dashboardData.priorityDistribution?.map((item: any) => ({
    name: item.name,
    value: item.count,
  })) || [];

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>
      
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 이슈
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalIssues || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              미해결 이슈
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.openIssuesCount || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              진행중 이슈
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.inProgressIssuesCount || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              해결된 이슈
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.resolvedIssuesCount || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* 차트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <PieChartIcon className="h-5 w-5 mr-2" />
              상태별 이슈 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <PieChartIcon className="h-5 w-5 mr-2" />
              우선순위별 이슈 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 최근 이슈 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Clock className="h-5 w-5 mr-2" />
            최근 이슈
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.recentIssues && dashboardData.recentIssues.length > 0 ? (
              dashboardData.recentIssues.slice(0, 5).map((issue: any) => (
                <div key={issue.id} className="border rounded-md p-3 shadow-sm hover:shadow-md transition-shadow">
                  <Link 
                    href={`/issues/${issue.id}`}
                    className="font-medium hover:underline block"
                  >
                    {issue.title}
                  </Link>
                  <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                    <div>
                      상태: <span className="font-medium">{issue.status?.name || '미정'}</span>
                    </div>
                    <div>
                      우선순위: <span className="font-medium">{issue.priority?.name || '없음'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                최근 이슈가 없습니다
              </div>
            )}
            
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => router.push('/issues')}
            >
              모든 이슈 보기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 