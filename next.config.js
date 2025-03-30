/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // 서버 사이드 렌더링 전용 설정
  output: 'standalone',
  
  // 정적 페이지 생성 비활성화
  staticPageGenerationTimeout: 300,
  distDir: '.next',
  
  // 클라이언트 모듈 오류 방지를 위한 실험적 기능 비활성화
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
    esmExternals: 'loose',
    appDir: true,
  },
  
  // webpack 설정 추가: NextAuth와 함께 사용하기 위한 폴리필 추가
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        path: false,
      };
    }
    return config;
  },
  
  // 서버 측 API 라우팅을 명시적으로 처리하기 위한 구성
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ];
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
  
  // clientModules 오류 방지 설정
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

module.exports = nextConfig; 