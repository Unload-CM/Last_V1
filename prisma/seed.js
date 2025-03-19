const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const prisma = new PrismaClient();

const priorityData = [
  {
    name: 'HIGH',
    label: '높음',
    thaiLabel: 'สูง',
    description: '긴급하게 처리해야 하는 이슈',
    thaiDescription: 'ประเด็นที่ต้องดำเนินการอย่างเร่งด่วน'
  },
  {
    name: 'MEDIUM',
    label: '중간',
    thaiLabel: 'ปานกลาง',
    description: '일반적인 처리가 필요한 이슈',
    thaiDescription: 'ประเด็นที่ต้องดำเนินการตามปกติ'
  },
  {
    name: 'LOW',
    label: '낮음',
    thaiLabel: 'ต่ำ',
    description: '여유있게 처리 가능한 이슈',
    thaiDescription: 'ประเด็นที่สามารถดำเนินการได้อย่างยืดหยุ่น'
  }
];

const statusData = [
  {
    name: 'PENDING',
    label: '대기중',
    thaiLabel: 'รอดำเนินการ',
    description: '처리 대기 상태',
    thaiDescription: 'สถานะรอการดำเนินการ'
  },
  {
    name: 'IN_PROGRESS',
    label: '진행중',
    thaiLabel: 'กำลังดำเนินการ',
    description: '처리가 진행중인 상태',
    thaiDescription: 'สถานะกำลังดำเนินการ'
  },
  {
    name: 'COMPLETED',
    label: '완료',
    thaiLabel: 'เสร็จสิ้น',
    description: '처리가 완료된 상태',
    thaiDescription: 'สถานะดำเนินการเสร็จสิ้น'
  },
  {
    name: 'CANCELLED',
    label: '취소됨',
    thaiLabel: 'ยกเลิก',
    description: '처리가 취소된 상태',
    thaiDescription: 'สถานะยกเลิกการดำเนินการ'
  }
];

const categoryData = [
  {
    name: 'MACHINE',
    label: 'Machine',
    thaiLabel: 'เครื่องจักร',
    description: '기계 설비 관련 이슈',
    thaiDescription: 'ประเด็นเกี่ยวกับเครื่องจักร'
  },
  {
    name: 'MAN',
    label: 'Man',
    thaiLabel: 'คน',
    description: '작업자 관련 이슈',
    thaiDescription: 'ประเด็นเกี่ยวกับบุคลากร'
  },
  {
    name: 'MATERIAL',
    label: 'Material',
    thaiLabel: 'วัสดุ',
    description: '자재/재료 관련 이슈',
    thaiDescription: 'ประเด็นเกี่ยวกับวัสดุ'
  },
  {
    name: 'METHOD',
    label: 'Method',
    thaiLabel: 'วิธีการ',
    description: '작업 방법/프로세스 관련 이슈',
    thaiDescription: 'ประเด็นเกี่ยวกับวิธีการทำงาน'
  }
];

const departmentData = [
  {
    name: 'MANAGEMENT',
    label: '경영부',
    thaiLabel: 'แผนกบริหาร',
    description: '회사의 전반적인 경영을 담당하는 부서입니다.',
    thaiDescription: 'แผนกที่รับผิดชอบการบริหารงานทั่วไปของบริษัท'
  },
  {
    name: 'ADMIN',
    label: '관리부',
    thaiLabel: 'แผนกธุรการ',
    description: '회사의 행정 및 관리를 담당하는 부서입니다.',
    thaiDescription: 'แผนกที่รับผิดชอบงานธุรการและการจัดการของบริษัท'
  },
  {
    name: 'PRODUCTION',
    label: '생산부',
    thaiLabel: 'แผนกการผลิต',
    description: '제품 생산을 담당하는 부서입니다.',
    thaiDescription: 'แผนกที่รับผิดชอบการผลิตสินค้า'
  },
  {
    name: 'QUALITY',
    label: '품질부',
    thaiLabel: 'แผนกควบคุมคุณภาพ',
    description: '제품 품질 관리 및 검사를 담당하는 부서입니다.',
    thaiDescription: 'แผนกที่รับผิดชอบการควบคุมและตรวจสอบคุณภาพผลิตภัณฑ์'
  },
  {
    name: 'FACILITY',
    label: '설비부',
    thaiLabel: 'แผนกซ่อมบำรุง',
    description: '공장 설비 관리 및 유지보수를 담당하는 부서입니다.',
    thaiDescription: 'แผนกที่รับผิดชอบการจัดการและบำรุงรักษาเครื่องจักรในโรงงาน'
  },
  {
    name: 'SUPPORT',
    label: '지원부',
    thaiLabel: 'แผนกสนับสนุน',
    description: '회사의 각종 지원 업무를 담당하는 부서입니다.',
    thaiDescription: 'แผนกที่รับผิดชอบงานสนับสนุนต่างๆ ของบริษัท'
  },
  {
    name: 'MATERIAL',
    label: '자재부',
    thaiLabel: 'แผนกวัสดุ',
    description: '자재 관리 및 재고를 담당하는 부서입니다.',
    thaiDescription: 'แผนกที่รับผิดชอบการจัดการวัสดุและควบคุมสินค้าคงคลัง'
  }
];

