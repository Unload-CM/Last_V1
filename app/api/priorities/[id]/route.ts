import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

/**
 * 우선순위 수정 API
 * PUT /api/priorities/:id
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: '유효하지 않은 우선순위 ID입니다.' },
        { status: 400 }
      );
    }
    
    const data = await req.json();
    console.log('우선순위 수정 요청 데이터:', data);
    
    // 필수 필드 검증
    if (!data.name || !data.label) {
      return NextResponse.json(
        { error: '우선순위 이름과 라벨은 필수입니다.' },
        { status: 400 }
      );
    }
    
    try {
      // 중복 확인 (자기 자신 제외)
      const existingPriority = await prisma.priority.findFirst({
        where: {
          name: data.name.toUpperCase(),
          id: { not: parseInt(id) }
        }
      });
      
      if (existingPriority) {
        return NextResponse.json(
          { error: '이미 존재하는 우선순위 이름입니다.' },
          { status: 400 }
        );
      }
      
      // 우선순위 수정
      const updatedPriority = await prisma.priority.update({
        where: { id: parseInt(id) },
        data: {
          name: data.name.toUpperCase(),
          label: data.label,
          description: data.description || null
        }
      });
      
      console.log('수정된 우선순위:', updatedPriority);
      
      return NextResponse.json({ 
        success: true, 
        message: '우선순위가 성공적으로 수정되었습니다.',
        priority: updatedPriority 
      });
    } catch (dbError) {
      console.error('데이터베이스 오류:', dbError);
      return NextResponse.json(
        { error: '우선순위를 수정하는 중 데이터베이스 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('우선순위 수정 중 오류 발생:', error);
    return NextResponse.json(
      { error: '우선순위를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 우선순위 삭제 API
 * DELETE /api/priorities/:id
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: '유효하지 않은 우선순위 ID입니다.' },
        { status: 400 }
      );
    }
    
    try {
      // 우선순위 삭제
      await prisma.priority.delete({
        where: { id: parseInt(id) }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: '우선순위가 성공적으로 삭제되었습니다.' 
      });
    } catch (dbError) {
      console.error('데이터베이스 오류:', dbError);
      return NextResponse.json(
        { error: '우선순위를 삭제하는 중 데이터베이스 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('우선순위 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { error: '우선순위를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 