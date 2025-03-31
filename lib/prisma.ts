import { PrismaClient, Prisma } from '@prisma/client';
import { createHash } from 'crypto';

// DATABASE_URL 확인 (디버깅용)
console.log('현재 사용 중인 DB 연결 URL:', process.env.DATABASE_URL?.replace(/:.+@/, ':****@'));
console.log('현재 사용 중인 DIRECT URL:', process.env.DIRECT_URL?.replace(/:.+@/, ':****@'));

// 환경 변수 로그 레벨 설정
const logLevels: Prisma.LogLevel[] = process.env.NODE_ENV === 'development' 
  ? ['query', 'info', 'warn', 'error'] 
  : ['error'];

// DATABASE_URL 유효성 검증
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
}

// 해시 생성 함수 
function hash(str: string): string {
  return createHash('sha256').update(str).digest('hex').substring(0, 8);
}

// PrismaClient 인스턴스를 위한 전역 타입 선언
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 클라이언트 생성 함수
function createPrismaClient(): PrismaClient {
  // 개발 환경에서 디버깅을 위한 로깅 활성화
  const client = new PrismaClient({
    log: logLevels,
    errorFormat: 'pretty',
  });

  // 연결 시간 초과 및 재시도 설정
  let connectionAttempts = 0;
  const maxAttempts = 3;
  const timeoutMs = 5000;

  // 확장 메서드 추가: 데이터베이스 연결 확인
  client.$extends({
    name: 'dbConnectionCheck',
    query: {
      $allModels: {
        async $allOperations({ args, query, operation, model }) {
          try {
            const result = await query(args);
            // 연결 성공 시 재시도 카운터 리셋
            connectionAttempts = 0;
            return result;
          } catch (error) {
            // 연결 관련 오류 처리
            if (error instanceof Prisma.PrismaClientInitializationError ||
                error instanceof Prisma.PrismaClientRustPanicError ||
                error instanceof Prisma.PrismaClientKnownRequestError) {
              
              connectionAttempts++;
              console.error(`데이터베이스 연결 시도 ${connectionAttempts}/${maxAttempts} 실패:`, error);
              
              if (connectionAttempts < maxAttempts) {
                // 지수 백오프로 재시도
                const delay = Math.min(timeoutMs * Math.pow(2, connectionAttempts - 1), 30000);
                console.log(`${delay}ms 후 재시도합니다...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return query(args);
              }
            }
            throw error;
          }
        },
      },
    },
  });

  // 확장된 클라이언트 반환
  return client;
}

// 클라이언트 인스턴스 생성 (개발 환경에서는 전역 변수 재사용)
export const prisma = globalForPrisma.prisma || createPrismaClient();

// 개발 환경에서만 전역 객체에 저장 (핫 리로딩 시 연결 재사용)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 데이터베이스 연결 확인 함수
export async function checkDatabaseConnection() {
  try {
    console.log('데이터베이스 연결 확인 중...');
    console.log('현재 DB 연결 URL:', process.env.DATABASE_URL?.replace(/:.+@/, ':****@'));
    
    // 간단한 쿼리로 연결 확인
    await prisma.$queryRaw`SELECT 1 as connection_test`;
    return { 
      connected: true, 
      message: '데이터베이스에 성공적으로 연결되었습니다.',
      dbInfo: {
        host: process.env.POSTGRES_HOST || 'unknown',
        port: process.env.POSTGRES_PORT || 'unknown',
        database: process.env.POSTGRES_DATABASE || 'postgres',
        user: process.env.POSTGRES_USER || 'unknown'
      }
    };
  } catch (error) {
    console.error('데이터베이스 연결 오류:', error);
    return { 
      connected: false, 
      message: '데이터베이스 연결에 실패했습니다.', 
      error: error instanceof Error ? error.message : String(error),
      dbInfo: {
        host: process.env.POSTGRES_HOST || 'unknown',
        port: process.env.POSTGRES_PORT || 'unknown',
        database: process.env.POSTGRES_DATABASE || 'postgres',
        user: process.env.POSTGRES_USER || 'unknown'
      }
    };
  }
}

export default prisma; 