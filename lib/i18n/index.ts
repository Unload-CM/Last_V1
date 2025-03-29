'use client';

import {
  departmentTranslations,
  departmentTranslationsThai,
  positionTranslations,
  positionTranslationsThai,
  statusTranslations,
  statusTranslationsThai,
  priorityTranslations,
  priorityTranslationsThai,
  categoryTranslations,
  categoryTranslationsThai,
  employeeTranslations,
  employeeTranslationsThai,
  commonTranslations,
  commonTranslationsThai
} from './translations';

import {
  loadTranslations,
  getTranslation,
  addTranslation,
  getBulkTranslations,
  invalidateCache
} from './dynamic-translator';

import { Department } from '@prisma/client';

import { createContext, useContext, useState, useCallback, ReactNode, createElement } from 'react';

// 언어 코드 정의
export const LANGUAGES = {
  KO: 'ko',
  TH: 'th',
  EN: 'en'
} as const;

// 지원하는 언어 타입
export type LanguageCode = typeof LANGUAGES[keyof typeof LANGUAGES];

// 번역 키 타입
export type TranslationKey = string;

// 번역 데이터 타입
export type TranslationData = {
  [key: string]: string | TranslationData;
};

// 번역 컨텍스트 타입
export interface TranslationContext {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey) => string;
}

// 기본 언어 설정
export const DEFAULT_LANGUAGE: LanguageCode = LANGUAGES.KO;

// 지원하는 언어 목록
export const SUPPORTED_LANGUAGES = [
  { code: LANGUAGES.KO, name: '한국어' },
  { code: LANGUAGES.TH, name: 'ไทย' },
  { code: LANGUAGES.EN, name: 'English' }
] as const;

// 현재 언어 설정
let currentLanguage: LanguageCode = DEFAULT_LANGUAGE;

// 동적 번역 사용 여부
let useDynamicTranslation = true;

/**
 * 동적 번역 모드 설정
 */
export function setDynamicTranslationMode(useMode: boolean): void {
  useDynamicTranslation = useMode;
  console.log(`동적 번역 모드: ${useMode ? '사용' : '미사용'}`);
}

/**
 * 현재 언어 설정하기
 */
export function setLanguage(lang: string): void {
  const normalizedLang = normalizeLanguageCode(lang);
  currentLanguage = normalizedLang;
  console.log(`언어가 ${normalizedLang}로 설정되었습니다.`);
}

/**
 * 현재 설정된 언어 가져오기
 */
export function getLanguage(): LanguageCode {
  return currentLanguage;
}

/**
 * 키에 해당하는 번역 가져오기
 */
export async function tAsync(key: string): Promise<string> {
  if (useDynamicTranslation) {
    return await getTranslation(key, currentLanguage);
  } else {
    return t(key);
  }
}

/**
 * 키에 해당하는 번역 가져오기 (동기 버전)
 */
export function t(key: string): string {
  const [category, subKey] = key.split('.');
  
  switch (category) {
    case 'employees':
      if (currentLanguage === LANGUAGES.TH) {
        return employeeTranslationsThai[subKey] || key;
      }
      return employeeTranslations[subKey] || key;
    
    case 'common':
      if (currentLanguage === LANGUAGES.TH) {
        return commonTranslationsThai[subKey] || key;
      }
      return commonTranslations[subKey] || key;
    
    default:
  switch (currentLanguage) {
    case LANGUAGES.KO:
      return getKoreanTranslation(key) || key;
    case LANGUAGES.TH:
      return getThaiTranslation(key) || getKoreanTranslation(key) || key;
    case LANGUAGES.EN:
          return key;
    default:
      return key;
      }
  }
}

/**
 * 한국어 번역 가져오기
 */
function getKoreanTranslation(key: string): string | undefined {
  if (key in departmentTranslations) {
    return departmentTranslations[key];
  }
  if (key in positionTranslations) {
    return positionTranslations[key];
  }
  if (key in statusTranslations) {
    return statusTranslations[key];
  }
  if (key in priorityTranslations) {
    return priorityTranslations[key];
  }
  if (key in categoryTranslations) {
    return categoryTranslations[key];
  }
  return undefined;
}

/**
 * 태국어 번역 가져오기
 */
function getThaiTranslation(key: string): string | undefined {
  if (key in departmentTranslationsThai) {
    return departmentTranslationsThai[key];
  }
  if (key in positionTranslationsThai) {
    return positionTranslationsThai[key];
  }
  if (key in statusTranslationsThai) {
    return statusTranslationsThai[key];
  }
  if (key in priorityTranslationsThai) {
    return priorityTranslationsThai[key];
  }
  if (key in categoryTranslationsThai) {
    return categoryTranslationsThai[key];
  }
  return undefined;
}

// 번역 시스템 초기화
export async function initTranslationSystem(): Promise<void> {
  if (useDynamicTranslation) {
    await loadTranslations();
  }
}

/**
 * 데이터베이스 항목의 표시 이름을 현재 언어에 맞게 반환합니다.
 */
export function getDisplayName(
  item: { name: string; label?: string; thaiLabel?: string },
  type: 'department' | 'position' | 'status' | 'priority' | 'category'
): string {
  if (!item) return '';

  if (currentLanguage === LANGUAGES.TH) {
    if (item.thaiLabel) {
      return item.thaiLabel;
    }
    
    const translations = {
      department: departmentTranslationsThai,
      position: positionTranslationsThai,
      status: statusTranslationsThai,
      priority: priorityTranslationsThai,
      category: categoryTranslationsThai
    };
    
    return translations[type][item.name] || item.name;
  }

  return item.label || item.name;
}

