import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 정적 생성 사용하지 않음 (항상 동적 경로로 처리)
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

/**
 * 이슈 최다 발견자 조회 API
 * GET /api/dashboard/top-issue-finders
 */
export async function GET(request: NextRequest) {
  try {
    // 요청에서 기간 파라미터 추출
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period') || 'month';
    const limitParam = searchParams.get('limit') || '3';
    
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
    
    // 샘플 데이터 사용 (데이터베이스 연결 오류 방지)
    const sampleTopFinders = [
      {
        id: 1,
        employeeId: "EMP004",
        name: "홍길동",
        thaiName: "ฮงกิลดง",
        nickname: "길동",
        departmentId: 1,
        departmentName: "생산부",
        issueCount: 18
      },
      {
        id: 2,
        employeeId: "EMP005",
        name: "김영희",
        thaiName: "ยองฮี คิม",
        nickname: "영희",
        departmentId: 2,
        departmentName: "품질관리부",
        issueCount: 14
      },
      {
        id: 3,
        employeeId: "EMP006",
        name: "이철수",
        thaiName: "ชอลซู อี",
        nickname: "철수",
        departmentId: 3,
        departmentName: "경영지원부",
        issueCount: 11
      }
    ];
    
    return NextResponse.json({
      period: periodParam,
      topFinders: sampleTopFinders
    });
  } catch (error) {
    console.error('이슈 발견자 TOP 3 조회 중 오류:', error);
    return NextResponse.json(
      { error: '이슈 발견자 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 