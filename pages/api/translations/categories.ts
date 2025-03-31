import { NextApiRequest, NextApiResponse } from 'next';
import { translationsStore } from './index';

/**
 * 카테고리 목록을 가져오는 API 엔드포인트
 * GET /api/translations/categories
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // 모든 번역에서 고유한 카테고리 추출 (Set 사용하여 중복 제거)
    const categorySet = new Set<string>();
    translationsStore.forEach(t => categorySet.add(t.category));
    
    // Set을 배열로 변환하고 정렬
    const categories = Array.from(categorySet).sort();
    
    console.log(`${categories.length}개의 카테고리 조회됨`);
    
    return res.status(200).json({ categories });
  } catch (error) {
    console.error('카테고리 목록 조회 중 오류:', error);
    return res.status(500).json({ error: '카테고리 목록을 불러오는 중 오류가 발생했습니다.' });
  }
}