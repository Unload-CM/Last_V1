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
  
  // 정적 페이지 생성 비활성화
  staticPageGenerationTimeout: 300,
  distDir: '.next',
  
  // 클라이언트 모듈 오류 방지를 위한 실험적 기능 설정
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
    esmExternals: 'loose',
    serverActions: false, // 서버 액션 비활성화
    appDir: true, // App 디렉토리 명시적으로 활성화
    forceSwcTransforms: true, // SWC 트랜스폼 강제 적용
    instrumentationHook: false, // 계측 훅 비활성화
    optimizePackageImports: false, // 패키지 임포트 최적화 비활성화
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
    
    // CSS 모듈 처리 설정 제거 (내장 로더 사용)
    
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
  
  // 타입스크립트와 ESLint 오류 무시 설정
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // CSS 관련 설정
  swcMinify: true, // SWC 최적화 활성화
  optimizeFonts: true, // 폰트 최적화 활성화
  
  // 로깅 레벨 설정
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // 빌드 시 소스맵 비활성화로 성능 향상
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig; 