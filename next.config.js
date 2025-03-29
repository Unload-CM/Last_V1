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
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: "https://unwvnodolgwrgiojrswp.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVud3Zub2RvbGd3cmdpb2pyc3dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDI5MDMsImV4cCI6MjA1ODgxODkwM30.6Rt2IFchWfwRGHP15yT_G3UchMUHsayHJdu63gJ5LDA",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://last-v1.vercel.app',
    NEXT_PUBLIC_LOGOUT_REDIRECT_URL: 'https://last-v1.vercel.app/admin-login',
    NEXT_PUBLIC_BASE_URL: 'https://last-v1.vercel.app',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV || 'production'
  },

  // 동적 라우트 설정
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'last-v1.vercel.app']
    },
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt']
  },
};

module.exports = nextConfig; 