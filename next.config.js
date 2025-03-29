/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 이미지 도메인 허용 목록 설정
  images: {
    domains: ['localhost', '192.168.1.33', 'unwvnodolgwrgiojrswp.supabase.co'],
  },
  
  // 환경 변수 설정
  env: {
    NEXTAUTH_URL: 'https://last-v1.vercel.app',
    NEXT_PUBLIC_LOGOUT_REDIRECT_URL: 'https://last-v1.vercel.app/admin-login',
    NEXT_PUBLIC_BASE_URL: 'https://last-v1.vercel.app',
  },

  // 정적 내보내기 설정
  output: 'standalone',
  
  // 동적 라우트 설정
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
};

module.exports = nextConfig; 