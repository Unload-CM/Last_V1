import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { textToCodeSync } from '@/utils/textToCode';

// 한글 이름을 영문 키로 변환하는 함수
function convertToEnglishKey(name: string): string {
  // 기본적인 한글-영문 매핑
  const koreanToEnglish: { [key: string]: string } = {
    '열림': 'open',
    '진행 중': 'in_progress',
    '해결됨': 'resolved',
    '종료': 'closed',
    '포기': 'abandoned',
    '완벽함': 'perfection'
  };

  // 매핑된 값이 있으면 사용, 없으면 영문 변환 로직 적용
  return koreanToEnglish[name] || 
    name.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, ''); // 영문자, 숫자, 언더스코어만 허용
}

/**
 * 상태 목록 조회 API
 * GET /api/status
 */
export async function GET(request: NextRequest) {
  try {
    console.log('상태 목록 조회 API 호출됨');
    
    const statuses = await prisma.status.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log('조회된 상태 목록:', statuses);
    
    return NextResponse.json({
      statuses: statuses
    });
  } catch (error) {
    console.error('상태 목록 조회 중 오류:', error);
    return NextResponse.json(
      { error: '상태 목록을 불러오는데 실패했습니다.' }, 
      { status: 500 }
    );
  }
}

/**
 * 새 상태 생성 API
 * POST /api/status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('상태 생성 요청 데이터:', body);

    // 필수 필드 검증
    if (!body.name) {
      return NextResponse.json(
        { error: '이름은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // 이미 존재하는 상태인지 확인
    const existingStatus = await prisma.status.findFirst({
      where: {
        OR: [
          { name: convertToEnglishKey(body.name) },
          { label: body.name }
        ]
      }
    });

    if (existingStatus) {
      return NextResponse.json(
        { error: '이미 존재하는 상태입니다.' },
        { status: 400 }
      );
    }

    // 새 상태 생성
    const newStatus = await prisma.status.create({
      data: {
        name: convertToEnglishKey(body.name),  // 시스템에서 사용할 영문 키
        label: body.name,                      // 표시될 한글 라벨
        description: body.description || '',
      }
    });

    console.log('생성된 상태:', newStatus);

    return NextResponse.json({
      status: newStatus,
      message: '상태가 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    console.error('상태 생성 중 오류:', error);
    return NextResponse.json(
      { error: '상태 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 상태 삭제 API
 * DELETE /api/status
 * 단일 또는 다중 상태 삭제 지원
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
    
    await prisma.status.delete({
      where: { id: parseInt(id) },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('상태 삭제 중 오류:', error);
    return NextResponse.json(
      { error: '상태 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 상태 수정 API
 * PUT /api/status
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, label, description } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: '상태 ID는 필수 항목입니다.' },
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
    
    console.log('상태 업데이트 데이터:', updateData);
    
    // 상태 정보 업데이트
    const status = await prisma.status.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    return NextResponse.json({
      status,
      message: '상태가 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('상태 업데이트 중 오류:', error);
    return NextResponse.json(
      { error: '상태 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
} 