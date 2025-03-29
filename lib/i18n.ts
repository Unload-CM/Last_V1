import { prisma } from '@/lib/prisma';

export type SupportedLanguage = 'ko' | 'th';
export type TranslationType = 'department' | 'status' | 'priority' | 'category';

// 인메모리 번역 데이터
const inMemoryTranslations: {
  code: string;
  type: TranslationType;
  language: SupportedLanguage;
  label: string;
  description?: string;
}[] = [
  // 한국어 번역
  { code: 'DEPARTMENT_PRODUCTION', type: 'department', language: 'ko', label: '생산부', description: '제품 생산 담당 부서' },
  { code: 'DEPARTMENT_QUALITY', type: 'department', language: 'ko', label: '품질관리부', description: '품질 관리 담당 부서' },
  { code: 'STATUS_OPEN', type: 'status', language: 'ko', label: '열림', description: '신규 이슈' },
  { code: 'STATUS_IN_PROGRESS', type: 'status', language: 'ko', label: '진행 중', description: '처리 중인 이슈' },
  
  // 태국어 번역
  { code: 'DEPARTMENT_PRODUCTION', type: 'department', language: 'th', label: 'แผนกการผลิต', description: 'แผนกที่รับผิดชอบการผลิตสินค้า' },
  { code: 'DEPARTMENT_QUALITY', type: 'department', language: 'th', label: 'แผนกควบคุมคุณภาพ', description: 'แผนกที่รับผิดชอบการควบคุมคุณภาพ' },
  { code: 'STATUS_OPEN', type: 'status', language: 'th', label: 'เปิด', description: 'ปัญหาใหม่' },
  { code: 'STATUS_IN_PROGRESS', type: 'status', language: 'th', label: 'กำลังดำเนินการ', description: 'ปัญหาที่กำลังดำเนินการ' }
];

// 번역 데이터를 가져오는 함수
export async function getTranslations(type: TranslationType, language: SupportedLanguage) {
  // 인메모리 데이터에서 필터링
  const translations = inMemoryTranslations.filter(
    t => t.type === type && t.language === language
  );
  
  return translations.reduce((acc, curr) => {
    acc[curr.code] = {
      label: curr.label,
      description: curr.description
    };
    return acc;
  }, {} as Record<string, { label: string; description?: string }>);
}

// 자동 코드 생성 함수
export function generateCode(thaiText: string): string {
  // 태국어를 영문으로 변환하는 매핑
  const thaiToEnglish: Record<string, string> = {
    'แผนก': 'DEPARTMENT',
    'อุปกรณ์': 'EQUIPMENT',
    'ซอฟต์แวร์': 'SOFTWARE',
    'คลังสินค้า': 'INVENTORY',
    'คุณภาพ': 'QUALITY',
    'ความปลอดภัย': 'SAFETY',
    // 필요한 매핑 추가
  };

  // 태국어 텍스트를 영문 코드로 변환
  let code = thaiText;
  Object.entries(thaiToEnglish).forEach(([thai, eng]) => {
    code = code.replace(new RegExp(thai, 'g'), eng);
  });

  // 특수문자 제거 및 공백을 언더스코어로 변환
  code = code
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_')
    .toUpperCase();

  return code;
}

// 새로운 번역 추가 함수
export async function addTranslation(
  type: TranslationType,
  thaiLabel: string,
  thaiDescription: string
) {
  const code = generateCode(thaiLabel);

  // 한국어 번역 추가 (기본값 사용)
  inMemoryTranslations.push({
    code,
    type,
    language: 'ko',
    label: code, // 임시로 코드를 라벨로 사용
    description: '번역 필요' // 번역 필요 표시
  });

  // 태국어 번역 추가
  inMemoryTranslations.push({
    code,
    type,
    language: 'th',
    label: thaiLabel,
    description: thaiDescription
  });

  return code;
} 