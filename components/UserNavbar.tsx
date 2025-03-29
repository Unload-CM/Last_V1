'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Menu, X, Bell, User } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/store/languageStore';
import dynamic from 'next/dynamic';
import { getDepartmentDisplayName } from '@/utils/languageDisplay';

// 클라이언트 사이드에서만 렌더링되도록 LanguageSwitcher 컴포넌트 동적 import
const LanguageSwitcher = dynamic(
  () => import('./common/LanguageSwitcher'),
  { ssr: false }
);

export default function UserNavbar() {
  // session 정보가 없는 경우에도 처리할 수 있도록 기본값 설정
  const sessionInfo = useSession();
  const { data: session, status } = sessionInfo || { data: null, status: 'unauthenticated' };
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, language, setLanguage } = useTranslation();

  // 부서명 표시 함수 - utils/languageDisplay에 있는 함수 사용
  const getDepartmentName = () => {
    if (!session?.user) return '';
    
    // user 객체에서 department 정보 추출
    const department = session.user.department ? 
      {
        name: session.user.department,
        label: session.user.departmentLabel || session.user.department,
        thaiLabel: session.user.departmentThaiLabel
      } : null;
    
    // utils/languageDisplay의 getDepartmentDisplayName 함수 사용
    return getDepartmentDisplayName(department, language, '');
  };

  // 사용자 표시 이름 형식 지정 함수
  const getDisplayName = () => {
    if (!session?.user) return '';
    
    // 부서명 - 언어에 따라 처리
    const departmentName = getDepartmentName();
    
    // ADMIN 계정인 경우
    if (session.user.email && ['CMADMIN1', 'CMADMIN2', 'ADMIN'].includes(session.user.email)) {
      return `${session.user.email} | ${departmentName}`;
    }
    
    // 일반 사용자 - 이미 lib/auth.ts에서 형식이 적용되어 있음
    // 이름 표시 부분을 현재 언어에 맞게 변경
    let userName = '';
    
    // 태국인 사용자
    if (session.user.isThai && session.user.thaiName) {
      userName = `${session.user.koreanName} (${session.user.thaiName})`;
      if (session.user.nickname) {
        userName += ` - ${session.user.nickname}`;
      }
    } else {
      // 태국인이 아닌 경우
      userName = session.user.koreanName || session.user.name || '';
    }
    
    return `${userName} | ${departmentName}`;
  };

  const handleSignOut = async () => {
    try {
      // const redirectUrl = 'http://192.168.1.33:3333/admin-login';
      const redirectUrl = process.env.NEXT_PUBLIC_LOGOUT_REDIRECT_URL;
      await signOut({ callbackUrl: redirectUrl });
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
        <div className="flex justify-between h-7 sm:h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="font-semibold text-xs sm:text-xl text-red-600 sm:text-gray-800">
                {/* PC 버전에서는 기존 타이틀 그대로 표시 */}
                <span className="hidden sm:inline">
                  {t('nav.title')}
                </span>
                {/* 모바일에서는 언어에 상관없이 "CoilMaster FMS"로 표시 */}
                <span className="sm:hidden">
                  CoilMaster FMS
                </span>
              </Link>
            </div>
            
            {/* 언어 선택 컴포넌트 - PC에서만 표시 */}
            <div className="ml-2 sm:ml-6 relative">
              {/* PC 버전에서는 기존 언어 선택기 사용 */}
              <div className="hidden sm:block">
                <LanguageSwitcher variant="dropdown" showIcons={true} />
              </div>
              {/* 모바일에서는 언어 선택 버튼 숨기기 */}
              <div className="sm:hidden">
                {/* 언어 선택 버튼 제거 */}
              </div>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* 알람 버튼 - 나중에 구현 예정 */}
            {/* <button
              className="p-2 rounded-full text-gray-400 hover:text-gray-500"
              aria-label={t('nav.notifications')}
            >
              <Bell className="h-6 w-6" />
            </button> */}

            {/* 로그인 상태 표시 */}
            <div className="ml-3 relative">
              <div className="flex items-center">
                {status === 'authenticated' && session ? (
                  <div className="flex items-center">
                    <div className="flex flex-col text-right mr-4">
                      <span className="text-sm font-semibold text-gray-700">
                        {/* ADMIN 계정은 사용자명 숨기고 부서만 표시 */}
                        {session.user?.email && ['CMADMIN1', 'CMADMIN2', 'ADMIN'].includes(session.user.email) ? (
                          getDepartmentName()
                        ) : (
                          // 일반 사용자: "koreanName (thaiName) - nickname | 부서명" 형식으로 표시
                          `${session.user?.koreanName || ''}${session.user?.thaiName ? ` (${session.user.thaiName})` : ''}${session.user?.nickname ? ` - ${session.user.nickname}` : ''} | ${getDepartmentName()}`
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {t('employees.employeeId')}: {session.user?.email}
                      </span>
                    </div>
                    <div 
                      className="flex items-center justify-center bg-blue-600 h-10 w-10 rounded-full text-white"
                    >
                      <User className="h-5 w-5" />
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                ) : (
                  <Link href="/admin-login" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                    {t('login.login')}
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center sm:hidden">
            {/* 모바일에서는 로그인한 ID만 표시 */}
            {status === 'authenticated' && session && (
              <div className="mr-1 flex items-center">
                <span className="text-[10px] text-gray-600">
                  {session.user?.email?.substring(0, session.user.email.includes('@') ? session.user.email.indexOf('@') : 8)}
                </span>
              </div>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-0.5 rounded-md text-gray-400"
            >
              {isMenuOpen ? (
                <X className="block h-4 w-4" />
              ) : (
                <Menu className="block h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 - 기존 코드에 언어 선택 포함 */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {/* 언어 선택 버튼을 여기에 표시 - setLanguage 함수 직접 사용 */}
            <div className="px-4 py-2 flex justify-center space-x-2">
              <button
                onClick={() => setLanguage('ko')}
                className={`px-3 py-1 rounded ${language === 'ko' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              >
                한국어
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded ${language === 'en' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('th')}
                className={`px-3 py-1 rounded ${language === 'th' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              >
                ไทย
              </button>
            </div>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {status === 'authenticated' && session ? (
              <div>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                      <User className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {/* ADMIN 계정은 사용자명 숨기고 부서만 표시 */}
                      {session.user?.email && ['CMADMIN1', 'CMADMIN2', 'ADMIN'].includes(session.user.email) ? (
                        getDepartmentName()
                      ) : (
                        // 일반 사용자: "koreanName (thaiName) - nickname | 부서명" 형식으로 표시
                        `${session.user?.koreanName || ''}${session.user?.thaiName ? ` (${session.user.thaiName})` : ''}${session.user?.nickname ? ` - ${session.user.nickname}` : ''} | ${getDepartmentName()}`
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {t('employees.employeeId')}: {session.user?.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    onClick={handleSignOut}
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 w-full text-left"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-2">
                <Link
                  href="/admin-login"
                  className="text-base font-medium text-gray-500 hover:text-gray-800"
                >
                  {t('login.login')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 