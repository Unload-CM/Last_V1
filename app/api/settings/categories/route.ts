import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 정적 생성 사용하지 않음 (항상 동적 경로로 처리)
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

// 샘플 카테고리 데이터
const SAMPLE_CATEGORIES = [
  { id: 1, name: 'facility', label: '시설', description: '공장 시설물 관련 이슈' },
  { id: 2, name: 'equipment', label: '장비', description: '생산 장비 관련 이슈' },
  { id: 3, name: 'safety', label: '안전', description: '안전 관련 이슈' },
  { id: 4, name: 'quality', label: '품질', description: '제품 품질 관련 이슈' },
  { id: 5, name: 'materials', label: '자재', description: '원자재 관련 이슈' },
  { id: 6, name: 'hr', label: '인사', description: '인력 관련 이슈' },
  { id: 7, name: 'other', label: '기타', description: '기타 이슈' }
];

export async function GET() {
  try {
    try {
      // 데이터베이스에서 카테고리 조회 시도
      const categories = await prisma.category.findMany();
      
      // 카테고리가 있으면 실제 데이터 반환
      if (categories && categories.length > 0) {
        return NextResponse.json(categories);
      } else {
        // 카테고리가 없으면 샘플 데이터 반환
        console.log('카테고리 데이터가 없어 샘플 데이터 반환');
        return NextResponse.json(SAMPLE_CATEGORIES);
      }
    } catch (dbError) {
      // 데이터베이스 오류 시 샘플 데이터 반환
      console.error('카테고리 데이터 조회 중 DB 오류:', dbError);
      return NextResponse.json(SAMPLE_CATEGORIES);
    }
  } catch (error) {
    console.error('카테고리 데이터 조회 중 오류:', error);
    return NextResponse.json({ error: '카테고리 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
} 