'use client';

import { useTranslation as useZustandTranslation } from '@/store/languageStore';

// 하위 호환성을 위한 re-export
export default function useTranslation() {
  return useZustandTranslation();
}

// 기존 코드는 참조용으로 주석 처리
/*
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

// 지원 언어 타입
export type Language = 'ko' | 'th' | 'en';

// 지원 언어 목록
export const SUPPORTED_LANGUAGES: Language[] = ['ko', 'th', 'en'];

// 번역 데이터 인터페이스
interface TranslationsType {
  [key: string]: {
    [key: string]: string | object;
  };
}

// 언어 컨텍스트 인터페이스
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
  supportedLanguages: Language[];
}

// 기본값 설정
const defaultLanguage: Language = 'ko';

// 번역 파일 경로 설정
const getTranslationPath = (lang: Language) => `/locales/${lang}/common.json`;

// 언어 컨텍스트 생성
const LanguageContext = createContext<LanguageContextType>({
  language: defaultLanguage,
  setLanguage: () => {},
  t: () => '',
  isLoading: true,
  supportedLanguages: SUPPORTED_LANGUAGES,
});

// 전역 번역 캐시 - 앱 전체에서 번역 데이터 유지
let translationsCache: TranslationsType = {};

// 언어 컨텍스트 제공자 컴포넌트
export function LanguageProvider({ children }: { children: ReactNode }) {
  // 세션 정보 가져오기 (로그인 상태 감지)
  const { status: sessionStatus } = useSession();
  
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [translations, setTranslations] = useState<TranslationsType>(translationsCache);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);

  // 브라우저 localStorage에서 언어 설정 불러오기 (클라이언트 사이드에서만 실행)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedLanguage = localStorage.getItem('language') as Language;
        console.log('localStorage에서 언어 설정 확인:', savedLanguage);
        if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
          console.log('localStorage에서 언어 설정 로드:', savedLanguage);
          setLanguage(savedLanguage);
        } else {
          // 브라우저 언어 감지 시도
          try {
            const browserLang = navigator.language.split('-')[0] as Language;
            console.log('브라우저 언어 감지:', browserLang);
            if (SUPPORTED_LANGUAGES.includes(browserLang)) {
              console.log('브라우저에서 감지된 언어로 설정:', browserLang);
              setLanguage(browserLang);
              localStorage.setItem('language', browserLang);
            }
          } catch (e) {
            console.error('브라우저 언어 감지 오류:', e);
          }
        }
      }
    } catch (error) {
      console.error('언어 설정 로드 중 오류:', error);
    }
  }, []);

  // 모든 언어의 번역 파일 미리 로드 - 세션 상태나 언어가 변경될 때마다 실행
  useEffect(() => {
    async function loadAllTranslations() {
      // 이미 캐시에 있는 번역이 있으면 먼저 사용
      if (Object.keys(translationsCache).length > 0) {
        console.log('캐시된 번역 데이터 사용:', Object.keys(translationsCache).join(', '));
        setTranslations(translationsCache);
        
        // 현재 언어의 번역이 이미 캐시에 있는지 확인
        if (translationsCache[language]) {
          console.log(`${language} 번역 데이터가 이미 캐시에 있음`);
          setIsLoading(false);
          setInitialized(true);
          return;
        }
      }

      setIsLoading(true);
      try {
        console.log('모든 언어 번역 파일 로딩 시작 (세션 상태:', sessionStatus, ')');
        
        // 현재 언어의 번역 파일 먼저 로드 (사용자 경험 향상)
        await loadTranslation(language);
        
        // 나머지 언어 로드
        const remainingLanguages = SUPPORTED_LANGUAGES.filter(lang => lang !== language);
        for (const lang of remainingLanguages) {
          await loadTranslation(lang);
        }
        
        console.log('모든 언어 파일 로드 완료');
      } catch (error) {
        console.error('번역 파일 로드 오류:', error);
      } finally {
        setIsLoading(false);
        setInitialized(true);
      }
    }
    
    loadAllTranslations();
  }, [language, sessionStatus]); // 세션 상태가 변경될 때도 다시 로드

  // 단일 언어 번역 파일 로드 함수
  const loadTranslation = async (lang: Language) => {
    try {
      console.log(`${lang} 번역 파일 로드 시작`);
      
      // 이미 캐시에 있으면 건너뛰기
      if (translationsCache[lang]) {
        console.log(`${lang} 번역 파일이 이미 캐시에 있음, 건너뛰기`);
        return translationsCache[lang];
      }
      
      // 타임스탬프를 추가하여 캐시 방지
      const timestamp = new Date().getTime();
      const response = await fetch(`${getTranslationPath(lang)}?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`${lang} 번역 파일 로드 실패: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log(`${lang} 번역 파일 내용 일부:`, text.substring(0, 100) + '...');
      
      try {
        const data = JSON.parse(text);
        console.log(`${lang} 번역 파일 파싱 성공:`, Object.keys(data).join(', '));
        
        // 전역 캐시와 상태 모두 업데이트
        translationsCache = { 
          ...translationsCache, 
          [lang]: data 
        };
        
        setTranslations(prev => ({ 
          ...prev, 
          [lang]: data 
        }));
        
        return data;
      } catch (parseError) {
        console.error(`${lang} 번역 파일 JSON 파싱 오류:`, parseError);
        return null;
      }
    } catch (error) {
      console.error(`${lang} 번역 파일 로드 오류:`, error);
      return null;
    }
  };

  // 언어 변경 시 localStorage에 저장
  useEffect(() => {
    if (typeof window !== 'undefined' && initialized) {
      console.log(`언어 변경: ${language}`);
      localStorage.setItem('language', language);
    }
  }, [language, initialized]);

  // 디버깅용: 번역 상태 정보 기록
  useEffect(() => {
    if (initialized) {
      console.log(`번역 준비 완료 - 언어: ${language}, 로딩 상태: ${isLoading}, 세션 상태: ${sessionStatus}`);
      console.log(`사용 가능한 번역: ${Object.keys(translations).join(', ')}`);
    }
  }, [initialized, language, isLoading, sessionStatus, translations]);

  // 번역 키에 대한 값 반환 함수
  const t = (key: string): string => {
    // 키 경로 분리
    const keys = key.split('.');
    
    // 번역 데이터 확인
    if (!translations[language]) {
      // console.log(`${language}에 대한 번역 데이터 없음, 키: ${key}`);
      return key;
    }
    
    // 중첩된 객체에서 값 찾기
    let value: any = translations[language];
    for (const k of keys) {
      if (!value || typeof value !== 'object') {
        // console.log(`키를 찾을 수 없음: ${key} (${k} 부분에서)`);
        return key;
      }
      value = value[k];
    }
    
    // 최종 값이 문자열인지 확인
    if (typeof value !== 'string') {
      // console.log(`${key}에 대한 값이 문자열이 아님: ${typeof value}`);
      return key;
    }
    
    return value;
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      isLoading,
      supportedLanguages: SUPPORTED_LANGUAGES
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

// 언어 컨텍스트 사용을 위한 훅
export default function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
*/ 