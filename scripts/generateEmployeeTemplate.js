const ExcelJS = require('exceljs');
const path = require('path');

async function generateEmployeeTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('직원 데이터');

  // 헤더 설정
  worksheet.columns = [
    { header: 'Employee_ID', key: 'employeeId', width: 15 },
    { header: 'Thai_Name', key: 'thaiName', width: 30 },
    { header: 'Korean_Name', key: 'koreanName', width: 15 },
    { header: 'Nickname', key: 'nickname', width: 15 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Admin_Status', key: 'isAdmin', width: 15 }
  ];

  // 스타일 설정
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // 예시 데이터 추가
  worksheet.addRow({
    employeeId: 'CM1234',
    thaiName: 'น.ส.สมหญิง ใจดี',
    koreanName: '소미영',
    nickname: 'Som',
    department: '생산부',
    isAdmin: 'N'
  });

  // 파일 저장
  const outputPath = path.join(__dirname, '../myfiles/employee_template.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log('템플릿이 생성되었습니다:', outputPath);
}

generateEmployeeTemplate().catch(console.error); 