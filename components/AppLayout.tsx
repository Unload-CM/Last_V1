'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import UserNavbar from '@/components/UserNavbar';
import MobileNavigation from '@/components/MobileNavigation';
import { useTranslation } from '@/store/languageStore';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

// 이슈 타입 정의
interface Issue {
  id: number;
  title: string;
  createdAt: string;
  status: {
    name: string;
    label: string;
  };
  category?: {
    name: string;
    label: string;
  };
  department?: {
    name: string;
    label: string;
  };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const router = useRouter();
  
  // 모바일 여부 확인
  const isMobile = useMediaQuery({ maxWidth: 768 });
  
  // 로그인 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  
  // 최근 이슈 관리
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  
  // 메뉴 접근 권한이 있는 사용자 목록
  const AUTHORIZED_USERS = ['CMADMIN1', 'CMADMIN2', 'CM6150', 'CM6156'];
  
  // 현재 로그인한 사용자가 권한이 있는지 확인하는 함수
  const hasMenuAccess = useCallback(() => {
    if (!isLoggedIn || !employeeId) return false;
    return AUTHORIZED_USERS.includes(employeeId);
  }, [isLoggedIn, employeeId]);
  
  // 로그인 상태 확인
  useEffect(() => {
    try {
      // 세션 정보가 있으면 그것을 사용
      if (session?.user) {
        setIsLoggedIn(true);
        setEmployeeId(session.user.email || null);
        return;
      }
      
      // 로컬 스토리지에서 로그인 정보 확인
      const storedAdminInfo = localStorage.getItem('adminInfo');
      if (storedAdminInfo) {
        const parsedInfo = JSON.parse(storedAdminInfo);
        if (parsedInfo.isLoggedIn) {
          setIsLoggedIn(true);
          setEmployeeId(parsedInfo.employeeId || null);
        }
      }
    } catch (error) {
      console.error('로그인 상태 확인 중 오류 발생:', error);
    }
  }, [session]);
  
  // 최근 이슈 데이터 로드
  useEffect(() => {
    const fetchRecentIssues = async () => {
      setIsLoadingIssues(true);
      try {
        // 실제 구현 시 주석 해제
        /*
        const response = await fetch('/api/issues?limit=5');
        if (!response.ok) {
          throw new Error('최근 이슈를 로드하는데 실패했습니다.');
        }
        const data = await response.json();
        setRecentIssues(data.issues || []);
        */
        
        // 임시 데이터 - 실제 구현 시 삭제
        const dummyIssues: Issue[] = [
          { id: 1, title: '생산라인 1번 기계 고장', createdAt: '2023-03-23', status: { name: 'OPEN', label: '미해결' }, category: { name: 'machine', label: '기계' } },
          { id: 2, title: '품질 검사 장비 오작동', createdAt: '2023-03-22', status: { name: 'IN_PROGRESS', label: '진행중' }, category: { name: 'quality', label: '품질' } },
          { id: 3, title: '자재 부족으로 생산 지연', createdAt: '2023-03-21', status: { name: 'RESOLVED', label: '해결됨' }, category: { name: 'material', label: '자재' } },
          { id: 4, title: '안전 표지판 손상', createdAt: '2023-03-20', status: { name: 'OPEN', label: '미해결' }, category: { name: 'safety', label: '안전' } },
          { id: 5, title: '창고 온도 조절 문제', createdAt: '2023-03-19', status: { name: 'IN_PROGRESS', label: '진행중' }, category: { name: 'facility', label: '시설' } },
        ];
        setRecentIssues(dummyIssues);
      } catch (error) {
        console.error('최근 이슈 로드 중 오류 발생:', error);
      } finally {
        setIsLoadingIssues(false);
      }
    };
    
    fetchRecentIssues();
  }, []);
  
  // 권한 없는 메뉴 클릭 처리
  const handleUnauthorizedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert(t('common.noPermission') || '사용 권한이 없습니다');
  };
  
  // 로그아웃 처리
  const handleLogout = useCallback(async () => {
    try {
      // next-auth의 signOut 함수 사용
      const redirectUrl = process.env.NEXT_PUBLIC_LOGOUT_REDIRECT_URL || '/admin-login';
      await signOut({ callbackUrl: redirectUrl });
      
      // 로컬 스토리지 정리
      localStorage.removeItem('adminInfo');
      setIsLoggedIn(false);
      setEmployeeId(null);
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    }
  }, []);
  
  return (
    <div className="flex flex-col h-screen">
      <UserNavbar />
      <div className="flex flex-1">
        {/* 데스크톱 사이드바 - 모바일에서는 숨김 */}
        {!isMobile && (
          <nav className="w-64 bg-white border-r border-gray-200 p-6 hidden md:block">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {t('nav.title')}
                </h3>
                <div className="space-y-2">
                  <Link href="/" className="menu-item flex items-center text-gray-900 hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    {t('nav.home')}
                  </Link>
                  <Link href="/issues" className="menu-item flex items-center text-gray-900 hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {t('nav.issues')}
                  </Link>
                  <Link 
                    href={hasMenuAccess() ? "/employees" : "#"} 
                    className={`menu-item flex items-center ${hasMenuAccess() ? 'text-gray-900 hover:bg-gray-50' : 'text-gray-400'}`}
                    onClick={!hasMenuAccess() ? handleUnauthorizedClick : undefined}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${hasMenuAccess() ? 'text-gray-900' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    {t('nav.employees')}
                  </Link>
                  {/* 태국어 문구 관리 메뉴 주석 처리 - 나중에 구현 예정
                  <Link href="/thai-phrases" className="menu-item flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    {t('nav.thaiPhrases')}
                  </Link>
                  */}
                  <Link href="/change-password" className="menu-item flex items-center text-gray-900 hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    {t('nav.changePassword')}
                  </Link>
                  
                  <Link 
                    href={hasMenuAccess() ? "/settings" : "#"} 
                    className={`menu-item flex items-center ${hasMenuAccess() ? 'text-gray-900 hover:bg-gray-50' : 'text-gray-400'}`}
                    onClick={!hasMenuAccess() ? handleUnauthorizedClick : undefined}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${hasMenuAccess() ? 'text-gray-900' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    {t('nav.settings')}
                  </Link>
                  
                  {/* 사용자 메뉴얼 메뉴 추가 - 설정 아래에 배치 */}
                  <Link href="/manual" className="menu-item flex items-center text-gray-900 hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                    {t('nav.userManual')}
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        )}
        
        <main className={`flex-1 bg-gradient-to-b from-[#F5FAFF] to-[#E8F2FF] overflow-y-auto ${isMobile ? 'pb-20' : ''}`}>
          {children}
        </main>
      </div>
      
      {/* 모바일 네비게이션 - 데스크톱에서는 숨김 */}
      {isMobile && (
        <MobileNavigation 
          isLoggedIn={isLoggedIn}
          hasMenuAccess={hasMenuAccess}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
} 