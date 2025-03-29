const xlsx = require('xlsx');
const path = require('path');

function main() {
  try {
    console.log('엑셀 파일 읽는 중...');
    const excelFilePath = path.resolve('C:\\Last_v1\\myfiles\\TH_Employee_v2.xlsx');
    const workbook = xlsx.readFile(excelFilePath);
    
    // 시트 목록 확인
    console.log('엑셀 시트 목록:');
    console.log(workbook.SheetNames);
    
    // 첫 번째 시트를 가져옵니다.
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 시트 데이터를 JSON으로 변환합니다.
    const employeeData = xlsx.utils.sheet_to_json(worksheet);
    
    console.log(`엑셀에서 ${employeeData.length}명의 직원 데이터를 읽었습니다.`);
    
    // 첫 번째 데이터의 모든 키와 값 출력
    if (employeeData.length > 0) {
      console.log('\n첫 번째 직원 데이터의 모든 키와 값:');
      const firstEmployee = employeeData[0];
      Object.keys(firstEmployee).forEach(key => {
        console.log(`${key}: ${firstEmployee[key]}`);
      });
    }
    
    // 엑셀의 열 헤더 (A1, B1, C1, ...) 확인
    console.log('\n엑셀 열 헤더:');
    const range = xlsx.utils.decode_range(worksheet['!ref']);
    for (let c = range.s.c; c <= range.e.c; c++) {
      const headerCell = worksheet[xlsx.utils.encode_cell({ r: 0, c })];
      if (headerCell) {
        console.log(`${xlsx.utils.encode_col(c)}: ${headerCell.v}`);
      }
    }
    
  } catch (error) {
    console.error('엑셀 파일 확인 중 오류 발생:', error);
  }
}

main(); 