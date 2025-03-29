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

export const metadata = {
  title: '공장 관리 시스템',
  description: '공장 관리를 위한 웹 애플리케이션',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  'application-name': '공장 관리 시스템',
  'apple-mobile-web-app-capable': 'yes',
  'apple-mobile-web-app-status-bar-style': 'default',
  'apple-mobile-web-app-title': '공장 관리 시스템',
  'mobile-web-app-capable': 'yes',
  'theme-color': '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head />
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