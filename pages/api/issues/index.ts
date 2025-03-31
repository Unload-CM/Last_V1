import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // 쿼리 파라미터
      const { limit = 50, page = 1, status, priority, category, department } = req.query;
      const pageSize = parseInt(limit as string) || 50;
      const currentPage = parseInt(page as string) || 1;
      const offset = (currentPage - 1) * pageSize;

      // 쿼리 빌드
      let query = supabase
        .from('issues')
        .select(`
          *,
          status:status_id (id, name, label),
          priority:priority_id (id, name, label),
          category:category_id (id, name, label),
          department:department_id (id, name, label),
          assignee:assignee_id (id, employee_id, korean_name),
          creator:created_by_id (id, employee_id, korean_name)
        `, { count: 'exact' });

      // 필터 적용
      if (status) {
        query = query.eq('status.name', status);
      }
      if (priority) {
        query = query.eq('priority.name', priority);
      }
      if (category) {
        query = query.eq('category.name', category);
      }
      if (department) {
        query = query.eq('department.name', department);
      }

      // 정렬 및 페이징
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('이슈 목록 조회 오류:', error);
        return res.status(500).json({ error: '이슈 목록을 불러오는데 실패했습니다.' });
      }

      // 데이터 형식 변환
      const issues = data.map(issue => ({
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
        department: issue.department.label,
        createdAt: issue.created_at,
        dueDate: issue.due_date,
        creator: issue.creator ? {
          id: issue.creator.id,
          employeeId: issue.creator.employee_id,
          name: issue.creator.korean_name
        } : null,
        assignee: issue.assignee ? {
          id: issue.assignee.id,
          employeeId: issue.assignee.employee_id,
          name: issue.assignee.korean_name
        } : null
      }));

      return res.status(200).json({
        issues,
        pagination: {
          total: count || 0,
          page: currentPage,
          pageSize: pageSize
        }
      });
    } catch (error) {
      console.error('요청 처리 중 오류가 발생했습니다:', error);
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  } else if (req.method === 'POST') {
    try {
      const { 
        title, 
        description, 
        statusId, 
        priorityId, 
        categoryId, 
        departmentId, 
        assigneeId, 
        createdById 
      } = req.body;

      // 필수 입력값 검증
      if (!title || !statusId || !priorityId || !categoryId || !departmentId) {
        return res.status(400).json({ error: '필수 입력값이 누락되었습니다.' });
      }

      // 이슈 추가
      const { data, error } = await supabase
        .from('issues')
        .insert({
          title,
          description,
          status_id: statusId,
          priority_id: priorityId,
          category_id: categoryId,
          department_id: departmentId,
          assignee_id: assigneeId || null,
          created_by_id: createdById || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('이슈 추가 오류:', error);
        return res.status(500).json({ error: '이슈 등록에 실패했습니다.' });
      }

      return res.status(201).json({
        message: '이슈가 성공적으로 등록되었습니다.',
        issue: {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description,
          statusId: data[0].status_id,
          priorityId: data[0].priority_id,
          categoryId: data[0].category_id,
          departmentId: data[0].department_id,
          assigneeId: data[0].assignee_id,
          createdById: data[0].created_by_id,
          createdAt: data[0].created_at
        }
      });
    } catch (error) {
      console.error('요청 처리 중 오류가 발생했습니다:', error);
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  } else {
    // 지원하지 않는 메서드
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 