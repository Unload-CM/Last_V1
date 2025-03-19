'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// 지원 언어 타입
export type Language = 'ko' | 'th' | 'en';

// 번역 데이터 인터페이스
interface TranslationsType {
  [key: string]: {
    [key: string]: string;
  };
}

// 언어 컨텍스트 인터페이스
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

// 임시 하드코딩된 번역 (데이터베이스 연결 전까지만 사용)
// 실제 구현 시 이 부분은 제거하고 데이터베이스에서 로드
const DEFAULT_TRANSLATIONS: TranslationsType = {
  ko: {
    // 네비게이션
    'nav.home': '대시보드',
    'nav.issues': '이슈 관리',
    'nav.reports': '보고서',
    'nav.employees': '사원 관리',
    'nav.settings': '설정',
    'nav.title': '공장관리시스템',
    'nav.notifications': '알림',
    'nav.profile': '프로필',
    'nav.logout': '로그아웃',
    
    // 대시보드
    'dashboard.welcome': '환영합니다',
    'dashboard.openIssues': '미해결 이슈',
    'dashboard.inProgressIssues': '진행 중 이슈',
    'dashboard.resolvedIssues': '해결된 이슈',
    'dashboard.totalIssues': '전체 이슈',
    'dashboard.recentIssues': '최근 이슈',
    'dashboard.viewAll': '모두 보기',
    'dashboard.departmentStats': '부서별 통계',
    'dashboard.monthlyTrends': '월간 추이',
    'dashboard.categoryDistribution': '카테고리 분포',
    'dashboard.efficiency': '효율성',
    
    // 이슈
    'issues.reportNewIssue': '새 이슈 등록',
    'issues.view': '상세보기',
    'issues.actions': '작업',
    'issues.title': '이슈 관리',
    'issues.newIssue': '새 이슈 등록',
    'issues.search': '이슈 검색...',
    'issues.noIssuesFound': '검색 결과가 없습니다',
    'issues.showing': '총',
    'issues.to': '-',
    'issues.of': '개 중',
    'issues.results': '표시 중',
    
    // 상태
    'status.OPEN': '미해결',
    'status.IN_PROGRESS': '진행 중',
    'status.RESOLVED': '해결됨',
    'status.CRITICAL': '심각',
    'status.HIGH': '높음',
    'status.MEDIUM': '중간',
    'status.LOW': '낮음',
    
    // 직원 관리
    'employees.title': '사원 관리',
    'employees.searchPlaceholder': '이름, 부서, 직책으로 검색',
    'employees.addNew': '신규 등록',
    'employees.id': '사원번호',
    'employees.name': '이름',
    'employees.department': '부서',
    'employees.position': '직책',
    'employees.thaiName': '태국어 이름',
    'employees.nickname': '닉네임',
    'employees.actions': '관리',
    'employees.noEmployees': '등록된 사원이 없습니다',
    'employees.noSearchResults': '검색 결과가 없습니다',
    'employees.addTitle': '신규 사원 등록',
    'employees.editTitle': '사원 정보 수정',
    'employees.requiredFieldsNote': '* 표시된 항목은 필수 입력 사항입니다',
    'employees.namePlaceholder': '이름을 입력하세요',
    'employees.departmentPlaceholder': '부서를 선택하세요',
    'employees.positionPlaceholder': '직책을 선택하세요',
    'employees.isThai': '태국인 여부',
    'employees.isThaiDescription': '태국 국적 직원인 경우 체크해주세요',
    'employees.requiredFields': '필수 항목을 모두 입력해주세요',
    'employees.fetchError': '사원 목록을 불러오는데 실패했습니다',
    'employees.confirmDelete': '정말 삭제하시겠습니까?',
    'employees.deleteSuccess': '삭제되었습니다',
    'employees.deleteFailed': '삭제에 실패했습니다',
    'employees.updateSuccess': '수정되었습니다',
    'employees.createSuccess': '등록되었습니다',
    'employees.saveFailed': '저장에 실패했습니다',

    // 공통
    'common.refresh': '새로고침',
    'common.edit': '수정',
    'common.delete': '삭제',
    'common.cancel': '취소',
    'common.add': '등록',
    'common.update': '수정',
    'common.processing': '처리 중...',
  },
  th: {
    // 네비게이션
    'nav.home': 'แดชบอร์ด',
    'nav.issues': 'จัดการปัญหา',
    'nav.reports': 'รายงาน',
    'nav.employees': 'จัดการพนักงาน',
    'nav.settings': 'การตั้งค่า',
    'nav.title': 'ระบบจัดการโรงงาน',
    'nav.notifications': 'การแจ้งเตือน',
    'nav.profile': 'โปรไฟล์',
    'nav.logout': 'ออกจากระบบ',
    
    // 대시보드
    'dashboard.welcome': 'ยินดีต้อนรับ',
    'dashboard.openIssues': 'ปัญหาที่ยังไม่ได้แก้ไข',
    'dashboard.inProgressIssues': 'ปัญหาที่กำลังดำเนินการ',
    'dashboard.resolvedIssues': 'ปัญหาที่แก้ไขแล้ว',
    'dashboard.totalIssues': 'ปัญหาทั้งหมด',
    'dashboard.recentIssues': 'ปัญหาล่าสุด',
    'dashboard.viewAll': 'ดูทั้งหมด',
    'dashboard.departmentStats': 'สถิติแผนก',
    'dashboard.monthlyTrends': 'แนวโน้มรายเดือน',
    'dashboard.categoryDistribution': 'การกระจายหมวดหมู่',
    'dashboard.efficiency': 'ประสิทธิภาพ',
    
    // 이슈
    'issues.reportNewIssue': 'รายงานปัญหาใหม่',
    'issues.view': 'ดูรายละเอียด',
    'issues.actions': 'การดำเนินการ',
    'issues.title': 'จัดการปัญหา',
    'issues.newIssue': 'เพิ่มปัญหาใหม่',
    'issues.search': 'ค้นหาปัญหา...',
    'issues.noIssuesFound': 'ไม่พบผลลัพธ์',
    'issues.showing': 'แสดง',
    'issues.to': 'ถึง',
    'issues.of': 'จาก',
    'issues.results': 'รายการ',
    
    // 상태
    'status.OPEN': 'เปิด',
    'status.IN_PROGRESS': 'กำลังดำเนินการ',
    'status.RESOLVED': 'แก้ไขแล้ว',
    'status.CRITICAL': 'วิกฤต',
    'status.HIGH': 'สูง',
    'status.MEDIUM': 'ปานกลาง',
    'status.LOW': 'ต่ำ',
    
    // 직원 관리
    'employees.title': 'จัดการพนักงาน',
    'employees.searchPlaceholder': 'ค้นหาตามชื่อ แผนก ตำแหน่ง',
    'employees.addNew': 'เพิ่มพนักงานใหม่',
    'employees.id': 'รหัสพนักงาน',
    'employees.name': 'ชื่อ',
    'employees.department': 'แผนก',
    'employees.position': 'ตำแหน่ง',
    'employees.thaiName': 'ชื่อไทย',
    'employees.nickname': 'ชื่อเล่น',
    'employees.actions': 'จัดการ',
    'employees.noEmployees': 'ไม่มีพนักงาน',
    'employees.noSearchResults': 'ไม่พบผลการค้นหา',
    'employees.addTitle': 'เพิ่มพนักงานใหม่',
    'employees.editTitle': 'แก้ไขข้อมูลพนักงาน',
    'employees.requiredFieldsNote': '* ช่องที่จำเป็นต้องกรอก',
    'employees.namePlaceholder': 'กรอกชื่อ',
    'employees.departmentPlaceholder': 'เลือกแผนก',
    'employees.positionPlaceholder': 'เลือกตำแหน่ง',
    'employees.isThai': 'พนักงานไทย',
    'employees.isThaiDescription': 'เลือกถ้าเป็นพนักงานสัญชาติไทย',
    'employees.requiredFields': 'กรุณากรอกข้อมูลที่จำเป็นทั้งหมด',
    'employees.fetchError': 'ไม่สามารถโหลดรายชื่อพนักงานได้',
    'employees.confirmDelete': 'คุณแน่ใจหรือไม่ที่จะลบ?',
    'employees.deleteSuccess': 'ลบเรียบร้อยแล้ว',
    'employees.deleteFailed': 'ไม่สามารถลบได้',
    'employees.updateSuccess': 'อัปเดตเรียบร้อยแล้ว',
    'employees.createSuccess': 'เพิ่มเรียบร้อยแล้ว',
    'employees.saveFailed': 'ไม่สามารถบันทึกได้',

    // 공통
    'common.refresh': 'รีเฟรช',
    'common.edit': 'แก้ไข',
    'common.delete': 'ลบ',
    'common.cancel': 'ยกเลิก',
    'common.add': 'เพิ่ม',
    'common.update': 'อัปเดต',
    'common.processing': 'กำลังประมวลผล...',
  },
  en: {
    // 네비게이션
    'nav.home': 'Dashboard',
    'nav.issues': 'Issue Management',
    'nav.reports': 'Reports',
    'nav.employees': 'Employee Management',
    'nav.settings': 'Settings',
    'nav.title': 'Factory Management System',
    'nav.notifications': 'Notifications',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',
    
    // 대시보드
    'dashboard.welcome': 'Welcome',
    'dashboard.openIssues': 'Open Issues',
    'dashboard.inProgressIssues': 'In Progress Issues',
    'dashboard.resolvedIssues': 'Resolved Issues',
    'dashboard.totalIssues': 'Total Issues',
    'dashboard.recentIssues': 'Recent Issues',
    'dashboard.viewAll': 'View All',
    'dashboard.departmentStats': 'Department Statistics',
    'dashboard.monthlyTrends': 'Monthly Trends',
    'dashboard.categoryDistribution': 'Category Distribution',
    'dashboard.efficiency': 'Efficiency',
    
    // 이슈
    'issues.reportNewIssue': 'Report New Issue',
    'issues.view': 'View Details',
    'issues.actions': 'Actions',
    'issues.title': 'Issue Management',
    'issues.newIssue': 'New Issue',
    'issues.search': 'Search issues...',
    'issues.noIssuesFound': 'No issues found',
    'issues.showing': 'Showing',
    'issues.to': 'to',
    'issues.of': 'of',
    'issues.results': 'results',
    
    // 상태
    'status.OPEN': 'Open',
    'status.IN_PROGRESS': 'In Progress',
    'status.RESOLVED': 'Resolved',
    'status.CRITICAL': 'Critical',
    'status.HIGH': 'High',
    'status.MEDIUM': 'Medium',
    'status.LOW': 'Low',
    
    // 직원 관리
    'employees.title': 'Employee Management',
    'employees.searchPlaceholder': 'Search by name, department, or position',
    'employees.addNew': 'Add New Employee',
    'employees.id': 'Employee ID',
    'employees.name': 'Name',
    'employees.department': 'Department',
    'employees.position': 'Position',
    'employees.thaiName': 'Thai Name',
    'employees.nickname': 'Nickname',
    'employees.actions': 'Manage',
    'employees.noEmployees': 'No employees registered',
    'employees.noSearchResults': 'No search results',
    'employees.addTitle': 'Add New Employee',
    'employees.editTitle': 'Edit Employee Information',
    'employees.requiredFieldsNote': '* Required fields',
    'employees.namePlaceholder': 'Enter name',
    'employees.departmentPlaceholder': 'Select department',
    'employees.positionPlaceholder': 'Select position',
    'employees.isThai': 'Thai Employee',
    'employees.isThaiDescription': 'Check if this employee is Thai',
    'employees.requiredFields': 'Please fill in all required fields',
    'employees.fetchError': 'Failed to load employee list',
    'employees.confirmDelete': 'Are you sure you want to delete?',
    'employees.deleteSuccess': 'Deleted successfully',
    'employees.deleteFailed': 'Delete failed',
    'employees.updateSuccess': 'Updated successfully',
    'employees.createSuccess': 'Created successfully',
    'employees.saveFailed': 'Save failed',

    // 공통
    'common.refresh': 'Refresh',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.cancel': 'Cancel',
    'common.add': 'Add',
    'common.update': 'Update',
    'common.processing': 'Processing...',
  }
};

