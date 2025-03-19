import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 이슈 해결 우수자 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 기간 파라미터 추출
    const period = searchParams.get('period') || 'month'; // month, week, year
    const limit = parseInt(searchParams.get('limit') || '5'); // 기본 5명
    const positionFilter = searchParams.get('position') || ''; // 직책 필터 (관리자/사원)
    
    // 기간에 따른 시작일 계산
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    // 직책 필터 조건 추가
    const positionCondition = positionFilter ? `AND e.position = ${positionFilter === '관리자' ? "'관리자'" : "'사원'"}` : '';
    
    // 해결된 이슈 수를 기준으로 사원 목록 조회
    const topResolvers = await (prisma as any).$queryRaw`
      SELECT 
        e.id,
        e."employeeId",
        e.name,
        e.position,
        e.department,
        COUNT(i.id) as resolved_count,
        COUNT(i.id) * 100.0 / (
          SELECT COUNT(*) FROM "Issue" 
          WHERE "status" = 'RESOLVED' 
          AND "resolvedAt" >= ${startDate}
        ) as resolution_percentage
      FROM "Employee" e
      JOIN "Issue" i ON e.id = i."assigneeId"
      WHERE i."status" = 'RESOLVED'
        AND i."resolvedAt" >= ${startDate}
        ${positionFilter ? `AND e.position = ${positionFilter === '관리자' ? "'관리자'" : "'사원'"}` : ''}
      GROUP BY e.id, e."employeeId", e.name, e.position, e.department
      ORDER BY resolved_count DESC
      LIMIT ${limit}
    `;
    
    return NextResponse.json({
      period,
      position: positionFilter,
      topResolvers: topResolvers.map((resolver: any) => ({
        id: resolver.id,
        employeeId: resolver.employeeId,
        name: resolver.name,
        position: resolver.position,
        department: resolver.department,
        resolvedCount: parseInt(resolver.resolved_count),
        resolutionPercentage: parseFloat(resolver.resolution_percentage),
      })),
    });
  } catch (error: any) {
    console.error('이슈 해결 우수자 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '이슈 해결 우수자 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 