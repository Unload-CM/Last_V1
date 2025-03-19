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
    const updatedPriority = await prisma.priority.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json(updatedPriority);
  } catch (error) {
    console.error('우선순위 업데이트 중 오류:', error);
    return NextResponse.json(
      { error: '우선순위 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
} 