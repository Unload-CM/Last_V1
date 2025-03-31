import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Toaster } from '@/components/ui/toaster';

// 기본 레이아웃 컴포넌트
export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // 클라이언트 측 렌더링 확인
  useEffect(() => {
    setMounted(true);
  }, []);

  // 로그인 상태가 아니고 로그인 페이지가 아닌 경우 로그인 페이지로 리디렉션
  useEffect(() => {
    if (mounted && status === 'unauthenticated' && router.pathname !== '/login' && router.pathname !== '/') {
      router.push('/login');
    }
  }, [mounted, status, router]);

  // 로그인 페이지 또는 메인 페이지인 경우 네비게이션 바 없이 렌더링
  if (router.pathname === '/login' || router.pathname === '/') {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 바 */}
      {status === 'authenticated' && (
        <nav className="bg-white shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                    공장 관리 시스템
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                  <Link 
                    href="/dashboard" 
                    className={`${router.pathname === '/dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-900 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}
                  >
                    대시보드
                  </Link>
                  <Link 
                    href="/issues" 
                    className={`${router.pathname.startsWith('/issues') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-900 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}
                  >
                    이슈
                  </Link>
                  <Link 
                    href="/employees" 
                    className={`${router.pathname.startsWith('/employees') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-900 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}
                  >
                    직원
                  </Link>
                  <Link 
                    href="/settings" 
                    className={`${router.pathname.startsWith('/settings') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-900 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}
                  >
                    설정
                  </Link>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <div className="text-sm font-medium text-gray-700">
                  {session?.user?.name || '사용자'}
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* 메인 콘텐츠 */}
      <main className="py-4">
        {children}
      </main>

      <Toaster />
    </div>
  );
} 