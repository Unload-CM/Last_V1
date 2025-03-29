'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/store/languageStore';
import { FiHome, FiAlertCircle, FiUsers, FiMenu, FiSettings, FiKey, FiBook, FiLogOut } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// 모바일 하단 네비게이션 아이템 타입
type NavItemType = {
  name: string;
  href: string;
  icon: any;
  onClick?: (e: React.MouseEvent) => void;
  requiresAuth?: boolean;
};

// 모바일 네비게이션 아이템 컴포넌트
const MobileNavItem = ({ item, isActive }: { item: NavItemType; isActive: boolean }) => {
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      className={`flex flex-col items-center justify-center px-0.5 py-0.5 ${
        isActive
          ? 'text-primary-600'
          : 'text-gray-500'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-[10px] mt-0.5">{item.name}</span>
    </Link>
  );
};

// 더보기 메뉴 컴포넌트
const MoreMenu = ({
  isOpen,
  onClose,
  onLogout,
  hasMenuAccess,
  handleUnauthorizedClick,
  isLoggedIn,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  hasMenuAccess: () => boolean;
  handleUnauthorizedClick: (e: React.MouseEvent) => void;
  isLoggedIn: boolean;
}) => {
  const { t } = useTranslation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 오버레이 */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* 더보기 메뉴 */}
          <motion.div
            className="fixed bottom-16 left-0 right-0 bg-white z-50 rounded-t-lg shadow-lg overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
          >
            <div className="py-2">
              {/* Employees 메뉴 - 관리자 권한 체크 */}
              <Link 
                href={hasMenuAccess() ? "/employees" : "#"}
                className={`flex items-center px-4 py-3 ${!hasMenuAccess() ? 'text-gray-400' : ''}`}
                onClick={(e) => {
                  if (!hasMenuAccess()) {
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
                href={hasMenuAccess() ? "/settings" : "#"}
                className={`flex items-center px-4 py-3 ${!hasMenuAccess() ? 'text-gray-400' : ''}`}
                onClick={(e) => {
                  if (!hasMenuAccess()) {
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

              {isLoggedIn && (
                <button
                  onClick={handleLogoutClick}
                  disabled={isLoggingOut}
                  className="flex items-center w-full px-4 py-3 text-red-600 disabled:opacity-50"
                >
                  <FiLogOut className="h-5 w-5 mr-3" />
                  <span>{isLoggingOut ? t('common.processing') : t('nav.logout')}</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function MobileNavigation({
  isLoggedIn = false,
  hasMenuAccess = () => false,
  onLogout = () => {},
}: {
  isLoggedIn?: boolean;
  hasMenuAccess?: () => boolean;
  onLogout?: () => void;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  
  // 현재 경로에 따라 활성화된 네비게이션 아이템 결정
  const getIsActiveLink = useCallback((href: string) => {
    if (!pathname) return false;
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  }, [pathname]);
  
  // 권한이 없는 경우 클릭 핸들러
  const handleUnauthorizedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert(t('common.noPermission'));
  };
  
  // 기본 네비게이션 아이템 - 4개로 조정
  const navItems: NavItemType[] = [
    {
      name: t('nav.dashboard'),
      href: '/',
      icon: FiHome,
    },
    {
      name: t('nav.issues'),
      href: '/issues',
      icon: FiAlertCircle,
      ...(isLoggedIn ? {} : { onClick: handleUnauthorizedClick }),
    },
    {
      name: t('nav.more'),
      href: '#',
      icon: FiMenu,
      onClick: (e) => {
        e.preventDefault();
        setIsMoreMenuOpen(true);
      },
    },
  ];
  
  return (
    <>
      {/* 모바일 하단 네비게이션 바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-gray-200">
        <div className="grid h-full grid-cols-3">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`flex flex-col items-center justify-center ${
                getIsActiveLink(item.href) ? 'text-blue-500' : 'text-gray-500'
              }`}
              onClick={item.onClick}
            >
              {<item.icon className="w-6 h-6" />}
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
      
      {/* 더보기 메뉴 */}
      <MoreMenu
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        onLogout={onLogout}
        hasMenuAccess={hasMenuAccess}
        handleUnauthorizedClick={handleUnauthorizedClick}
        isLoggedIn={isLoggedIn}
      />
      
      {/* 메인 콘텐츠와 하단 네비게이션 바 사이의 간격 */}
      <div className="pb-12"></div>
    </>
  );
} 