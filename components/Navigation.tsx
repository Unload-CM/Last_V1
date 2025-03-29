'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from '@/store/languageStore';
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
  FiMessageSquare,
  FiBook,
} from 'react-icons/fi';
import { useMediaQuery } from 'react-responsive';
import Notifications from './Notifications';
import LanguageSwitcher from './common/LanguageSwitcher';
import { useSession } from 'next-auth/react';

// 네비게이션 아이템 타입 정의
interface NavItemType {
  name: string;
  href: string;
  icon: any;
  requiresAuth?: boolean;
  onClick?: () => void;
}

// 네비게이션 아이템 컴포넌트를 메모이제이션
const NavItem = memo(({ item, isActive, onClick }: { 
  item: NavItemType;
  isActive: boolean;
  onClick?: () => void;
}) => {
  const Icon = item.icon;
  
  // 아이템에 onClick 핸들러가 있으면 그것을 사용
  const handleClick = (e: React.MouseEvent) => {
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    }
    
    // 외부에서 전달된 onClick도 실행
    if (onClick) {
      onClick();
    }
  };
  
  return (
    <Link
      href={item.href}
      className={`inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md ${
        isActive
          ? 'text-primary-700 bg-primary-50'
          : 'text-gray-900 hover:bg-gray-50'
      }`}
      onClick={handleClick}
    >
      <Icon className="mr-1 sm:mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
      {item.name}
    </Link>
  );
});

NavItem.displayName = 'NavItem';

