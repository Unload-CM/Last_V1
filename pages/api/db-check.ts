// 디버깅 목적의 파일 - 데이터베이스 연결 확인용
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma, checkDatabaseConnection } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 데이터베이스 연결 확인
    const connectionStatus = await checkDatabaseConnection();
    
    // 기본 데이터 확인 시도
    let dataCount: Record<string, number> = {};
    let errorMsg: string | null = null;
    
    try {
      // 연결이 확인되었을 때만 데이터 쿼리 시도
      if (connectionStatus.connected) {
        dataCount = {
          status: await prisma.status.count(),
          priority: await prisma.priority.count(),
          category: await prisma.category.count(),
          department: await prisma.department.count(),
          employee: await prisma.employee.count(),
          issue: await prisma.issue.count()
        };
      } else {
        errorMsg = connectionStatus.error;
      }
    } catch (countError) {
      console.error('데이터 카운트 오류:', countError);
      errorMsg = String(countError);
    }
    
    // 무조건 응답 반환 (디버깅 용도)
    return res.status(connectionStatus.connected ? 200 : 500).json({
      status: connectionStatus.connected ? 'success' : 'error',
      message: connectionStatus.connected ? '데이터베이스 연결 성공' : '데이터베이스 연결 실패',
      error: errorMsg,
      serverInfo: connectionStatus.serverInfo,
      databaseInfo: {
        connectionString: process.env.NODE_ENV === 'development' 
          ? process.env.DATABASE_URL?.replace(/:.+@/, ':****@') 
          : '보안상 이유로 표시하지 않음',
        database: process.env.POSTGRES_DATABASE || 'postgres',
        schema: process.env.POSTGRES_SCHEMA || 'public',
        host: process.env.POSTGRES_HOST || 'unknown',
        port: process.env.POSTGRES_PORT || 'unknown'
      },
      dataCount: connectionStatus.connected ? dataCount : undefined,
      env: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('오류 발생:', error);
    return res.status(500).json({
      status: 'error',
      message: '처리 중 오류가 발생했습니다.',
      error: String(error)
    });
  }
} 