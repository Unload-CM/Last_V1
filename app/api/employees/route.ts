import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 기본 부서 데이터
const DEFAULT_DEPARTMENT_ITEMS = [
  { id: 1, value: '생산부', label: '생산부', description: '제품 생산 담당' },
  { id: 2, value: '품질관리부', label: '품질관리부', description: '품질 검사 및 관리 담당' },
  { id: 3, value: '물류창고', label: '물류창고', description: '물류 및 재고 관리 담당' },
  { id: 4, value: '자재관리', label: '자재관리', description: '자재 조달 및 관리 담당' },
];

/**
 * 다음 사원 ID를 생성하는 함수
 * 형식: EMP + 5자리 숫자 (예: EMP00001)
 */
async function generateNextEmployeeId(): Promise<string> {
  const lastEmployee = await prisma.employee.findFirst({
    orderBy: {
      employeeId: 'desc'
    }
  });

  if (!lastEmployee) {
    return 'EMP00001';
  }

  const lastNumber = parseInt(lastEmployee.employeeId.slice(3));
  const nextNumber = lastNumber + 1;
  return `EMP${nextNumber.toString().padStart(5, '0')}`;
}

/**
 * 직원 목록 조회 API
 * GET /api/employees
 * Query Parameters:
 * - departmentId: 부서 ID (선택)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');

    // 검색 조건 설정
    const where = departmentId ? { departmentId: parseInt(departmentId) } : {};

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            label: true,
            thaiLabel: true
          }
        }
      },
      orderBy: {
        koreanName: 'asc'
      }
    });

    return NextResponse.json({ 
      employees,
      message: employees.length === 0 ? '등록된 직원이 없습니다.' : undefined
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: '직원 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 새 직원 등록 API
 * POST /api/employees
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const employee = await prisma.employee.create({
      data: {
        employeeId: data.employeeId,
        koreanName: data.koreanName,
        isThai: data.isThai,
        thaiName: data.thaiName,
        nickname: data.nickname,
        departmentId: parseInt(data.departmentId)
      },
      include: {
        department: true
      }
    });

    return NextResponse.json({ employee });
  } catch (error) {
    console.error('직원 생성 중 오류:', error);
    return NextResponse.json(
      { error: '직원 등록에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 직원 삭제 API
 * DELETE /api/employees
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: '직원 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 직원 삭제
    await prisma.employee.delete({
      where: { id: Number(id) }
    });
    
    return NextResponse.json({ message: '직원이 삭제되었습니다.' });
  } catch (error) {
    console.error('직원 삭제 중 오류:', error);
    return NextResponse.json(
      { error: '직원 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 직원 정보 수정 API
 * PUT /api/employees
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id,
      isThai,
      thaiName,
      nickname,
      koreanName,
      isAdmin,
      departmentId
    } = body;

    // 필수 필드 검증
    if (!koreanName || !departmentId) {
      return NextResponse.json(
        { error: '이름과 부서는 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // 부서 존재 여부 확인
    const department = await prisma.department.findUnique({
      where: { id: departmentId }
    });

    if (!department) {
      return NextResponse.json(
        { error: '존재하지 않는 부서입니다.' },
        { status: 400 }
      );
    }

    // 직원 정보 수정
    const updatedEmployee = await prisma.employee.update({
      where: { id: Number(id) },
      data: {
        isThai,
        thaiName: isThai ? thaiName : null,
        nickname: isThai ? nickname : null,
        koreanName,
        isAdmin,
        departmentId
      },
      include: {
        department: true
      }
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error('직원 수정 중 오류:', error);
    return NextResponse.json(
      { error: '직원 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
} 