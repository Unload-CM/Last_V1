import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('카테고리 데이터 조회 중 오류:', error);
    return NextResponse.json({ error: '카테고리 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
} 