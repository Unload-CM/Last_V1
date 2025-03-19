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

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// 언어 코드 정의
export const LANGUAGES = {
  KO: 'ko',
  TH: 'th',
  EN: 'en'
};

// 현재 언어 설정
let currentLanguage = LANGUAGES.KO;

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
export function setLanguage(lang: string) {
  if (Object.values(LANGUAGES).includes(lang)) {
    currentLanguage = lang;
    console.log(`언어가 ${lang}로 설정되었습니다.`);
  } else {
    console.error(`지원하지 않는 언어 코드: ${lang}`);
  }
}

/**
 * 현재 설정된 언어 가져오기
 */
export function getLanguage(): string {
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
export function getDisplayName(item: { name: string; label?: string; thaiLabel?: string }, type: 'department' | 'position' | 'status' | 'priority' | 'category'): string {
  if (!item) return '';

  if (currentLanguage === LANGUAGES.TH) {
    // 1. 데이터베이스에 저장된 태국어 라벨이 있으면 사용
    if (item.thaiLabel) {
      return item.thaiLabel;
    }
    
    // 2. 없으면 translations.ts의 태국어 번역 사용
    switch (type) {
      case 'department':
        return departmentTranslationsThai[item.name] || item.name;
      case 'position':
        return positionTranslationsThai[item.name] || item.name;
      case 'status':
        return statusTranslationsThai[item.name] || item.name;
      case 'priority':
        return priorityTranslationsThai[item.name] || item.name;
      case 'category':
        return categoryTranslationsThai[item.name] || item.name;
      default:
        return item.name;
    }
  }

  // 한국어 표시
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
export { loadTranslations, getTranslation, addTranslation, getBulkTranslations, invalidateCache } from './dynamic-translator';

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

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ko');
  const [translations, setTranslations] = useState<TranslationsType>(DEFAULT_TRANSLATIONS);

  const t = useCallback((key: string): string => {
    const translation = translations[language]?.[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key} in language: ${language}`);
      return key.split('.').pop() || key;
    }
    return translation;
  }, [language, translations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}