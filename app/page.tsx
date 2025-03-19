'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
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
  CalendarClock,
  BarChart2,
  PieChart as PieChartIcon,
  ArrowRight
} from 'lucide-react';

// 색상 배열
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function Dashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('대시보드 데이터를 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('대시보드 데이터 로딩 중 오류:', error);
        toast.error('대시보드 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Navigation />
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-primary border-r-transparent align-middle"></div>
          <p className="mt-2">대시보드 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto py-6">
        <Navigation />
        <div className="text-center py-10">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <p className="mt-2">대시보드 데이터를 불러오는데 실패했습니다.</p>
        </div>
      </div>
    );
  }

  // 차트에 사용할 데이터 형식으로 변환
  const statusData = dashboardData.statusDistribution.map((item: any) => ({
    name: item.name,
    value: item.count,
  }));

  const priorityData = dashboardData.priorityDistribution.map((item: any) => ({
    name: item.name,
    value: item.count,
  }));

  const departmentData = dashboardData.departmentDistribution.map((item: any) => ({
    name: item.name,
    value: item.count,
  }));

  const monthlyData = dashboardData.monthlyIssueCreation.map((item: any) => ({
    name: `${item.month}월`,
    이슈: item.count,
  }));

  return (
    <div className="container mx-auto py-6">
      <Navigation />
      
      <div className="grid gap-6 mt-6">
        <h1 className="text-3xl font-bold">대시보드</h1>
        
        {/* 통계 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                전체 이슈
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalIssues}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                미해결 이슈
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.statusDistribution.find((s: any) => s.name === '미해결')?.count || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                진행중 이슈
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.statusDistribution.find((s: any) => s.name === '진행중')?.count || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                해결된 이슈
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.statusDistribution.find((s: any) => s.name === '해결됨')?.count || 0}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 월별 이슈 생성 추이 */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="h-5 w-5 mr-2" />
                월별 이슈 생성 추이
              </CardTitle>
              <CardDescription>
                월별 이슈 생성 수를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="이슈" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* 상태별 이슈 분포 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
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
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* 우선순위별 이슈 분포 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
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
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {priorityData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 부서별 이슈 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              부서별 이슈 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="이슈 수" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* 최근 이슈 및 마감일 임박 이슈 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 최근 생성된 이슈 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                최근 생성된 이슈
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.recentIssues.length > 0 ? (
                  dashboardData.recentIssues.map((issue: any) => (
                    <div key={issue.id} className="border-b pb-2">
                      <Link 
                        href={`/issues/${issue.id}`}
                        className="font-medium hover:underline block"
                      >
                        {issue.title}
                      </Link>
                      <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
                        <div>{issue.department.label}</div>
                        <div>{format(new Date(issue.createdAt), 'yyyy-MM-dd', { locale: ko })}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    최근 생성된 이슈가 없습니다.
                  </div>
                )}
                
                {dashboardData.recentIssues.length > 0 && (
                  <div className="pt-2">
                    <Link
                      href="/issues"
                      className="inline-flex items-center text-sm text-primary hover:underline"
                    >
                      모든 이슈 보기
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* 마감일 임박 이슈 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarClock className="h-5 w-5 mr-2" />
                마감일 임박 이슈
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.upcomingDueIssues.length > 0 ? (
                  dashboardData.upcomingDueIssues.map((issue: any) => (
                    <div key={issue.id} className="border-b pb-2">
                      <Link 
                        href={`/issues/${issue.id}`}
                        className="font-medium hover:underline block"
                      >
                        {issue.title}
                      </Link>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <div className="text-muted-foreground">{issue.department.label}</div>
                        <div className="text-red-500 font-medium">
                          마감일: {format(new Date(issue.dueDate), 'yyyy-MM-dd', { locale: ko })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    마감일 임박한 이슈가 없습니다.
                  </div>
                )}
                
                {dashboardData.upcomingDueIssues.length > 0 && (
                  <div className="pt-2">
                    <Link
                      href="/issues"
                      className="inline-flex items-center text-sm text-primary hover:underline"
                    >
                      모든 이슈 보기
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
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