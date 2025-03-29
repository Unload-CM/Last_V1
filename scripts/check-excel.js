const XLSX = require('xlsx');
const path = require('path');

function checkExcel() {
  try {
    console.log('엑셀 파일 내용 확인 중...');
    
    // 엑셀 파일 경로
    const excelFilePath = path.join(__dirname, '..', 'myfiles', 'TH_Employee_v2.xlsx');
    
    // 엑셀 파일 읽기
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 엑셀 데이터를 JSON으로 변환 (헤더 포함)
    const jsonDataWithHeader = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // 헤더 정보 출력
    console.log('헤더 정보:');
    if (jsonDataWithHeader[0]) {
      jsonDataWithHeader[0].forEach((header, index) => {
        console.log(`${index}: ${header}`);
      });
    }
    
    console.log('\n처음 5개 행 데이터 (컬럼별):');
    
    // 처음 5개 행 출력 (컬럼별로 자세히)
    for (let i = 1; i <= 5 && i < jsonDataWithHeader.length; i++) {
      const row = jsonDataWithHeader[i];
      console.log(`\n행 ${i}:`);
      if (row) {
        row.forEach((value, index) => {
          console.log(`  컬럼 ${index}: ${value}`);
        });
      }
    }
    
    // 키-값 형식으로 JSON 변환
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('\n키-값 형식의 처음 3개 행:');
    for (let i = 0; i < 3 && i < jsonData.length; i++) {
      console.log(jsonData[i]);
    }
    
    // 부서 정보 수집 (원래 데이터)
    console.log('\n부서 컬럼 분석:');
    const departmentColumns = {}; // 부서 데이터가 있을 가능성이 있는 컬럼들
    
    // 각 컬럼별로 확인
    if (jsonDataWithHeader.length > 1) {
      const firstRow = jsonDataWithHeader[1];
      firstRow.forEach((value, index) => {
        if (value && (
            typeof value === 'string' && 
            (value.includes('부') || 
             ['MANAGEMENT', 'ADMIN', 'PRODUCTION', 'QUALITY', 'FACILITY', 'SUPPORT', 'MATERIAL'].includes(value.toUpperCase()))
           )) {
          departmentColumns[index] = { value, count: 1 };
        }
      });
      
      // 나머지 행에서 부서 컬럼으로 의심되는 값들 계산
      for (let i = 2; i < Math.min(30, jsonDataWithHeader.length); i++) {
        const row = jsonDataWithHeader[i];
        if (row) {
          Object.keys(departmentColumns).forEach(colIndex => {
            const value = row[colIndex];
            if (value) {
              if (!departmentColumns[colIndex].values) {
                departmentColumns[colIndex].values = {};
              }
              if (!departmentColumns[colIndex].values[value]) {
                departmentColumns[colIndex].values[value] = 0;
              }
              departmentColumns[colIndex].values[value]++;
              departmentColumns[colIndex].count++;
            }
          });
        }
      }
    }
    
    console.log('가능한 부서 정보 컬럼:', departmentColumns);
    
    // 키 기반 데이터에서 부서 필드 찾기
    if (jsonData.length > 0) {
      const possibleDepartmentFields = [];
      
      Object.keys(jsonData[0]).forEach(field => {
        if (field.toLowerCase().includes('dep') || 
            field.toLowerCase().includes('부서') || 
            field.toLowerCase().includes('부') || 
            field.toLowerCase().includes('department')) {
          possibleDepartmentFields.push(field);
        }
      });
      
      console.log('\n가능한 부서 필드명:', possibleDepartmentFields);
      
      // 처음 10개 행에서 부서 필드별 값 확인
      if (possibleDepartmentFields.length > 0) {
        console.log('\n부서 필드별 값 (처음 10개 행):');
        possibleDepartmentFields.forEach(field => {
          console.log(`\n필드 "${field}"의 값:`);
          for (let i = 0; i < 10 && i < jsonData.length; i++) {
            console.log(`  행 ${i+1}: ${jsonData[i][field]}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('엑셀 파일 확인 중 오류:', error);
  }
}

// 스크립트 실행
checkExcel(); 