// 언어 컨텍스트 생성
const LanguageContext = createContext<LanguageContextType>({
  language: 'ko',
  setLanguage: () => {},
  t: () => '',
  isLoading: false
});

// 언어 제공자 컴포넌트
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('ko');
  const [translations, setTranslations] = useState<TranslationsType>({ ko: {}, th: {}, en: {} });
  const [isLoading, setIsLoading] = useState(true);

  // 언어 변경 처리
  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('factory-management-language', newLanguage);
    }
  };

  // 초기 언어 설정
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('factory-management-language') as Language;
      if (savedLanguage) {
        setLanguage(savedLanguage);
      } else {
        const browserLanguage = navigator.language.toLowerCase();
        if (browserLanguage.startsWith('th')) {
          setLanguage('th');
        } else if (browserLanguage.startsWith('en')) {
          setLanguage('en');
        }
      }
    }
    setTranslations(DEFAULT_TRANSLATIONS);
    setIsLoading(false);
  }, []);

  // 번역 함수
  const t = (key: string): string => {
    if (!key) return '';

    const translation = translations[language]?.[key];
    if (translation) {
      return translation;
    }

    // 번역이 없는 경우 키의 마지막 부분을 반환
    const parts = key.split('.');
    return parts[parts.length - 1];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 훅
export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

export default useTranslation; 