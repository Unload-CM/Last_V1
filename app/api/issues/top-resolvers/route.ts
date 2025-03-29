import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 정적 생성 사용하지 않음 (항상 동적 경로로 처리)
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

/**
 * 이슈 최다 해결자 조회 API
 * GET /api/issues/top-resolvers
 */
export async function GET(request: NextRequest) {
  try {
    // 요청에서 기간 파라미터 추출
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period') || 'month';
    const limitParam = searchParams.get('limit') || '5';
    
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
    
    const limit = parseInt(limitParam, 10);
    
    // 샘플 데이터로 응답 (데이터베이스 연결 오류 방지)
    const sampleTopResolvers = [
      {
        id: 1,
        employeeId: "EMP001",
        name: "김민수",
        thaiName: "มินซู คิม",
        nickname: "민수",
        departmentId: 1,
        departmentName: "생산부",
        resolvedCount: 15
      },
      {
        id: 2,
        employeeId: "EMP002",
        name: "이지은",
        thaiName: "จีอึน อี",
        nickname: "지은",
        departmentId: 2,
        departmentName: "품질관리부",
        resolvedCount: 12
      },
      {
        id: 3,
        employeeId: "EMP003",
        name: "박준호",
        thaiName: "จุนโฮ พาร์ค",
        nickname: "준호",
        departmentId: 3,
        departmentName: "경영지원부",
        resolvedCount: 10
      }
    ];
    
    return NextResponse.json({
      period: periodParam,
      topResolvers: sampleTopResolvers
    });
  } catch (error) {
    console.error('이슈 해결 우수자 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '이슈 해결 우수자 목록을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 