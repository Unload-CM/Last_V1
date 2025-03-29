import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// 이메일 설정 임시 저장 (Prisma 모델이 없으므로)
const DEFAULT_EMAIL_SETTINGS = {
  id: 1,
  emails: [],
  frequency: 'monthly',
  dayOfMonth: 'last',
  time: '9',
  reportContent: ['issueStatus', 'departmentStats', 'keyIssues', 'resolutionRate']
};

// 전역 변수로 설정 데이터 유지 (임시)
let emailSettings = { ...DEFAULT_EMAIL_SETTINGS };

/**
 * 이메일 설정 조회 API
 * GET /api/email-settings
 */
export async function GET(req: NextRequest) {
  try {
    console.log('이메일 설정 조회 API 호출됨');
    
    // 모델이 없으므로 메모리에서 설정 반환
    console.log('조회된 이메일 설정:', emailSettings);
    
    // 올바른 형식으로 응답 반환
    return NextResponse.json(emailSettings);
  } catch (error) {
    console.error('이메일 설정 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '이메일 설정을 조회하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 이메일 설정 저장 API
 * POST /api/email-settings
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log('이메일 설정 저장 요청 데이터:', data);
    
    // 필수 필드 검증
    if (!data.emails || !Array.isArray(data.emails)) {
      return NextResponse.json({ error: '이메일 목록은 필수 항목입니다.' }, { status: 400 });
    }
    
    // 메모리에 이메일 설정 업데이트
    emailSettings = {
      id: 1,
      emails: data.emails,
      frequency: data.frequency || 'monthly',
      dayOfMonth: data.dayOfMonth || 'last',
      time: data.time || '9',
      reportContent: data.reportContent || ['issueStatus']
    };
    
    console.log('저장된 이메일 설정:', emailSettings);
    
    return NextResponse.json({
      success: true,
      message: '이메일 설정이 성공적으로 저장되었습니다.',
      settings: emailSettings
    });
  } catch (error) {
    console.error('이메일 설정 저장 중 오류 발생:', error);
    return NextResponse.json(
      { error: '이메일 설정을 저장하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 