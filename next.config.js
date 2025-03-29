/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 이미지 도메인 허용 목록 설정
  images: {
    domains: ['localhost', '192.168.1.33'],
  },
  
  // 환경 변수 설정
  env: {
    NEXTAUTH_URL: 'http://192.168.1.33:3331',
    NEXT_PUBLIC_LOGOUT_REDIRECT_URL: 'http://192.168.1.33:3331/admin-login',
  },
};

module.exports = nextConfig; 