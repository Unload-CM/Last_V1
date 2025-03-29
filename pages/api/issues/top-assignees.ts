import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // const limit = parseInt(req.query.limit as string) || 3;

    // const topAssignees = await prisma.issue.groupBy({
    //   by: ['assigneeId'],
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

    // // 담당자 정보 가져오기
    // const assigneeIds = topAssignees.map(assignee => assignee.assigneeId).filter(id => id !== null);
    // const assignees = await prisma.employee.findMany({
    //   where: {
    //     id: {
    //       in: assigneeIds,
    //     },
    //   },
    //   select: {
    //     id: true,
    //     employeeId: true,
    //     koreanName: true,
    //     department: {
    //       select: {
    //         name: true,
    //       },
    //     },
    //   },
    // });

    // // 결과 조합
    // const result = topAssignees.map(assignee => {
    //   const assigneeInfo = assignees.find(a => a.id === assignee.assigneeId);
    //   return {
    //     id: assignee.assigneeId,
    //     employeeId: assigneeInfo?.employeeId || '',
    //     name: assigneeInfo?.koreanName || '',
    //     department: assigneeInfo?.department?.name || '',
    //     assignedCount: assignee._count.id,
    //   };
    // }).filter(item => item.id !== null);

    // 임시 데이터 반환
    const mockAssignees = [
      { id: 1, employeeId: 'emp001', name: '김철수', department: '생산부', assignedCount: 10 },
      { id: 2, employeeId: 'emp002', name: '이영희', department: '품질관리부', assignedCount: 7 },
      { id: 3, employeeId: 'emp003', name: '박지성', department: '자재관리', assignedCount: 4 },
    ];

    return res.status(200).json({ topAssignees: mockAssignees });
  } catch (error) {
    console.error('이슈 담당자 통계 조회 오류:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 