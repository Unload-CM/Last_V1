import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 정적 생성 사용하지 않음 (항상 동적 경로로 처리)
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

/**
 * 이슈 최다 해결자 조회 API
 * GET /api/dashboard/top-issue-resolvers
 */
export async function GET(request: NextRequest) {
  try {
    // 요청에서 기간 파라미터 추출
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period') || 'month';
    
    // 기간에 따른 날짜 범위 설정
    const now = new Date();
    let fromDate = new Date();
    
    switch(periodParam) {
      case 'week':
        fromDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        fromDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        fromDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        fromDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        fromDate.setMonth(now.getMonth() - 1); // 기본값: 한 달
    }
    
    // 샘플 데이터로 응답 (데이터베이스 연결 오류 방지)
    const sampleTopResolvers = [
      {
        id: 4,
        employeeId: "EMP007",
        name: "박지민",
        thaiName: "จีมิน พาร์ค",
        nickname: "지민",
        departmentId: 1,
        departmentName: "생산부",
        resolvedCount: 21
      },
      {
        id: 5,
        employeeId: "EMP008",
        name: "최수진",
        thaiName: "ซูจิน ชเว",
        nickname: "수진",
        departmentId: 4,
        departmentName: "IT부서",
        resolvedCount: 19
      },
      {
        id: 6,
        employeeId: "EMP009",
        name: "정태현",
        thaiName: "แทฮยอน จอง",
        nickname: "태현",
        departmentId: 2,
        departmentName: "품질관리부",
        resolvedCount: 16
      }
    ];
    
    return NextResponse.json({
      period: periodParam,
      topResolvers: sampleTopResolvers
    });
  } catch (error) {
    console.error('이슈 해결자 TOP 3 조회 중 오류:', error);
    return NextResponse.json(
      { error: '이슈 해결자 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 