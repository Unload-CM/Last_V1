import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 정적 배포에서는 최소한의 미들웨어만 사용
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 클라이언트 사이드 리디렉션만 처리
  // 인증이 필요한 페이지는 클라이언트 사이드에서 처리하도록 함
  
  // 루트 페이지 접근 시 로그인 페이지로 리디렉션
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// 미들웨어 설정 - 최소한의 패턴만 매칭
export const config = {
  matcher: [
    // 루트 경로만 처리
    '/'
  ],
}; 