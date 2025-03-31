import { NextApiRequest, NextApiResponse } from 'next';
import { invalidateCache } from '@/lib/i18n/dynamic-translator';

// 임시 번역 데이터 참조 (실제로는 index.ts에서 관리하는 데이터를 공유해야 함)
// 이 부분은 실제 구현에서는 데이터베이스 또는 공유 상태로 대체해야 합니다
import { translationsStore } from './index';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '유효한 ID가 제공되지 않았습니다.' });
  }
  
  const translationId = parseInt(id);
  
  // ID로 번역 찾기
  const translationIndex = translationsStore.findIndex(t => t.id === translationId);
  
  if (translationIndex === -1) {
    return res.status(404).json({ error: '해당 번역을 찾을 수 없습니다.' });
  }

  switch (method) {
    case 'GET':
      return getTranslation(translationIndex, res);
    case 'PUT':
      return updateTranslation(req, translationIndex, res);
    case 'DELETE':
      return deleteTranslation(translationIndex, res);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

/**
 * 단일 번역 조회
 */
function getTranslation(index: number, res: NextApiResponse) {
  try {
    const translation = translationsStore[index];
    return res.status(200).json({ translation });
  } catch (error) {
    console.error('번역 조회 중 오류:', error);
    return res.status(500).json({ error: '번역을 조회하는 중 오류가 발생했습니다.' });
  }
}

/**
 * 번역 수정
 */
async function updateTranslation(req: NextApiRequest, index: number, res: NextApiResponse) {
  try {
    const data = req.body;
    
    if (!data.translation) {
      return res.status(400).json({ error: '번역 내용은 필수 항목입니다.' });
    }
    
    // 번역 업데이트
    translationsStore[index].translation = data.translation;
    
    // 다른 필드도 업데이트 (있는 경우)
    if (data.key) translationsStore[index].key = data.key;
    if (data.category) translationsStore[index].category = data.category;
    
    const translation = translationsStore[index];
    
    // 캐시 무효화
    await invalidateCache();
    
    return res.status(200).json({
      success: true,
      message: '번역이 성공적으로 수정되었습니다.',
      translation
    });
  } catch (error) {
    console.error('번역 수정 중 오류:', error);
    return res.status(500).json({ error: '번역을 수정하는 중 오류가 발생했습니다.' });
  }
}

/**
 * 번역 삭제
 */
async function deleteTranslation(index: number, res: NextApiResponse) {
  try {
    // 번역 삭제
    translationsStore.splice(index, 1);
    
    // 캐시 무효화
    await invalidateCache();
    
    return res.status(200).json({
      success: true,
      message: '번역이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('번역 삭제 중 오류:', error);
    return res.status(500).json({ error: '번역을 삭제하는 중 오류가 발생했습니다.' });
  }
} 