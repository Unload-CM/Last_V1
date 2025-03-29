const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('기본 데이터 생성 시작...');

  // 부서 데이터 생성
  console.log('부서 데이터 생성 중...');
  const departments = [
    { name: 'MANAGEMENT', label: '경영부', thaiLabel: 'แผนกบริหาร', description: '회사의 전반적인 경영을 담당하는 부서입니다.', thaiDescription: 'แผนกที่รับผิดชอบการบริหารงานทั่วไปของบริษัท' },
    { name: 'ADMIN', label: '관리부', thaiLabel: 'แผนกธุรการ', description: '회사의 행정 및 관리를 담당하는 부서입니다.', thaiDescription: 'แผนกที่รับผิดชอบงานธุรการและการจัดการของบริษัท' },
    { name: 'PRODUCTION', label: '생산부', thaiLabel: 'แผนกการผลิต', description: '제품 생산을 담당하는 부서입니다.', thaiDescription: 'แผนกที่รับผิดชอบการผลิตสินค้า' },
    { name: 'QUALITY', label: '품질부', thaiLabel: 'แผนกควบคุมคุณภาพ', description: '제품 품질 관리 및 검사를 담당하는 부서입니다.', thaiDescription: 'แผนกที่รับผิดชอบการควบคุมและตรวจสอบคุณภาพผลิตภัณฑ์' },
    { name: 'FACILITY', label: '설비부', thaiLabel: 'แผนกซ่อมบำรุง', description: '공장 설비 관리 및 유지보수를 담당하는 부서입니다.', thaiDescription: 'แผนกที่รับผิดชอบการจัดการและบำรุงรักษาเครื่องจักรในโรงงาน' },
    { name: 'SUPPORT', label: '지원부', thaiLabel: 'แผนกสนับสนุน', description: '회사의 각종 지원 업무를 담당하는 부서입니다.', thaiDescription: 'แผนกที่รับผิดชอบงานสนับสนุนต่างๆ ของบริษัท' },
    { name: 'MATERIAL', label: '자재부', thaiLabel: 'แผนกวัสดุ', description: '자재 관리 및 재고를 담당하는 부서입니다.', thaiDescription: 'แผนกที่รับผิดชอบการจัดการวัสดุและควบคุมสินค้าคงคลัง' }
  ];

  for (const department of departments) {
    await prisma.department.upsert({
      where: { name: department.name },
      update: department,
      create: department,
    });
  }

  // 상태 데이터 생성
  console.log('상태 데이터 생성 중...');
  const statuses = [
    { name: 'OPEN', label: '미해결', thaiLabel: 'ยังไม่ได้แก้ไข', description: '아직 처리되지 않은 이슈', thaiDescription: 'ประเด็นที่ยังไม่ได้รับการแก้ไข' },
    { name: 'IN_PROGRESS', label: '진행중', thaiLabel: 'กำลังดำเนินการ', description: '현재 처리 중인 이슈', thaiDescription: 'ประเด็นที่กำลังดำเนินการอยู่' },
    { name: 'RESOLVED', label: '해결됨', thaiLabel: 'แก้ไขแล้ว', description: '해결된 이슈', thaiDescription: 'ประเด็นที่ได้รับการแก้ไขแล้ว' },
    { name: 'CLOSED', label: '종료', thaiLabel: 'ปิด', description: '종료된 이슈', thaiDescription: 'ประเด็นที่ปิดแล้ว' }
  ];

  for (const status of statuses) {
    await prisma.status.upsert({
      where: { name: status.name },
      update: status,
      create: status,
    });
  }

  // 우선순위 데이터 생성
  console.log('우선순위 데이터 생성 중...');
  const priorities = [
    { name: 'CRITICAL', label: '심각', thaiLabel: 'วิกฤต', description: '즉시 해결해야 하는 이슈', thaiDescription: 'ประเด็นที่ต้องแก้ไขทันที' },
    { name: 'HIGH', label: '높음', thaiLabel: 'สูง', description: '우선적으로 해결해야 하는 이슈', thaiDescription: 'ประเด็นที่ต้องแก้ไขเร่งด่วน' },
    { name: 'MEDIUM', label: '중간', thaiLabel: 'ปานกลาง', description: '일반적인 우선순위의 이슈', thaiDescription: 'ประเด็นที่มีความสำคัญปานกลาง' },
    { name: 'LOW', label: '낮음', thaiLabel: 'ต่ำ', description: '여유있게 해결할 수 있는 이슈', thaiDescription: 'ประเด็นที่สามารถแก้ไขได้เมื่อมีเวลา' }
  ];

  for (const priority of priorities) {
    await prisma.priority.upsert({
      where: { name: priority.name },
      update: priority,
      create: priority,
    });
  }

  // 카테고리 데이터 생성
  console.log('카테고리 데이터 생성 중...');
  const categories = [
    { name: 'MACHINERY', label: '기계 고장', thaiLabel: 'เครื่องจักรเสีย', description: '기계 고장 관련 이슈', thaiDescription: 'ปัญหาเกี่ยวกับเครื่องจักรเสีย' },
    { name: 'QUALITY', label: '품질 문제', thaiLabel: 'ปัญหาคุณภาพ', description: '제품 품질 관련 이슈', thaiDescription: 'ปัญหาเกี่ยวกับคุณภาพของผลิตภัณฑ์' },
    { name: 'SAFETY', label: '안전 문제', thaiLabel: 'ปัญหาความปลอดภัย', description: '안전 관련 이슈', thaiDescription: 'ปัญหาเกี่ยวกับความปลอดภัย' },
    { name: 'MATERIAL', label: '자재 부족', thaiLabel: 'ขาดวัสดุ', description: '자재 부족 관련 이슈', thaiDescription: 'ปัญหาเกี่ยวกับการขาดแคลนวัสดุ' },
    { name: 'OTHER', label: '기타', thaiLabel: 'อื่นๆ', description: '기타 이슈', thaiDescription: 'ปัญหาอื่นๆ' }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
  }

  // 관리자 계정 생성
  console.log('관리자 계정 생성 중...');
  const managementDept = await prisma.department.findUnique({
    where: { name: 'MANAGEMENT' }
  });

  if (managementDept) {
    await prisma.employee.upsert({
      where: { employeeId: 'admin' },
      update: {
        koreanName: '관리자',
        isAdmin: true,
        departmentId: managementDept.id
      },
      create: {
        employeeId: 'admin',
        koreanName: '관리자',
        thaiName: 'ผู้ดูแลระบบ',
        isAdmin: true,
        departmentId: managementDept.id
      }
    });
  }

  // 데모 직원 생성
  console.log('데모 직원 생성 중...');
  
  // 부서 ID 가져오기
  const productionDept = await prisma.department.findUnique({ where: { name: 'PRODUCTION' } });
  
  if (productionDept) {
    await prisma.employee.upsert({
      where: { employeeId: 'KIM001' },
      update: {
        koreanName: '김철수',
        departmentId: productionDept.id,
        isAdmin: true
      },
      create: {
        employeeId: 'KIM001',
        koreanName: '김철수',
        departmentId: productionDept.id,
        isAdmin: true
      }
    });

    await prisma.employee.upsert({
      where: { employeeId: 'EMP0001' },
      update: {
        koreanName: '사용자1',
        departmentId: productionDept.id,
        isAdmin: false
      },
      create: {
        employeeId: 'EMP0001',
        koreanName: '사용자1',
        departmentId: productionDept.id,
        isAdmin: false
      }
    });
  }

  console.log('기본 데이터 생성 완료!');
}

main()
  .catch((e) => {
    console.error('데이터 생성 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 