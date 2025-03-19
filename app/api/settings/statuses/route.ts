import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * 이슈 상태 목록 조회 API
 * GET /api/settings/statuses
 */
export async function GET(request: NextRequest) {
  try {
    const statuses = await prisma.status.findMany({
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

    return NextResponse.json(statuses);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return NextResponse.json(
      { error: '상태 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 