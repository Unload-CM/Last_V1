import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // URL에서 language 쿼리 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ko';
    
    // 지원하는 언어 확인
    if (!['ko', 'en', 'th'].includes(language)) {
      return NextResponse.json(
        { error: 'Unsupported language' },
        { status: 400 }
      );
    }
    
    // 메뉴얼 파일 경로 (documents 폴더 내의 manual_xx.md 파일)
    let fileName = '';
    
    switch (language) {
      case 'ko':
        fileName = 'manual_ko.md';
        break;
      case 'en':
        fileName = 'manual_en.md';
        break;
      case 'th':
        fileName = 'manual_th.md';
        break;
      default:
        fileName = 'manual_ko.md';
    }
    
    // 파일 경로 생성
    const filePath = path.join(process.cwd(), 'documents', fileName);
    
    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: `Manual file not found: ${fileName}` },
        { status: 404 }
      );
    }
    
    // 파일 읽기
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 응답 반환
    return NextResponse.json({ content: fileContent });
  } catch (error) {
    console.error('메뉴얼 파일 읽기 오류:', error);
    return NextResponse.json(
      { error: 'Failed to read manual file' },
      { status: 500 }
    );
  }
} 