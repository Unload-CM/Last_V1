import Head from 'next/head';

export default function MobilePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Head>
        <title>모바일 버전 - 공장 관리 시스템</title>
        <meta name="description" content="공장 관리 시스템 모바일 버전" />
      </Head>
      <div className="text-center">
        <h1 className="text-xl font-bold">공장 관리 시스템</h1>
        <p className="mt-2">모바일 버전</p>
      </div>
    </main>
  );
} 