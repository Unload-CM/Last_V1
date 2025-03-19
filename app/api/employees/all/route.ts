import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * 모든 사원 삭제 API
 * DELETE /api/employees/all
 * 관리자 권한 필요
 */
export async function DELETE(req: NextRequest) {
  try {
    // 여기에 관리자 권한 검증 로직을 추가할 수 있습니다.
    // 예: 토큰 검증, 세션 확인 등
    
    // 모든 사원 삭제
    await (prisma as any).employee.deleteMany({});
    
    return NextResponse.json({ 
      success: true, 
      message: '모든 사원이 성공적으로 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('모든 사원 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { error: '모든 사원을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 