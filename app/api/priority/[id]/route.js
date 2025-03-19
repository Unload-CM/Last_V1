import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { convertKoreanToEnglishKey, createTranslationEntry } from '../../../../lib/utils/translation-helper';

export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 ID입니다.' },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { name, label, description } = data;

    // 한글 입력을 영문 키값으로 변환
    const englishKey = convertKoreanToEnglishKey(name, '우선순위');
    
    // Priority 테이블 업데이트
    const priority = await prisma.priority.update({
      where: { id },
      data: {
        name: englishKey,
        label: label || name,
        description: description || ''
      }
    });

    // Translation 테이블 업데이트
    await prisma.translation.upsert({
      where: {
        key_language: {
          key: `priority.${englishKey}`,
          language: 'ko'
        }
      },
      update: {
        translation: name
      },
      create: {
        key: `priority.${englishKey}`,
        language: 'ko',
        translation: name,
        category: 'priority'
      }
    });

    if (description) {
      await prisma.translation.upsert({
        where: {
          key_language: {
            key: `priority.${englishKey}.description`,
            language: 'ko'
          }
        },
        update: {
          translation: description
        },
        create: {
          key: `priority.${englishKey}.description`,
          language: 'ko',
          translation: description,
          category: 'priority_description'
        }
      });
    }

    return NextResponse.json(priority);
  } catch (error) {
    console.error('우선순위 수정 중 오류:', error);
    return NextResponse.json(
      { error: '우선순위 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 ID입니다.' },
        { status: 400 }
      );
    }

    // 우선순위 삭제
    const priority = await prisma.priority.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true, 
      message: '우선순위가 성공적으로 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('우선순위 삭제 중 오류:', error);
    return NextResponse.json(
      { error: '우선순위 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 