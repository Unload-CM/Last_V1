import './globals.css';
import { Inter } from 'next/font/google';
import { Noto_Sans_Thai } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import Providers from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

const notoSansThai = Noto_Sans_Thai({
  weight: ['400', '500', '600', '700'],
  subsets: ['thai'],
  variable: '--font-noto-sans-thai',
});

export const metadata = {
  title: '공장 관리 시스템',
  description: '공장 관리를 위한 웹 애플리케이션',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} ${notoSansThai.variable}`} suppressHydrationWarning>
        <Providers>
          <div className="flex h-screen">
            <nav className="w-64 bg-white border-r border-gray-200 p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    관리
                  </h3>
                  <div className="space-y-2">
                    <Link href="/employees" className="menu-item flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      직원 관리
                    </Link>
                    <Link href="/thai-phrases" className="menu-item flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      태국어 문구 관리
                    </Link>
                  </div>
                </div>
              </div>
            </nav>
            <main className="flex-1 p-8 bg-gray-50 overflow-y-auto">
              {children}
            </main>
          </div>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
} 