/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // API 경로를 사용하므로 'export' 모드는 사용할 수 없음
  // output: 'export',
  
  images: {
    domains: ['images.unsplash.com', 'ekzoqpoztqjaneeamkcz.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  typescript: {
    // 타입 오류가 빌드 중에도 계속 진행되도록 설정 (개발 편의)
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  eslint: {
    // 린트 오류가 빌드 중에도 계속 진행되도록 설정 (개발 편의)
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 