import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * 이슈 상태 목록 조회 API
 * GET /api/settings/statuses
 */
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

// 샘플 상태 데이터
const SAMPLE_STATUSES = [
  { id: 1, name: 'OPEN', label: '열림', thaiLabel: 'เปิด', color: '#FF0000' },
  { id: 2, name: 'IN_PROGRESS', label: '진행중', thaiLabel: 'กำลังดำเนินการ', color: '#FFFF00' },
  { id: 3, name: 'RESOLVED', label: '해결됨', thaiLabel: 'แก้ไขแล้ว', color: '#00FF00' },
  { id: 4, name: 'CLOSED', label: '종료', thaiLabel: 'ปิดแล้ว', color: '#808080' }
];

export async function GET() {
  try {
    try {
      // 데이터베이스에서 상태 조회 시도
      const statuses = await prisma.status.findMany();
      
      // 상태가 있으면 실제 데이터 반환
      if (statuses && statuses.length > 0) {
        return NextResponse.json(statuses);
      } else {
        // 상태가 없으면 샘플 데이터 반환
        console.log('상태 데이터가 없어 샘플 데이터 반환');
        return NextResponse.json(SAMPLE_STATUSES);
      }
    } catch (dbError) {
      // 데이터베이스 오류 시 샘플 데이터 반환
      console.error('상태 데이터 조회 중 DB 오류:', dbError);
      return NextResponse.json(SAMPLE_STATUSES);
    }
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return NextResponse.json({ error: '상태 목록을 가져오는데 실패했습니다.' }, { status: 500 });
  }
} 