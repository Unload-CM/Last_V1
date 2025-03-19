import prisma from '@/lib/prisma';
import { LANGUAGES } from './index';

// 메모리 캐시 객체
let translationCache: {
  [key: string]: {
    [language: string]: string;
  };
} = {};

// 캐시가 로드되었는지 확인하는 플래그
let isCacheLoaded = false;

// 캐시 로드 진행 중인지 확인하는 플래그 (동시 요청 처리)
let isLoadingCache = false;

// 캐시 로드 대기 중인 Promise
let loadCachePromise: Promise<void> | null = null;

/**
 * 번역 데이터 캐시 초기화/로드
 */
export async function loadTranslations(): Promise<void> {
  // 이미 로드 중이면 진행 중인 Promise 반환
  if (isLoadingCache && loadCachePromise) {
    return loadCachePromise;
  }

  // 로드 중 플래그 설정
  isLoadingCache = true;

  // 새로운 로드 Promise 생성
  loadCachePromise = new Promise<void>(async (resolve) => {
    try {
      console.log('번역 데이터 로드 중...');
      
      // 데이터베이스에서 모든 번역 가져오기
      const translations = await prisma.translation.findMany();
      
      // 캐시 초기화
      translationCache = {};
      
      // 번역 데이터를 캐시에 저장
      for (const translation of translations) {
        if (!translationCache[translation.key]) {
          translationCache[translation.key] = {};
        }
        
        translationCache[translation.key][translation.language] = translation.translation;
      }
      
      console.log(`${translations.length}개의 번역 데이터 로드 완료`);
      isCacheLoaded = true;
    } catch (error) {
      console.error('번역 데이터 로드 중 오류 발생:', error);
    } finally {
      isLoadingCache = false;
      resolve();
    }
  });

  return loadCachePromise;
}

/**
 * 키와 언어에 해당하는 번역 가져오기
 * @param key 번역 키
 * @param language 언어 코드
 * @returns 번역된 문자열 또는 키 (번역이 없는 경우)
 */
export async function getTranslation(key: string, language: string): Promise<string> {
  // 캐시가 로드되지 않았으면 로드
  if (!isCacheLoaded) {
    await loadTranslations();
  }
  
  // 캐시에서 번역 가져오기
  if (translationCache[key] && translationCache[key][language]) {
    return translationCache[key][language];
  }
  
  // 한국어로 찾을 수 없으면 영어 형식으로 반환 (키를 공백으로 변환하고 첫 글자 대문자)
  if (language === LANGUAGES.EN) {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  
  // 번역이 없으면 키 그대로 반환
  return key;
}

/**
 * 새 번역 추가
 * @param key 번역 키
 * @param language 언어 코드
 * @param translation 번역 문자열
 * @param category 카테고리
 */
export async function addTranslation(
  key: string,
  language: string,
  translation: string,
  category: string
): Promise<void> {
  try {
    // 데이터베이스에 번역 추가/업데이트
    await prisma.translation.upsert({
      where: {
        key_language: {
          key,
          language
        }
      },
      update: {
        translation
      },
      create: {
        key,
        language,
        translation,
        category
      }
    });
    
    // 캐시 업데이트
    if (!translationCache[key]) {
      translationCache[key] = {};
    }
    
    translationCache[key][language] = translation;
  } catch (error) {
    console.error('번역 추가 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 여러 번역 한 번에 가져오기 (성능 최적화)
 * @param keys 번역 키 배열
 * @param language 언어 코드
 * @returns 키-번역 쌍 객체
 */
export async function getBulkTranslations(
  keys: string[],
  language: string
): Promise<Record<string, string>> {
  // 캐시가 로드되지 않았으면 로드
  if (!isCacheLoaded) {
    await loadTranslations();
  }
  
  const result: Record<string, string> = {};
  
  for (const key of keys) {
    if (translationCache[key] && translationCache[key][language]) {
      result[key] = translationCache[key][language];
    } else if (language === LANGUAGES.EN) {
      // 영어의 경우 키를 변환
      result[key] = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
    } else {
      // 없으면 키 그대로
      result[key] = key;
    }
  }
  
  return result;
}

/**
 * 키가 존재하는지 확인
 * @param key 번역 키
 * @param language 언어 코드
 * @returns 존재 여부
 */
export function hasTranslation(key: string, language: string): boolean {
  return !!(translationCache[key] && translationCache[key][language]);
}

/**
 * 캐시 무효화 및 재로드
 */
export async function invalidateCache(): Promise<void> {
  isCacheLoaded = false;
  return loadTranslations();
}

// 자동 번역 함수 (기본적인 규칙 기반 변환)
export function autoTranslateToEnglishKey(text: string, type: string): string {
  if (!text) return '';
  
  const typePostfix = {
    department: '_department',
    position: '_position',
    category: '_issue',
    status: '',
    priority: ''
  }[type] || '';
  
  const typePrefix = {
    status: 'issue_',
    priority: 'priority_',
    category: '',
    department: '',
    position: ''
  }[type] || '';
  
  // 한글->영어 기본 변환 규칙 (확장 가능)
  const koreanToEnglish: Record<string, string> = {
    '가': 'ga', '나': 'na', '다': 'da', '라': 'ra', '마': 'ma', 
    '바': 'ba', '사': 'sa', '아': 'a', '자': 'ja', '차': 'cha',
    '카': 'ka', '타': 'ta', '파': 'pa', '하': 'ha',
    '설비': 'equipment', '소프트웨어': 'software', '안전': 'safety',
    '재고': 'stock', '원자재': 'raw_material', '관리': 'management',
    '생산': 'production', '품질': 'quality', '물류': 'logistics'
  };
  
  // 특정 단어 전체 변환
  if (koreanToEnglish[text]) {
    return typePrefix + koreanToEnglish[text] + typePostfix;
  }
  
  // 문자 단위 변환 시도
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    result += koreanToEnglish[char] || char;
  }
  
  // 영어 키 형식으로 변환
  return typePrefix + 
    result
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') + 
    typePostfix;
} 