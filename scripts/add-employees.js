const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addEmployees() {
  try {
    // 이미지에 있는 직원 추가
    const employees = [
      {
        employeeId: 'TCME0001',
        name: 'Thomas cha',
        position: '관리자',
        department: '경영지',
        contact: '010-5656-1608',
        email: 'thomas.cha@example.com',
        hireDate: new Date('2000-02-12')
      },
      {
        employeeId: 'TCME0002',
        name: 'Eric Cha',
        position: '관리자',
        department: '경영지',
        contact: '010-111-1111',
        email: 'eric.cha@example.com',
        hireDate: new Date('2000-01-01')
      },
      {
        employeeId: 'TCME0003',
        name: 'Toy',
        position: '관리자',
        department: '생산부',
        contact: '010-111-1111',
        email: 'toy@example.com',
        hireDate: new Date('2025-03-16')
      },
      {
        employeeId: 'TCME0004',
        name: 'Sam',
        position: '관리자',
        department: '생산부',
        contact: '010-111-1111',
        email: 'sam@example.com',
        hireDate: new Date('2025-03-16')
      }
    ];

    // 부서 추가
    await prisma.department.upsert({
      where: { name: '경영지' },
      update: {},
      create: { name: '경영지' }
    });

    console.log('부서 추가됨');

    // 직원 추가
    for (const emp of employees) {
      await prisma.employee.upsert({
        where: { email: emp.email },
        update: {},
        create: emp
      });
      console.log(`직원 추가됨: ${emp.name}`);
    }

    console.log('모든 직원이 성공적으로 추가되었습니다.');
  } catch (error) {
    console.error('직원 추가 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addEmployees(); 