"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { CheckCircle, Medal, Trophy, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from "@/store/languageStore";

interface TopIssueResolver {
  id: number;
  koreanName: string;
  thaiName: string | null;
  nickname: string | null;
  departmentName: string;
  resolvedCount: number;
  score?: number; // 가중치 점수
  rank: number; // API에서 제공하는 공동 순위 정보
}

interface TopIssueResolversProps {
  data?: TopIssueResolver[];
  isLoading?: boolean;
}

// 메달 색상 정의
const medalColors = [
  "text-yellow-500", // 금메달 (1위)
  "text-gray-400",   // 은메달 (2위)
  "text-orange-600"  // 동메달 (3위) - 더 선명한 주황색으로 변경
];

// 배경 색상 정의
const bgColors = [
  "bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-yellow-300", // 1위 - 더 진한 배경과 두꺼운 테두리
  "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200",                // 2위
  "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200"           // 3위 - 더 분명한 주황색 배경
];

// 바 차트 색상
const barColors = ["#FFD700", "#C0C0C0", "#FF8C00"];

export default function TopIssueResolvers({ data = [], isLoading = false }: TopIssueResolversProps) {
  const { t } = useTranslation();
  
  // 차트 데이터 준비
  const chartData = data.map((resolver) => ({
    name: resolver.koreanName,
    fullName: resolver.koreanName + (resolver.thaiName ? ` (${resolver.thaiName})` : ''),
    resolvedCount: resolver.resolvedCount,
    rank: resolver.rank
  }));

  // X축 틱 값 계산
  const maxResolved = Math.max(...data.map(r => r.resolvedCount), 0);
  const tickValues = Array.from({ length: maxResolved + 1 }, (_, i) => i); // 0부터 최대값까지의 정수 배열

  return (
    <Card className="border-2 border-blue-200 bg-white shadow-sm overflow-hidden">
      <CardHeader className="bg-blue-50 border-b border-blue-100 py-2 px-3">
        <CardTitle className="flex items-center gap-2 text-blue-700 text-sm">
          <Trophy className="h-4 w-4 text-yellow-500" /> {t('dashboard.topIssueResolvers')}
        </CardTitle>
        <CardDescription className="text-xs">{t('dashboard.topIssueResolverDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        {isLoading ? (
          <div className="py-2 text-center text-gray-500 text-sm">{t('common.loading')}</div>
        ) : data.length === 0 ? (
          <div className="py-2 text-center text-gray-500 text-sm">{t('common.noIssuesFound')}</div>
        ) :
          <>
            {/* 바 차트 */}
            <div className="h-36 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <XAxis 
                    type="number" 
                    domain={[0, maxResolved]} 
                    ticks={tickValues} 
                    allowDecimals={false} 
                  />
                  <YAxis 
                    type="category" 
                    dataKey="fullName" 
                    tick={{ fontSize: 10 }}
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}`, t('dashboard.resolvedCount')]}
                    labelFormatter={(value) => `${value}`}
                  />
                  <Bar 
                    dataKey="resolvedCount" 
                    name={t('dashboard.resolvedCount')}
                    fill="#8884d8"
                    shape={(props) => {
                      const { x, y, width, height, index } = props;
                      const dataItem = chartData[index];
                      const rankIndex = dataItem?.rank ? dataItem.rank - 1 : index;
                      // 1,2,3위에 맞는 색상 선택 (공동 순위 고려)
                      const colorIndex = Math.min(rankIndex, barColors.length - 1);
                      
                      return (
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={barColors[colorIndex]}
                          rx={4}
                          ry={4}
                        />
                      );
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* 랭킹 카드 - 공동 순위 지원 */}
            <div className="space-y-2">
              {data.map((resolver, index) => {
                // 공동 순위에 맞는 스타일 선택
                const rankIndex = resolver.rank - 1;
                const medalColor = medalColors[Math.min(rankIndex, medalColors.length - 1)];
                const bgColor = bgColors[Math.min(rankIndex, bgColors.length - 1)];
                
                return (
                  <div 
                    key={resolver.id} 
                    className={`flex items-center justify-between p-2 rounded-lg border ${bgColor} transition-all text-sm`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar className="h-8 w-8 border border-gray-200">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-bold">
                            {resolver.koreanName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {/* 공동 순위에 맞는 메달 표시 */}
                        {resolver.rank <= 3 && (
                          <Medal className={`absolute -top-1 -right-1 h-4 w-4 ${medalColor} drop-shadow-sm`} />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 text-xs">
                          {resolver.koreanName}
                          {resolver.thaiName && ` (${resolver.thaiName})`}
                        </div>
                        <div className="text-xs text-gray-500">{resolver.departmentName}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 bg-blue-50 py-1 px-2 rounded-full text-xs font-medium text-blue-600">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{resolver.resolvedCount} {t('dashboard.issues')}</span>
                      </div>
                      {/* 점수 표시 */}
                      <div className="flex items-center gap-1 bg-amber-50 py-1 px-2 rounded-full text-xs font-medium text-amber-600">
                        <Star className="h-3 w-3 text-amber-500" />
                        <span>{resolver.score || 0} {t('dashboard.points')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        }
      </CardContent>
    </Card>
  );
} 