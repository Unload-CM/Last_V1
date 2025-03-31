// NextAuth providers API endpoint
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

/**
 * NextAuth providers API endpoint
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export default async function handler(req, res) {
  try {
    // 참고: getProviders는 클라이언트 사이드 함수이므로 서버 API에서 직접 사용 불가
    // 대신 authOptions에서 providers 정보를 직접 추출
    
    // 설정된 인증 제공자 정보 반환
    const providers = authOptions.providers.reduce((acc, provider) => {
      acc[provider.id] = {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        signinUrl: `/api/auth/signin/${provider.id}`,
        callbackUrl: `/api/auth/callback/${provider.id}`
      };
      return acc;
    }, {});
    
    res.status(200).json(providers);
  } catch (error) {
    console.error('Providers API 오류:', error);
    res.status(500).json({ error: '로그인 제공자 정보를 불러오는데 실패했습니다.' });
  }
} 