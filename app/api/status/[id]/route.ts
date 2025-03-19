import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

/**
 * 상태 수정 API
 * PUT /api/status/:id
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: '유효하지 않은 상태 ID입니다.' },
        { status: 400 }
      );
    }
    
    const data = await req.json();
    console.log('상태 수정 요청 데이터:', data);
    
    // 필수 필드 검증
    if (!data.name || !data.label) {
      return NextResponse.json(
        { error: '상태 이름과 라벨은 필수입니다.' },
        { status: 400 }
      );
    }
    
    try {
      // 중복 확인 (자기 자신 제외)
      const existingStatus = await prisma.status.findFirst({
        where: {
          name: data.name.toUpperCase(),
          id: { not: parseInt(id) }
        }
      });
      
      if (existingStatus) {
        return NextResponse.json(
          { error: '이미 존재하는 상태 이름입니다.' },
          { status: 400 }
        );
      }
      
      // 상태 수정
      const updatedStatus = await prisma.status.update({
        where: { id: parseInt(id) },
        data: {
          name: data.name.toUpperCase(),
          label: data.label,
          description: data.description || null
        }
      });
      
      console.log('수정된 상태:', updatedStatus);
      
      return NextResponse.json({ 
        success: true, 
        message: '상태가 성공적으로 수정되었습니다.',
        status: updatedStatus 
      });
    } catch (dbError) {
      console.error('데이터베이스 오류:', dbError);
      return NextResponse.json(
        { error: '상태를 수정하는 중 데이터베이스 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('상태 수정 중 오류 발생:', error);
    return NextResponse.json(
      { error: '상태를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 상태 삭제 API
 * DELETE /api/status/:id
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: '유효하지 않은 상태 ID입니다.' },
        { status: 400 }
      );
    }
    
    try {
      // 상태 삭제
      await prisma.status.delete({
        where: { id: parseInt(id) }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: '상태가 성공적으로 삭제되었습니다.' 
      });
    } catch (dbError) {
      console.error('데이터베이스 오류:', dbError);
      return NextResponse.json(
        { error: '상태를 삭제하는 중 데이터베이스 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('상태 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { error: '상태를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 