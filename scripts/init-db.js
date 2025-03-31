const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 관리자 키 사용
const supabase = createClient(supabaseUrl, supabaseKey);

async function initializeDatabase() {
  console.log('데이터베이스 초기화를 시작합니다...');

  // 1. 부서 테이블 생성 및 초기 데이터 삽입
  const departments = [
    { name: 'MANAGEMENT', label: '관리부', thaiLabel: '', description: '회사 전반적인 업무 관리' },
    { name: 'PRODUCTION', label: '생산부', thaiLabel: '', description: '제품 생산 담당' },
    { name: 'TECHNICAL', label: '기술부', thaiLabel: '', description: '기술 지원 및 개발' },
    { name: 'QUALITY', label: '품질부', thaiLabel: '', description: '품질 검사 및 관리' },
    { name: 'MAINTENANCE', label: '정비부', thaiLabel: '', description: '설비 유지 보수' }
  ];

  console.log('부서 데이터 삽입 중...');
  for (const dept of departments) {
    const { error } = await supabase
      .from('departments')
      .upsert(
        { 
          name: dept.name, 
          label: dept.label, 
          thaiLabel: dept.thaiLabel,
          description: dept.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { onConflict: 'name' }
      );

    if (error) {
      console.error(`부서 데이터 삽입 오류 (${dept.name}):`, error);
    }
  }

  // 2. 상태 테이블 생성 및 초기 데이터 삽입
  const statuses = [
    { name: 'OPEN', label: '미처리', thaiLabel: '', description: '아직 처리되지 않은 이슈' },
    { name: 'IN_PROGRESS', label: '처리중', thaiLabel: '', description: '처리 진행 중인 이슈' },
    { name: 'RESOLVED', label: '해결됨', thaiLabel: '', description: '해결된 이슈' },
    { name: 'CLOSED', label: '종료', thaiLabel: '', description: '종료된 이슈' }
  ];

  console.log('상태 데이터 삽입 중...');
  for (const status of statuses) {
    const { error } = await supabase
      .from('statuses')
      .upsert(
        { 
          name: status.name, 
          label: status.label, 
          thaiLabel: status.thaiLabel,
          description: status.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { onConflict: 'name' }
      );

    if (error) {
      console.error(`상태 데이터 삽입 오류 (${status.name}):`, error);
    }
  }

  // 3. 우선순위 테이블 생성 및 초기 데이터 삽입
  const priorities = [
    { name: 'HIGH', label: '높음', thaiLabel: '', description: '긴급한 이슈' },
    { name: 'MEDIUM', label: '중간', thaiLabel: '', description: '중요한 이슈' },
    { name: 'LOW', label: '낮음', thaiLabel: '', description: '일반적인 이슈' }
  ];

  console.log('우선순위 데이터 삽입 중...');
  for (const priority of priorities) {
    const { error } = await supabase
      .from('priorities')
      .upsert(
        { 
          name: priority.name, 
          label: priority.label, 
          thaiLabel: priority.thaiLabel,
          description: priority.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { onConflict: 'name' }
      );

    if (error) {
      console.error(`우선순위 데이터 삽입 오류 (${priority.name}):`, error);
    }
  }

  // 4. 카테고리 테이블 생성 및 초기 데이터 삽입
  const categories = [
    { name: 'EQUIPMENT', label: '설비', thaiLabel: '', description: '설비 관련 이슈' },
    { name: 'SOFTWARE', label: '소프트웨어', thaiLabel: '', description: '소프트웨어 관련 이슈' },
    { name: 'SAFETY', label: '안전', thaiLabel: '', description: '안전 관련 이슈' },
    { name: 'QUALITY', label: '품질', thaiLabel: '', description: '품질 관련 이슈' },
    { name: 'PRODUCTION', label: '생산', thaiLabel: '', description: '생산 관련 이슈' }
  ];

  console.log('카테고리 데이터 삽입 중...');
  for (const category of categories) {
    const { error } = await supabase
      .from('categories')
      .upsert(
        { 
          name: category.name, 
          label: category.label, 
          thaiLabel: category.thaiLabel,
          description: category.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { onConflict: 'name' }
      );

    if (error) {
      console.error(`카테고리 데이터 삽입 오류 (${category.name}):`, error);
    }
  }

  // 5. 직원 테이블 생성 및 초기 데이터 삽입
  // 먼저 부서 ID 조회
  console.log('부서 ID 조회 중...');
  const { data: deptData, error: deptError } = await supabase
    .from('departments')
    .select('id, name');

  if (deptError) {
    console.error('부서 데이터 조회 오류:', deptError);
    return;
  }

  const deptMap = {};
  deptData.forEach(dept => {
    deptMap[dept.name] = dept.id;
  });

  const employees = [
    { employeeId: 'EMP001', koreanName: '김관리', departmentName: 'MANAGEMENT', isAdmin: true },
    { employeeId: 'EMP002', koreanName: '이기술', departmentName: 'TECHNICAL', isAdmin: false },
    { employeeId: 'EMP003', koreanName: '박생산', departmentName: 'PRODUCTION', isAdmin: false },
    { employeeId: 'EMP004', koreanName: '최품질', departmentName: 'QUALITY', isAdmin: false },
    { employeeId: 'EMP005', koreanName: '정정비', departmentName: 'MAINTENANCE', isAdmin: false },
    { employeeId: 'EMP006', koreanName: '홍사원', departmentName: 'PRODUCTION', isAdmin: false },
    { employeeId: 'EMP007', koreanName: '강기사', departmentName: 'TECHNICAL', isAdmin: false },
    { employeeId: 'EMP008', koreanName: '조조장', departmentName: 'PRODUCTION', isAdmin: false }
  ];

  console.log('직원 데이터 삽입 중...');
  for (const emp of employees) {
    const departmentId = deptMap[emp.departmentName];
    if (!departmentId) {
      console.error(`부서를 찾을 수 없음: ${emp.departmentName}`);
      continue;
    }

    const { error } = await supabase
      .from('employees')
      .upsert(
        { 
          employeeId: emp.employeeId, 
          koreanName: emp.koreanName, 
          isAdmin: emp.isAdmin,
          departmentId: departmentId,
          password: '0000',
          isThai: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { onConflict: 'employeeId' }
      );

    if (error) {
      console.error(`직원 데이터 삽입 오류 (${emp.employeeId}):`, error);
    }
  }

  // 6. 이슈 데이터 삽입 준비
  // 필요한 ID 조회
  console.log('관련 ID 조회 중...');
  const { data: statusData, error: statusError } = await supabase
    .from('statuses')
    .select('id, name');

  if (statusError) {
    console.error('상태 데이터 조회 오류:', statusError);
    return;
  }

  const statusMap = {};
  statusData.forEach(status => {
    statusMap[status.name] = status.id;
  });

  const { data: priorityData, error: priorityError } = await supabase
    .from('priorities')
    .select('id, name');

  if (priorityError) {
    console.error('우선순위 데이터 조회 오류:', priorityError);
    return;
  }

  const priorityMap = {};
  priorityData.forEach(priority => {
    priorityMap[priority.name] = priority.id;
  });

  const { data: categoryData, error: categoryError } = await supabase
    .from('categories')
    .select('id, name');

  if (categoryError) {
    console.error('카테고리 데이터 조회 오류:', categoryError);
    return;
  }

  const categoryMap = {};
  categoryData.forEach(category => {
    categoryMap[category.name] = category.id;
  });

  const { data: employeeData, error: employeeError } = await supabase
    .from('employees')
    .select('id, employeeId');

  if (employeeError) {
    console.error('직원 데이터 조회 오류:', employeeError);
    return;
  }

  const employeeMap = {};
  employeeData.forEach(employee => {
    employeeMap[employee.employeeId] = employee.id;
  });

  // 7. 이슈 데이터 삽입
  const issues = [
    { 
      title: '생산 라인 1 모터 과열', 
      description: '생산 라인 1번의 메인 모터에서 과열 현상이 발견되었습니다.', 
      status: 'OPEN', 
      priority: 'HIGH', 
      category: 'EQUIPMENT', 
      department: 'PRODUCTION',
      createdBy: 'EMP001',
      assignee: 'EMP002',
      createdAt: '2024-03-29T00:00:00Z'
    },
    { 
      title: '소프트웨어 업데이트 필요', 
      description: '제어 시스템의 소프트웨어 업데이트가 필요합니다.', 
      status: 'IN_PROGRESS', 
      priority: 'MEDIUM', 
      category: 'SOFTWARE', 
      department: 'TECHNICAL',
      createdBy: 'EMP004',
      assignee: 'EMP007',
      createdAt: '2024-03-28T00:00:00Z'
    },
    { 
      title: '품질 검사 장비 고장', 
      description: 'A구역 품질 검사 장비가 정상 작동하지 않습니다.', 
      status: 'RESOLVED', 
      priority: 'HIGH', 
      category: 'EQUIPMENT', 
      department: 'QUALITY',
      createdBy: 'EMP003',
      assignee: 'EMP004',
      createdAt: '2024-03-27T00:00:00Z'
    },
    { 
      title: '안전 매뉴얼 업데이트', 
      description: '새로운 안전 규정에 맞게 매뉴얼 업데이트가 필요합니다.', 
      status: 'CLOSED', 
      priority: 'LOW', 
      category: 'SAFETY', 
      department: 'MANAGEMENT',
      createdBy: 'EMP005',
      assignee: 'EMP001',
      createdAt: '2024-03-26T00:00:00Z'
    },
    { 
      title: '생산 라인 2 정기 점검', 
      description: '생산 라인 2번의 정기 점검 일정 계획이 필요합니다.', 
      status: 'OPEN', 
      priority: 'MEDIUM', 
      category: 'MAINTENANCE', 
      department: 'PRODUCTION',
      createdBy: 'EMP006',
      assignee: 'EMP003',
      createdAt: '2024-03-25T00:00:00Z'
    },
    { 
      title: '정비 장비 교체 필요', 
      description: '노후화된 정비 장비의 교체가 필요합니다.', 
      status: 'OPEN', 
      priority: 'HIGH', 
      category: 'EQUIPMENT', 
      department: 'MAINTENANCE',
      createdBy: 'EMP001',
      assignee: 'EMP005',
      createdAt: '2024-03-24T00:00:00Z'
    },
    { 
      title: '생산량 감소 조사', 
      description: '최근 생산량이 감소하는 원인 조사가 필요합니다.', 
      status: 'IN_PROGRESS', 
      priority: 'HIGH', 
      category: 'PRODUCTION', 
      department: 'PRODUCTION',
      createdBy: 'EMP001',
      assignee: 'EMP008',
      createdAt: '2024-03-23T00:00:00Z'
    },
    { 
      title: '원자재 품질 이슈', 
      description: '최근 입고된 원자재의 품질 문제가 발견되었습니다.', 
      status: 'OPEN', 
      priority: 'HIGH', 
      category: 'QUALITY', 
      department: 'QUALITY',
      createdBy: 'EMP003',
      assignee: 'EMP004',
      createdAt: '2024-03-22T00:00:00Z'
    }
  ];

  console.log('이슈 데이터 삽입 중...');
  for (const issue of issues) {
    const departmentId = deptMap[issue.department];
    const statusId = statusMap[issue.status];
    const priorityId = priorityMap[issue.priority];
    const categoryId = categoryMap[issue.category];
    const createdById = employeeMap[issue.createdBy];
    const assigneeId = employeeMap[issue.assignee];

    if (!departmentId || !statusId || !priorityId || !categoryId) {
      console.error(`관련 데이터를 찾을 수 없음: ${issue.title}`);
      continue;
    }

    const { error } = await supabase
      .from('issues')
      .insert({ 
        title: issue.title, 
        description: issue.description, 
        departmentId: departmentId,
        statusId: statusId,
        priorityId: priorityId,
        categoryId: categoryId,
        createdById: createdById,
        assigneeId: assigneeId,
        createdAt: issue.createdAt,
        updatedAt: new Date().toISOString()
      });

    if (error) {
      console.error(`이슈 데이터 삽입 오류 (${issue.title}):`, error);
    }
  }

  console.log('데이터베이스 초기화가 완료되었습니다.');
}

// 데이터베이스 초기화 함수 실행
initializeDatabase()
  .then(() => {
    console.log('데이터베이스 초기화가 완료되었습니다.');
    process.exit(0);
  })
  .catch(error => {
    console.error('데이터베이스 초기화 중 오류가 발생했습니다:', error);
    process.exit(1);
  }); 