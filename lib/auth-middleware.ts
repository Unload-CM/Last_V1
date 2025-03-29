import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * API 요청에 대한 인증 검사 미들웨어
 * @param req NextRequest 객체
 * @param requireAuth 인증이 필요한지 여부
 * @param requireSpecialAccess 특별 권한이 필요한지 여부
 */
export async function apiAuthMiddleware(
  req: NextRequest,
  requireAuth = true,
  requireSpecialAccess = false
) {
  try {
    // 인증 토큰 확인
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // 인증이 필요하고 토큰이 없는 경우
    if (requireAuth && !token) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 특별 권한이 필요한 경우 사용자 권한 확인
    if (requireSpecialAccess && token) {
      // 토큰에서 isAdmin 값 확인
      if (!token.isAdmin) {
        return NextResponse.json(
          { error: '이 작업을 수행할 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    // 인증 성공, 정상 처리 진행
    return null;
  } catch (error) {
    console.error('API 인증 미들웨어 오류:', error);
    return NextResponse.json(
      { error: '인증 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 특정 API 경로가 권한이 필요한 경로인지 확인
 * @param pathname API 경로
 */
export function isRestrictedApiPath(pathname: string): boolean {
  // 직원 관리 관련 API 경로
  if (
    pathname.startsWith('/api/employees') ||
    pathname.startsWith('/api/employee')
  ) {
    return true;
  }

  // 설정 관련 API 경로
  if (
    pathname.startsWith('/api/settings') ||
    pathname.startsWith('/api/status') ||
    pathname.startsWith('/api/statuses') ||
    pathname.startsWith('/api/priority') ||
    pathname.startsWith('/api/priorities') ||
    pathname.startsWith('/api/category') ||
    pathname.startsWith('/api/categories') ||
    pathname.startsWith('/api/department') ||
    pathname.startsWith('/api/departments')
  ) {
    return true;
  }

  return false;
} 