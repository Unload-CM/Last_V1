// NextAuth providers API endpoint
import { getProviders } from 'next-auth/react';

/**
 * NextAuth providers API endpoint - 루트 경로 버전
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export default async function handler(req, res) {
  try {
    const providers = await getProviders();
    res.status(200).json(providers || {});
  } catch (error) {
    console.error('Providers API 오류:', error);
    res.status(500).json({ error: '로그인 제공자 정보를 불러오는데 실패했습니다.' });
  }
} 