import { NextApiRequest, NextApiResponse } from 'next';
import { prisma, checkDatabaseConnection } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 데이터베이스 연결 확인
    const connectionStatus = await checkDatabaseConnection();
    
    if (!connectionStatus.connected) {
      return res.status(500).json({
        status: 'error',
        message: '데이터베이스 연결에 실패했습니다.',
        error: connectionStatus.error
      });
    }

    // 기본 데이터 확인
    const statusCount = await prisma.status.count();
    const priorityCount = await prisma.priority.count();
    const categoryCount = await prisma.category.count();
    const departmentCount = await prisma.department.count();
    const employeeCount = await prisma.employee.count();
    const issueCount = await prisma.issue.count();

    return res.status(200).json({
      status: 'success',
      message: '데이터베이스 연결 성공',
      databaseInfo: {
        connectionString: process.env.NODE_ENV === 'development' 
          ? process.env.DATABASE_URL?.replace(/:.+@/, ':****@') 
          : '보안상 이유로 표시하지 않음',
        database: process.env.POSTGRES_DATABASE || 'postgres',
        schema: process.env.POSTGRES_SCHEMA || 'public'
      },
      dataCount: {
        status: statusCount,
        priority: priorityCount,
        category: categoryCount,
        department: departmentCount,
        employee: employeeCount,
        issue: issueCount
      }
    });
  } catch (error) {
    console.error('데이터베이스 연결 확인 중 오류 발생:', error);
    return res.status(500).json({
      status: 'error',
      message: '데이터베이스 연결 확인 중 오류가 발생했습니다.',
      error: String(error)
    });
  }
} 