import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const departments = await prisma.department.findMany();
    return NextResponse.json(departments);
  } catch (error) {
    console.error('부서 데이터 조회 중 오류:', error);
    return NextResponse.json({ error: '부서 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
} 