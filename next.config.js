/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 이미지 도메인 허용 목록 설정
  images: {
    domains: ['localhost', '192.168.1.33'],
  },
  
  // 서버 설정
  server: {
    // 모든 IPv4 주소에서 접속 허용
    host: '0.0.0.0',
    // port: 3331,  // 개발 환경용 포트
    port: 3333,  // 운영 환경용 포트
  },
  
  // 환경 변수 설정
  env: {
    NEXTAUTH_URL: 'http://192.168.1.33:3331',
    NEXT_PUBLIC_LOGOUT_REDIRECT_URL: 'http://192.168.1.33:3331/admin-login',
    // NEXTAUTH_URL: 'http://192.168.1.33:3333',
    //NEXT_PUBLIC_LOGOUT_REDIRECT_URL: 'http://192.168.1.33:3333/admin-login',
    // 여기에 필요한 다른 환경 변수 추가
  },
  
  // 트랜스파일러 설정
  transpilePackages: [],
  
  // API 경로 재작성 규칙
  async rewrites() {
    return [
      // 여기에 필요한 rewrite 규칙 추가
    ];
  },

  // 개발 환경 설정
  webpack: (config, { dev, isServer }) => {
    // 개발 환경에서만 적용될 설정
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    return config;
  },
};

module.exports = nextConfig; 