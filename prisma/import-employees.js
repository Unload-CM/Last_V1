const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function importEmployees() {
  try {
    console.log('직원 데이터 가져오기 시작...');
    
    // Excel 파일 읽기
    const filePath = path.resolve('C:/Last/myfiles/TH_Employee_v2.xlsx');
    console.log(`파일 경로: ${filePath}`);
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Excel 데이터를 JSON으로 변환
    const employeeData = XLSX.utils.sheet_to_json(worksheet);
    console.log(`엑셀에서 ${employeeData.length}명의 직원 정보 로드 완료`);
    
    // 컬럼명 매핑 체크
    const firstEmployee = employeeData[0];
    console.log('엑셀 파일의 첫 번째 행 데이터:', firstEmployee);

    // 모든 부서 가져오기
    const departments = await prisma.department.findMany();
    console.log(`DB에서 ${departments.length}개의 부서 정보를 가져왔습니다.`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // 각 직원 데이터 처리
    for (const employee of employeeData) {
      try {
        // 엑셀 파일의 실제 컬럼명에 맞게 데이터 매핑
        const employeeId = employee.Employee_ID || '';
        const koreanName = employee.Korean_Name || '';
        const thaiName = employee.Thai_Name || null;
        const nickname = employee.Nickname || null;
        const departmentName = employee.Department || '';
        // Y 또는 N을 boolean으로 변환
        const isAdmin = employee.Admin_Status === 'Y' ? true : false;
        // 태국인 여부는 Thai_Name 값이 있으면 true로 설정
        const isThai = Boolean(employee.Thai_Name);
        
        // 필수 필드 확인
        if (!employeeId || !koreanName || !departmentName) {
          console.error(`필수 정보 누락: ${employeeId} - ${koreanName} - ${departmentName}`);
          errorCount++;
          continue;
        }
        
        // 부서명(label)으로 부서 찾기
        const department = departments.find(dept => dept.label === departmentName);
        
        if (!department) {
          console.error(`부서 정보를 DB에서 찾을 수 없음: ${departmentName}`);
          errorCount++;
          continue;
        }
        
        // 중복 확인 및 직원 생성/업데이트
        await prisma.employee.upsert({
          where: { employeeId },
          update: {
            koreanName,
            thaiName,
            nickname,
            departmentId: department.id,
            isThai: Boolean(isThai),
            isAdmin: Boolean(isAdmin)
          },
          create: {
            employeeId,
            koreanName,
            thaiName,
            nickname,
            departmentId: department.id,
            isThai: Boolean(isThai),
            isAdmin: Boolean(isAdmin)
          }
        });
        
        successCount++;
        console.log(`직원 추가/업데이트 완료: ${koreanName} (${employeeId}) - 부서: ${departmentName}`);
      } catch (error) {
        console.error(`직원 데이터 처리 중 오류: ${error.message}`, employee);
        errorCount++;
      }
    }
    
    console.log('====================================');
    console.log(`직원 데이터 가져오기 완료`);
    console.log(`성공: ${successCount}명, 오류: ${errorCount}명`);
    console.log('====================================');
  } catch (error) {
    console.error('직원 데이터 가져오기 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
importEmployees(); 