import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { convertToEnglishKey } from '@/lib/i18n/translations';

// 기본 부서 데이터 (영어 키 사용)
const DEFAULT_DEPARTMENTS = [
  { id: 1, name: 'production', description: '제품 생산 담당' },
  { id: 2, name: 'quality', description: '품질 검사 및 관리 담당' },
  { id: 3, name: 'logistics', description: '물류 및 재고 관리 담당' },
  { id: 4, name: 'materials', description: '자재 조달 및 관리 담당' },
  { id: 5, name: 'engineering', description: '연구 개발 담당' },
  { id: 6, name: 'management', description: '경영 관리 담당' }
];

/**
 * 부서 목록 조회 API
 * GET /api/departments
 */
export async function GET(request: NextRequest) {
  try {
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        label: true,
        thaiLabel: true,
        description: true,
        thaiDescription: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // 디버깅: thaiLabel이 있는 부서 확인
    console.log('부서 목록 API 호출됨');
    departments.forEach(dept => {
      console.log(`부서 ${dept.id} ${dept.name}: label=${dept.label}, thaiLabel=${dept.thaiLabel || 'null'}`);
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: '부서 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 새 부서 생성 API
 * POST /api/departments
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('부서 생성 요청 데이터:', data);
    
    // 필수 필드 검증
    if (!data.label) {
      return NextResponse.json({ error: '부서 이름은 필수 항목입니다.' }, { status: 400 });
    }
    
    // 한글 이름을 영어 키로 변환
    const departmentKey = convertToEnglishKey(data.label, 'department');
    
    console.log('사용할 부서 키:', departmentKey);
    
    // 이미 존재하는 부서인지 확인
    try {
      const existingDepartment = await prisma.department.findFirst({
        where: { 
          OR: [
            { name: departmentKey },
            { label: data.label }
          ]
        }
      });
      
      if (existingDepartment) {
        return NextResponse.json({ error: '이미 존재하는 부서입니다.' }, { status: 400 });
      }
      
      // 부서 생성
      const department = await prisma.department.create({
        data: {
          name: departmentKey, // 영어 키를 name에 저장
          label: data.label, // 원래 입력된 이름을 label에 저장
          description: data.description || ''
        }
      });
      
      console.log('생성된 부서:', department);
      
      return NextResponse.json({
        success: true,
        message: '부서가 성공적으로 생성되었습니다.',
        department: department
      });
    } catch (dbError) {
      console.error('데이터베이스 오류:', dbError);
      return NextResponse.json({ error: '부서 생성 중 데이터베이스 오류가 발생했습니다.' }, { status: 500 });
    }
  } catch (error) {
    console.error('부서 생성 중 오류 발생:', error);
    return NextResponse.json({ error: '부서 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * 부서 삭제 API
 * DELETE /api/departments
 * 단일 또는 다중 부서 삭제 지원
 */
export async function DELETE(req: NextRequest) {
  try {
    let ids: number[] = [];
    
    // URL에서 ids 쿼리 파라미터 가져오기
    const url = new URL(req.url);
    const idsParam = url.searchParams.get('ids');
    
    if (idsParam) {
      // 쉼표로 구분된 ID 문자열을 배열로 변환하고 숫자로 파싱
      ids = idsParam.split(',').map(id => parseInt(id.trim()));
    } else {
      // 요청 본문에서 ids 배열 가져오기 (Prisma Studio 지원)
      try {
        const body = await req.json();
        console.log('DELETE 요청 본문:', body);
        
        if (body && body.ids && Array.isArray(body.ids)) {
          ids = body.ids;
        } else if (body && typeof body.id === 'number') {
          // 단일 ID가 있는 경우 (Prisma Studio에서 단일 레코드 삭제 시)
          ids = [body.id];
        } else if (body && Array.isArray(body)) {
          // Prisma Studio에서 여러 레코드 삭제 시 ID 배열이 직접 전송될 수 있음
          ids = body.map(item => typeof item === 'number' ? item : item.id);
        }
      } catch (e) {
        // 요청 본문이 없거나 파싱할 수 없는 경우 무시
        console.log('요청 본문 파싱 실패:', e);
      }
    }
    
    // ids가 비어있는 경우 오류 반환
    if (ids.length === 0) {
      return NextResponse.json(
        { error: '삭제할 부서 ID가 지정되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    // 유효하지 않은 ID 확인
    const invalidIds = ids.filter(id => isNaN(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: '유효하지 않은 부서 ID가 포함되어 있습니다.' },
        { status: 400 }
      );
    }
    
    console.log('삭제할 부서 ID 목록:', ids);
    
    try {
      // 여러 부서 삭제
      const result = await prisma.department.deleteMany({
        where: {
          id: {
            in: ids
          }
        }
      });
      
      console.log('삭제 결과:', result);
      
      return NextResponse.json({ 
        success: true, 
        message: `${result.count}개의 부서가 성공적으로 삭제되었습니다.`,
        deletedCount: result.count
      });
    } catch (dbError) {
      console.error('데이터베이스 오류:', dbError);
      return NextResponse.json(
        { error: '부서를 삭제하는 중 데이터베이스 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('부서 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { error: '부서를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    const department = await prisma.department.update({
      where: { id: parseInt(id) },
      data
    });
    return NextResponse.json({ department });
  } catch (error) {
    console.error('부서 정보 수정 중 오류:', error);
    return NextResponse.json({ error: '부서 정보 수정에 실패했습니다.' }, { status: 500 });
  }
} 