import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { convertKoreanToEnglishKey } from '../../../../lib/utils/translation-helper';

/**
 * 카테고리 수정 API
 * PUT /api/categories/:id
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리 ID입니다.' },
        { status: 400 }
      );
    }

    const data = await req.json();
    console.log('카테고리 수정 요청 데이터:', data);
    
    // 필수 필드 검증
    if (!data.name) {
      return NextResponse.json(
        { error: '카테고리 이름은 필수입니다.' },
        { status: 400 }
      );
    }
    
    // 영문 키 값 처리
    let englishKey = data.label || '';
    
    // label이 없는 경우 name에서 영문 키 생성
    if (!englishKey) {
      englishKey = convertKoreanToEnglishKey(data.name, '카테고리');
    }
    
    console.log('사용할 카테고리 키:', englishKey);

    // 카테고리 수정
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        label: englishKey,
        description: data.description || null
      }
    });

    console.log('수정된 카테고리:', category);

    return NextResponse.json({ 
      success: true, 
      message: '카테고리가 성공적으로 수정되었습니다.',
      category
    });
  } catch (error) {
    console.error('카테고리 수정 중 오류 발생:', error);
    return NextResponse.json(
      { error: '카테고리를 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 카테고리 삭제 API
 * DELETE /api/categories/:id
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리 ID입니다.' },
        { status: 400 }
      );
    }
    
    try {
      // 카테고리 삭제
      await prisma.category.delete({
        where: { id }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: '카테고리가 성공적으로 삭제되었습니다.' 
      });
    } catch (dbError) {
      console.error('데이터베이스 오류:', dbError);
      return NextResponse.json(
        { error: '카테고리를 삭제하는 중 데이터베이스 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('카테고리 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { error: '카테고리를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 