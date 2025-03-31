import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 정적 생성 사용하지 않음 (항상 동적 경로로 처리)
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

/**
 * 현재 로그인한 사용자 정보 조회 API
 * GET /api/employees/me
 */
export async function GET(request: NextRequest) {
  try {
    // 세션에서 사용자 정보 가져오기
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // 사용자 ID 가져오기
    const userId = parseInt(session.user.id);

    // 데이터베이스에서 사용자 정보 조회
    const employee = await prisma.employee.findUnique({
      where: {
        id: userId
      },
      include: {
        department: true
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 비밀번호 필드 제외하고 응답
    const { password, ...employeeWithoutPassword } = employee;

    return NextResponse.json(employeeWithoutPassword);
  } catch (error) {
    console.error('사용자 정보 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '사용자 정보를 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 