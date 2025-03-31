import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 서버리스 배포를 위한 설정
export const dynamic = 'force-dynamic';

/**
 * 다음 직원 ID 생성 API
 * GET /api/next-employee-id
 */
export async function GET(request: NextRequest) {
  try {
    // 데이터베이스 연결 오류 대비 샘플 데이터
    const sampleEmployeeId = 'EMP' + Math.floor(Math.random() * 900 + 100).toString();
    
    try {
      // 가장 최근 직원 ID 조회 시도
      const latestEmployee = await prisma.employee.findFirst({
        orderBy: {
          id: 'desc'
        },
        select: {
          employeeId: true
        }
      });
      
      if (latestEmployee) {
        // 기존 직원 ID 형식 (예: EMP001, EMP002 등)에서 숫자 부분 추출
        const currentIdMatch = latestEmployee.employeeId.match(/EMP(\d+)/);
        
        if (currentIdMatch && currentIdMatch[1]) {
          // 숫자 부분 증가시키기
          const currentNumber = parseInt(currentIdMatch[1], 10);
          const nextNumber = currentNumber + 1;
          
          // 숫자 부분을 3자리로 유지 (예: 001, 002, ...)
          const paddedNumber = nextNumber.toString().padStart(3, '0');
          
          // 새 직원 ID 생성
          const nextEmployeeId = `EMP${paddedNumber}`;
          
          return NextResponse.json({ nextEmployeeId });
        }
      }
      
      // 직원 정보가 없거나 ID 형식이 다른 경우 기본값 사용
      return NextResponse.json({ nextEmployeeId: 'EMP001' });
      
    } catch (dbError) {
      // 데이터베이스 오류 발생 시 샘플 데이터 반환
      console.error('다음 직원 ID 생성 중 오류:', dbError);
      return NextResponse.json({ nextEmployeeId: sampleEmployeeId });
    }
  } catch (error) {
    console.error('다음 직원 ID 생성 중 오류:', error);
    return NextResponse.json(
      { error: '다음 직원 ID를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 