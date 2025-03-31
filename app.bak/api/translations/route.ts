import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { invalidateCache } from '@/lib/i18n/dynamic-translator';

// 임시 번역 데이터 저장소
const translationsStore: any[] = [
  { id: 1, key: 'greeting', language: 'ko', translation: '안녕하세요', category: 'common' },
  { id: 2, key: 'greeting', language: 'th', translation: 'สวัสดี', category: 'common' },
  { id: 3, key: 'save', language: 'ko', translation: '저장', category: 'actions' },
  { id: 4, key: 'save', language: 'th', translation: 'บันทึก', category: 'actions' }
];

// 다음 ID 값 유지
let nextId = translationsStore.length + 1;

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
    
    // 검색 조건에 맞는 번역 필터링
    let translations = [...translationsStore];
    
    if (language) {
      translations = translations.filter(t => t.language === language);
    }
    
    if (category) {
      translations = translations.filter(t => t.category === category);
    }
    
    if (key) {
      translations = translations.filter(t => t.key.includes(key));
    }
    
    // 정렬
    translations.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      if (a.key !== b.key) return a.key.localeCompare(b.key);
      return a.language.localeCompare(b.language);
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
    
    // 중복 체크
    const exists = translationsStore.some(
      t => t.key === data.key && t.language === data.language && t.category === data.category
    );
    
    if (exists) {
      return NextResponse.json(
        { error: '이미 존재하는 번역입니다.' },
        { status: 400 }
      );
    }
    
    // 번역 추가
    const translation = {
      id: nextId++,
      key: data.key,
      language: data.language,
      translation: data.translation,
      category: data.category
    };
    
    translationsStore.push(translation);
    
    // 캐시 무효화
    await invalidateCache();
    
    return NextResponse.json({
      success: true,
      message: '번역이 성공적으로 추가되었습니다.',
      translation
    });
  } catch (error: any) {
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
    
    // 번역 찾기
    const index = translationsStore.findIndex(t => t.id === data.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: '해당 번역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 번역 업데이트
    translationsStore[index].translation = data.translation;
    const translation = translationsStore[index];
    
    // 캐시 무효화
    await invalidateCache();
    
    return NextResponse.json({
      success: true,
      message: '번역이 성공적으로 수정되었습니다.',
      translation
    });
  } catch (error: any) {
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
    const idParam = url.searchParams.get('id');
    
    if (!idParam) {
      return NextResponse.json(
        { error: '삭제할 번역 ID가 지정되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    const id = parseInt(idParam);
    
    // 번역 찾기
    const index = translationsStore.findIndex(t => t.id === id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: '해당 번역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 번역 삭제
    translationsStore.splice(index, 1);
    
    // 캐시 무효화
    await invalidateCache();
    
    return NextResponse.json({
      success: true,
      message: '번역이 성공적으로 삭제되었습니다.'
    });
  } catch (error: any) {
    console.error('번역 삭제 중 오류:', error);
    return NextResponse.json(
      { error: '번역을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 