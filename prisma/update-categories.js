const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateCategories() {
  try {
    console.log('카테고리 업데이트 시작...');

    // 기존 카테고리 데이터 삭제
    await prisma.category.deleteMany();
    console.log('기존 카테고리 삭제 완료');

    // 4M 기준 카테고리 데이터 생성
    const categories = [
      // Man (인적 요소)
      { name: 'MAN_SKILL', label: '작업자 스킬(Man)', thaiLabel: 'ทักษะพนักงาน(Man)', description: '작업자의 기술 및 교육 관련 문제', thaiDescription: 'ปัญหาเกี่ยวกับทักษะและการฝึกอบรมของพนักงาน' },
      { name: 'MAN_PROCEDURE', label: '작업 절차(Man)', thaiLabel: 'ขั้นตอนการทำงาน(Man)', description: '작업 절차 미준수 또는 오류 관련 문제', thaiDescription: 'ปัญหาเกี่ยวกับการไม่ปฏิบัติตามขั้นตอนหรือข้อผิดพลาดในการทำงาน' },
      { name: 'MAN_COMMUNICATION', label: '의사소통(Man)', thaiLabel: 'การสื่อสาร(Man)', description: '작업자 간 의사소통 문제', thaiDescription: 'ปัญหาการสื่อสารระหว่างพนักงาน' },
      
      // Machine (기계 요소)
      { name: 'MACHINE_BREAKDOWN', label: '기계 고장(Machine)', thaiLabel: 'เครื่องจักรเสีย(Machine)', description: '기계 설비 고장 또는 오작동', thaiDescription: 'การเสียหรือทำงานผิดปกติของเครื่องจักร' },
      { name: 'MACHINE_MAINTENANCE', label: '기계 유지보수(Machine)', thaiLabel: 'การบำรุงรักษาเครื่องจักร(Machine)', description: '기계 설비 유지보수 관련 문제', thaiDescription: 'ปัญหาเกี่ยวกับการบำรุงรักษาเครื่องจักร' },
      { name: 'MACHINE_SETUP', label: '기계 셋업(Machine)', thaiLabel: 'การตั้งค่าเครื่องจักร(Machine)', description: '기계 설정 또는 셋업 관련 문제', thaiDescription: 'ปัญหาเกี่ยวกับการตั้งค่าเครื่องจักร' },
      
      // Material (자재 요소)
      { name: 'MATERIAL_SHORTAGE', label: '자재 부족(Material)', thaiLabel: 'การขาดแคลนวัสดุ(Material)', description: '원자재 또는 부품 부족 문제', thaiDescription: 'ปัญหาการขาดแคลนวัตถุดิบหรือชิ้นส่วน' },
      { name: 'MATERIAL_QUALITY', label: '자재 품질(Material)', thaiLabel: 'คุณภาพวัสดุ(Material)', description: '원자재 품질 문제', thaiDescription: 'ปัญหาคุณภาพของวัตถุดิบ' },
      { name: 'MATERIAL_HANDLING', label: '자재 취급(Material)', thaiLabel: 'การจัดการวัสดุ(Material)', description: '자재 취급 또는 보관 관련 문제', thaiDescription: 'ปัญหาเกี่ยวกับการจัดการหรือการเก็บรักษาวัสดุ' },
      
      // Method (방법 요소)
      { name: 'METHOD_PROCESS', label: '공정 방법(Method)', thaiLabel: 'วิธีการกระบวนการ(Method)', description: '제조 공정 또는 방법 관련 문제', thaiDescription: 'ปัญหาเกี่ยวกับกระบวนการหรือวิธีการผลิต' },
      { name: 'METHOD_STANDARD', label: '작업 표준(Method)', thaiLabel: 'มาตรฐานการทำงาน(Method)', description: '작업 표준 또는 지침 관련 문제', thaiDescription: 'ปัญหาเกี่ยวกับมาตรฐานหรือแนวทางการทำงาน' },
      { name: 'METHOD_LAYOUT', label: '작업 레이아웃(Method)', thaiLabel: 'ผังการทำงาน(Method)', description: '작업장 레이아웃 또는 공간 배치 문제', thaiDescription: 'ปัญหาเกี่ยวกับผังหรือการจัดพื้นที่ในที่ทำงาน' },
      
      // 기타
      { name: 'SAFETY', label: '안전 문제(Other)', thaiLabel: 'ปัญหาความปลอดภัย(Other)', description: '안전 관련 이슈', thaiDescription: 'ปัญหาเกี่ยวกับความปลอดภัย' },
      { name: 'ENVIRONMENT', label: '환경 문제(Other)', thaiLabel: 'ปัญหาสิ่งแวดล้อม(Other)', description: '환경 관련 이슈', thaiDescription: 'ปัญหาเกี่ยวกับสิ่งแวดล้อม' },
      { name: 'OTHER', label: '기타(Other)', thaiLabel: 'อื่นๆ(Other)', description: '기타 이슈', thaiDescription: 'ปัญหาอื่นๆ' }
    ];

    // 새 카테고리 데이터 추가
    for (const category of categories) {
      await prisma.category.create({
        data: category
      });
      console.log(`카테고리 추가: ${category.label}`);
    }

    console.log('카테고리 업데이트 완료!');
  } catch (error) {
    console.error('카테고리 업데이트 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
updateCategories(); 