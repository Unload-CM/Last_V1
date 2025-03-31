import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

/**
 * 우선순위 목록 조회 API
 * GET /api/priorities
 */
export async function GET(req: NextRequest) {
  try {
    console.log('우선순위 목록 조회 API 호출됨');
    
    // 데이터베이스에서 우선순위 목록 조회
    const priorities = await prisma.priority.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log('조회된 우선순위 목록:', priorities);
    
    return NextResponse.json({ priorities });
  } catch (error) {
    console.error('우선순위 목록 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '우선순위 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 새 우선순위 생성 API
 * POST /api/priorities
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('우선순위 생성 요청 데이터:', data);
    
    // 필수 필드 검증
    if (!data.name || !data.label) {
      return NextResponse.json(
        { error: '우선순위 이름과 라벨은 필수입니다.' },
        { status: 400 }
      );
    }
    
    try {
      // 중복 확인
      const existingPriority = await prisma.priority.findUnique({
        where: { name: data.name.toUpperCase() }
      });
      
      if (existingPriority) {
        return NextResponse.json(
          { error: '이미 존재하는 우선순위 이름입니다.' },
          { status: 400 }
        );
      }
      
      // 우선순위 생성
      const newPriority = await prisma.priority.create({
        data: {
          name: data.name.toUpperCase(),
          label: data.label,
          description: data.description || null
        }
      });
      
      console.log('생성된 우선순위:', newPriority);
      
      return NextResponse.json({ 
        success: true, 
        message: '우선순위가 성공적으로 생성되었습니다.',
        priority: newPriority 
      }, { status: 201 });
    } catch (dbError) {
      console.error('데이터베이스 오류:', dbError);
      return NextResponse.json(
        { error: '우선순위를 생성하는 중 데이터베이스 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('우선순위 생성 중 오류 발생:', error);
    return NextResponse.json(
      { error: '우선순위를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 우선순위 삭제 API
 * DELETE /api/priorities/:id
 */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop();
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: '유효하지 않은 우선순위 ID입니다.' },
        { status: 400 }
      );
    }
    
    try {
      // 우선순위 삭제
      await prisma.priority.delete({
        where: { id: parseInt(id) }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: '우선순위가 성공적으로 삭제되었습니다.' 
      });
    } catch (dbError) {
      console.error('데이터베이스 오류:', dbError);
      return NextResponse.json(
        { error: '우선순위를 삭제하는 중 데이터베이스 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('우선순위 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { error: '우선순위를 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 