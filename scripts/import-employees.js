const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const prisma = new PrismaClient();

// 부서 매핑 정보
const departmentMapping = {
  '생산부': 'PRODUCTION',
  '품질부': 'QUALITY',
  '설비부': 'FACILITY',
  '지원부': 'SUPPORT',
  '자재부': 'MATERIAL',
  '관리부': 'ADMIN',
  '경영부': 'MANAGEMENT',
  '품질관리부': 'QUALITY',
  '시설관리부': 'FACILITY',
  '자재관리부': 'MATERIAL',
  '1': 'MANAGEMENT',
  '2': 'ADMIN',
  '3': 'PRODUCTION',
  '4': 'QUALITY',
  '5': 'FACILITY',
  '6': 'SUPPORT',
  '7': 'MATERIAL'
};

async function importEmployees() {
  try {
    console.log('엑셀 파일에서 직원 데이터 가져오는 중...');
    
    // 엑셀 파일 경로
    const excelFilePath = path.join(__dirname, '..', 'myfiles', 'TH_Employee_v2.xlsx');
    
    // 엑셀 파일 읽기
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 엑셀 데이터를 키-값 형식의 JSON으로 변환 (헤더를 필드명으로 사용)
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`총 ${jsonData.length}개의 직원 데이터를 발견했습니다.`);
    
    // 직원 데이터 배열 준비
    const employees = [];
    
    for (const row of jsonData) {
      // 빈 데이터는 건너뛰기
      if (!row.Employee_ID) {
        continue;
      }
      
      // 타이 직원 여부 확인
      const isThai = row.Thai_Name && 
                     typeof row.Thai_Name === 'string' && 
                     /[ก-๙]/.test(row.Thai_Name); // 타이어 문자가 포함되어 있는지 확인
      
      // 부서 이름을 부서 코드로 변환
      const departmentValue = row.Department || '';
      const departmentName = departmentMapping[departmentValue] || '';
      
      if (row.Employee_ID && row.Korean_Name && departmentName) {
        employees.push({
          employeeId: row.Employee_ID.toString(),
          koreanName: row.Korean_Name,
          thaiName: row.Thai_Name || null,
          nickname: row.Nickname || null,
          isThai: isThai,
          departmentName: departmentName,
          isAdmin: row.Admin_Status === true || row.Admin_Status === 'Y' || row.Admin_Status === 'true'
        });
      } else {
        console.log(`건너뜀: ${row.Employee_ID} - 필수 정보 누락 (이름 또는 부서)`);
      }
    }
    
    console.log(`${employees.length}개의 유효한 직원 데이터를 처리합니다.`);
    
    // 부서 정보 가져오기
    const departments = await prisma.department.findMany();
    const departmentMap = {};
    
    departments.forEach(dept => {
      departmentMap[dept.name] = dept.id;
    });
    
    console.log('부서 매핑 정보:', departmentMap);
    
    // 직원 데이터 DB에 삽입
    let successCount = 0;
    let errorCount = 0;
    
    for (const employee of employees) {
      const departmentId = departmentMap[employee.departmentName];
      
      if (!departmentId) {
        console.error(`부서를 찾을 수 없습니다: ${employee.departmentName} (${employee.employeeId} - ${employee.koreanName})`);
        errorCount++;
        continue;
      }
      
      try {
        // 기존 직원이 있는지 확인
        const existingEmployee = await prisma.employee.findUnique({
          where: { employeeId: employee.employeeId }
        });
        
        if (existingEmployee) {
          // 기존 직원 정보 업데이트
          await prisma.employee.update({
            where: { id: existingEmployee.id },
            data: {
              koreanName: employee.koreanName,
              thaiName: employee.thaiName,
              nickname: employee.nickname,
              isThai: employee.isThai,
              isAdmin: employee.isAdmin,
              departmentId: departmentId
            }
          });
          console.log(`직원 정보 업데이트: ${employee.employeeId} - ${employee.koreanName}`);
        } else {
          // 새 직원 추가
          await prisma.employee.create({
            data: {
              employeeId: employee.employeeId,
              koreanName: employee.koreanName,
              thaiName: employee.thaiName,
              nickname: employee.nickname,
              isThai: employee.isThai,
              isAdmin: employee.isAdmin,
              departmentId: departmentId,
              password: "0000" // 기본 비밀번호
            }
          });
          console.log(`새 직원 추가: ${employee.employeeId} - ${employee.koreanName}`);
        }
        
        successCount++;
      } catch (error) {
        console.error(`직원 데이터 처리 중 오류: ${employee.employeeId}`, error);
        errorCount++;
      }
    }
    
    console.log(`작업 완료: ${successCount}개 성공, ${errorCount}개 실패`);
    
  } catch (error) {
    console.error('직원 데이터 가져오기 중 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
importEmployees()
  .then(() => {
    console.log('직원 가져오기 작업이 완료되었습니다.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error);
    process.exit(1);
  }); 