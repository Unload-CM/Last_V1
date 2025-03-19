import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { translateCategory, getCategoryKey } from '@/lib/i18n';
import { convertKoreanToEnglishKey, createTranslationEntry } from '../../../lib/utils/translation-helper';

// 기본 카테고리 데이터
const DEFAULT_CATEGORIES = [
  { id: 1, name: '설비', label: 'equipment', description: '설비 관련 이슈' },
  { id: 2, name: '원자재', label: 'raw_material', description: '원자재 관련 이슈' },
  { id: 3, name: '관리', label: 'management', description: '관리 관련 이슈' },
];

/**
 * 카테고리 목록 조회 API
 * GET /api/categories
 */
export async function GET(req: NextRequest) {
  try {
    console.log('카테고리 목록 조회 API 호출됨');
    
    // 데이터베이스에서 카테고리 목록 조회
    try {
      const categories = await prisma.category.findMany();
      
      console.log('조회된 카테고리 목록:', categories);
      
      if (categories.length === 0) {
        console.log('카테고리 데이터가 없어 기본 데이터 반환');
        return NextResponse.json({ 
          categories: DEFAULT_CATEGORIES,
          message: '카테고리 데이터가 없어 기본 데이터를 반환합니다.'
        });
      }
      
      return NextResponse.json({ categories });
    } catch (dbError) {
      console.error('데이터베이스 조회 오류:', dbError);
      // 데이터베이스 오류 시 기본 데이터 사용
      return NextResponse.json({ 
        categories: DEFAULT_CATEGORIES,
        message: '데이터베이스 오류로 기본 데이터를 반환합니다.'
      });
    }
  } catch (error) {
    console.error('카테고리 목록 조회 중 오류 발생:', error);
    return NextResponse.json(
      { 
        error: '카테고리 목록을 불러오는 중 오류가 발생했습니다.', 
        categories: DEFAULT_CATEGORIES,
        message: '오류가 발생하여 기본 데이터를 반환합니다.'
      },
      { status: 500 }
    );
  }
}

/**
 * 새 카테고리 생성 API
 * POST /api/categories
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('카테고리 생성 요청 데이터:', data);
    
    // 이미 존재하는 카테고리인지 확인 (한글/태국어 이름으로 확인)
    const existingCategory = await prisma.category.findUnique({
      where: { name: data.name }
    });
    
    if (existingCategory) {
      return NextResponse.json({ error: '이미 존재하는 카테고리입니다.' }, { status: 400 });
    }
    
    // 카테고리 생성
    const category = await prisma.category.create({
      data: {
        name: data.name,    // 한글/태국어 이름
        label: data.label,  // 영문 키
        description: data.description || null
      }
    });
    
    console.log('생성된 카테고리:', category);
    
    // 번역 데이터 추가
    try {
      // 카테고리 이름 번역 저장
      await prisma.translation.create({
        data: {
          key: data.label, // 카테고리 접두사 없이 label 값만 사용
          language: 'ko', // 나중에 언어 감지로 변경 가능
          translation: data.name,
          category: 'category'
        }
      });
      console.log('번역 추가 완료:', data.label, '->', data.name);
      
      // 설명이 있으면 설명도 번역 저장
      if (data.description) {
        await prisma.translation.create({
          data: {
            key: `${data.label}_description`, // 설명은 구분을 위해 _description 접미사
            language: 'ko', // 나중에 언어 감지로 변경 가능
            translation: data.description,
            category: 'category_description'
          }
        });
        console.log('설명 번역 추가 완료:', `${data.label}_description`, '->', data.description);
      }
    } catch (translationError) {
      console.error('번역 데이터 추가 중 오류:', translationError);
      // 번역 추가 실패해도 카테고리 생성은 계속 진행
    }
    
    return NextResponse.json({
      success: true,
      message: '카테고리가 성공적으로 생성되었습니다.',
      category
    });
  } catch (error) {
    console.error('카테고리 생성 중 오류 발생:', error);
    return NextResponse.json({ error: '카테고리 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

/**
 * 카테고리 삭제 API
 * DELETE /api/categories
 * 단일 또는 다중 카테고리 삭제 지원
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
        { error: '삭제할 카테고리 ID가 지정되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    // 유효하지 않은 ID 확인
    const invalidIds = ids.filter(id => isNaN(id));
    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리 ID가 포함되어 있습니다.' },
        { status: 400 }
      );
    }
    
    console.log('삭제할 카테고리 ID 목록:', ids);
    
    try {
      // 여러 카테고리 삭제
      const result = await prisma.category.deleteMany({
        where: {
          id: {
            in: ids
          }
        }
      });
      
      console.log('삭제 결과:', result);
      
      return NextResponse.json({ 
        success: true, 
        message: `${result.count}개의 카테고리가 성공적으로 삭제되었습니다.`,
        deletedCount: result.count
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

/**
 * 카테고리 수정 API
 * PUT /api/categories/:id
 */
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, name, label, description } = data;
    
    // 영문 키 값 처리
    let englishKey = label || '';
    
    // label이 없는 경우 name에서 영문 키 생성
    if (!englishKey) {
      englishKey = convertKoreanToEnglishKey(name, '카테고리');
    }
    
    console.log('카테고리 수정 요청 데이터:', data);
    console.log('사용할 카테고리 키:', englishKey);
    
    // 카테고리 업데이트
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name,
        label: englishKey,
        description: description || ''
      }
    });
    
    // Translation 테이블 업데이트
    await prisma.translation.upsert({
      where: {
        key_language: {
          key: englishKey,
          language: 'ko'
        }
      },
      update: {
        translation: name
      },
      create: {
        key: englishKey,
        language: 'ko',
        translation: name,
        category: 'category'
      }
    });
    
    if (description) {
      await prisma.translation.upsert({
        where: {
          key_language: {
            key: `${englishKey}_description`,
            language: 'ko'
          }
        },
        update: {
          translation: description
        },
        create: {
          key: `${englishKey}_description`,
          language: 'ko',
          translation: description,
          category: 'category_description'
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: '카테고리가 성공적으로 수정되었습니다.',
      category
    });
  } catch (error) {
    console.error('카테고리 수정 중 오류:', error);
    return NextResponse.json(
      { error: '카테고리 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 