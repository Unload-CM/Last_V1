import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { convertToEnglishKey } from '@/lib/i18n/translations';

/**
 * 부서 목록 조회 API
 * GET /api/department
 */
export async function GET(request: NextRequest) {
  try {
    console.log('부서 목록 조회 API 호출됨');
    
    // URL에서 language 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ko';
    
    const departments = await prisma.department.findMany({
      orderBy: { id: 'asc' }
    });
    
    // 언어에 따라 적절한 라벨과 설명 선택
    const processedDepartments = departments.map(dept => ({
      ...dept,
      label: language === 'th' ? dept.thaiLabel || dept.label : dept.label,
      description: language === 'th' ? dept.thaiDescription || dept.description : dept.description
    }));
    
    console.log('조회된 부서 목록:', processedDepartments);
    
    return NextResponse.json({
      departments: processedDepartments
    });
  } catch (error) {
    console.error('부서 목록 조회 중 오류:', error);
    return NextResponse.json(
      { error: '부서 목록을 불러오는데 실패했습니다.' }, 
      { status: 500 }
    );
  }
}

/**
 * 새 부서 생성 API
 * POST /api/department
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('부서 생성 요청 데이터:', body);

    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { 
          success: false,
          error: '이름은 필수 입력 항목입니다.' 
        },
        { status: 400 }
      );
    }

    // 이미 존재하는 부서인지 확인
    const existingDepartment = await prisma.department.findFirst({
      where: {
        OR: [
          { name: convertToEnglishKey(name, 'department') },
          { label: name }
        ]
      }
    });

    if (existingDepartment) {
      return NextResponse.json(
        { 
          success: false,
          error: '이미 존재하는 부서입니다.' 
        },
        { status: 400 }
      );
    }

    // 새 부서 생성
    const newDepartment = await prisma.department.create({
      data: {
        name: convertToEnglishKey(name, 'department'),
        label: name,
        description: description || null,
      }
    });

    console.log('생성된 부서:', newDepartment);

    return NextResponse.json({
      success: true,
      department: newDepartment,
      message: '부서가 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    console.error('부서 생성 중 오류:', error);
    return NextResponse.json(
      { error: '부서 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 부서 수정 API
 * PUT /api/department
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description } = body;
    
    if (!id || !name) {
      return NextResponse.json(
        { 
          success: false,
          error: 'ID와 이름은 필수 항목입니다.' 
        },
        { status: 400 }
      );
    }
    
    // 변경할 데이터만 추출
    const updateData: any = {
      name: convertToEnglishKey(name, 'department'),
      label: name,
      description: description || null
    };
    
    console.log('부서 업데이트 데이터:', updateData);
    
    // 부서 정보 업데이트
    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    return NextResponse.json({
      department,
      message: '부서가 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('부서 업데이트 중 오류:', error);
    return NextResponse.json(
      { error: '부서 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 부서 삭제 API
 * DELETE /api/department
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID는 필수 항목입니다.' },
        { status: 400 }
      );
    }
    
    await prisma.department.delete({
      where: { id: parseInt(id) },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('부서 삭제 중 오류:', error);
    return NextResponse.json(
      { error: '부서 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
} 