// 모바일 네비게이션 아이템 컴포넌트를 메모이제이션
const MobileNavItem = memo(({ item, isActive, onClick }: { 
  item: NavItemType;
  isActive: boolean;
  onClick?: () => void;
}) => {
  const Icon = item.icon;
  
  // 아이템에 onClick 핸들러가 있으면 그것을 사용
  const handleClick = (e: React.MouseEvent) => {
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    }
    
    // 외부에서 전달된 onClick도 실행
    if (onClick) {
      onClick();
    }
  };
  
  return (
    <Link
      href={item.href}
      className={`block px-3 py-2 rounded-md text-base font-medium ${
        isActive
          ? 'text-primary-700 bg-primary-50'
          : 'text-gray-900 hover:bg-gray-50'
      }`}
      onClick={handleClick}
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
  const { t } = useTranslation();
  return (
    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
      <div className="px-4 py-2 border-b">
        {isLoggedIn && adminInfo ? (
          <>
            <p className="text-sm font-medium text-gray-900">{adminInfo.name}</p>
            <p className="text-xs text-gray-500">
              {adminInfo.role === 'super_admin' ? t('employees.superAdmin') : t('employees.admin')}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-900">{t('common.guest')}</p>
            <p className="text-xs text-gray-500">{t('login.required')}</p>
          </>
        )}
      </div>
      
      {isLoggedIn ? (
        <>
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            {t('nav.profile')}
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            {t('nav.settings')}
          </Link>
          <div className="border-t">
            <button
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={onLogout}
            >
              <FiLogOut className="inline mr-1" />
              {t('nav.logout')}
            </button>
          </div>
        </>
      ) : (
        <Link
          href="/admin-login"
          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          {t('login.login')}
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
  
  // Next-auth 세션 정보 가져오기
  const { data: session } = useSession();
  
  // 로그인 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{ name: string; role: string; employeeId?: string } | null>(null);
  
  // 메뉴 접근 권한이 있는 사용자 목록
  const AUTHORIZED_USERS = ['CMADMIN1', 'CMADMIN2', 'CM6150', 'CM6156'];
  
  // 현재 로그인한 사용자가 권한이 있는지 확인하는 함수
  const hasMenuAccess = useCallback(() => {
    if (!isLoggedIn || !adminInfo || !adminInfo.employeeId) return false;
    return AUTHORIZED_USERS.includes(adminInfo.employeeId);
  }, [isLoggedIn, adminInfo]);
  
  // 로그인 상태 확인
  useEffect(() => {
    try {
      // 세션 정보가 있으면 그것을 사용
      if (session?.user) {
        setIsLoggedIn(true);
        setAdminInfo({
          name: session.user.name || '',
          role: session.user.isSystemAdmin ? 'super_admin' : 'admin',
          employeeId: session.user.email || ''
        });
        return;
      }
      
      // 로컬 스토리지에서 로그인 정보 확인
      const storedAdminInfo = localStorage.getItem('adminInfo');
      if (storedAdminInfo) {
        const parsedInfo = JSON.parse(storedAdminInfo);
        if (parsedInfo.isLoggedIn) {
          setIsLoggedIn(true);
          setAdminInfo({
            name: parsedInfo.name,
            role: parsedInfo.role,
            employeeId: parsedInfo.employeeId || ''
          });
        }
      }
    } catch (error) {
      console.error('로그인 상태 확인 중 오류 발생:', error);
    }
  }, [session]);
  
  // 로그아웃 처리 - useCallback으로 메모이제이션
  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('adminInfo');
      setIsLoggedIn(false);
      setAdminInfo(null);
      setIsUserMenuOpen(false);
      
      // const redirectUrl = 'http://192.168.1.33:3333/admin-login';
      const redirectUrl = process.env.NEXT_PUBLIC_LOGOUT_REDIRECT_URL || '/admin-login';
      router.push(redirectUrl);
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
  
  // 네비게이션 아이템 - 권한에 따라 필터링된 항목 생성
  const getNavigationItems = useCallback((): NavItemType[] => {
    const baseItems: NavItemType[] = [
      {
        name: t('nav.home'),
        href: '/',
        icon: FiHome,
      },
      {
        name: t('nav.issues'),
        href: '/issues',
        icon: FiAlertCircle,
      }
    ];
    
    // 모든 사용자에게 직원 관리와 설정 메뉴 아이템을 보여주지만
    // 클릭 시 권한 체크를 진행
    baseItems.push(
      {
        name: t('nav.employees'),
        href: hasMenuAccess() ? '/employees' : '#', // 권한이 없으면 # 링크로 설정
        icon: FiUsers,
        requiresAuth: true,
        onClick: !hasMenuAccess() ? () => {
          // 권한이 없을 경우 알림 메시지 표시
          alert(t('common.noPermission') || '사용 권한이 없습니다');
        } : undefined
      },
      // 모든 사용자가 접근 가능한 메뉴얼 메뉴 추가
      {
        name: t('nav.manual'),
        href: '/manual',
        icon: FiBook,
      },
      {
        name: t('nav.settings'),
        href: hasMenuAccess() ? '/settings' : '#', // 권한이 없으면 # 링크로 설정
        icon: FiSettings,
        requiresAuth: true,
        onClick: !hasMenuAccess() ? () => {
          // 권한이 없을 경우 알림 메시지 표시
          alert(t('common.noPermission') || '사용 권한이 없습니다');
        } : undefined
      }
    );
    
    // 태국어 문구 관리 메뉴는 완전히 주석 처리
    /*
    baseItems.push({
      name: t('nav.thaiPhrases'),
      href: '/thai-phrases',
      icon: FiMessageSquare,
    });
    */
    
    return baseItems;
  }, [t, hasMenuAccess]);
  
  // 현재 표시할 네비게이션 아이템
  const navigationItems = getNavigationItems();
  
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex px-1 sm:px-2 lg:px-0 overflow-x-auto">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-base sm:text-xl font-bold text-primary-600">
                {t('nav.title')}
              </Link>
            </div>
            <nav className="ml-2 sm:ml-6 flex space-x-1 sm:space-x-4">
              {navigationItems.map((item) => (
                <NavItem 
                  key={item.name} 
                  item={item} 
                  isActive={isActivePath(item.href)} 
                />
              ))}
            </nav>
          </div>
          
          <div className="flex items-center">
            {/* 언어 선택 컴포넌트 추가 */}
            <div className="mr-2 sm:mr-4">
              <LanguageSwitcher variant="dropdown" showIcons={isMobile ? false : true} />
            </div>
            
            {/* 알림 컴포넌트 추가 */}
            <Notifications />
            
            {/* 사용자 메뉴 */}
            <div className="ml-2 sm:ml-4 relative flex-shrink-0">
              <div>
                <button
                  className="flex text-sm rounded-full focus:outline-none"
                  onClick={toggleUserMenu}
                >
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                    <FiUser className="h-4 w-4 sm:h-5 sm:w-5" />
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
          </div>
        </div>
      </div>
    </header>
  );
}

// 컴포넌트 메모이제이션
export default memo(Navigation); 