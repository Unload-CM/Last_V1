import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

// 실제 구현에서는 데이터베이스에서 가져오게 됩니다.
// 예: import { db } from '../../../../lib/db';

// 한국어 번역 (데이터베이스 구현 예시)
const koTranslations = {
  // 네비게이션
  'nav.home': '대시보드',
  'nav.issues': '이슈 관리',
  'nav.reports': '리포트',
  'nav.employees': '사원 관리',
  'nav.settings': '설정',
  'nav.logout': '로그아웃',
  'nav.notifications': '알림',
  'nav.profile': '프로필',

  // 대시보드
  'dashboard.welcome': '환영합니다',
  'dashboard.overview': '개요',
  'dashboard.openIssues': '오픈 이슈',
  'dashboard.inProgressIssues': '진행 중 이슈',
  'dashboard.resolvedIssues': '해결된 이슈',
  'dashboard.totalIssues': '전체 이슈',
  'dashboard.recentIssues': '최근 이슈',
  'dashboard.departmentStats': '부서별 통계',
  'dashboard.monthlyTrends': '월간 추세',
  'dashboard.categoryDistribution': '카테고리 분포',
  'dashboard.efficiency': '효율성',
  'dashboard.viewAll': '모두 보기',
  'dashboard.reportNewIssue': '새 이슈 보고',

  // 이슈 상태
  'issues.status.open': '오픈',
  'issues.status.inProgress': '진행 중',
  'issues.status.resolved': '해결됨',
  'issues.status.closed': '종료됨',
  'issues.priority.critical': '심각',
  'issues.priority.high': '높음',
  'issues.priority.medium': '중간',
  'issues.priority.low': '낮음',
  'issues.reportNewIssue': '새 이슈 보고',

  // 리포트
  'reports.title': '리포트',
  'reports.description': '공장 운영 통계 및 리포트',
  'reports.productionReports': '생산 리포트',
  'reports.qualityReports': '품질 리포트',
  'reports.inventoryReports': '재고 리포트',
  'reports.efficiencyReports': '효율성 리포트',
  'reports.comingSoon': '준비 중입니다',
  'reports.underDevelopment': '이 기능은 현재 개발 중입니다',

  // 설정
  'settings.title': '설정',
  'settings.description': '시스템 및 계정 설정을 관리합니다',
  'settings.general': '일반 설정',
  'settings.language': '언어 설정',
  'settings.notifications': '알림 설정',
  'settings.security': '보안 설정',
  'settings.account': '계정 설정',
  'settings.data': '데이터 관리',
  'settings.save': '저장',
  'settings.cancel': '취소',
  'settings.chooseLanguage': '언어 선택',
  'settings.korean': '한국어',
  'settings.thai': '태국어',
  'settings.english': '영어',

  // 직원 관리
  'employees.title': '사원 관리',
  'employees.description': '사원 정보 관리 및 조회',
  'employees.search': '사원 검색',
  'employees.addNew': '신규 등록',
  'employees.filter': '필터',
  'employees.export': '내보내기',
  'employees.name': '이름',
  'employees.position': '직책',
  'employees.department': '부서',
  'employees.contact': '연락처',
  'employees.email': '이메일',
  'employees.hireDate': '입사일',
  'employees.actions': '작업',
  
  // 공통
  'common.edit': '편집',
  'common.delete': '삭제',
  'common.noResults': '검색 결과가 없습니다',
  'common.loading': '로딩 중...',
  'common.error': '오류',
  'common.success': '성공',
  'common.refresh': '새로고침',
  'common.add': '추가',
};

