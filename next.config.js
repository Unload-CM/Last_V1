/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // 엄격 모드 비활성화로 이중 렌더링 방지
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true, // 이미지 최적화 비활성화
  },
  
  // 정적 페이지 생성 설정
  output: 'export', // 완전한 정적 내보내기로 변경
  distDir: '.next',
  trailingSlash: true, // URL 끝에 슬래시 추가
  
  // Next.js 15.2.4에서 변경된 설정
  serverExternalPackages: ['@prisma/client', 'bcrypt'],
  
  // CSS 모듈 문제 해결을 위한 웹팩 설정
  webpack: (config) => {
    // clientModules 문제 해결을 위한 CSS 모듈 처리 최적화
    if (config.module?.rules) {
      config.module.rules.forEach((rule) => {
        if (rule.oneOf && Array.isArray(rule.oneOf)) {
          rule.oneOf.forEach((r) => {
            if (r.test && r.test.toString().includes('css')) {
              r.sideEffects = true;
            }
          });
        }
      });
    }
    return config;
  },
  
  // 환경 변수 설정
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://last-v1.vercel.app',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://last-v1.vercel.app',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://last-v1.vercel.app'
  },
  
  // 타입스크립트와 ESLint 오류 무시 설정
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 빌드 소스맵 비활성화
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig; 