import { NextApiRequest, NextApiResponse } from 'next';
import { translationsStore } from './index';

/**
 * 번역 키 목록을 가져오는 API 엔드포인트
 * GET /api/translations/keys
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { category } = req.query;
    
    // 모든 번역에서 고유한 키 추출
    let translations = [...translationsStore];
    
    // 카테고리 필터링 (있는 경우)
    if (category && typeof category === 'string') {
      translations = translations.filter(t => t.category === category);
    }
    
    // 고유한 키 추출 (Set 사용하여 중복 제거)
    const keySet = new Set<string>();
    translations.forEach(t => keySet.add(t.key));
    
    // Set을 배열로 변환하고 정렬
    const keys = Array.from(keySet).sort();
    
    console.log(`${keys.length}개의 번역 키 조회됨`);
    
    return res.status(200).json({ keys });
  } catch (error) {
    console.error('번역 키 목록 조회 중 오류:', error);
    return res.status(500).json({ error: '번역 키 목록을 불러오는 중 오류가 발생했습니다.' });
  }
} 