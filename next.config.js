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
  // output: 'standalone', // 정적 생성을 사용하지 않음 (서버 측 렌더링을 위해 주석 처리)
  
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
  
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
    esmExternals: 'loose',
    // serverActions: true // Next.js 14부터 기본으로 포함됨
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
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://last-v1.vercel.app'
  }
};

module.exports = nextConfig; 