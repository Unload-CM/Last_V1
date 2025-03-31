import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // 직원 목록 조회
      const { data, error, count } = await supabase
        .from('employees')
        .select(`
          *,
          department:department_id (
            id,
            name,
            label
          )
        `)
        .order('korean_name', { ascending: true });

      if (error) {
        console.error('직원 목록 조회 오류:', error);
        return res.status(500).json({ error: '직원 목록을 불러오는데 실패했습니다.' });
      }

      // 데이터 형식 변환
      const employees = data.map(employee => ({
        id: employee.id,
        employeeId: employee.employee_id,
        name: employee.korean_name,
        departmentId: employee.department_id,
        department: employee.department.label,
        position: employee.is_admin ? '관리자' : employee.position || '사원',
        isAdmin: employee.is_admin
      }));

      return res.status(200).json({
        employees,
        pagination: {
          total: count || employees.length,
          page: 1,
          pageSize: employees.length
        }
      });
    } catch (error) {
      console.error('요청 처리 중 오류가 발생했습니다:', error);
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  } else if (req.method === 'POST') {
    try {
      const { employeeId, name, departmentId, position, isAdmin } = req.body;

      // 필수 입력값 검증
      if (!employeeId || !name || !departmentId) {
        return res.status(400).json({ error: '필수 입력값이 누락되었습니다.' });
      }

      // 직원 추가
      const { data, error } = await supabase
        .from('employees')
        .insert({
          employee_id: employeeId,
          korean_name: name,
          department_id: departmentId,
          position: position || null,
          is_admin: isAdmin || false,
          is_thai: false,
          password: '0000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('직원 추가 오류:', error);
        return res.status(500).json({ error: '직원 등록에 실패했습니다.' });
      }

      return res.status(201).json({
        message: '직원이 성공적으로 등록되었습니다.',
        employee: {
          id: data[0].id,
          employeeId: data[0].employee_id,
          name: data[0].korean_name,
          departmentId: data[0].department_id,
          position: data[0].position || '사원',
          isAdmin: data[0].is_admin
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