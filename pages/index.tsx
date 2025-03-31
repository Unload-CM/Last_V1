import type { NextPage } from 'next';
import Head from 'next/head';

const Home: NextPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>공장 관리 시스템</title>
        <meta name="description" content="공장 관리 시스템" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center min-h-screen py-2">
        <h1 className="text-4xl font-bold mt-10 mb-5">공장 관리 시스템</h1>
        <p className="text-lg mb-5">로그인 중입니다...</p>
      </main>
    </div>
  );
};

export default Home; 