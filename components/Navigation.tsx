'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useTranslation from '../utils/i18n';
import {
  FiHome,
  FiAlertCircle,
  FiUsers,
  FiSettings,
  FiMenu,
  FiX,
  FiBell,
  FiUser,
  FiLogOut,
} from 'react-icons/fi';
import { useMediaQuery } from 'react-responsive';
import Notifications from './Notifications';

// 네비게이션 아이템 컴포넌트를 메모이제이션
const NavItem = memo(({ item, isActive, onClick }: { 
  item: { name: string; href: string; icon: any };
  isActive: boolean;
  onClick?: () => void;
}) => {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
        isActive
          ? 'text-primary-700 bg-primary-50'
          : 'text-gray-900 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <Icon className="mr-1.5 h-5 w-5" />
      {item.name}
    </Link>
  );
});

NavItem.displayName = 'NavItem';

// 모바일 네비게이션 아이템 컴포넌트를 메모이제이션
const MobileNavItem = memo(({ item, isActive, onClick }: { 
  item: { name: string; href: string; icon: any };
  isActive: boolean;
  onClick?: () => void;
}) => {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`block px-3 py-2 rounded-md text-base font-medium ${
        isActive
          ? 'text-primary-700 bg-primary-50'
          : 'text-gray-900 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <Icon className="inline mr-1.5 h-5 w-5" />
      {item.name}
    </Link>
  );
});

MobileNavItem.displayName = 'MobileNavItem';

// 사용자 메뉴 컴포넌트를 메모이제이션
const UserMenu = memo(({ 
  isLoggedIn, 
  adminInfo, 
  onLogout 
}: { 
  isLoggedIn: boolean; 
  adminInfo: { name: string; role: string } | null;
  onLogout: () => void;
}) => {
  return (
    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
      <div className="px-4 py-2 border-b">
        {isLoggedIn && adminInfo ? (
          <>
            <p className="text-sm font-medium text-gray-900">{adminInfo.name}</p>
            <p className="text-xs text-gray-500">
              {adminInfo.role === 'super_admin' ? '최고 관리자' : '관리자'}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-900">게스트</p>
            <p className="text-xs text-gray-500">로그인이 필요합니다</p>
          </>
        )}
      </div>
      
      {isLoggedIn ? (
        <>
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            프로필
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            설정
          </Link>
          <div className="border-t">
            <button
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={onLogout}
            >
              <FiLogOut className="inline mr-1" />
              로그아웃
            </button>
          </div>
        </>
      ) : (
        <Link
          href="/admin-login"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          로그인
        </Link>
      )}
    </div>
  );
});

UserMenu.displayName = 'UserMenu';

function Navigation() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // 로그인 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{ name: string; role: string } | null>(null);
  
  // 로그인 상태 확인
  useEffect(() => {
    try {
      const storedAdminInfo = localStorage.getItem('adminInfo');
      if (storedAdminInfo) {
        const parsedInfo = JSON.parse(storedAdminInfo);
        if (parsedInfo.isLoggedIn) {
          setIsLoggedIn(true);
          setAdminInfo({
            name: parsedInfo.name,
            role: parsedInfo.role
          });
        }
      }
    } catch (error) {
      console.error('로그인 상태 확인 중 오류 발생:', error);
    }
  }, []);
  
  // 로그아웃 처리 - useCallback으로 메모이제이션
  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('adminInfo');
      setIsLoggedIn(false);
      setAdminInfo(null);
      setIsUserMenuOpen(false);
      router.push('/admin-login');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    }
  }, [router]);
  
  // 반응형 디자인을 위한 미디어 쿼리
  const isMobile = useMediaQuery({ maxWidth: 768 });
  
  // 토글 함수 메모이제이션
  const toggleNav = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen(prev => !prev);
  }, []);
  
  // 모바일 메뉴 닫기 함수 메모이제이션
  const closeMobileMenu = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  // 현재 경로와 일치하는지 확인 - useCallback으로 메모이제이션
  const isActivePath = useCallback((path: string): boolean => {
    if (path === '/') {
      return pathname === path;
    }
    return pathname?.startsWith(path) || false;
  }, [pathname]);
  
  // 네비게이션 아이템 - 컴포넌트 외부로 이동하여 리렌더링 방지
  const navigationItems = [
    {
      name: '대시보드',
      href: '/',
      icon: FiHome,
    },
    {
      name: '이슈 관리',
      href: '/issues',
      icon: FiAlertCircle,
    },
    {
      name: '사원 관리',
      href: '/employees',
      icon: FiUsers,
    },
    {
      name: '설정',
      href: '/settings',
      icon: FiSettings,
    },
  ];
  
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex px-2 lg:px-0">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-primary-600">
                공장관리시스템
              </Link>
            </div>
            {!isMobile && (
              <nav className="hidden md:ml-6 md:flex md:space-x-4">
                {navigationItems.map((item) => (
                  <NavItem 
                    key={item.name} 
                    item={item} 
                    isActive={isActivePath(item.href)} 
                  />
                ))}
              </nav>
            )}
          </div>
          
          <div className="flex items-center">
            {/* 알림 컴포넌트 추가 */}
            <Notifications />
            
            {/* 사용자 메뉴 */}
            <div className="ml-4 relative flex-shrink-0">
              <div>
                <button
                  className="flex text-sm rounded-full focus:outline-none"
                  onClick={toggleUserMenu}
                >
                  <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                    <FiUser />
                  </div>
                </button>
              </div>
              
              {isUserMenuOpen && (
                <UserMenu 
                  isLoggedIn={isLoggedIn} 
                  adminInfo={adminInfo} 
                  onLogout={handleLogout} 
                />
              )}
            </div>
            
            {/* 모바일 메뉴 버튼 */}
            {isMobile && (
              <div className="-mr-2 flex items-center md:hidden">
                <div className="ml-3">
                  <button
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={toggleNav}
                  >
                    {isOpen ? (
                      <FiX className="block h-6 w-6" />
                    ) : (
                      <FiMenu className="block h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 모바일 메뉴 */}
      {isMobile && isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navigationItems.map((item) => (
              <MobileNavItem
                key={item.name}
                item={item}
                isActive={isActivePath(item.href)}
                onClick={closeMobileMenu}
              />
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

// 컴포넌트 메모이제이션
export default memo(Navigation); 