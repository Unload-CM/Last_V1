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
    },
    login: {
      title: "공장관리시스템",
      subtitle: "로그인하여 계속 진행하세요",
      login: "로그인",
      password: "비밀번호",
      defaultPassword: "기본 비밀번호: 0000",
      adminOnly: "관리자 권한이 있는 사용자만 로그인 가능합니다",
      availableAccounts: "사용 가능한 관리자 계정: CMADMIN1, CMADMIN2",
      errorRequiredFields: "사원번호와 비밀번호를 모두 입력해주세요",
      invalidCredentials: "잘못된 이메일 또는 비밀번호입니다"
    },
    employees: {
      title: "직원 관리",
      addNew: "신규 직원 등록",
      searchPlaceholder: "사원번호, 이름, 부서, 태국어 이름으로 검색",
      refreshEmployees: "새로고침",
      number: "No.",
      employeeId: "사원번호",
      name: "이름",
      department: "부서",
      thaiName: "태국어 이름",
      nickname: "닉네임",
      isSolver: "이슈 해결자",
      actions: "관리",
      noEmployees: "등록된 직원이 없습니다",
      edit: "수정",
      delete: "삭제",
      editTitle: "직원 정보 수정",
      addTitle: "신규 직원 등록",
      requiredFieldsNote: "* 표시는 필수 입력 항목입니다",
      namePlaceholder: "이름을 입력하세요",
      departmentPlaceholder: "부서를 선택하세요",
      thaiNamePlaceholder: "태국어 이름을 입력하세요",
      nicknamePlaceholder: "닉네임을 입력하세요",
      solverDescription: "이슈를 해결할 수 있는 권한을 부여합니다",
      isThaiDescription: "태국 국적 직원인 경우 체크해주세요",
      confirmDelete: "이 직원을 삭제하시겠습니까?",
      deleteSuccess: "직원이 삭제되었습니다.",
      deleteFailed: "직원 삭제에 실패했습니다.",
      updateSuccess: "정보가 수정되었습니다.",
      createSuccess: "직원이 등록되었습니다.",
      requiredFields: "이름과 부서는 필수 입력 항목입니다.",
      fetchError: "직원 목록을 불러오는데 실패했습니다.",
      departmentsLoadError: "부서 정보를 불러오는데 실패했습니다",
      solverLabel: "해결자",
      normalLabel: "일반",
      saveFailed: "저장에 실패했습니다.",
      save: "저장",
      cancel: "취소"
    },
    dashboard: {
      title: "대시보드",
      description: "CoilMaster 대시보드 - 이슈 통계 및 요약",
      topIssueFinders: "이슈 발견자 랭킹",
      topIssueResolvers: "이슈 해결자 랭킹",
      topCommenters: "댓글 작성 랭킹",
      topIssueFinderDescription: "가장 많은 이슈를 발견한 사용자 TOP 3",
      topIssueResolverDescription: "가장 많은 이슈를 해결한 사용자 TOP 3",
      topCommenterDescription: "가장 활발하게 댓글을 작성한 사용자 TOP 3",
      monthlyIssueCreation: "월별 이슈 생성 추이",
      monthlyIssueDescription: "월별 이슈 생성 수를 확인하세요",
      totalIssues: "전체 이슈",
      openIssues: "미해결 이슈",
      inProgressIssues: "진행 중인 이슈",
      resolvedIssues: "해결된 이슈",
      issuesCount: "이슈 수",
      resolvedCount: "해결 수",
      commentsCount: "댓글 수",
      statusDistribution: "상태별 이슈 분포",
      priorityDistribution: "우선순위별 이슈 분포",
      departmentDistribution: "부서별 이슈 분포",
      noIssuesFound: "이슈를 찾을 수 없습니다",
      loading: "대시보드 데이터 로딩 중...",
      loadingError: "대시보드 데이터를 불러오는데 실패했습니다",
      recentIssues: "최근 이슈",
      noIssues: "등록된 이슈가 없습니다",
      noDepartmentData: "부서별 데이터가 없습니다",
      noRecentIssues: "최근 생성된 이슈가 없습니다",
      score: "점수",
      points: "점수",
      issues: "이슈",
      comments: "댓글",
      issuesByDepartment: "부서별 이슈",
      dateFilter: {
        quickSelect: "빠른 선택"
      }
    },
    issues: {
      title: "이슈 제목",
      total: "전체 이슈",
      status: {
        open: "미처리 이슈",
        inProgress: "처리 중 이슈",
        resolved: "해결된 이슈",
        closed: "종료된 이슈"
      },
      search: "이슈 검색",
      newIssue: "이슈 등록",
      department: "부서",
      priority: "우선순위",
      category: "카테고리",
      createdAt: "생성일",
      updatedAt: "수정일",
      dueDate: "마감일",
      filters: "필터",
      resetFilters: "필터 초기화",
      noIssuesFound: "이슈를 찾을 수 없습니다",
      issueFinder: "이슈 발견자",
      issueResolver: "이슈 해결자",
      selectAssignee: "이슈 발견자 선택",
      selectSolver: "이슈 해결자 선택",
      assignedTo: "이슈 발견자",
      solver: "이슈 해결자",
      fields: {
        title: "제목",
        description: "설명",
        status: "상태",
        priority: "우선순위",
        category: "카테고리",
        department: "부서",
        assignee: "이슈 발견자",
        solver: "이슈 해결자",
        dueDate: "마감일"
      },
      history: {
        statusChange: "상태 변경",
        priorityChange: "우선순위 변경",
        categoryChange: "카테고리 변경",
        departmentChange: "부서 변경",
        assigneeChange: "담당자 변경",
        solverChange: "해결자 변경",
        contentChange: "내용 변경",
        fileAdded: "파일 추가됨",
        deleteConfirmTitle: "히스토리 항목 삭제",
        deleteConfirmMessage: "이 히스토리 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
        noHistory: "이슈 히스토리가 없습니다.",
        title: "이력"
      },
      dateFilter: {
        from: "시작일",
        to: "종료일",
        quickSelect: "빠른 선택",
        today: "오늘",
        thisWeek: "이번 주",
        thisMonth: "이번 달",
        lastMonth: "전월",
        last3Months: "최근 3개월",
        thisYear: "올해",
        selectDate: "날짜 선택"
      },
      changePassword: {
        title: "비밀번호 변경",
        subtitle: "비밀번호 변경",
        currentPassword: "현재 비밀번호",
        newPassword: "새 비밀번호",
        confirmPassword: "새 비밀번호 확인",
        changeButton: "비밀번호 변경",
        passwordMismatch: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
        passwordTooShort: "새 비밀번호는 최소 4자 이상이어야 합니다.",
        changeSuccess: "비밀번호가 성공적으로 변경되었습니다.",
        changeError: "비밀번호 변경 중 오류가 발생했습니다.",
        serverError: "서버 오류가 발생했습니다. 나중에 다시 시도해주세요.",
        adminNotAllowed: "시스템 관리자 계정의 비밀번호는 변경할 수 없습니다."
      },
      datePicker: {
        yearMonthDay: "날짜 선택",
        selectDate: "날짜 선택",
        clear: "삭제",
        today: "오늘"
      },
      fileUpload: {
        selectFile: "파일 선택",
        noFileSelected: "선택된 파일 없음"
      },
      upload: "업로드",
      comments: "댓글",
      commentPlaceholder: "댓글을 입력하세요",
      attachFiles: "파일 첨부",
      addComment: "댓글 추가",
      autoCompressImage: "이미지 자동 압축",
      maxWidth800: "이미지 최대 너비 800px",
      allDepartments: "모든 부서",
      allStatus: "모든 상태",
      allStatuses: "모든 상태",
      allPriority: "모든 우선순위",
      allPriorities: "모든 우선순위",
      description: "설명",
      management: "이슈 제목",
      createIssue: "이슈 등록",
      titlePlaceholder: "이슈 제목을 입력하세요",
      descriptionPlaceholder: "이슈에 대한 상세 설명을 입력하세요",
      noAttachments: "첨부 파일 없음",
      noComments: "댓글 없음",
      confirmDelete: "이슈 삭제",
      confirmDeleteMessage: "이 이슈를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      deleteComment: "댓글 삭제",
      confirmDeleteComment: "댓글 삭제",
      confirmDeleteCommentDescription: "이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      deleteHistory: "이력 삭제",
      confirmDeleteHistory: "이력 삭제",
      confirmDeleteHistoryDescription: "이 이력을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      onlyCreatorCanDelete: "본인이 작성한 이슈만 삭제할 수 있습니다.",
      loginRequired: "로그인이 필요합니다."
    },
    status: {
      open: "미해결",
      in_progress: "진행중",
      resolved: "해결됨",
      closed: "종료"
    },
    priority: {
      critical: "심각",
      high: "높음",
      medium: "중간",
      low: "낮음"
    },
    dateFilter: {
      from: "시작일",
      to: "종료일",
      quickSelect: "빠른 선택",
      today: "오늘",
      thisWeek: "이번 주",
      thisMonth: "이번 달",
      lastMonth: "전월",
      last3Months: "최근 3개월",
      thisYear: "올해",
      selectDate: "날짜 선택"
    },
    changePassword: {
      title: "비밀번호 변경",
      subtitle: "비밀번호 변경",
      currentPassword: "현재 비밀번호",
      newPassword: "새 비밀번호",
      confirmPassword: "새 비밀번호 확인",
      changeButton: "비밀번호 변경",
      passwordMismatch: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
      passwordTooShort: "새 비밀번호는 최소 4자 이상이어야 합니다.",
      changeSuccess: "비밀번호가 성공적으로 변경되었습니다.",
      changeError: "비밀번호 변경 중 오류가 발생했습니다.",
      serverError: "서버 오류가 발생했습니다. 나중에 다시 시도해주세요.",
      adminNotAllowed: "시스템 관리자 계정의 비밀번호는 변경할 수 없습니다."
    },
    datePicker: {
      yearMonthDay: "날짜 선택",
      selectDate: "날짜 선택",
      clear: "삭제",
      today: "오늘"
    },
    fileUpload: {
      selectFile: "파일 선택",
      noFileSelected: "선택된 파일 없음"
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