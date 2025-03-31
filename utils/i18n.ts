import { useState, useEffect } from 'react';

// 번역 타입 정의
type Translations = {
  [key: string]: string | { [key: string]: string | Translations };
};

// 지원하는 언어 타입
export type Language = 'ko' | 'en' | 'th';

// 기본 번역 데이터
const translations: Record<Language, Translations> = {
  ko: {
    common: {
      loading: "로딩 중",
      error: "오류",
      noPermission: "권한이 없습니다",
      processing: "처리 중..."
    },
    nav: {
      dashboard: "대시보드",
      issues: "이슈",
      employees: "직원",
      settings: "설정",
      changePassword: "비밀번호 변경",
      userManual: "사용자 매뉴얼",
      logout: "로그아웃",
      more: "더보기"
    }
  },
  en: {
    common: {
      loading: "Loading",
      error: "Error",
      noPermission: "No permission",
      processing: "Processing..."
    },
    nav: {
      dashboard: "Dashboard",
      issues: "Issues",
      employees: "Employees",
      settings: "Settings",
      changePassword: "Change Password",
      userManual: "User Manual",
      logout: "Logout",
      more: "More"
    }
  },
  th: {
    common: {
      loading: "กำลังโหลด",
      error: "ข้อผิดพลาด",
      noPermission: "ไม่มีสิทธิ์",
      processing: "กำลังประมวลผล..."
    },
    nav: {
      dashboard: "แดชบอร์ด",
      issues: "ปัญหา",
      employees: "พนักงาน",
      settings: "การตั้งค่า",
      changePassword: "เปลี่ยนรหัสผ่าน",
      userManual: "คู่มือการใช้งาน",
      logout: "ออกจากระบบ",
      more: "เพิ่มเติม"
    }
  }
};

// 기본 언어 설정
const DEFAULT_LANGUAGE: Language = 'ko';

// 번역 함수
const translate = (key: string, language: Language): string => {
  const keys = key.split('.');
  let current: any = translations[language];

  for (const k of keys) {
    if (current[k] === undefined) {
      return key; // 키를 찾을 수 없으면 키 자체를 반환
    }
    current = current[k];
  }

  return typeof current === 'string' ? current : key;
};

// i18n 훅
export default function useTranslation() {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  // 브라우저에서 언어 설정 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && ['ko', 'en', 'th'].includes(savedLanguage)) {
        setLanguage(savedLanguage);
      }
    }
  }, []);

  // 언어 변경 함수
  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  // 번역 함수
  const t = (key: string): string => {
    return translate(key, language);
  };

  return {
    t,
    language,
    setLanguage: changeLanguage
  };
} 