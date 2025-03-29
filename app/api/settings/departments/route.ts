import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 정적 생성 사용하지 않음 (항상 동적 경로로 처리)
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

// 샘플 부서 데이터
const SAMPLE_DEPARTMENTS = [
  { id: 1, name: 'production', label: '생산부', thaiLabel: 'ฝ่ายผลิต', description: '제품 생산 담당 부서' },
  { id: 2, name: 'quality', label: '품질관리부', thaiLabel: 'ฝ่ายควบคุมคุณภาพ', description: '품질 검사 및 관리 담당 부서' },
  { id: 3, name: 'facility', label: '시설관리부', thaiLabel: 'ฝ่ายบริหารสิ่งอำนวยความสะดวก', description: '공장 시설 관리 담당 부서' },
  { id: 4, name: 'hr', label: '인사부', thaiLabel: 'ฝ่ายทรัพยากรบุคคล', description: '인사 관리 담당 부서' },
  { id: 5, name: 'logistics', label: '물류부', thaiLabel: 'ฝ่ายโลจิสติกส์', description: '물류 및 재고 관리 담당 부서' }
];

export async function GET() {
  try {
    try {
      // 데이터베이스에서 부서 조회 시도
      const departments = await prisma.department.findMany();
      
      // 부서가 있으면 실제 데이터 반환
      if (departments && departments.length > 0) {
        return NextResponse.json(departments);
      } else {
        // 부서가 없으면 샘플 데이터 반환
        console.log('부서 데이터가 없어 샘플 데이터 반환');
        return NextResponse.json(SAMPLE_DEPARTMENTS);
      }
    } catch (dbError) {
      // 데이터베이스 오류 시 샘플 데이터 반환
      console.error('부서 데이터 조회 중 DB 오류:', dbError);
      return NextResponse.json(SAMPLE_DEPARTMENTS);
    }
  } catch (error) {
    console.error('부서 데이터 조회 중 오류:', error);
    return NextResponse.json({ error: '부서 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
} 