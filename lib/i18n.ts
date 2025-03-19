import { prisma } from '@/lib/prisma';

export type SupportedLanguage = 'ko' | 'th';
export type TranslationType = 'department' | 'status' | 'priority' | 'category';

// 번역 데이터를 가져오는 함수
export async function getTranslations(type: TranslationType, language: SupportedLanguage) {
  const translations = await prisma.translation.findMany({
    where: {
      type,
      language
    }
  });
  
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
  await prisma.translation.create({
    data: {
      code,
      type,
      language: 'ko',
      label: code, // 임시로 코드를 라벨로 사용
      description: '번역 필요' // 번역 필요 표시
    }
  });

  // 태국어 번역 추가
  await prisma.translation.create({
    data: {
      code,
      type,
      language: 'th',
      label: thaiLabel,
      description: thaiDescription
    }
  });

  return code;
} 