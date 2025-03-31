import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // 상태 목록 조회
      const { data: statusData, error: statusError } = await supabase
        .from('statuses')
        .select('*')
        .order('id', { ascending: true });

      if (statusError) {
        console.error('상태 목록 조회 오류:', statusError);
        return res.status(500).json({ error: '상태 목록을 불러오는데 실패했습니다.' });
      }

      // 우선순위 목록 조회
      const { data: priorityData, error: priorityError } = await supabase
        .from('priorities')
        .select('*')
        .order('id', { ascending: true });

      if (priorityError) {
        console.error('우선순위 목록 조회 오류:', priorityError);
        return res.status(500).json({ error: '우선순위 목록을 불러오는데 실패했습니다.' });
      }

      // 카테고리 목록 조회
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .order('label', { ascending: true });

      if (categoryError) {
        console.error('카테고리 목록 조회 오류:', categoryError);
        return res.status(500).json({ error: '카테고리 목록을 불러오는데 실패했습니다.' });
      }

      // 데이터 형식 변환
      const statuses = statusData.map(status => ({
        id: status.id,
        name: status.name,
        label: status.label,
        description: status.description
      }));

      const priorities = priorityData.map(priority => ({
        id: priority.id,
        name: priority.name,
        label: priority.label,
        description: priority.description
      }));

      const categories = categoryData.map(category => ({
        id: category.id,
        name: category.name,
        label: category.label,
        description: category.description
      }));

      return res.status(200).json({
        statuses,
        priorities,
        categories
      });
    } catch (error) {
      console.error('요청 처리 중 오류가 발생했습니다:', error);
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  } else {
    // 지원하지 않는 메서드
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 