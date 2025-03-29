/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 동적 라우트 설정
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
    serverActions: {
      allowedOrigins: ['localhost:3000', 'last-v1.vercel.app']
    },
    // 정적 페이지 생성 비활성화
    appDir: true,
    // 동적 서버 사용 허용
    esmExternals: 'loose'
  },
  
  // 환경 변수 설정
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:1234@db.unwvnodolgwrgiojrswp.supabase.co:5432/postgres",
    NEXT_PUBLIC_SUPABASE_URL: "https://unwvnodolgwrgiojrswp.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVud3Zub2RvbGd3cmdpb2pyc3dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDI5MDMsImV4cCI6MjA1ODgxODkwM30.6Rt2IFchWfwRGHP15yT_G3UchMUHsayHJdu63gJ5LDA",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://last-v1.vercel.app',
    NEXT_PUBLIC_LOGOUT_REDIRECT_URL: 'https://last-v1.vercel.app/admin-login',
    NEXT_PUBLIC_BASE_URL: 'https://last-v1.vercel.app',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "84d67aeaff4834ad58d65adc4f5cde4d"
  },
  
  // 정적 내보내기 비활성화 (서버 사이드 렌더링으로 실행)
  output: 'standalone',
  
  images: {
    domains: ['unwvnodolgwrgiojrswp.supabase.co']
  },

  // 동적 서버 사용 허용 (headers, cookies, request 객체 등)
  modularizeImports: {
    'lodash-es': {
      transform: 'lodash-es/{{member}}',
    },
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  }
};

module.exports = nextConfig 