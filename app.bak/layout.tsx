import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from './providers';
import LanguageProvider from '@/components/providers/LanguageProvider';
import AppLayout from '@/components/AppLayout';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <title>공장 관리 시스템</title>
        <meta name="description" content="공장 관리를 위한 웹 애플리케이션" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
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