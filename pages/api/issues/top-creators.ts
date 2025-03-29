import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // const limit = parseInt(req.query.limit as string) || 5;

    // const topCreators = await prisma.issue.groupBy({
    //   by: ['createdById'],
    //   _count: {
    //     id: true,
    //   },
    //   orderBy: {
    //     _count: {
    //       id: 'desc',
    //     },
    //   },
    //   take: limit,
    // });

    // // 생성자 정보 가져오기
    // const creatorIds = topCreators.map(creator => creator.createdById);
    // const creators = await prisma.employee.findMany({
    //   where: {
    //     id: {
    //       in: creatorIds,
    //     },
    //   },
    //   select: {
    //     id: true,
    //     employeeId: true,
    //     koreanName: true,
    //     department: {
    //       select: {
    //         name: true,
    //       }
    //     },
    //   },
    // });

    // // 결과 조합
    // const result = topCreators.map(creator => {
    //   const creatorInfo = creators.find(c => c.id === creator.createdById);
    //   return {
    //     id: creator.createdById,
    //     employeeId: creatorInfo?.employeeId || '',
    //     name: creatorInfo?.koreanName || '',
    //     department: creatorInfo?.department?.name || '',
    //     createdCount: creator._count.id,
    //   };
    // });

    // 임시 데이터 반환
    const mockCreators = [
      { id: 1, employeeId: 'emp001', name: '김철수', department: '생산부', createdCount: 12 },
      { id: 2, employeeId: 'emp002', name: '이영희', department: '품질관리부', createdCount: 8 },
      { id: 3, employeeId: 'emp003', name: '박지성', department: '자재관리', createdCount: 5 },
    ];

    return res.status(200).json({ topCreators: mockCreators });
  } catch (error) {
    console.error('이슈 생성자 통계 조회 오류:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 