// 태국어 번역 (데이터베이스 구현 예시)
const thTranslations = {
  // 네비게이션
  'nav.home': 'แดชบอร์ด',
  'nav.issues': 'จัดการปัญหา',
  'nav.reports': 'รายงาน',
  'nav.employees': 'จัดการพนักงาน',
  'nav.settings': 'การตั้งค่า',
  'nav.logout': 'ออกจากระบบ',
  'nav.notifications': 'การแจ้งเตือน',
  'nav.profile': 'โปรไฟล์',

  // 대시보드
  'dashboard.welcome': 'ยินดีต้อนรับ',
  'dashboard.overview': 'ภาพรวม',
  'dashboard.openIssues': 'ปัญหาที่เปิดอยู่',
  'dashboard.inProgressIssues': 'ปัญหาที่กำลังดำเนินการ',
  'dashboard.resolvedIssues': 'ปัญหาที่แก้ไขแล้ว',
  'dashboard.totalIssues': 'ปัญหาทั้งหมด',
  'dashboard.recentIssues': 'ปัญหาล่าสุด',
  'dashboard.departmentStats': 'สถิติแผนก',
  'dashboard.monthlyTrends': 'แนวโน้มรายเดือน',
  'dashboard.categoryDistribution': 'การกระจายตามหมวดหมู่',
  'dashboard.efficiency': 'ประสิทธิภาพ',
  'dashboard.viewAll': 'ดูทั้งหมด',
  'dashboard.reportNewIssue': 'รายงานปัญหาใหม่',

  // 이슈 상태
  'issues.status.open': 'เปิด',
  'issues.status.inProgress': 'กำลังดำเนินการ',
  'issues.status.resolved': 'แก้ไขแล้ว',
  'issues.status.closed': 'ปิดแล้ว',
  'issues.priority.critical': 'วิกฤต',
  'issues.priority.high': 'สูง',
  'issues.priority.medium': 'ปานกลาง',
  'issues.priority.low': 'ต่ำ',
  'issues.reportNewIssue': 'รายงานปัญหาใหม่',

  // 리포트
  'reports.title': 'รายงาน',
  'reports.description': 'สถิติและรายงานการดำเนินงานของโรงงาน',
  'reports.productionReports': 'รายงานการผลิต',
  'reports.qualityReports': 'รายงานคุณภาพ',
  'reports.inventoryReports': 'รายงานสินค้าคงคลัง',
  'reports.efficiencyReports': 'รายงานประสิทธิภาพ',
  'reports.comingSoon': 'เร็วๆ นี้',
  'reports.underDevelopment': 'คุณสมบัตินี้อยู่ระหว่างการพัฒนา',

  // 설정
  'settings.title': 'การตั้งค่า',
  'settings.description': 'จัดการการตั้งค่าระบบและบัญชี',
  'settings.general': 'การตั้งค่าทั่วไป',
  'settings.language': 'การตั้งค่าภาษา',
  'settings.notifications': 'การตั้งค่าการแจ้งเตือน',
  'settings.security': 'การตั้งค่าความปลอดภัย',
  'settings.account': 'การตั้งค่าบัญชี',
  'settings.data': 'การจัดการข้อมูล',
  'settings.save': 'บันทึก',
  'settings.cancel': 'ยกเลิก',
  'settings.chooseLanguage': 'เลือกภาษา',
  'settings.korean': 'ภาษาเกาหลี',
  'settings.thai': 'ภาษาไทย',
  'settings.english': 'ภาษาอังกฤษ',

  // 직원 관리
  'employees.title': 'จัดการพนักงาน',
  'employees.description': 'จัดการและค้นหาข้อมูลพนักงาน',
  'employees.search': 'ค้นหาพนักงาน',
  'employees.addNew': 'เพิ่มพนักงานใหม่',
  'employees.filter': 'กรอง',
  'employees.export': 'ส่งออก',
  'employees.name': 'ชื่อ',
  'employees.position': 'ตำแหน่ง',
  'employees.department': 'แผนก',
  'employees.contact': 'ติดต่อ',
  'employees.email': 'อีเมล',
  'employees.hireDate': 'วันที่จ้างงาน',
  'employees.actions': 'การดำเนินการ',
  
  // 공통
  'common.edit': 'แก้ไข',
  'common.delete': 'ลบ',
  'common.noResults': 'ไม่พบผลลัพธ์',
  'common.loading': 'กำลังโหลด...',
  'common.error': 'เกิดข้อผิดพลาด',
  'common.success': 'ดำเนินการสำเร็จ',
  'common.refresh': 'รีเฟรช',
  'common.add': 'เพิ่ม',
};

