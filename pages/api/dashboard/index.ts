import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // 이슈 상태별 카운트 조회
    const statusCounts = await prisma.issue.groupBy({
      by: ['statusId'],
      _count: {
        id: true
      }
    });

    // 각 상태에 대한 이름 조회
    const statuses = await prisma.status.findMany();
    const statusMap = statuses.reduce((acc, status) => {
      acc[status.id] = status.name;
      return acc;
    }, {} as Record<number, string>);

    // 상태별 카운트 정리
    const summary = {
      open: 0,
      inProgress: 0, 
      resolved: 0,
      closed: 0,
      total: 0
    };

    statusCounts.forEach(count => {
      const statusName = statusMap[count.statusId];
      
      if (statusName === 'OPEN') summary.open = count._count.id;
      else if (statusName === 'IN_PROGRESS') summary.inProgress = count._count.id;
      else if (statusName === 'RESOLVED') summary.resolved = count._count.id;
      else if (statusName === 'CLOSED') summary.closed = count._count.id;
      
      summary.total += count._count.id;
    });

    // 최근 이슈 가져오기
    const recentIssues = await prisma.issue.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        status: true,
        priority: true,
        category: true,
        department: true,
        creator: true,
        assignee: true,
      }
    });

    const formattedIssues = recentIssues.map(issue => ({
      id: issue.id,
      issueId: `ISS-${issue.id.toString().padStart(3, '0')}`,
      title: issue.title,
      description: issue.description,
      status: issue.status.name,
      statusLabel: issue.status.label,
      priority: issue.priority.name,
      priorityLabel: issue.priority.label,
      category: issue.category.name,
      categoryLabel: issue.category.label,
      department: issue.department.name,
      departmentLabel: issue.department.label,
      createdAt: issue.createdAt.toISOString(),
      dueDate: issue.dueDate ? issue.dueDate.toISOString() : null,
      creator: issue.creator ? {
        id: issue.creator.id,
        employeeId: issue.creator.employeeId,
        name: issue.creator.koreanName,
        department: issue.creator.departmentId.toString()
      } : null,
      assignee: issue.assignee ? {
        id: issue.assignee.id,
        employeeId: issue.assignee.employeeId,
        name: issue.assignee.koreanName,
        department: issue.assignee.departmentId.toString()
      } : null
    }));

    // 부서별 이슈 카운트
    const departmentCounts = await prisma.issue.groupBy({
      by: ['departmentId'],
      _count: {
        id: true
      }
    });

    // 각 부서에 대한 이름 조회
    const departments = await prisma.department.findMany();
    const departmentMap = departments.reduce((acc, dept) => {
      acc[dept.id] = { name: dept.name, label: dept.label };
      return acc;
    }, {} as Record<number, { name: string, label: string }>);

    const issuesByDepartment = departmentCounts.map(item => ({
      id: item.departmentId,
      name: departmentMap[item.departmentId].name,
      label: departmentMap[item.departmentId].label,
      count: item._count.id
    }));

    // 카테고리별 이슈 카운트
    const categoryCounts = await prisma.issue.groupBy({
      by: ['categoryId'],
      _count: {
        id: true
      }
    });

    // 각 카테고리에 대한 이름 조회
    const categories = await prisma.category.findMany();
    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = { name: cat.name, label: cat.label };
      return acc;
    }, {} as Record<number, { name: string, label: string }>);

    const issuesByCategory = categoryCounts.map(item => ({
      id: item.categoryId,
      name: categoryMap[item.categoryId].name,
      label: categoryMap[item.categoryId].label,
      count: item._count.id
    }));

    // 응답 반환
    return res.status(200).json({
      issueSummary: summary,
      recentIssues: formattedIssues,
      issuesByDepartment,
      issuesByCategory
    });
  } catch (error) {
    console.error('대시보드 데이터 조회 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
} 