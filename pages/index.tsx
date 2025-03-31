import type { NextPage } from 'next';
import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

const Home: NextPage = () => {
  const router = useRouter();
  const { status } = useSession();
  
  useEffect(() => {
    // 인증 상태 확인 후 처리
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>공장 관리 시스템</title>
        <meta name="description" content="공장 관리 시스템" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center min-h-screen py-2">
        <h1 className="text-4xl font-bold mt-10 mb-5">공장 관리 시스템</h1>
        <p className="text-lg mb-5">로딩 중...</p>
      </main>
    </div>
  );
};

export default Home; 