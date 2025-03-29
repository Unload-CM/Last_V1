import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * 이슈 우선순위 목록 조회 API
 * GET /api/settings/priorities
 */
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

// 샘플 우선순위 데이터
const SAMPLE_PRIORITIES = [
  { id: 1, name: 'CRITICAL', label: '긴급', thaiLabel: 'วิกฤต', color: '#FF0000' },
  { id: 2, name: 'HIGH', label: '높음', thaiLabel: 'สูง', color: '#FF9900' },
  { id: 3, name: 'MEDIUM', label: '중간', thaiLabel: 'ปานกลาง', color: '#FFFF00' },
  { id: 4, name: 'LOW', label: '낮음', thaiLabel: 'ต่ำ', color: '#00FF00' }
];

export async function GET() {
  try {
    try {
      // 데이터베이스에서 우선순위 조회 시도
      const priorities = await prisma.priority.findMany();
      
      // 우선순위가 있으면 실제 데이터 반환
      if (priorities && priorities.length > 0) {
        return NextResponse.json(priorities);
      } else {
        // 우선순위가 없으면 샘플 데이터 반환
        console.log('우선순위 데이터가 없어 샘플 데이터 반환');
        return NextResponse.json(SAMPLE_PRIORITIES);
      }
    } catch (dbError) {
      // 데이터베이스 오류 시 샘플 데이터 반환
      console.error('우선순위 데이터 조회 중 DB 오류:', dbError);
      return NextResponse.json(SAMPLE_PRIORITIES);
    }
  } catch (error) {
    console.error('Error fetching priorities:', error);
    return NextResponse.json({ error: '우선순위를 가져오는데 실패했습니다.' }, { status: 500 });
  }
} 