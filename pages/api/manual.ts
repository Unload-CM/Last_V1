import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  try {
    // 쿼리 파라미터에서 언어 가져오기
    const { language = 'ko' } = req.query;
    const lang = Array.isArray(language) ? language[0] : language;
    
    // 지원하는 언어 목록
    const supportedLanguages = ['ko', 'en', 'th'];
    
    // 언어 유효성 검사
    if (!supportedLanguages.includes(lang)) {
      return res.status(400).json({ error: '지원하지 않는 언어입니다.' });
    }
    
    // 매뉴얼 파일 경로
    const manualFile = path.join(process.cwd(), 'public', 'manuals', `manual_${lang}.md`);
    
    // 파일 존재 여부 확인
    if (!fs.existsSync(manualFile)) {
      // 파일이 없는 경우 기본 언어(한국어)로 대체
      const defaultManualFile = path.join(process.cwd(), 'public', 'manuals', 'manual_ko.md');
      
      if (!fs.existsSync(defaultManualFile)) {
        return res.status(404).json({ error: '매뉴얼 파일을 찾을 수 없습니다.' });
      }
      
      const content = fs.readFileSync(defaultManualFile, 'utf8');
      return res.status(200).json({ content, language: 'ko' });
    }
    
    // 매뉴얼 파일 읽기
    const content = fs.readFileSync(manualFile, 'utf8');
    
    return res.status(200).json({ content, language: lang });
  } catch (error) {
    console.error('매뉴얼 파일 로드 중 오류:', error);
    return res.status(500).json({ error: '매뉴얼 파일을 로드하는 중 오류가 발생했습니다.' });
  }
} 