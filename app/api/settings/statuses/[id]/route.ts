import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    // 업데이트할 필드만 추출
    const { label, description } = body;
    const updateData: { label?: string; description?: string } = {};
    
    if (label !== undefined) updateData.label = label;
    if (description !== undefined) updateData.description = description;
    
    // 데이터 업데이트
    const updatedStatus = await prisma.status.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json(updatedStatus);
  } catch (error) {
    console.error('상태 업데이트 중 오류:', error);
    return NextResponse.json(
      { error: '상태 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
} 