// 부서 매핑
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

const readEmployeeData = async () => {
  try {
    console.log('엑셀 파일 읽는 중...');
    const workbook = XLSX.readFile('./myfiles/TH_Employee_v2.xlsx');
    console.log('엑셀 파일 로드 완료');
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('전체 행 수:', data.length);
    
    const filteredData = data
      .filter(row => row['Employee_ID'] && row['Thai_Name'])
      .map(row => ({
        employeeId: String(row['Employee_ID']).trim(),
        koreanName: row['Korean_Name'] ? String(row['Korean_Name']).trim() : row['Nickname'] ? String(row['Nickname']).trim() : 'Unknown',
        thaiName: row['Thai_Name'] ? String(row['Thai_Name']).trim() : null,
        nickname: row['Nickname'] ? String(row['Nickname']).trim() : null,
        isThai: true,
        departmentName: row['Department'] ? String(row['Department']).trim() : null,
        isAdmin: row['Admin_Status'] === 'Y'
      }));

    console.log(`필터링된 데이터: ${filteredData.length}명의 직원`);
    return filteredData;
  } catch (error) {
    console.error('엑셀 파일 읽기 오류:', error);
    return [];
  }
};

async function main() {
  console.log('데이터 추가 시작...');
  
  // 기존 데이터 삭제 (직원 데이터는 유지)
  console.log('기존 데이터 삭제 중...');
  // 직원 데이터는 삭제하지 않음
  // await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.priority.deleteMany();
  await prisma.status.deleteMany();
  await prisma.category.deleteMany();
  console.log('기존 데이터 삭제 완료');

  // 부서 데이터 추가
  console.log('부서 데이터 추가 중...');
  for (const dept of departmentData) {
    await prisma.department.create({
      data: dept
    });
  }
  console.log('부서 데이터 추가 완료');

  // 우선순위 데이터 추가
  console.log('우선순위 데이터 추가 중...');
  for (const priority of priorityData) {
    await prisma.priority.create({
      data: priority
    });
  }
  console.log('우선순위 데이터 추가 완료');

  // 상태 데이터 추가
  console.log('상태 데이터 추가 중...');
  for (const status of statusData) {
    await prisma.status.create({
      data: status
    });
  }
  console.log('상태 데이터 추가 완료');

  // 카테고리 데이터 추가
  console.log('카테고리 데이터 추가 중...');
  for (const category of categoryData) {
    await prisma.category.create({
      data: category
    });
  }
  console.log('카테고리 데이터 추가 완료');

  // Excel 파일에서 직원 데이터 읽기
  const employeeData = await readEmployeeData();
  console.log(`엑셀 파일에서 ${employeeData.length}명의 직원 정보를 찾았습니다`);

  // 직원 데이터 입력
  for (const employee of employeeData) {
    try {
      // 부서 찾기
      const departmentName = departmentMapping[employee.departmentName];
      if (!departmentName) {
        console.error(`부서를 찾을 수 없습니다: ${employee.departmentName}`);
        continue;
      }
      
      // 부서 ID 찾기
      const department = await prisma.department.findFirst({
        where: { name: departmentName }
      });
      
      if (!department) {
        console.error(`부서 정보를 찾을 수 없습니다: ${departmentName}`);
        continue;
      }
      
      // 직원 생성
      await prisma.employee.create({
        data: {
          employeeId: employee.employeeId,
          koreanName: employee.koreanName,
          thaiName: employee.thaiName,
          nickname: employee.nickname,
          isThai: employee.isThai,
          isAdmin: employee.isAdmin,
          departmentId: department.id
        }
      });
      
      console.log(`직원 추가 완료: ${employee.koreanName} (${employee.employeeId})`);
    } catch (error) {
      console.error(`직원 추가 중 오류: ${employee.koreanName} (${employee.employeeId})`, error);
    }
  }

  console.log('모든 데이터 추가 완료');
}

// main 함수 실행
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 