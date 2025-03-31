import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 지원하는 언어 정의
export type Language = 'ko' | 'en' | 'th';

// 지원하는 언어 목록
export const SUPPORTED_LANGUAGES: Language[] = ['ko', 'en', 'th'];

// 기본 언어 설정
export const DEFAULT_LANGUAGE: Language = 'ko';

// 언어 스토어 상태 인터페이스
interface LanguageState {
  // 현재 선택된 언어
  language: Language;
  
  // 언어 설정 함수
  setLanguage: (language: Language) => void;
  
  // 번역 함수
  t: (key: string) => string;
}

// 번역 데이터
const translations: Record<Language, Record<string, any>> = {
  ko: {
    common: {
      loading: "로딩 중",
      error: "오류",
      noIssuesFound: "이슈를 찾을 수 없습니다",
      month: "월",
      edit: "수정",
      delete: "삭제",
      processing: "처리 중...",
      save: "저장",
      saving: "저장 중...",
      cancel: "취소",
      noPermission: "사용 권한이 없습니다",
      status: '상태',
      category: '카테고리',
      department: '부서',
      createdBy: '작성자',
      createdAt: '생성일',
      updatedAt: '수정일',
      unknown: '알 수 없음',
      author: "작성자",
      deleting: "삭제 중...",
      refresh: "새로고침",
      itemsPerPage: "페이지당 항목 수",
      totalItems: "전체 항목",
      noMoreItems: "더 이상 항목이 없습니다",
      previous: "이전",
      next: "다음",
      user: "사용자"
    },
    nav: {
      title: "공장관리시스템",
      home: "홈",
      dashboard: "대시보드",
      issues: "이슈",
      notifications: "알림",
      employees: "직원",
      thaiPhrases: "태국어 문구 관리", 
      changePassword: "비밀번호 변경",
      settings: "설정",
      logout: "로그아웃",
      more: "더보기",
      userManual: "사용자 매뉴얼"
    }
  },
  en: {
    common: {
      loading: "Loading",
      error: "Error",
      noIssuesFound: "No issues found",
      month: "Month",
      edit: "Edit",
      delete: "Delete",
      processing: "Processing...",
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      noPermission: "You don't have permission",
      status: 'Status',
      category: 'Category',
      department: 'Department',
      createdBy: 'Created by',
      createdAt: 'Created at',
      updatedAt: 'Updated at',
      unknown: 'Unknown',
      author: "Author",
      deleting: "Deleting...",
      refresh: "Refresh",
      itemsPerPage: "Items per page",
      totalItems: "Total items",
      noMoreItems: "No more items",
      previous: "Previous",
      next: "Next",
      user: "User"
    },
    nav: {
      title: "Factory Management System",
      home: "Home",
      dashboard: "Dashboard",
      issues: "Issues",
      notifications: "Notifications",
      employees: "Employees",
      thaiPhrases: "Thai Phrases Management",
      changePassword: "Change Password",
      settings: "Settings",
      logout: "Logout",
      more: "More",
      userManual: "User Manual"
    }
  },
  th: {
    common: {
      loading: "กำลังโหลด",
      error: "ข้อผิดพลาด",
      noIssuesFound: "ไม่พบประเด็น",
      month: "เดือน",
      edit: "แก้ไข",
      delete: "ลบ",
      processing: "กำลังประมวลผล...",
      save: "บันทึก",
      saving: "กำลังบันทึก...",
      cancel: "ยกเลิก",
      noPermission: "คุณไม่มีสิทธิ์",
      status: 'สถานะ',
      category: 'หมวดหมู่',
      department: 'แผนก',
      createdBy: 'สร้างโดย',
      createdAt: 'สร้างเมื่อ',
      updatedAt: 'อัปเดตเมื่อ',
      unknown: 'ไม่ทราบ',
      author: "ผู้เขียน",
      deleting: "กำลังลบ...",
      refresh: "รีเฟรช",
      itemsPerPage: "รายการต่อหน้า",
      totalItems: "รายการทั้งหมด",
      noMoreItems: "ไม่มีรายการเพิ่มเติม",
      previous: "ก่อนหน้า",
      next: "ถัดไป",
      user: "ผู้ใช้"
    },
    nav: {
      title: "ระบบจัดการโรงงาน",
      home: "หน้าแรก",
      dashboard: "แดชบอร์ด",
      issues: "ประเด็น",
      notifications: "การแจ้งเตือน",
      employees: "พนักงาน",
      thaiPhrases: "จัดการวลีภาษาไทย",
      changePassword: "เปลี่ยนรหัสผ่าน",
      settings: "ตั้งค่า",
      logout: "ออกจากระบบ",
      more: "เพิ่มเติม",
      userManual: "คู่มือการใช้งาน"
    }
  }
};

// 번역 함수
const translate = (key: string, language: Language): string => {
  const keys = key.split('.');
  let current: any = translations[language];

  for (const k of keys) {
    if (!current || current[k] === undefined) {
      // console.log(`키를 찾을 수 없음: ${key}`);
      return key;
    }
    current = current[k];
  }

  if (typeof current !== 'string') {
    // console.log(`${key}에 대한 값이 문자열이 아님: ${typeof current}`);
    return key;
  }

  return current;
};

// 언어 스토어 생성
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: DEFAULT_LANGUAGE,
      
      setLanguage: (newLanguage: Language) => set({ language: newLanguage }),
      
      t: (key: string) => translate(key, get().language)
    }),
    {
      name: 'language-storage',
      getStorage: () => localStorage,
    }
  )
);

// React Hook 형태로 사용하기 위한 함수
export const useTranslation = () => {
  const { language, setLanguage, t } = useLanguageStore();
  
  return {
    language,
    setLanguage,
    t
  };
}; 