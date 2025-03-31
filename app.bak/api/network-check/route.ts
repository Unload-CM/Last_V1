import { NextRequest, NextResponse } from 'next/server';
import os from 'os';

// 정적 생성 사용하지 않음 (항상 동적 경로로 처리)
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

/**
 * 네트워크 연결 확인 API
 * GET /api/network-check
 */
export async function GET(request: NextRequest) {
  try {
    // 서버의 현재 시간과 함께 응답을 반환
    const now = new Date();
    
    // 클라이언트의 IP 주소를 가져옴
    const headers = request.headers;
    const clientIp = headers.get('x-real-ip') || 
                     headers.get('x-forwarded-for') || 
                     'unknown';
    
    // 유저 에이전트(브라우저/기기 정보) 가져오기
    const userAgent = headers.get("user-agent") || "Unknown";
    
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
    
    // 응답 데이터
    const data = {
      status: 'ok',
      message: '네트워크 연결이 정상입니다.',
      serverTime: now.toISOString(),
      clientIp,
      userAgent,
      server: serverInfo,
      timestamp,
    };
    
    // 로그 출력
    console.log(`네트워크 체크 - 클라이언트: ${clientIp}, 유저에이전트: ${userAgent}`);
    
    // 성공 응답 반환
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('네트워크 체크 중 오류:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: '네트워크 체크 중 오류가 발생했습니다.' 
      }, 
      { status: 500 }
    );
  }
} 