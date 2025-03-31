/**
 * 우선순위 삭제 API
 * DELETE /api/priority
 * 단일 또는 다중 우선순위 삭제 지원
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 한글 이름을 영문 키로 변환하는 함수
function convertToEnglishKey(name: string): string {
  // 기본적인 한글-영문 매핑
  const koreanToEnglish: { [key: string]: string } = {
    '심각': 'critical',
    '높음': 'high',
    '중간': 'medium',
    '낮음': 'low'
  };

  // 매핑된 값이 있으면 사용, 없으면 영문 변환 로직 적용
  return koreanToEnglish[name] || 
    name.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
}

/**
 * 우선순위 목록을 조회하는 API 엔드포인트
 */
export async function GET(request: NextRequest) {
  try {
    console.log('우선순위 목록 조회 API 호출됨');
    
    const priorities = await prisma.priority.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log('조회된 우선순위 목록:', priorities);
    
    return NextResponse.json({
      priorities: priorities
    });
  } catch (error) {
    console.error('우선순위 목록 조회 중 오류:', error);
    return NextResponse.json(
      { error: '우선순위 목록을 불러오는데 실패했습니다.' }, 
      { status: 500 }
    );
  }
}

/**
 * 새 우선순위 생성 API
 * POST /api/priority
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('우선순위 생성 요청 데이터:', body);

    // 필수 필드 검증
    if (!body.name) {
      return NextResponse.json(
        { error: '이름은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // 이미 존재하는 우선순위인지 확인
    const existingPriority = await prisma.priority.findFirst({
      where: {
        OR: [
          { name: convertToEnglishKey(body.name) },
          { label: body.name }
        ]
      }
    });

    if (existingPriority) {
      return NextResponse.json(
        { error: '이미 존재하는 우선순위입니다.' },
        { status: 400 }
      );
    }

    // 새 우선순위 생성
    const newPriority = await prisma.priority.create({
      data: {
        name: convertToEnglishKey(body.name),  // 시스템에서 사용할 영문 키
        label: body.name,                      // 표시될 한글 라벨
        description: body.description || '',
      }
    });

    console.log('생성된 우선순위:', newPriority);

    return NextResponse.json({
      priority: newPriority,
      message: '우선순위가 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    console.error('우선순위 생성 중 오류:', error);
    return NextResponse.json(
      { error: '우선순위 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 우선순위 수정 API
 * PUT /api/priority
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, label, description } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: '우선순위 ID는 필수 항목입니다.' },
        { status: 400 }
      );
    }
    
    // 변경할 데이터만 추출
    const updateData: any = {};
    
    // 라벨이 변경된 경우, 영문 코드로 변환하여 name 필드에 저장
    if (label !== undefined) {
      updateData.label = label;  // 원본 한글 라벨 저장
      updateData.name = convertToEnglishKey(label);  // 영문 코드로 변환하여 저장
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }
    
    console.log('우선순위 업데이트 데이터:', updateData);
    
    // 우선순위 정보 업데이트
    const priority = await prisma.priority.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    return NextResponse.json({
      priority,
      message: '우선순위가 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('우선순위 업데이트 중 오류:', error);
    return NextResponse.json(
      { error: '우선순위 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 우선순위 삭제 API
 * DELETE /api/priority
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
    
    await prisma.priority.delete({
      where: { id: parseInt(id) },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('우선순위 삭제 중 오류:', error);
    return NextResponse.json(
      { error: '우선순위 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
} 