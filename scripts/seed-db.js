const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('데이터베이스 시드 시작...');
    
    // 관리자 사용자 생성
    const admin = await prisma.user.create({
      data: {
        name: 'Thomas Cha',
        email: 'thomas@coilmaster.com',
        password: '0000',
        role: 'admin'
      }
    }).catch(e => {
      if (e.code === 'P2002') {
        console.log('관리자 사용자가 이미 존재합니다.');
        return prisma.user.findUnique({
          where: { email: 'thomas@coilmaster.com' }
        });
      }
      throw e;
    });
    
    console.log('관리자 사용자:', admin);
    
    // 부서 생성
    const departments = [
      { name: 'production', description: '제품 생산 담당' },
      { name: 'quality', description: '품질 검사 및 관리 담당' },
      { name: 'logistics', description: '물류 및 재고 관리 담당' },
      { name: 'engineering', description: '연구 개발 담당' },
      { name: 'management', description: '경영 지원 담당' },
      { name: 'management_support', description: '경영 담당' }
    ];
    
    for (const dept of departments) {
      await prisma.department.create({
        data: dept
      }).catch(e => {
        if (e.code === 'P2002') {
          console.log(`부서 '${dept.name}'가 이미 존재합니다.`);
          return;
        }
        console.error(`부서 '${dept.name}' 생성 중 오류:`, e);
      });
    }
    
    console.log('부서 생성 완료');
    
    // 카테고리 생성
    const categories = [
      { name: 'equipment' },
      { name: 'software_error' },
      { name: 'inventory_shortage' },
      { name: 'quality_issue' },
      { name: 'safety_issue' }
    ];
    
    for (const cat of categories) {
      await prisma.category.create({
        data: cat
      }).catch(e => {
        if (e.code === 'P2002') {
          console.log(`카테고리 '${cat.name}'가 이미 존재합니다.`);
          return;
        }
        console.error(`카테고리 '${cat.name}' 생성 중 오류:`, e);
      });
    }
    
    console.log('카테고리 생성 완료');
    
    // Status 생성
    const statuses = [
      { name: 'open', label: 'Open', description: 'Newly created issue' },
      { name: 'in_progress', label: 'In Progress', description: 'Issue being handled' },
      { name: 'resolved', label: 'Resolved', description: 'Issue has been resolved' },
      { name: 'closed', label: 'Closed', description: 'Issue has been closed' }
    ];

    for (const status of statuses) {
      await prisma.status.create({
        data: status
      }).catch(e => {
        if (e.code === 'P2002') {
          console.log(`Status '${status.name}' already exists.`);
          return;
        }
        console.error(`Error creating status '${status.name}':`, e);
      });
    }

    console.log('Status creation completed');

    // Priority 생성
    const priorities = [
      { name: 'critical', label: 'Critical', description: 'Requires immediate attention' },
      { name: 'high', label: 'High', description: 'High priority issue' },
      { name: 'medium', label: 'Medium', description: 'Normal priority issue' },
      { name: 'low', label: 'Low', description: 'Low priority issue' }
    ];

    for (const priority of priorities) {
      await prisma.priority.create({
        data: priority
      }).catch(e => {
        if (e.code === 'P2002') {
          console.log(`Priority '${priority.name}' already exists.`);
          return;
        }
        console.error(`Error creating priority '${priority.name}':`, e);
      });
    }

    console.log('Priority creation completed');
    
    // 직원 생성
    const employees = [
      {
        employeeId: 'EMP001',
        name: '김철수',
        position: 'manager',
        department: 'production',
        contact: '010-1234-5678',
        email: 'kim@example.com',
        hireDate: new Date('2020-01-15')
      },
      {
        employeeId: 'EMP002',
        name: '이영희',
        position: 'employee',
        department: 'quality',
        contact: '010-2345-6789',
        email: 'lee@example.com',
        hireDate: new Date('2021-03-20')
      },
      {
        employeeId: 'EMP003',
        name: '박지성',
        position: 'employee',
        department: 'logistics',
        contact: '010-3456-7890',
        email: 'park@example.com',
        hireDate: new Date('2022-05-10')
      },
      {
        employeeId: 'TCME0001',
        name: 'Thomas Cha',
        position: 'manager',
        department: 'management_support',
        contact: '010-5656-1608',
        email: 'thomas.cha@example.com',
        hireDate: new Date('2000-02-12')
      },
      {
        employeeId: 'TCME0002',
        name: 'Eric Cha',
        position: 'manager',
        department: 'management_support',
        contact: '010-111-1111',
        email: 'eric.cha@example.com',
        hireDate: new Date('2000-01-01')
      },
      {
        employeeId: 'TCME0003',
        name: 'Toy',
        position: 'manager',
        department: 'production',
        contact: '010-111-1111',
        email: 'toy@example.com',
        hireDate: new Date('2025-03-16')
      },
      {
        employeeId: 'TCME0004',
        name: 'Sam',
        position: 'manager',
        department: 'production',
        contact: '010-111-1111',
        email: 'sam@example.com',
        hireDate: new Date('2025-03-16')
      }
    ];
    
    for (const emp of employees) {
      await prisma.employee.create({
        data: emp
      }).catch(e => {
        if (e.code === 'P2002') {
          console.log(`직원 '${emp.name}(${emp.email})'가 이미 존재합니다.`);
          return;
        }
        console.error(`직원 '${emp.name}' 생성 중 오류:`, e);
      });
    }
    
    console.log('직원 생성 완료');
    
    // 번역 데이터 추가
    const translations = [
      // 상태 번역 - 한국어
      { key: 'status.open', language: 'ko', translation: '열림', category: 'status' },
      { key: 'status.in_progress', language: 'ko', translation: '진행 중', category: 'status' },
      { key: 'status.resolved', language: 'ko', translation: '해결됨', category: 'status' },
      { key: 'status.closed', language: 'ko', translation: '종료', category: 'status' },
      { key: 'status.open.description', language: 'ko', translation: '새로 등록된 이슈', category: 'status_description' },
      { key: 'status.in_progress.description', language: 'ko', translation: '처리 중인 이슈', category: 'status_description' },
      { key: 'status.resolved.description', language: 'ko', translation: '해결된 이슈', category: 'status_description' },
      { key: 'status.closed.description', language: 'ko', translation: '종료된 이슈', category: 'status_description' },

      // 상태 번역 - 태국어
      { key: 'status.open', language: 'th', translation: 'เปิด', category: 'status' },
      { key: 'status.in_progress', language: 'th', translation: 'กำลังดำเนินการ', category: 'status' },
      { key: 'status.resolved', language: 'th', translation: 'แก้ไขแล้ว', category: 'status' },
      { key: 'status.closed', language: 'th', translation: 'ปิด', category: 'status' },
      { key: 'status.open.description', language: 'th', translation: 'ปัญหาที่สร้างขึ้นใหม่', category: 'status_description' },
      { key: 'status.in_progress.description', language: 'th', translation: 'กำลังดำเนินการแก้ไข', category: 'status_description' },
      { key: 'status.resolved.description', language: 'th', translation: 'ปัญหาได้รับการแก้ไขแล้ว', category: 'status_description' },
      { key: 'status.closed.description', language: 'th', translation: 'ปัญหาได้ถูกปิด', category: 'status_description' },

      // 우선순위 번역 - 한국어
      { key: 'priority.critical', language: 'ko', translation: '심각', category: 'priority' },
      { key: 'priority.high', language: 'ko', translation: '높음', category: 'priority' },
      { key: 'priority.medium', language: 'ko', translation: '중간', category: 'priority' },
      { key: 'priority.low', language: 'ko', translation: '낮음', category: 'priority' },
      { key: 'priority.critical.description', language: 'ko', translation: '긴급 처리가 필요한 이슈', category: 'priority_description' },
      { key: 'priority.high.description', language: 'ko', translation: '높은 우선순위 이슈', category: 'priority_description' },
      { key: 'priority.medium.description', language: 'ko', translation: '보통 우선순위 이슈', category: 'priority_description' },
      { key: 'priority.low.description', language: 'ko', translation: '낮은 우선순위 이슈', category: 'priority_description' },

      // 우선순위 번역 - 태국어
      { key: 'priority.critical', language: 'th', translation: 'วิกฤต', category: 'priority' },
      { key: 'priority.high', language: 'th', translation: 'สูง', category: 'priority' },
      { key: 'priority.medium', language: 'th', translation: 'ปานกลาง', category: 'priority' },
      { key: 'priority.low', language: 'th', translation: 'ต่ำ', category: 'priority' },
      { key: 'priority.critical.description', language: 'th', translation: 'ต้องการการแก้ไขด่วน', category: 'priority_description' },
      { key: 'priority.high.description', language: 'th', translation: 'ปัญหาที่มีความสำคัญสูง', category: 'priority_description' },
      { key: 'priority.medium.description', language: 'th', translation: 'ปัญหาที่มีความสำคัญปานกลาง', category: 'priority_description' },
      { key: 'priority.low.description', language: 'th', translation: 'ปัญหาที่มีความสำคัญต่ำ', category: 'priority_description' },

      // 부서 번역 - 한국어
      { key: 'department.production', language: 'ko', translation: '생산부', category: 'department' },
      { key: 'department.quality', language: 'ko', translation: '품질관리부', category: 'department' },
      { key: 'department.logistics', language: 'ko', translation: '물류창고', category: 'department' },
      { key: 'department.engineering', language: 'ko', translation: '연구개발부', category: 'department' },
      { key: 'department.management', language: 'ko', translation: '경영지원부', category: 'department' },
      { key: 'department.management_support', language: 'ko', translation: '경영지', category: 'department' },
      
      // 부서 번역 - 태국어
      { key: 'department.production', language: 'th', translation: 'ฝ่ายการผลิต', category: 'department' },
      { key: 'department.quality', language: 'th', translation: 'ฝ่ายควบคุมคุณภาพ', category: 'department' },
      { key: 'department.logistics', language: 'th', translation: 'ฝ่ายคลังสินค้า', category: 'department' },
      { key: 'department.engineering', language: 'th', translation: 'ฝ่ายวิจัยและพัฒนา', category: 'department' },
      { key: 'department.management', language: 'th', translation: 'ฝ่ายบริหาร', category: 'department' },
      { key: 'department.management_support', language: 'th', translation: 'ฝ่ายสนับสนุนการจัดการ', category: 'department' },
      
      // 직책 번역 - 한국어
      { key: 'position.manager', language: 'ko', translation: '관리자', category: 'position' },
      { key: 'position.employee', language: 'ko', translation: '사원', category: 'position' },
      
      // 직책 번역 - 태국어
      { key: 'position.manager', language: 'th', translation: 'ผู้จัดการ', category: 'position' },
      { key: 'position.employee', language: 'th', translation: 'พนักงาน', category: 'position' },
      
      // 카테고리 번역 - 한국어
      { key: 'category.equipment', language: 'ko', translation: '설비', category: 'issue_category' },
      { key: 'category.software_error', language: 'ko', translation: '소프트웨어 오류', category: 'issue_category' },
      { key: 'category.inventory_shortage', language: 'ko', translation: '재고 부족', category: 'issue_category' },
      { key: 'category.quality_issue', language: 'ko', translation: '품질 문제', category: 'issue_category' },
      { key: 'category.safety_issue', language: 'ko', translation: '안전 문제', category: 'issue_category' },
      
      // 카테고리 번역 - 태국어
      { key: 'category.equipment', language: 'th', translation: 'อุปกรณ์', category: 'issue_category' },
      { key: 'category.software_error', language: 'th', translation: 'ข้อผิดพลาดของซอฟต์แวร์', category: 'issue_category' },
      { key: 'category.inventory_shortage', language: 'th', translation: 'สินค้าขาดสต็อก', category: 'issue_category' },
      { key: 'category.quality_issue', language: 'th', translation: 'ปัญหาคุณภาพ', category: 'issue_category' },
      { key: 'category.safety_issue', language: 'th', translation: 'ปัญหาความปลอดภัย', category: 'issue_category' }
    ];
    
    for (const trans of translations) {
      await prisma.translation.create({
        data: trans
      }).catch(e => {
        if (e.code === 'P2002') {
          console.log(`번역 '${trans.key}(${trans.language})'가 이미 존재합니다.`);
          return;
        }
        console.error(`번역 '${trans.key}' 생성 중 오류:`, e);
      });
    }
    
    console.log('번역 데이터 생성 완료');
    
    console.log('데이터베이스 시드 완료!');
  } catch (error) {
    console.error('시드 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 