/**
 * 데이터베이스에서 가져온 사원 데이터를 UI 표시용으로 변환합니다.
 */
export function formatEmployeesForUI(employees: any[]): any[] {
  return employees.map(emp => ({
    ...emp,
    department: getDisplayName({ 
      name: emp.department,
      label: emp.departmentLabel,
      thaiLabel: emp.departmentThaiLabel 
    }, 'department'),
    position: getDisplayName({ 
      name: emp.position,
      label: emp.positionLabel,
      thaiLabel: emp.positionThaiLabel 
    }, 'position')
  }));
}

/**
 * 부서 정보를 선택된 언어로 번역합니다.
 */
export function translateDepartment(department: Department, language: string = 'ko') {
  if (!department) return null;

  return {
    ...department,
    label: language === 'th' ? department.thaiLabel || department.label : department.label,
    description: language === 'th' ? department.thaiDescription || department.description : department.description
  };
}

/**
 * 카테고리 정보를 선택된 언어로 번역합니다.
 */
export function translateCategory(category: any, language: string = 'ko') {
  if (!category) return null;

  return {
    ...category,
    label: language === 'th' ? category.thaiLabel || category.label : category.label,
    description: language === 'th' ? category.thaiDescription || category.description : category.description
  };
}

/**
 * 카테고리명을 영문 키로 변환합니다.
 */
export function getCategoryKey(name: string): string {
  const categoryKeys: { [key: string]: string } = {
    '품질': 'quality',
    '생산': 'production',
    '설비': 'maintenance',
    '안전': 'safety',
    '기타': 'etc'
  };

  return categoryKeys[name] || name.toLowerCase();
}

/**
 * 부서명을 영문 키로 변환합니다.
 */
export function getDepartmentKey(name: string): string {
  const departmentKeys: { [key: string]: string } = {
    '품질부': 'quality',
    '생산부': 'production',
    '설비부': 'maintenance',
    '구매부': 'purchasing',
    'BOI': 'boi',
    '자재부': 'materials'
  };

  return departmentKeys[name] || name.toLowerCase();
}

// 이전 버전과의 호환성을 위해 내보내기
export {
  loadTranslations,
  getTranslation,
  addTranslation,
  getBulkTranslations,
  invalidateCache
} from './dynamic-translator';

type Language = 'ko' | 'th' | 'en';

interface TranslationsType {
  [key: string]: {
    [key: string]: string;
  };
}

const DEFAULT_TRANSLATIONS: TranslationsType = {
  ko: {
    'employees.title': '직원 관리',
    'employees.addTitle': '새 직원 등록',
    'employees.requiredFieldsNote': '* 표시는 필수 입력 항목입니다',
    'employees.id': '사번',
    'employees.name': '이름',
    'employees.department': '부서',
    'employees.thaiName': '태국어 이름',
    'employees.nickname': '닉네임',
    'employees.isThai': '태국인 여부',
    'employees.isThaiDescription': '태국 국적 직원인 경우 체크해주세요',
    'employees.namePlaceholder': '이름을 입력하세요',
    'employees.departmentPlaceholder': '부서를 선택하세요',
    'employees.searchPlaceholder': '이름, 부서, 태국어 이름, 닉네임으로 검색',
    'employees.addNew': '직원 추가',
    'employees.noEmployees': '등록된 직원이 없습니다',
    'employees.actions': '관리',
    'common.add': '추가',
    'common.cancel': '취소'
  },
  th: {
    'employees.title': 'จัดการพนักงาน',
    'employees.addTitle': 'เพิ่มพนักงานใหม่',
    'employees.requiredFieldsNote': '* จำเป็นต้องกรอก',
    'employees.id': 'รหัสพนักงาน',
    'employees.name': 'ชื่อ',
    'employees.department': 'แผนก',
    'employees.thaiName': 'ชื่อภาษาไทย',
    'employees.nickname': 'ชื่อเล่น',
    'employees.isThai': 'พนักงานไทย',
    'employees.isThaiDescription': 'เลือกถ้าเป็นพนักงานสัญชาติไทย',
    'employees.namePlaceholder': 'กรุณากรอกชื่อ',
    'employees.departmentPlaceholder': 'กรุณาเลือกแผนก',
    'employees.searchPlaceholder': 'ค้นหาด้วยชื่อ แผนก ชื่อไทย หรือชื่อเล่น',
    'employees.addNew': 'เพิ่มพนักงาน',
    'employees.noEmployees': 'ไม่มีพนักงาน',
    'employees.actions': 'จัดการ',
    'common.add': 'เพิ่ม',
    'common.cancel': 'ยกเลิก'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Language Context
const LanguageContext = createContext<LanguageContextType>({
  language: 'ko',
  setLanguage: () => {},
  t: (key: string) => key
});

/**
 * 언어 설정을 제공하는 컴포넌트
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(
    (typeof window !== 'undefined' && localStorage.getItem('language') as Language) || 'ko'
  );

  // 언어 변경 함수
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    currentLanguage = lang;
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  }, []);

  return createElement(
    LanguageContext.Provider, 
    { value: { language, setLanguage, t } }, 
    children
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}