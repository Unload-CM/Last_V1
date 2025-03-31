import './globals.css';
import { Inter } from 'next/font/google';
import { Noto_Sans_Thai } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from './providers';
import LanguageProvider from '@/components/providers/LanguageProvider';
import AppLayout from '../components/AppLayout';

const inter = Inter({ subsets: ['latin'] });

const notoSansThai = Noto_Sans_Thai({
  weight: ['400', '500', '600', '700'],
  subsets: ['thai'],
  variable: '--font-noto-sans-thai',
});

// viewport 설정을 별도로 export - Next.js 14.1 이상 권장 방식
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 간소화된 메타데이터 (기본값만 포함)
export const metadata = {
  title: '공장 관리 시스템',
  description: '공장 관리를 위한 웹 애플리케이션',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      {/* viewport 메타 태그를 직접 추가하여 Next.js 메타데이터 시스템 우회 */}
      <head>
        <meta name="application-name" content="공장 관리 시스템" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="공장 관리 시스템" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`${inter.className} ${notoSansThai.variable}`} suppressHydrationWarning>
        <Providers>
          <LanguageProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </LanguageProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
} 