import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { apiAuthMiddleware, isRestrictedApiPath } from './lib/auth-middleware';
import prisma from './lib/prisma';

// 로그인이 필요 없는 공개 경로 목록
const publicPaths = [
  '/admin-login',
  '/api/auth/signin',
  '/api/auth/callback',
  '/api/auth/signout',
  '/api/auth/session',
  '/api/auth/csrf',
];

// 특별 권한이 필요한 경로 목록
const restrictedPaths = [
  '/employees',
  '/settings',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일 경로는 무시
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/uploads')
  ) {
    return NextResponse.next();
  }

  // API 경로 처리
  if (pathname.startsWith('/api/')) {
    // auth 관련 API는 무시
    if (pathname.startsWith('/api/auth/')) {
      return NextResponse.next();
    }
    
    // 제한된 API 경로인지 확인
    const needsSpecialAccess = isRestrictedApiPath(pathname);
    
    // API 인증 미들웨어 적용
    const authResult = await apiAuthMiddleware(
      request, 
      true, // 항상 인증 필요
      needsSpecialAccess // 특별 권한 필요 여부
    );
    
    // 인증 실패한 경우 인증 미들웨어의 응답 반환
    if (authResult) {
      return authResult;
    }
    
    // 인증 성공한 경우 계속 진행
    return NextResponse.next();
  }

  // 공개 경로 체크
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 인증 토큰 확인
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!token) {
    const url = new URL('/admin-login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // 제한된 경로 체크 - 특정 사용자만 접근 가능
  const isRestrictedPath = restrictedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isRestrictedPath) {
    // DB 검사 대신 토큰의 isAdmin 값을 사용
    if (!token.isAdmin) {
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }
  }

  // 인증된 사용자는 정상적으로 페이지 접근 허용
  return NextResponse.next();
}

// 미들웨어 설정
export const config = {
  matcher: [
    /*
     * 모든 경로에 대해 매칭 (제외 경로: /api/auth, 정적 파일)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}; 