const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 먼저 현재 ID 7인 직원 정보 확인
    const currentEmployee = await prisma.employee.findUnique({
      where: { id: 7 }
    });
    
    console.log("수정 전 직원 정보:", JSON.stringify(currentEmployee, null, 2));
    
    if (!currentEmployee) {
      console.log("ID 7인 직원을 찾을 수 없습니다.");
      return;
    }
    
    // employeeId를 "CMADMIN2"로 수정
    const updatedEmployee = await prisma.employee.update({
      where: { id: 7 },
      data: { employeeId: "CMADMIN2" }
    });
    
    console.log("수정 후 직원 정보:", JSON.stringify(updatedEmployee, null, 2));
    console.log("직원 ID 7의 employeeId가 성공적으로 CMADMIN2로 수정되었습니다.");
  } catch (error) {
    console.error("오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
