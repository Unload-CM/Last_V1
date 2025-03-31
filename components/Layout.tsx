import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Toaster } from '@/components/ui/toaster';
import { FiHome, FiAlertCircle, FiUsers, FiMenu, FiSettings, FiKey, FiBook, FiLogOut } from 'react-icons/fi';
import { useTranslation } from '@/store/languageStore';

// 모바일 네비게이션 컴포넌트
const MobileNavigation = ({ isOpen, onClose, onLogout, hasMenuAccess }) => {
  const { t } = useTranslation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  // 권한이 없는 경우 클릭 핸들러
  const handleUnauthorizedClick = (e) => {
    e.preventDefault();
    alert(t('common.noPermission'));
  };

  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <>
          {/* 오버레이 */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          
          {/* 더보기 메뉴 */}
          <div
            className="fixed bottom-16 left-0 right-0 bg-white z-50 rounded-t-lg shadow-lg overflow-hidden"
          >
            <div className="py-2">
              {/* Employees 메뉴 - 관리자 권한 체크 */}
              <Link 
                href={hasMenuAccess ? "/employees" : "#"}
                className={`flex items-center px-4 py-3 ${!hasMenuAccess ? 'text-gray-400' : ''}`}
                onClick={(e) => {
                  if (!hasMenuAccess) {
                    e.preventDefault();
                    handleUnauthorizedClick(e);
                  }
                  onClose();
                }}
              >
                <FiUsers className="h-5 w-5 mr-3 text-gray-500" />
                <span>{t('nav.employees')}</span>
              </Link>

              <Link href="/change-password" className="flex items-center px-4 py-3" onClick={onClose}>
                <FiKey className="h-5 w-5 mr-3 text-gray-500" />
                <span>{t('nav.changePassword')}</span>
              </Link>

              {/* Settings 메뉴 - 관리자 권한 체크 */}
              <Link 
                href={hasMenuAccess ? "/settings" : "#"}
                className={`flex items-center px-4 py-3 ${!hasMenuAccess ? 'text-gray-400' : ''}`}
                onClick={(e) => {
                  if (!hasMenuAccess) {
                    e.preventDefault();
                    handleUnauthorizedClick(e);
                  }
                  onClose();
                }}
              >
                <FiSettings className="h-5 w-5 mr-3 text-gray-500" />
                <span>{t('nav.settings')}</span>
              </Link>

              <Link href="/manual" className="flex items-center px-4 py-3" onClick={onClose}>
                <FiBook className="h-5 w-5 mr-3 text-gray-500" />
                <span>{t('nav.userManual')}</span>
              </Link>

              <button
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                className="flex items-center w-full px-4 py-3 text-red-600 disabled:opacity-50"
              >
                <FiLogOut className="h-5 w-5 mr-3" />
                <span>{isLoggingOut ? t('common.processing') : t('nav.logout')}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* 모바일 하단 네비게이션 바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-white border-t border-gray-200 md:hidden">
        <div className="grid h-full grid-cols-3">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center ${
              router.pathname === '/dashboard' ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <FiHome className="w-6 h-6" />
            <span className="text-xs mt-1">{t('nav.dashboard')}</span>
          </Link>
          
          <Link
            href="/issues"
            className={`flex flex-col items-center justify-center ${
              router.pathname.startsWith('/issues') ? 'text-blue-500' : 'text-gray-500'
            }`}
          >
            <FiAlertCircle className="w-6 h-6" />
            <span className="text-xs mt-1">{t('nav.issues')}</span>
          </Link>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              onClose(); // 이미 열려있으면 닫기
            }}
            className="flex flex-col items-center justify-center text-gray-500"
          >
            <FiMenu className="w-6 h-6" />
            <span className="text-xs mt-1">{t('nav.more')}</span>
          </button>
        </div>
      </nav>
    </>
  );
};

// 기본 레이아웃 컴포넌트
export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

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

  // 모바일 화면 여부 체크
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // 로그아웃 처리
  const handleLogout = useCallback(async () => {
    try {
      await signOut({ callbackUrl: '/login' });
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    }
  }, []);

  // 메뉴 접근 권한 확인 (기본적으로는 관리자 권한이 필요한 메뉴인지 확인)
  const hasAdminAccess = useCallback(() => {
    // 여기서는 단순히 로그인 상태만 확인
    // 실제로는 사용자 역할이나 권한에 따라 체크해야 함
    return status === 'authenticated';
  }, [status]);

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 네비게이션 바 */}
      {status === 'authenticated' && (
        <nav className="bg-white shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                    {t('nav.title')}
                  </Link>
                </div>
                <div className="hidden md:ml-6 md:flex md:space-x-4">
                  <Link 
                    href="/dashboard" 
                    className={`${router.pathname === '/dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-900 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}
                  >
                    {t('nav.dashboard')}
                  </Link>
                  <Link 
                    href="/issues" 
                    className={`${router.pathname.startsWith('/issues') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-900 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}
                  >
                    {t('nav.issues')}
                  </Link>
                  <Link 
                    href="/employees" 
                    className={`${router.pathname.startsWith('/employees') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-900 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}
                  >
                    {t('nav.employees')}
                  </Link>
                  <Link 
                    href="/settings" 
                    className={`${router.pathname.startsWith('/settings') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-900 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}
                  >
                    {t('nav.settings')}
                  </Link>
                  <Link 
                    href="/manual" 
                    className={`${router.pathname.startsWith('/manual') ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-900 hover:text-blue-600'} px-3 py-2 text-sm font-medium`}
                  >
                    {t('nav.userManual')}
                  </Link>
                </div>
              </div>
              <div className="hidden md:ml-6 md:flex md:items-center">
                <div className="text-sm font-medium text-gray-700 flex items-center">
                  <span className="mr-3">{session?.user?.name || t('common.user')}</span>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 px-3 py-2 text-sm font-medium"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* 메인 콘텐츠 */}
      <main className={`py-4 flex-1 ${isMobile ? 'pb-20' : ''}`}>
        {children}
      </main>

      {/* 모바일 네비게이션 */}
      {isMobile && status === 'authenticated' && (
        <MobileNavigation 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onLogout={handleLogout}
          hasMenuAccess={hasAdminAccess()}
        />
      )}

      <Toaster />
    </div>
  );
} 