import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * 다음 사원 ID를 생성하는 함수
 * 형식: EMP + 5자리 숫자 (예: EMP00001)
 */
async function generateNextEmployeeId(): Promise<string> {
  try {
    const lastEmployee = await prisma.employee.findFirst({
      orderBy: {
        employeeId: 'desc'
      },
      where: {
        employeeId: {
          startsWith: 'EMP'
        }
      }
    });

    if (!lastEmployee) {
      return 'EMP00001';
    }

    // EMP로 시작하는 ID인지 확인
    if (!lastEmployee.employeeId.startsWith('EMP')) {
      return 'EMP00001';
    }

    try {
      const lastNumber = parseInt(lastEmployee.employeeId.slice(3));
      const nextNumber = lastNumber + 1;
      return `EMP${nextNumber.toString().padStart(5, '0')}`;
    } catch (error) {
      console.error('직원 ID 파싱 오류:', error);
      return 'EMP00001';
    }
  } catch (error) {
    console.error('다음 직원 ID 생성 중 오류:', error);
    return 'EMP00001';
  }
}

/**
 * 다음 사원 ID 생성 API
 * GET /api/next-employee-id
 */
export async function GET(request: NextRequest) {
  try {
    const nextId = await generateNextEmployeeId();
    return NextResponse.json({ nextId });
  } catch (error) {
    console.error('다음 직원 ID 생성 중 오류:', error);
    return NextResponse.json(
      { error: '다음 직원 ID를 생성하는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 