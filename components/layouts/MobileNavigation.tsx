import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home,
  FileText,
  Users,
  MoreHorizontal,
  KeyRound,
  Settings,
  BookOpen
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function MobileNavigation() {
  const { t } = useTranslation();
  const pathname = usePathname() || '';

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-gray-200">
      <div className="grid h-full grid-cols-4">
        <Link href="/dashboard" className={`flex flex-col items-center justify-center ${isActive('/dashboard') ? 'text-blue-500' : 'text-gray-500'}`}>
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">{t('nav.dashboard')}</span>
        </Link>
        
        <Link href="/issues" className={`flex flex-col items-center justify-center ${isActive('/issues') ? 'text-blue-500' : 'text-gray-500'}`}>
          <FileText className="w-6 h-6" />
          <span className="text-xs mt-1">{t('nav.issues')}</span>
        </Link>

        <Link href="/employees" className={`flex flex-col items-center justify-center ${isActive('/employees') ? 'text-blue-500' : 'text-gray-500'}`}>
          <Users className="w-6 h-6" />
          <span className="text-xs mt-1">{t('nav.employees')}</span>
        </Link>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="flex flex-col items-center justify-center w-full h-full focus:outline-none">
            <MoreHorizontal className="w-6 h-6 text-gray-500" />
            <span className="text-xs mt-1 text-gray-500">{t('nav.more')}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mb-16">
            <DropdownMenuItem asChild>
              <Link href="/change-password" className={`flex items-center w-full ${isActive('/change-password') ? 'text-blue-500' : ''}`}>
                <KeyRound className="w-4 h-4 mr-2" />
                <span>{t('nav.changePassword')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className={`flex items-center w-full ${isActive('/settings') ? 'text-blue-500' : ''}`}>
                <Settings className="w-4 h-4 mr-2" />
                <span>{t('nav.settings')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/manual" className={`flex items-center w-full ${isActive('/manual') ? 'text-blue-500' : ''}`}>
                <BookOpen className="w-4 h-4 mr-2" />
                <span>{t('nav.userManual')}</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
} 