// 영어 번역 (데이터베이스 구현 예시)
const enTranslations = {
  // 네비게이션
  'nav.home': 'Dashboard',
  'nav.issues': 'Issue Management',
  'nav.reports': 'Reports',
  'nav.employees': 'Employee Management',
  'nav.settings': 'Settings',
  'nav.logout': 'Logout',
  'nav.notifications': 'Notifications',
  'nav.profile': 'Profile',

  // 대시보드
  'dashboard.welcome': 'Welcome',
  'dashboard.overview': 'Overview',
  'dashboard.openIssues': 'Open Issues',
  'dashboard.inProgressIssues': 'In Progress Issues',
  'dashboard.resolvedIssues': 'Resolved Issues',
  'dashboard.totalIssues': 'Total Issues',
  'dashboard.recentIssues': 'Recent Issues',
  'dashboard.departmentStats': 'Department Statistics',
  'dashboard.monthlyTrends': 'Monthly Trends',
  'dashboard.categoryDistribution': 'Category Distribution',
  'dashboard.efficiency': 'Efficiency',
  'dashboard.viewAll': 'View All',
  'dashboard.reportNewIssue': 'Report New Issue',

  // 이슈 상태
  'issues.status.open': 'OPEN',
  'issues.status.inProgress': 'IN PROGRESS',
  'issues.status.resolved': 'RESOLVED',
  'issues.status.closed': 'CLOSED',
  'issues.priority.critical': 'CRITICAL',
  'issues.priority.high': 'HIGH',
  'issues.priority.medium': 'MEDIUM',
  'issues.priority.low': 'LOW',
  'issues.reportNewIssue': 'Report New Issue',

  // 리포트
  'reports.title': 'Reports',
  'reports.description': 'Factory operation statistics and reports',
  'reports.productionReports': 'Production Reports',
  'reports.qualityReports': 'Quality Reports',
  'reports.inventoryReports': 'Inventory Reports',
  'reports.efficiencyReports': 'Efficiency Reports',
  'reports.comingSoon': 'Coming Soon',
  'reports.underDevelopment': 'This feature is currently under development',

  // 설정
  'settings.title': 'Settings',
  'settings.description': 'Manage system and account settings',
  'settings.general': 'General Settings',
  'settings.language': 'Language Settings',
  'settings.notifications': 'Notification Settings',
  'settings.security': 'Security Settings',
  'settings.account': 'Account Settings',
  'settings.data': 'Data Management',
  'settings.save': 'Save',
  'settings.cancel': 'Cancel',
  'settings.chooseLanguage': 'Choose Language',
  'settings.korean': 'Korean',
  'settings.thai': 'Thai',
  'settings.english': 'English',

  // 직원 관리
  'employees.title': 'Employee Management',
  'employees.description': 'Manage and view employee information',
  'employees.search': 'Search Employees',
  'employees.addNew': 'Add New',
  'employees.filter': 'Filter',
  'employees.export': 'Export',
  'employees.name': 'Name',
  'employees.position': 'Position',
  'employees.department': 'Department',
  'employees.contact': 'Contact',
  'employees.email': 'Email',
  'employees.hireDate': 'Hire Date',
  'employees.actions': 'Actions',
  
  // 공통
  'common.edit': 'Edit',
  'common.delete': 'Delete',
  'common.noResults': 'No results found',
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',
  'common.refresh': 'Refresh',
  'common.add': 'Add',
};

// 모든 번역 데이터
const translations = {
  ko: koTranslations,
  th: thTranslations,
  en: enTranslations
};

/**
 * 번역 데이터 API 핸들러
 * 
 * @param req 요청 객체
 * @param params 라우트 매개변수
 * @returns 응답 객체
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { language: string } }
) {
  const { language } = params;
  
  // 지원하는 언어인지 확인
  if (!['ko', 'th', 'en'].includes(language)) {
    return NextResponse.json(
      { error: 'Unsupported language' },
      { status: 400 }
    );
  }
  
  let translations;
  
  // 언어에 따라 번역 데이터 선택
  switch (language) {
    case 'ko':
      translations = koTranslations;
      break;
    case 'th':
      translations = thTranslations;
      break;
    case 'en':
      translations = enTranslations;
      break;
    default:
      translations = koTranslations; // 기본값
  }
  
  // 번역 데이터 반환
  return NextResponse.json({ translations });
} 