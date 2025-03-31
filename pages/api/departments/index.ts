import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // 부서 목록 조회
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('label', { ascending: true });

      if (error) {
        console.error('부서 목록 조회 오류:', error);
        return res.status(500).json({ error: '부서 목록을 불러오는데 실패했습니다.' });
      }

      // 데이터 형식 변환
      const departments = data.map(dept => ({
        id: dept.id,
        name: dept.name,
        label: dept.label,
        description: dept.description
      }));

      return res.status(200).json({ departments });
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