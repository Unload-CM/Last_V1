'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useLanguageStore } from '@/store/languageStore';

interface LanguageProviderProps {
  children: ReactNode;
}

/**
 * 앱 전체에 다국어 지원을 제공하는 Provider 컴포넌트
 * 
 * 루트 레이아웃에서 사용합니다.
 */
export default function LanguageProvider({ children }: LanguageProviderProps) {
  const { loadTranslations, initialized, language } = useLanguageStore();
  const [isClient, setIsClient] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // 마운트 시 즉시 번역 데이터 로드 (서버 사이드에서는 작동하지 않음)
  useEffect(() => {
    setIsClient(true);
    
    // 클라이언트 측에서 번역 데이터 로드
    const loadData = async () => {
      try {
        console.log('번역 데이터 로드 시작');
        await loadTranslations();
        console.log('번역 데이터 로드 완료');
        setIsReady(true);
      } catch (error) {
        console.error('번역 데이터 로드 오류:', error);
        // 오류가 있어도 앱은 계속 동작해야 함
        setIsReady(true);
      }
    };
    
    loadData();
  }, [loadTranslations]);
  
  // language 변경 시 번역 데이터 로드
  useEffect(() => {
    if (isClient) {
      console.log(`언어 변경됨: ${language}, 번역 데이터 다시 로드`);
      loadTranslations(language);
    }
  }, [language, isClient, loadTranslations]);
  
  // 클라이언트 사이드에서 준비되기 전에는 아무것도 렌더링하지 않음
  if (!isClient) {
    return null;
  }
  
  // 클라이언트에서 초기 로딩 완료 전에는 간단한 로딩 상태 표시
  if (!isReady) {
    return <div style={{ display: 'none' }}></div>;
  }
  
  console.log('번역 준비 완료, 컴포넌트 렌더링');
  return <>{children}</>;
} 