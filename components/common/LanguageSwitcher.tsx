'use client';

import { useEffect, useState } from 'react';
import { useTranslation, Language, SUPPORTED_LANGUAGES } from '@/store/languageStore';
import { Globe, ChevronDown } from 'lucide-react';

// 언어 표시 이름 매핑
const languageNames: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  th: 'ภาษาไทย'
};

// 국기 아이콘 매핑 (유니코드 이모지 사용)
const languageFlags: Record<Language, string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  th: '🇹🇭'
};

type LanguageSwitcherProps = {
  // 드롭다운 또는 버튼 그룹 스타일 선택 (기본값: dropdown)
  variant?: 'dropdown' | 'buttons';
  
  // 아이콘 표시 여부 (기본값: false)
  showIcons?: boolean;
  
  // 스타일 커스터마이징을 위한 추가 클래스
  className?: string;
};

// 클라이언트 컴포넌트
export default function LanguageSwitcher({
  variant = 'dropdown',
  showIcons = true,
  className = ''
}: LanguageSwitcherProps) {
  // 서버 사이드 렌더링과 클라이언트 렌더링 간의 불일치 문제 해결
  const [mounted, setMounted] = useState(false);
  
  // 스토어에서 필요한 데이터와 함수 가져오기 - useTranslation 사용
  const { language, setLanguage } = useTranslation();
  
  // 마운트 상태 관리
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 언어 선택기 드롭다운 상태
  const [isOpen, setIsOpen] = useState(false);

  // 서버 사이드 렌더링 시에는 빈 컴포넌트 반환
  if (!mounted) {
    return (
      <div className={className}>
        <button className="flex items-center space-x-1 px-2 py-1 rounded-md">
          <span>한국어</span>
        </button>
      </div>
    );
  }

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  // 드롭다운 스타일
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-100 focus:outline-none transition-colors"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {showIcons && <span className="mr-1">{languageFlags[language]}</span>}
          <span>{languageNames[language]}</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 right-0 bg-white rounded-md shadow-lg py-1 w-32 border border-gray-200">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                  language === lang ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                {showIcons && <span className="mr-2">{languageFlags[lang]}</span>}
                {languageNames[lang]}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 버튼 그룹 스타일
  return (
    <div className={`flex space-x-2 ${className}`}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          onClick={() => handleLanguageChange(lang)}
          className={`px-3 py-1 rounded-md flex items-center ${
            language === lang
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          aria-pressed={language === lang}
        >
          {showIcons && <span className="mr-1">{languageFlags[lang]}</span>}
          {languageNames[lang]}
        </button>
      ))}
    </div>
  );
} 