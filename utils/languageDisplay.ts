/**
 * 언어 기반 데이터 표시 유틸리티 함수
 * 한국어: label 필드 사용
 * 영어: name 필드 사용
 * 태국어: thaiLabel 필드 사용 (없으면 label로 폴백)
 */

type DataWithLabels = {
  name: string;
  label: string;
  thaiLabel?: string;
  [key: string]: any;
};

/**
 * 언어 설정에 따라 적절한 필드를 선택하여 표시
 * @param data 데이터 객체 (name, label, thaiLabel 필드 포함)
 * @param language 현재 언어 설정 ('ko' | 'en' | 'th')
 * @param fallback 데이터가 없을 경우 표시할 기본값
 * @returns 현재 언어에 맞는 표시명
 */
export function getLocalizedDisplay(
  data: DataWithLabels | null | undefined,
  language: string,
  fallback: string = '-'
): string {
  if (!data) return fallback;
  
  switch (language) {
    case 'en':
      return data.name || fallback;
    case 'th':
      if (data.thaiLabel) return data.thaiLabel;
      return data.label || fallback;
    case 'ko':
    default:
      return data.label || fallback;
  }
}

/**
 * 상태(Status) 필드의 다국어 표시
 */
export function getStatusDisplayName(
  status: DataWithLabels | null | undefined,
  language: string,
  fallback: string = '-'
): string {
  return getLocalizedDisplay(status, language, fallback);
}

/**
 * 우선순위(Priority) 필드의 다국어 표시
 */
export function getPriorityDisplayName(
  priority: DataWithLabels | null | undefined,
  language: string,
  fallback: string = '-'
): string {
  return getLocalizedDisplay(priority, language, fallback);
}

/**
 * 카테고리(Category) 필드의 다국어 표시
 */
export function getCategoryDisplayName(
  category: DataWithLabels | null | undefined,
  language: string,
  fallback: string = '-'
): string {
  return getLocalizedDisplay(category, language, fallback);
}

/**
 * 부서(Department) 필드의 다국어 표시
 */
export function getDepartmentDisplayName(
  department: DataWithLabels | null | undefined,
  language: string,
  fallback: string = '-'
): string {
  if (!department) return fallback;
  
  if (language === 'en') return department.name || fallback;
  if (language === 'th') {
    // thaiLabel이 있으면 사용
    if (department.thaiLabel) {
      return department.thaiLabel;
    }
    
    // 없으면 translations에서 가져오기 시도
    try {
      const { departmentTranslationsThai } = require('@/lib/i18n/translations');
      const keyName = department.name?.toLowerCase();
      if (keyName && departmentTranslationsThai[keyName]) {
        console.log(`부서 ${department.name}의 태국어 번역 찾음:`, departmentTranslationsThai[keyName]);
        return departmentTranslationsThai[keyName];
      }
    } catch (e) {
      console.error('부서 번역 데이터 가져오기 오류:', e);
    }
    
    // 둘 다 없으면 기본 라벨 사용
    console.log(`부서 ${department.name}의 태국어 라벨이 없어 기본값 사용:`, department.label);
    return department.label || fallback;
  }
  
  // 한국어
  return department.label || fallback;
} 