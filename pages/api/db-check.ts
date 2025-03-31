// 디버깅 목적의 파일 - 데이터베이스 연결 확인용
import { NextApiRequest, NextApiResponse } from 'next';
import { checkDatabaseConnection } from '@/lib/prisma';

/**
 * 데이터베이스 연결 상태를 확인하는 API 엔드포인트
 * 
 * @route GET /api/db-check
 * @access 개발 환경에서만 접근 가능
 * @returns {object} 데이터베이스 연결 상태 및 메시지
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('DB 체크 API 호출됨');

  // GET 요청만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
  }

  try {
    // 데이터베이스 연결 확인
    const connectionResult = await checkDatabaseConnection();

    if (connectionResult.connected) {
      return res.status(200).json({
        success: true,
        message: connectionResult.message,
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        success: false,
        message: connectionResult.message,
        error: connectionResult.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('API 처리 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 내부 오류',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
} 