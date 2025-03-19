import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 부서 데이터 생성
  const departments = [
    { name: '생산부', label: '생산부', description: '제품 생산 담당' },
    { name: '품질관리부', label: '품질관리부', description: '품질 검사 및 관리 담당' },
    { name: '물류창고', label: '물류창고', description: '물류 및 재고 관리 담당' },
    { name: '자재관리', label: '자재관리', description: '자재 조달 및 관리 담당' },
    { name: '경영지원부', label: '경영지원부', description: '경영 지원 업무 담당' }
  ];

  for (const department of departments) {
    await prisma.department.create({
      data: department
    });
  }

  // 샘플 직원 데이터 생성
  const employees = [
    {
      employeeId: 'EMP00001',
      koreanName: '김관리',
      isThai: false,
      departmentId: 1
    },
    {
      employeeId: 'EMP00002',
      koreanName: '이태국',
      isThai: true,
      thaiName: 'สมชาย',
      nickname: '쏨차이',
      departmentId: 2
    }
  ];

  for (const employee of employees) {
    await prisma.employee.create({
      data: employee
    });
  }

  console.log('초기 데이터가 성공적으로 생성되었습니다.');
}

main()
  .catch((e) => {
    console.error('초기 데이터 생성 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 