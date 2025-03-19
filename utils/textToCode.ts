/**
 * 한글 및 태국어 텍스트를 영문 코드로 변환하는 함수
 * 1. 미리 정의된 매핑 테이블에서 변환을 시도
 * 2. 매핑 테이블에 없는 경우 기본 변환 로직 적용
 * 3. 변환된 결과를 코드 형식으로 정리 (대문자, 공백 제거 등)
 */
export async function textToCode(text: string, language: 'ko' | 'th' | 'en' = 'ko'): Promise<string> {
  // 이미 영문이면 바로 코드로 변환
  if (language === 'en') {
    return formatAsCode(text);
  }

  // 미리 정의된 한글->영문 매핑 테이블
  const koreanToEnglish: { [key: string]: string } = {
    // 부서
    '생산부': 'PRODUCTION',
    '품질관리부': 'QUALITY_CONTROL',
    '물류창고': 'LOGISTICS',
    '자재관리': 'MATERIAL_MANAGEMENT',
    '경영지원부': 'MANAGEMENT_SUPPORT',
    '연구개발부': 'RESEARCH_DEVELOPMENT',
    '인사부': 'HUMAN_RESOURCES',
    '재무부': 'FINANCE',
    '영업부': 'SALES',
    '마케팅': 'MARKETING',
    '오락부': 'ENTERTAINMENT',
    
    // 카테고리
    '설비': 'EQUIPMENT',
    '소프트웨어 오류': 'SOFTWARE_ERROR',
    '재고 부족': 'INVENTORY_SHORTAGE',
    '품질 문제': 'QUALITY_ISSUE',
    '안전 문제': 'SAFETY_ISSUE',
    
    // 상태
    '미해결': 'OPEN',
    '진행 중': 'IN_PROGRESS',
    '해결됨': 'RESOLVED',
    '종료': 'CLOSED',
    
    // 우선순위
    '심각': 'CRITICAL',
    '높음': 'HIGH',
    '중간': 'MEDIUM',
    '낮음': 'LOW'
  };

  // 미리 정의된 태국어->영문 매핑 테이블
  const thaiToEnglish: { [key: string]: string } = {
    // 부서
    'แผนกการผลิต': 'PRODUCTION',
    'แผนกควบคุมคุณภาพ': 'QUALITY_CONTROL',
    'คลังสินค้าและโลจิสติกส์': 'LOGISTICS',
    'การจัดการวัสดุ': 'MATERIAL_MANAGEMENT',
    'ฝ่ายสนับสนุนการจัดการ': 'MANAGEMENT_SUPPORT',
    'แผนกวิจัยและพัฒนา': 'RESEARCH_DEVELOPMENT',
    'ฝ่ายทรัพยากรบุคคล': 'HUMAN_RESOURCES',
    'แผนกการเงิน': 'FINANCE',
    'แผนกขาย': 'SALES',
    'การตลาด': 'MARKETING',
    'แผนกบันเทิง': 'ENTERTAINMENT',
    
    // 카테고리
    'อุปกรณ์': 'EQUIPMENT',
    'ข้อผิดพลาดของซอฟต์แวร์': 'SOFTWARE_ERROR',
    'การขาดแคลนสินค้าคงคลัง': 'INVENTORY_SHORTAGE',
    'ปัญหาคุณภาพ': 'QUALITY_ISSUE',
    'ปัญหาความปลอดภัย': 'SAFETY_ISSUE',
    
    // 상태
    'เปิด': 'OPEN',
    'กำลังดำเนินการ': 'IN_PROGRESS',
    'แก้ไขแล้ว': 'RESOLVED',
    'ปิด': 'CLOSED',
    
    // 우선순위
    'วิกฤต': 'CRITICAL',
    'สูง': 'HIGH',
    'กลาง': 'MEDIUM',
    'ต่ำ': 'LOW'
  };

  // 매핑 테이블에서 찾기
  const mappingTable = language === 'ko' ? koreanToEnglish : thaiToEnglish;
  if (mappingTable[text]) {
    return mappingTable[text];
  }

  // Google Translate API 대신 기본 변환 로직 사용
  return formatAsCode(text === '' ? 'UNTITLED' : text);
}

