'use client';

import { useRouter } from 'next/navigation';
import useTranslation, { Language } from '../utils/i18n';

console.log('LanguageSwitcher loaded');

export default function LanguageSwitcher() {
  const router = useRouter();
  try {
    const { language, setLanguage } = useTranslation();

    const changeLanguage = (locale: string) => {
      setLanguage(locale as Language);
      // 페이지 새로고침하여 변경사항 적용
      window.location.reload();
    };

    return (
      <div className="flex space-x-2">
        <button
          className={`px-3 py-1 rounded-md ${
            language === 'ko' ? 'bg-primary-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => changeLanguage('ko')}
        >
          한국어
        </button>
        <button
          className={`px-3 py-1 rounded-md ${
            language === 'th' ? 'bg-primary-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => changeLanguage('th')}
        >
          ไทย
        </button>
        <button
          className={`px-3 py-1 rounded-md ${
            language === 'en' ? 'bg-primary-500 text-white' : 'bg-gray-200'
          }`}
          onClick={() => changeLanguage('en')}
        >
          English
        </button>
      </div>
    );
  } catch (error) {
    console.error('LanguageSwitcher 오류:', error);
    return <div>Language Switcher Error</div>;
  }
} 