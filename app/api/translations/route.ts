import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { invalidateCache } from '@/lib/i18n/dynamic-translator';

/**
 * 번역 목록 조회 API
 * GET /api/translations
 */
export async function GET(req: NextRequest) {
  try {
    console.log('번역 목록 조회 API 호출됨');
    
    // 쿼리 파라미터 처리
    const url = new URL(req.url);
    const language = url.searchParams.get('language');
    const category = url.searchParams.get('category');
    const key = url.searchParams.get('key');
    
    // 검색 조건 구성
    const where: any = {};
    
    if (language) {
      where.language = language;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (key) {
      where.key = {
        contains: key
      };
    }
    
    // 데이터베이스에서 번역 조회
    const translations = await prisma.translation.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
        { language: 'asc' }
      ]
    });
    
    console.log(`${translations.length}개의 번역 데이터 조회됨`);
    
    return NextResponse.json({ translations });
  } catch (error) {
    console.error('번역 목록 조회 중 오류:', error);
    return NextResponse.json(
      { error: '번역 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 번역 추가/수정 API
 * POST /api/translations
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.key || !data.language || !data.translation || !data.category) {
      return NextResponse.json(
        { error: '키, 언어, 번역, 카테고리는 필수 항목입니다.' },
        { status: 400 }
      );
    }
    
    // 번역 추가
    const translation = await prisma.translation.create({
      data: {
        key: data.key,
        language: data.language,
        translation: data.translation,
        category: data.category
      }
    });
    
    // 캐시 무효화
    await invalidateCache();
    
    return NextResponse.json({
      success: true,
      message: '번역이 성공적으로 추가되었습니다.',
      translation
    });
  } catch (error: any) {
    // 고유 제약 조건 위반 (중복 키) 처리
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '이미 존재하는 번역입니다.' },
        { status: 400 }
      );
    }
    
    console.error('번역 추가 중 오류:', error);
    return NextResponse.json(
      { error: '번역을 추가하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 번역 수정 API
 * PUT /api/translations
 */
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.id || !data.translation) {
      return NextResponse.json(
        { error: 'ID와 번역 내용은 필수 항목입니다.' },
        { status: 400 }
      );
    }
    
    // 번역 업데이트
    const translation = await prisma.translation.update({
      where: { id: data.id },
      data: { translation: data.translation }
    });
    
    // 캐시 무효화
    await invalidateCache();
    
    return NextResponse.json({
      success: true,
      message: '번역이 성공적으로 수정되었습니다.',
      translation
    });
  } catch (error: any) {
    // 레코드를 찾을 수 없는 경우 처리
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '해당 번역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    console.error('번역 수정 중 오류:', error);
    return NextResponse.json(
      { error: '번역을 수정하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 번역 삭제 API
 * DELETE /api/translations
 */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: '삭제할 번역 ID가 지정되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    // 번역 삭제
    await prisma.translation.delete({
      where: { id: parseInt(id) }
    });
    
    // 캐시 무효화
    await invalidateCache();
    
    return NextResponse.json({
      success: true,
      message: '번역이 성공적으로 삭제되었습니다.'
    });
  } catch (error: any) {
    // 레코드를 찾을 수 없는 경우 처리
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '해당 번역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    console.error('번역 삭제 중 오류:', error);
    return NextResponse.json(
      { error: '번역을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 