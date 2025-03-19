import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 태국어 문구 목록 조회
export async function GET() {
  try {
    const phrases = await prisma.thaiPhrase.findMany({
      include: {
        tags: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(phrases);
  } catch (error) {
    console.error('태국어 문구 조회 중 오류:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อความได้' }, // 문구를 불러올 수 없습니다
      { status: 500 }
    );
  }
}

// 새로운 태국어 문구 추가
export async function POST(request: Request) {
  try {
    const { text, tags } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'กรุณาใส่ข้อความ' }, // 문구를 입력해주세요
        { status: 400 }
      );
    }

    // 태그 처리
    const tagObjects = await Promise.all(
      tags.map(async (tagName: string) => {
        return await prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        });
      })
    );

    // 문구 생성
    const phrase = await prisma.thaiPhrase.create({
      data: {
        text,
        tags: {
          connect: tagObjects.map(tag => ({ id: tag.id }))
        }
      },
      include: {
        tags: true
      }
    });

    return NextResponse.json(phrase);
  } catch (error) {
    console.error('태국어 문구 생성 중 오류:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถบันทึกข้อความได้' }, // 문구를 저장할 수 없습니다
      { status: 500 }
    );
  }
} 