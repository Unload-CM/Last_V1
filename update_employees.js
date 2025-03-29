const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('엑셀 파일 읽는 중...');
    const excelFilePath = path.resolve('C:\\Last_v1\\myfiles\\TH_Employee_v2.xlsx');
    const workbook = xlsx.readFile(excelFilePath);
    
    // 첫 번째 시트를 가져옵니다.
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 시트 데이터를 JSON으로 변환합니다.
    const employeeData = xlsx.utils.sheet_to_json(worksheet);
    
    console.log(`엑셀에서 ${employeeData.length}명의 직원 데이터를 읽었습니다.`);
    
    // 현재 직원 데이터 확인 (로깅 목적)
    const currentEmployees = await prisma.employee.findMany({
      include: {
        department: true
      }
    });
    console.log(`현재 DB에 ${currentEmployees.length}명의 직원이 있습니다.`);
    
    // 기존 직원 데이터 삭제 (단, Issue 등 관련 데이터가 있을 수 있으므로 주의)
    console.log('기존 직원 데이터 삭제 중...');
    await prisma.employee.deleteMany({});
    
    // 부서 데이터 가져오기
    const departments = await prisma.department.findMany();
    const departmentMap = {};
    departments.forEach(dept => {
      departmentMap[dept.label] = dept.id;
    });
    
    console.log('새 직원 데이터 추가 중...');
    let addedCount = 0;
    let errorCount = 0;
    
    // 각 직원 데이터를 처리합니다.
    for (const employee of employeeData) {
      try {
        // 부서 ID 찾기
        const departmentLabel = employee.DEPARTMENT;
        const departmentId = departmentMap[departmentLabel];
        
        if (!departmentId) {
          console.error(`"${departmentLabel}" 부서를 찾을 수 없습니다.`);
          errorCount++;
          continue;
        }
        
        await prisma.employee.create({
          data: {
            employeeId: employee.EMPID || '', 
            koreanName: employee.KOREAN_NAME || '',
            thaiName: employee.THAI_NAME || null,
            nickname: employee.NICKNAME || null,
            isThai: Boolean(employee.TH_EMP === 'Y'),
            isAdmin: Boolean(employee.IS_ADMIN === 'Y'),
            password: '0000', // 기본 비밀번호
            departmentId: departmentId
          }
        });
        
        addedCount++;
      } catch (error) {
        console.error(`직원 데이터 추가 중 오류: ${JSON.stringify(employee)}`, error);
        errorCount++;
      }
    }
    
    console.log(`${addedCount}명의 직원 데이터가 추가되었습니다.`);
    if (errorCount > 0) {
      console.log(`${errorCount}건의 오류가 발생했습니다.`);
    }
    
    // 결과 확인
    const newEmployees = await prisma.employee.findMany({
      include: {
        department: true
      }
    });
    
    console.log('\n업데이트된 직원 목록:');
    console.log(`총 ${newEmployees.length}명의 직원이 등록되었습니다.`);
    
  } catch (error) {
    console.error('직원 데이터 업데이트 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 