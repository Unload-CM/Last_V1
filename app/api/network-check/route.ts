import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import os from 'os';

// 네트워크 인터페이스 정보 가져오기
function getNetworkInfo() {
  const networkInterfaces = os.networkInterfaces();
  const result: any = {};
  
  Object.keys(networkInterfaces).forEach((name) => {
    const interfaces = networkInterfaces[name];
    if (interfaces) {
      result[name] = interfaces.map(iface => ({
        address: iface.address,
        family: iface.family,
        internal: iface.internal,
      }));
    }
  });
  
  return result;
}

// GET 요청 처리
export async function GET(req: NextRequest) {
  try {
    // 클라이언트 IP 주소 가져오기
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(/, /)[0] : req.ip || "unknown";
    
    // 유저 에이전트(브라우저/기기 정보) 가져오기
    const userAgent = req.headers.get("user-agent") || "Unknown";
    
    // 서버 정보
    const serverInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      networkInterfaces: getNetworkInfo(),
    };
    
    // 현재 시간
    const timestamp = new Date().toISOString();
    
    // 응답 데이터
    const data = {
      message: "Network check successful",
      client: {
        ip,
        userAgent,
      },
      server: serverInfo,
      timestamp,
    };
    
    // 로그 출력
    console.log(`네트워크 체크 - 클라이언트: ${ip}, 유저에이전트: ${userAgent}`);
    
    // 성공 응답 반환
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("네트워크 체크 중 오류:", error);
    
    // 오류 응답 반환
    return NextResponse.json({ 
      error: "네트워크 체크 중 오류가 발생했습니다.",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 