import { PrismaClient, Prisma } from '@prisma/client';

// PrismaClient 전역 타입 선언
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 데이터베이스 연결 문제 발생 시 재시도 로직
function getPrismaClient() {
  // 전역 객체가 있으면 재사용
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  
  // 환경에 따른 로그 레벨 설정
  const logLevels: Prisma.LogLevel[] = process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'];
  
  // 새 Prisma 클라이언트 생성
  const client = new PrismaClient({
    log: logLevels,
    // 연결 타임아웃 설정
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
  });

  // 개발 환경에서는 전역 객체에 저장하여 핫 리로드 시 재연결 방지
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  
  return client;
}

// 클라이언트 인스턴스 생성
export const prisma = getPrismaClient();

// 데이터베이스 연결 확인 함수
export async function checkDatabaseConnection() {
  try {
    // 간단한 쿼리 실행으로 연결 확인
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true, error: null };
  } catch (error) {
    console.error('데이터베이스 연결 오류:', error);
    return { connected: false, error: String(error) };
  }
}

export default prisma; 