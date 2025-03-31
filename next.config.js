/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
    domains: ['*'],
  },
  
  // output: 'export', // API 라우트를 사용하기 위해 주석 처리
  trailingSlash: true,
  
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Vercel 서버리스 함수에서 업로드 폴더 제외
  outputFileTracing: true,
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'public/uploads/**',
        '.next/cache/**',
        'node_modules/sharp/**',
      ],
    },
  },
};

module.exports = nextConfig; 