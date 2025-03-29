import { useCallback } from 'react';
import { useLanguageStore } from '@/store/languageStore';

/**
 * 다국어 번역을 위한 훅
 * 현재 설정된 언어에 따라 텍스트를 번역하는 함수를 제공합니다.
 */
export function useTranslate() {
  const { language } = useLanguageStore();
  
  /**
   * 주어진 텍스트 항목들을 현재 언어에 맞게 번역합니다.
   * @param korean 한국어 텍스트
   * @param thai 태국어 텍스트 (선택적)
   * @param english 영어 텍스트 (선택적)
   * @returns 현재 설정된 언어에 맞는 텍스트
   */
  const translate = useCallback(
    (korean: string, thai?: string, english?: string): string => {
      // 현재 언어 설정에 따라 적절한 번역 반환
      switch (language) {
        case 'th':
          return thai || korean;
        case 'en':
          return english || korean;
        case 'ko':
        default:
          return korean;
      }
    },
    [language]
  );
  
  return { translate };
} 