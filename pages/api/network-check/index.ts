import { NextApiRequest, NextApiResponse } from 'next';
import os from 'os';

/**
 * 네트워크 연결 확인 API
 * GET /api/network-check
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET 요청만 허용
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '지원하지 않는 메소드입니다.' });
  }

  try {
    // 서버의 현재 시간과 함께 응답을 반환
    const now = new Date();
    
    // 클라이언트의 IP 주소를 가져옴
    const headers = req.headers;
    const clientIp = headers['x-real-ip'] || 
                     headers['x-forwarded-for'] || 
                     req.socket.remoteAddress ||
                     'unknown';
    
    // 유저 에이전트(브라우저/기기 정보) 가져오기
    const userAgent = headers["user-agent"] || "Unknown";
    
    // 서버 정보
    const serverInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      cpus: os.cpus().length,
      memory: Math.floor(os.totalmem() / (1024 * 1024 * 1024)) + "GB",
      uptime: Math.floor(os.uptime() / 3600) + " hours",
    };
    
    // 타임스탬프
    const timestamp = new Date().toISOString();
    
    // 클라이언트 정보 처리
    const client = {
      ip: Array.isArray(clientIp) ? clientIp[0] : clientIp,
      userAgent
    };
    
    // 응답 데이터
    const data = {
      status: 'ok',
      message: '네트워크 연결이 정상입니다.',
      serverTime: now.toISOString(),
      server: serverInfo,
      client,
      timestamp,
    };
    
    // 로그 출력
    console.log(`네트워크 체크 - 클라이언트: ${client.ip}, 유저에이전트: ${userAgent}`);
    
    // 성공 응답 반환
    return res.status(200).json(data);
  } catch (error) {
    console.error('네트워크 체크 중 오류:', error);
    return res.status(500).json({ 
      status: 'error',
      error: '네트워크 체크 중 오류가 발생했습니다.' 
    });
  }
} 