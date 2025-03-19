import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * 이슈 우선순위 목록 조회 API
 * GET /api/settings/priorities
 */
export async function GET(request: NextRequest) {
  try {
    const priorities = await prisma.priority.findMany({
      select: {
        id: true,
        name: true,
        label: true,
        thaiLabel: true,
        description: true,
        thaiDescription: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    return NextResponse.json(priorities);
  } catch (error) {
    console.error('Error fetching priorities:', error);
    return NextResponse.json(
      { error: '우선순위 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 