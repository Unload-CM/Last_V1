const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const translations = [
  // 대시보드 관련 번역
  {
    key: 'dashboard.welcome',
    language: 'ko',
    translation: '환영합니다',
    category: 'dashboard'
  },
  {
    key: 'dashboard.openIssues',
    language: 'ko',
    translation: '미해결 이슈',
    category: 'dashboard'
  },
  {
    key: 'dashboard.inProgressIssues',
    language: 'ko',
    translation: '진행 중인 이슈',
    category: 'dashboard'
  },
  {
    key: 'dashboard.resolvedIssues',
    language: 'ko',
    translation: '해결된 이슈',
    category: 'dashboard'
  },
  {
    key: 'dashboard.totalIssues',
    language: 'ko',
    translation: '전체 이슈',
    category: 'dashboard'
  },
  {
    key: 'dashboard.departmentStats',
    language: 'ko',
    translation: '부서별 통계',
    category: 'dashboard'
  },
  {
    key: 'dashboard.recentIssues',
    language: 'ko',
    translation: '최근 이슈',
    category: 'dashboard'
  },
  {
    key: 'dashboard.viewAll',
    language: 'ko',
    translation: '전체 보기',
    category: 'dashboard'
  },
  // 태국어 번역
  {
    key: 'dashboard.welcome',
    language: 'th',
    translation: 'ยินดีต้อนรับ',
    category: 'dashboard'
  },
  {
    key: 'dashboard.openIssues',
    language: 'th',
    translation: 'ปัญหาที่ยังไม่ได้แก้ไข',
    category: 'dashboard'
  },
  {
    key: 'dashboard.inProgressIssues',
    language: 'th',
    translation: 'ปัญหาที่กำลังดำเนินการ',
    category: 'dashboard'
  },
  {
    key: 'dashboard.resolvedIssues',
    language: 'th',
    translation: 'ปัญหาที่แก้ไขแล้ว',
    category: 'dashboard'
  },
  {
    key: 'dashboard.totalIssues',
    language: 'th',
    translation: 'ปัญหาทั้งหมด',
    category: 'dashboard'
  },
  // 이슈 관련 번역 추가
  {
    key: 'issues.view',
    language: 'ko',
    translation: '상세보기',
    category: 'issues'
  },
  {
    key: 'issues.actions',
    language: 'ko',
    translation: '작업',
    category: 'issues'
  },
  {
    key: 'issues.title',
    language: 'ko',
    translation: '이슈 관리',
    category: 'issues'
  },
  {
    key: 'issues.newIssue',
    language: 'ko',
    translation: '새 이슈 등록',
    category: 'issues'
  },
  {
    key: 'issues.search',
    language: 'ko',
    translation: '이슈 검색...',
    category: 'issues'
  },
  {
    key: 'issues.noIssuesFound',
    language: 'ko',
    translation: '검색 결과가 없습니다',
    category: 'issues'
  },
  {
    key: 'issues.showing',
    language: 'ko',
    translation: '총',
    category: 'issues'
  },
  {
    key: 'issues.to',
    language: 'ko',
    translation: '-',
    category: 'issues'
  },
  {
    key: 'issues.of',
    language: 'ko',
    translation: '개 중',
    category: 'issues'
  },
  {
    key: 'issues.results',
    language: 'ko',
    translation: '표시 중',
    category: 'issues'
  },
  // 영어 번역
  {
    key: 'issues.view',
    language: 'en',
    translation: 'View Details',
    category: 'issues'
  },
  {
    key: 'issues.actions',
    language: 'en',
    translation: 'Actions',
    category: 'issues'
  },
  {
    key: 'issues.title',
    language: 'en',
    translation: 'Issue Management',
    category: 'issues'
  },
  {
    key: 'issues.newIssue',
    language: 'en',
    translation: 'New Issue',
    category: 'issues'
  },
  {
    key: 'issues.search',
    language: 'en',
    translation: 'Search issues...',
    category: 'issues'
  },
  {
    key: 'issues.noIssuesFound',
    language: 'en',
    translation: 'No issues found',
    category: 'issues'
  },
  {
    key: 'issues.showing',
    language: 'en',
    translation: 'Showing',
    category: 'issues'
  },
  {
    key: 'issues.to',
    language: 'en',
    translation: 'to',
    category: 'issues'
  },
  {
    key: 'issues.of',
    language: 'en',
    translation: 'of',
    category: 'issues'
  },
  {
    key: 'issues.results',
    language: 'en',
    translation: 'results',
    category: 'issues'
  },
  // 태국어 번역
  {
    key: 'issues.view',
    language: 'th',
    translation: 'ดูรายละเอียด',
    category: 'issues'
  },
  {
    key: 'issues.actions',
    language: 'th',
    translation: 'การดำเนินการ',
    category: 'issues'
  },
  {
    key: 'issues.title',
    language: 'th',
    translation: 'จัดการปัญหา',
    category: 'issues'
  },
  {
    key: 'issues.newIssue',
    language: 'th',
    translation: 'เพิ่มปัญหาใหม่',
    category: 'issues'
  },
  {
    key: 'issues.search',
    language: 'th',
    translation: 'ค้นหาปัญหา...',
    category: 'issues'
  },
  {
    key: 'issues.noIssuesFound',
    language: 'th',
    translation: 'ไม่พบผลลัพธ์',
    category: 'issues'
  },
  {
    key: 'issues.showing',
    language: 'th',
    translation: 'แสดง',
    category: 'issues'
  },
  {
    key: 'issues.to',
    language: 'th',
    translation: 'ถึง',
    category: 'issues'
  },
  {
    key: 'issues.of',
    language: 'th',
    translation: 'จาก',
    category: 'issues'
  },
  {
    key: 'issues.results',
    language: 'th',
    translation: 'รายการ',
    category: 'issues'
  }
];

async function seedTranslations() {
  try {
    // 기존 데이터 삭제
    await prisma.translation.deleteMany();
    console.log('기존 번역 데이터 삭제 완료');

    // 새 데이터 추가
    await prisma.translation.createMany({
      data: translations
    });
    console.log('새로운 번역 데이터 추가 완료');
  } catch (error) {
    console.error('번역 데이터 추가 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedTranslations(); 