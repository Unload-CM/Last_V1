import { useTranslation } from 'react-i18next';
import { MONTHS } from '../constants/months';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2 } from 'lucide-react';

export default async function MobileDashboard() {
  const { t, i18n } = useTranslation();
  const language = cookies().get('language')?.value || 'en';
  
  // 현재 날짜 기준으로 이번 달의 시작일과 현재 날짜를 구합니다
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  // API를 통해 대시보드 데이터를 가져옵니다
  const response = await fetch(`/api/dashboard?from=${startOfMonth.toISOString()}&to=${endOfDay.toISOString()}&lang=${language}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to load dashboard data');
  }

  const dashboardData = await response.json();

  const monthlyData = dashboardData.monthlyIssueCreation ? 
    dashboardData.monthlyIssueCreation.map((item: any) => ({
      name: MONTHS[language as keyof typeof MONTHS][item.month - 1],
      issues: item.count,
    }))
  : [];

  return (
    <div className="container mx-auto py-1">
      <div className="grid gap-2 mt-1">
        <Card className="w-full md:col-span-2 shadow-sm">
          <CardHeader className="px-4 py-3">
            <CardTitle className="flex items-center text-lg">
              <BarChart2 className="h-5 w-5 mr-2" />
              {language === 'ko' ? '월별 이슈 생성' :
               language === 'th' ? 'การสร้างปัญหารายเดือน' :
               'Monthly Issue Creation'}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="name" />
                  <YAxis 
                    allowDecimals={false}
                    domain={[0, (dataMax: number) => Math.ceil(dataMax)]}
                    ticks={Array.from({ length: Math.ceil(Math.max(...monthlyData.map(item => item.issues))) + 1 }, (_, i) => i)}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="issues" 
                    name={language === 'ko' ? '이슈 수' :
                         language === 'th' ? 'จำนวนปัญหา' :
                         'Issues Count'} 
                    fill="#8884d8" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 