import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { convertToEnglishKey } from '@/lib/i18n/translations';

/**
 * 카테고리 목록 조회 API
 * GET /api/category
 */
export async function GET(request: NextRequest) {
  try {
    console.log('카테고리 목록 조회 API 호출됨');
    
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        label: true,
        description: true
      }
    });
    
    console.log('조회된 카테고리 목록:', categories);
    
    return NextResponse.json({
      success: true,
      categories: categories,
      message: '카테고리 목록을 성공적으로 조회했습니다.'
    });
  } catch (error) {
    console.error('카테고리 목록 조회 중 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '카테고리 목록을 불러오는데 실패했습니다.' 
      }, 
      { status: 500 }
    );
  }
}

/**
 * 새 카테고리 생성 API
 * POST /api/category
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('카테고리 생성 요청 데이터:', body);

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

    // 이미 존재하는 카테고리인지 확인
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: convertToEnglishKey(name, 'category') },
          { label: name }
        ]
      }
    });

    if (existingCategory) {
      return NextResponse.json(
        { 
          success: false,
          error: '이미 존재하는 카테고리입니다.' 
        },
        { status: 400 }
      );
    }

    // 새 카테고리 생성
    const newCategory = await prisma.category.create({
      data: {
        name: convertToEnglishKey(name, 'category'),  // 한글 이름을 영문 키로 변환
        label: name,                                  // 원본 한글 이름
        description: description || null,
      }
    });

    console.log('생성된 카테고리:', newCategory);

    return NextResponse.json({
      success: true,
      category: newCategory,
      message: '카테고리가 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    console.error('카테고리 생성 중 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '카테고리 생성에 실패했습니다.' 
      },
      { status: 500 }
    );
  }
}

/**
 * 카테고리 수정 API
 * PUT /api/category
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
      name: convertToEnglishKey(name, 'category'),  // 한글 이름을 영문 키로 변환
      label: name,                                  // 원본 한글 이름
      description: description || null
    };
    
    console.log('카테고리 업데이트 데이터:', updateData);
    
    // 카테고리 정보 업데이트
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    return NextResponse.json({
      success: true,
      category,
      message: '카테고리가 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('카테고리 업데이트 중 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '카테고리 업데이트에 실패했습니다.' 
      },
      { status: 500 }
    );
  }
}

/**
 * 카테고리 삭제 API
 * DELETE /api/category
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { 
          success: false,
          error: '카테고리 ID는 필수 항목입니다.' 
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({
      success: true,
      message: '카테고리가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('카테고리 삭제 중 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '카테고리 삭제에 실패했습니다.' 
      },
      { status: 500 }
    );
  }
} 