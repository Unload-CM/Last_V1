import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 특정 사원 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // ID가 숫자인 경우 (DB ID)
    if (/^\d+$/.test(id)) {
      const employee = await (prisma as any).employee.findUnique({
        where: { id: parseInt(id) },
      });
      
      if (!employee) {
        return NextResponse.json(
          { error: '해당 ID의 사원을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(employee);
    } 
    // ID가 문자열인 경우 (employeeId)
    else {
      const employee = await (prisma as any).employee.findUnique({
        where: { employeeId: id },
      });
      
      if (!employee) {
        return NextResponse.json(
          { error: '해당 ID의 사원을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(employee);
    }
  } catch (error: any) {
    console.error('사원 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '사원 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 사원 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    // 수정할 사원 찾기
    let employee;
    
    // ID가 숫자인 경우 (DB ID)
    if (/^\d+$/.test(id)) {
      employee = await (prisma as any).employee.findUnique({
        where: { id: parseInt(id) },
      });
    } 
    // ID가 문자열인 경우 (employeeId)
    else {
      employee = await (prisma as any).employee.findUnique({
        where: { employeeId: id },
      });
    }
    
    if (!employee) {
      return NextResponse.json(
        { error: '해당 ID의 사원을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 수정할 데이터 준비
    const updateData: any = {};
    
    // 수정 가능한 필드 목록
    const updatableFields = ['name', 'position', 'department', 'contact', 'email', 'hireDate'];
    
    // 제공된 필드만 업데이트
    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        if (field === 'hireDate') {
          updateData[field] = new Date(data[field]);
        } else {
          updateData[field] = data[field];
        }
      }
    }
    
    // 사원 정보 업데이트
    const updatedEmployee = await (prisma as any).employee.update({
      where: { id: employee.id },
      data: updateData,
    });
    
    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    console.error('사원 정보 수정 중 오류 발생:', error);
    
    // 중복 이메일 오류 처리
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json(
        { error: '이미 등록된 이메일 주소입니다.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '사원 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 사원 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // 삭제할 사원 찾기
    let employee;
    
    // ID가 숫자인 경우 (DB ID)
    if (/^\d+$/.test(id)) {
      employee = await (prisma as any).employee.findUnique({
        where: { id: parseInt(id) },
      });
    } 
    // ID가 문자열인 경우 (employeeId)
    else {
      employee = await (prisma as any).employee.findUnique({
        where: { employeeId: id },
      });
    }
    
    if (!employee) {
      return NextResponse.json(
        { error: '해당 ID의 사원을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 관련 이슈 확인 (이슈가 있으면 삭제 불가)
    const issueCount = await (prisma as any).issue.count({
      where: {
        OR: [
          { creatorId: employee.id },
          { assigneeId: employee.id },
        ],
      },
    });
    
    if (issueCount > 0) {
      return NextResponse.json(
        { error: '이 사원과 연결된 이슈가 있어 삭제할 수 없습니다. 먼저 관련 이슈를 다른 사원에게 재할당하세요.' },
        { status: 400 }
      );
    }
    
    // 사원 삭제
    await (prisma as any).employee.delete({
      where: { id: employee.id },
    });
    
    return NextResponse.json({ message: '사원이 성공적으로 삭제되었습니다.' });
  } catch (error: any) {
    console.error('사원 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { error: '사원 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 