/**
 * 텍스트를 코드 형식으로 변환하는 함수
 * 1. 대문자로 변환
 * 2. 공백을 언더스코어로 변환
 * 3. 영문, 숫자, 언더스코어 외의 문자 제거
 */
function formatAsCode(text: string): string {
  return text
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
}

/**
 * 동기식으로 텍스트를 영문 코드로 변환하는 함수
 */
export function textToCodeSync(text: string, language: 'ko' | 'th' | 'en' = 'ko'): string {
  // 이미 영문이면 바로 코드로 변환
  if (language === 'en') {
    return formatAsCode(text);
  }

  // 매핑 테이블 활용
  const koreanToEnglish: { [key: string]: string } = {
    // 부서
    '생산부': 'PRODUCTION',
    '품질관리부': 'QUALITY_CONTROL',
    '물류창고': 'LOGISTICS',
    '자재관리': 'MATERIAL_MANAGEMENT',
    '경영지원부': 'MANAGEMENT_SUPPORT',
    '연구개발부': 'RESEARCH_DEVELOPMENT',
    '인사부': 'HUMAN_RESOURCES',
    '재무부': 'FINANCE',
    '영업부': 'SALES',
    '마케팅': 'MARKETING',
    '오락부': 'ENTERTAINMENT',
    
    // 카테고리
    '설비': 'EQUIPMENT',
    '소프트웨어 오류': 'SOFTWARE_ERROR',
    '재고 부족': 'INVENTORY_SHORTAGE',
    '품질 문제': 'QUALITY_ISSUE',
    '안전 문제': 'SAFETY_ISSUE',
    
    // 상태
    '미해결': 'OPEN',
    '진행 중': 'IN_PROGRESS',
    '해결됨': 'RESOLVED',
    '종료': 'CLOSED',
    
    // 우선순위
    '심각': 'CRITICAL',
    '높음': 'HIGH',
    '중간': 'MEDIUM',
    '낮음': 'LOW'
  };

  const thaiToEnglish: { [key: string]: string } = {
    // 부서
    'แผนกการผลิต': 'PRODUCTION',
    'แผนกควบคุมคุณภาพ': 'QUALITY_CONTROL',
    'คลังสินค้าและโลจิสติกส์': 'LOGISTICS',
    'การจัดการวัสดุ': 'MATERIAL_MANAGEMENT',
    'ฝ่ายสนับสนุนการจัดการ': 'MANAGEMENT_SUPPORT',
    'แผนกวิจัยและพัฒนา': 'RESEARCH_DEVELOPMENT',
    'ฝ่ายทรัพยากรบุคคล': 'HUMAN_RESOURCES',
    'แผนกการเงิน': 'FINANCE',
    'แผนกขาย': 'SALES',
    'การตลาด': 'MARKETING',
    'แผนกบันเทิง': 'ENTERTAINMENT',
    
    // 카테고리
    'อุปกรณ์': 'EQUIPMENT',
    'ข้อผิดพลาดของซอฟต์แวร์': 'SOFTWARE_ERROR',
    'การขาดแคลนสินค้าคงคลัง': 'INVENTORY_SHORTAGE',
    'ปัญหาคุณภาพ': 'QUALITY_ISSUE',
    'ปัญหาความปลอดภัย': 'SAFETY_ISSUE',
    
    // 상태
    'เปิด': 'OPEN',
    'กำลังดำเนินการ': 'IN_PROGRESS',
    'แก้ไขแล้ว': 'RESOLVED',
    'ปิด': 'CLOSED',
    
    // 우선순위
    'วิกฤต': 'CRITICAL',
    'สูง': 'HIGH',
    'กลาง': 'MEDIUM',
    'ต่ำ': 'LOW'
  };

  const mappingTable = language === 'ko' ? koreanToEnglish : thaiToEnglish;
  if (mappingTable[text]) {
    return mappingTable[text];
  }

  // 매핑 테이블에 없는 경우 텍스트 자체를 코드화
  return formatAsCode(text === '' ? 'UNTITLED' : text);
} 