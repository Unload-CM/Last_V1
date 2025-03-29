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
  
  // 번역 데이터 (언어별로 내용 다름)
  translations: {
    [lang in Language]?: Record<string, any>;
  };
  
  // 번역 데이터 로딩 상태
  isLoading: boolean;
  
  // 번역 데이터 로드 함수
  loadTranslations: (lang?: Language) => Promise<void>;
  
  // 번역 함수
  t: (key: string) => string;
  
  // 초기화 완료 여부
  initialized: boolean;
}

// 번역 파일 경로 설정 - public 폴더 내부에 있는 파일 참조
const getTranslationPath = (lang: Language) => `/locales/${lang}/common.json`;

// 번역 데이터 기본값
const defaultTranslations: Record<Language, Record<string, any>> = {
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
      next: "다음"
    },
    nav: {
      title: "공장관리시스템",
      home: "대시보드",
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
      noRecentIssues: "최근 생성된 이슈가 없습니다",
      score: "점수",
      points: "점수",
      issues: "이슈",
      comments: "댓글",
      dateFilter: {
        quickSelect: "빠른 선택"
      }
    },
    issues: {
      title: "이슈 제목",
      search: "이슈 검색",
      newIssue: "이슈 등록",
      department: "부서",
      status: "상태",
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
      noPermission: "You do not have permission to access this feature",
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
      next: "Next"
    },
    nav: {
      title: "Factory Management System",
      home: "Dashboard",
      dashboard: "Dashboard",
      issues: "Issues",
      notifications: "Notifications",
      employees: "Employees",
      thaiPhrases: "Thai Phrases", 
      changePassword: "Change Password",
      settings: "Settings",
      logout: "Logout",
      more: "More",
      userManual: "User Manual"
    },
    login: {
      title: "Factory Management System",
      subtitle: "Sign in to continue",
      login: "Sign in",
      password: "Password",
      defaultPassword: "Default password: 0000",
      adminOnly: "Only users with admin privileges can log in",
      availableAccounts: "Available admin accounts: CMADMIN1, CMADMIN2",
      errorRequiredFields: "Please enter employee ID and password",
      invalidCredentials: "Invalid employee ID or password"
    },
    employees: {
      title: "Employee Management",
      addNew: "Add New Employee",
      searchPlaceholder: "Search by name, department, Thai name",
      refreshEmployees: "Refresh",
      number: "No.",
      employeeId: "Employee ID",
      name: "Name",
      department: "Department",
      thaiName: "Thai Name",
      nickname: "Nickname",
      isSolver: "Issue Solver",
      actions: "Actions",
      noEmployees: "No employees found",
      edit: "Edit",
      delete: "Delete",
      editTitle: "Edit Employee Information",
      addTitle: "Add New Employee",
      requiredFieldsNote: "* Required fields",
      namePlaceholder: "Enter name",
      departmentPlaceholder: "Select department",
      thaiNamePlaceholder: "Enter Thai name",
      nicknamePlaceholder: "Enter nickname",
      solverDescription: "Grants permission to resolve issues",
      isThaiDescription: "Check if the employee is Thai",
      confirmDelete: "Are you sure you want to delete this employee?",
      deleteSuccess: "Employee deleted successfully.",
      deleteFailed: "Failed to delete employee.",
      updateSuccess: "Information updated successfully.",
      createSuccess: "Employee registered successfully.",
      requiredFields: "Name and department are required fields.",
      fetchError: "Failed to load employee list.",
      departmentsLoadError: "Failed to load department information",
      solverLabel: "Solver",
      normalLabel: "Normal",
      saveFailed: "Failed to save.",
      save: "Save",
      cancel: "Cancel"
    },
    dashboard: {
      title: "Dashboard",
      topIssueFinders: "Top Issue Finders",
      topIssueResolvers: "Top Issue Resolvers",
      topCommenters: "Top Commenters",
      topIssueFinderDescription: "Users who found the most issues (TOP 3)",
      topIssueResolverDescription: "Users who resolved the most issues (TOP 3)",
      topCommenterDescription: "Most active commenters (TOP 3)",
      monthlyIssueCreation: "Monthly Issue Creation",
      monthlyIssueDescription: "View the number of issues created each month",
      totalIssues: "Total Issues",
      openIssues: "Open Issues",
      inProgressIssues: "In Progress Issues",
      resolvedIssues: "Resolved Issues",
      issuesCount: "Issues Count",
      resolvedCount: "Resolved Count",
      commentsCount: "Comments Count",
      statusDistribution: "Status Distribution",
      priorityDistribution: "Priority Distribution",
      departmentDistribution: "Department Distribution",
      noIssuesFound: "No issues found",
      loading: "Loading dashboard data...",
      loadingError: "Failed to load dashboard data",
      recentIssues: "Recent Issues",
      noRecentIssues: "No recent issues",
      score: "Score",
      points: "Points",
      issues: "Issues",
      comments: "Comments",
      dateFilter: {
        quickSelect: "Quick Select"
      }
    },
    issues: {
      title: "Issue Title",
      search: "Search Issues",
      newIssue: "New Issue",
      department: "Department",
      status: "Status",
      priority: "Priority",
      category: "Category",
      createdAt: "Created Date",
      updatedAt: "Updated at",
      dueDate: "Due Date",
      filters: "Filters",
      resetFilters: "Reset Filters",
      noIssuesFound: "No issues found",
      issueFinder: "Issue Finder",
      issueResolver: "Issue Resolver",
      selectAssignee: "Select Issue Finder",
      selectSolver: "Select Issue Resolver",
      assignedTo: "Issue Finder",
      solver: "Issue Resolver",
      fields: {
        title: "Title",
        description: "Description",
        status: "Status",
        priority: "Priority",
        category: "Category",
        department: "Department",
        assignee: "Issue Finder",
        solver: "Issue Resolver",
        dueDate: "Due Date"
      },
      history: {
        statusChange: "Status Changed",
        priorityChange: "Priority Changed",
        categoryChange: "Category Changed",
        departmentChange: "Department Changed",
        assigneeChange: "Assignee Changed",
        solverChange: "Solver Changed",
        contentChange: "Content Changed",
        fileAdded: "File Added",
        deleteConfirmTitle: "Delete History Item",
        deleteConfirmMessage: "Are you sure you want to delete this history item? This action cannot be undone.",
        noHistory: "No issue history available.",
        title: "History"
      },
      dateFilter: {
        from: "From",
        to: "To",
        quickSelect: "Quick Select",
        today: "Today",
        thisWeek: "This Week",
        thisMonth: "This Month",
        lastMonth: "Last Month",
        last3Months: "Last 3 Months",
        thisYear: "This Year",
        selectDate: "Select Date"
      },
      changePassword: {
        title: "Change Password",
        subtitle: "Change Password",
        currentPassword: "Current Password",
        newPassword: "New Password",
        confirmPassword: "Confirm New Password",
        changeButton: "Change Password",
        passwordMismatch: "New password and confirmation password do not match.",
        passwordTooShort: "New password must be at least 4 characters long.",
        changeSuccess: "Password has been successfully changed.",
        changeError: "An error occurred while changing the password.",
        serverError: "A server error occurred. Please try again later.",
        adminNotAllowed: "System administrator accounts cannot change their password."
      },
      datePicker: {
        yearMonthDay: "Select Date",
        selectDate: "Select Date",
        clear: "Clear",
        today: "Today"
      },
      fileUpload: {
        selectFile: "Select File",
        noFileSelected: "No file selected"
      },
      upload: "Upload",
      comments: "Comments",
      commentPlaceholder: "Enter your comment",
      attachFiles: "Attach Files",
      addComment: "Add Comment",
      autoCompressImage: "Auto Compress Image",
      maxWidth800: "Maximum image width 800px",
      allDepartments: "All Departments",
      allStatus: "All Status",
      allStatuses: "All Statuses",
      allPriority: "All Priority",
      allPriorities: "All Priorities",
      description: "Description",
      management: "Issue Title",
      createIssue: "Register an Issue",
      titlePlaceholder: "Enter issue title",
      descriptionPlaceholder: "Enter detailed description of the issue",
      noAttachments: "No attachments",
      noComments: "No comments",
      confirmDelete: "Delete Issue",
      confirmDeleteMessage: "Are you sure you want to delete this issue? This action cannot be undone.",
      deleteComment: "Delete Comment",
      confirmDeleteComment: "Delete Comment",
      confirmDeleteCommentDescription: "Are you sure you want to delete this comment? This action cannot be undone.",
      deleteHistory: "Delete History",
      confirmDeleteHistory: "Delete History",
      confirmDeleteHistoryDescription: "Are you sure you want to delete this history? This action cannot be undone.",
      onlyCreatorCanDelete: "Only the creator can delete this issue.",
      loginRequired: "Login is required."
    },
    status: {
      open: "Open",
      in_progress: "In Progress",
      resolved: "Resolved",
      closed: "Closed"
    },
    priority: {
      critical: "Critical",
      high: "High",
      medium: "Medium",
      low: "Low"
    },
    dateFilter: {
      from: "From",
      to: "To",
      quickSelect: "Quick Select",
      today: "Today",
      thisWeek: "This Week",
      thisMonth: "This Month",
      lastMonth: "Last Month",
      last3Months: "Last 3 Months",
      thisYear: "This Year",
      selectDate: "Select Date"
    },
    changePassword: {
      title: "Change Password",
      subtitle: "Change Password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      confirmPassword: "Confirm New Password",
      changeButton: "Change Password",
      passwordMismatch: "New password and confirmation password do not match.",
      passwordTooShort: "New password must be at least 4 characters long.",
      changeSuccess: "Password has been successfully changed.",
      changeError: "An error occurred while changing the password.",
      serverError: "A server error occurred. Please try again later.",
      adminNotAllowed: "System administrator accounts cannot change their password."
    },
    datePicker: {
      yearMonthDay: "Select Date",
      selectDate: "Select Date",
      clear: "Clear",
      today: "Today"
    },
    fileUpload: {
      selectFile: "Select File",
      noFileSelected: "No file selected"
    }
  },
  th: {
    common: {
      loading: "กำลังโหลด",
      error: "ข้อผิดพลาด",
      noIssuesFound: "ไม่พบปัญหา",
      month: "เดือน",
      edit: "แก้ไข",
      delete: "ลบ",
      processing: "กำลังประมวลผล...",
      save: "บันทึก",
      saving: "กำลังบันทึก...",
      cancel: "ยกเลิก",
      noPermission: "คุณไม่มีสิทธิ์เข้าถึงคุณสมบัตินี้",
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
      next: "ถัดไป"
    },
    nav: {
      title: "ระบบจัดการโรงงาน",
      home: "แดชบอร์ด",
      dashboard: "แดชบอร์ด",
      issues: "ปัญหา",
      notifications: "การแจ้งเตือน",
      employees: "พนักงาน",
      thaiPhrases: "วลีภาษาไทย",
      changePassword: "เปลี่ยนรหัสผ่าน",
      settings: "การตั้งค่า",
      logout: "ออกจากระบบ",
      more: "เพิ่มเติม",
      userManual: "คู่มือการใช้งาน"
    },
    login: {
      title: "ระบบจัดการโรงงาน",
      subtitle: "เข้าสู่ระบบเพื่อดำเนินการต่อ",
      login: "เข้าสู่ระบบ",
      password: "รหัสผ่าน",
      defaultPassword: "รหัสผ่านเริ่มต้น: 0000",
      adminOnly: "เฉพาะผู้ใช้ที่มีสิทธิ์ผู้ดูแลระบบเท่านั้นที่สามารถเข้าสู่ระบบได้",
      availableAccounts: "บัญชีผู้ดูแลระบบที่สามารถใช้ได้: CMADMIN1, CMADMIN2",
      errorRequiredFields: "กรุณากรอกรหัสพนักงานและรหัสผ่าน",
      invalidCredentials: "รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง"
    },
    employees: {
      title: "จัดการพนักงาน",
      addNew: "เพิ่มพนักงานใหม่",
      searchPlaceholder: "ค้นหาด้วยรหัสพนักงาน ชื่อ แผนก หรือชื่อไทย",
      refreshEmployees: "รีเฟรช",
      number: "ลำดับ",
      employeeId: "รหัสพนักงาน",
      name: "ชื่อ",
      department: "แผนก",
      thaiName: "ชื่อไทย",
      nickname: "ชื่อเล่น",
      isSolver: "ผู้แก้ไขปัญหา",
      actions: "จัดการ",
      noEmployees: "ไม่พบพนักงาน",
      edit: "แก้ไข",
      delete: "ลบ",
      editTitle: "แก้ไขข้อมูลพนักงาน",
      addTitle: "เพิ่มพนักงานใหม่",
      requiredFieldsNote: "* จำเป็นต้องกรอก",
      namePlaceholder: "ใส่ชื่อ",
      departmentPlaceholder: "เลือกแผนก",
      thaiNamePlaceholder: "ใส่ชื่อไทย",
      nicknamePlaceholder: "ใส่ชื่อเล่น",
      solverDescription: "ให้สิทธิ์ในการแก้ไขปัญหา",
      isThaiDescription: "เลือกถ้าพนักงานเป็นคนไทย",
      confirmDelete: "คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานรายนี้?",
      deleteSuccess: "ลบพนักงานสำเร็จ",
      deleteFailed: "ลบพนักงานไม่สำเร็จ",
      updateSuccess: "อัปเดตข้อมูลสำเร็จ",
      createSuccess: "ลงทะเบียนพนักงานสำเร็จ",
      requiredFields: "ชื่อและแผนกเป็นข้อมูลที่จำเป็น",
      fetchError: "ไม่สามารถโหลดรายชื่อพนักงานได้",
      departmentsLoadError: "ไม่สามารถโหลดข้อมูลแผนกได้",
      solverLabel: "ผู้แก้ไข",
      normalLabel: "ปกติ",
      saveFailed: "บันทึกไม่สำเร็จ",
      save: "บันทึก",
      cancel: "ยกเลิก"
    },
    dashboard: {
      title: "แดชบอร์ด",
      topIssueFinders: "อันดับผู้ค้นพบปัญหา",
      topIssueResolvers: "อันดับผู้แก้ไขปัญหา",
      topCommenters: "อันดับผู้แสดงความคิดเห็น",
      topIssueFinderDescription: "ผู้ที่พบปัญหามากที่สุด (TOP 3)",
      topIssueResolverDescription: "ผู้ที่แก้ไขปัญหามากที่สุด (TOP 3)",
      topCommenterDescription: "ผู้แสดงความคิดเห็นที่กระตือรือร้นที่สุด (TOP 3)",
      monthlyIssueCreation: "การสร้างปัญหารายเดือน",
      monthlyIssueDescription: "ดูจำนวนปัญหาที่สร้างในแต่ละเดือน",
      totalIssues: "ปัญหาทั้งหมด",
      openIssues: "ปัญหาที่ยังไม่ได้แก้ไข",
      inProgressIssues: "ปัญหาที่กำลังดำเนินการ",
      resolvedIssues: "ปัญหาที่แก้ไขแล้ว",
      issuesCount: "จำนวนปัญหา",
      resolvedCount: "จำนวนที่แก้ไขแล้ว",
      commentsCount: "จำนวนความคิดเห็น",
      statusDistribution: "การกระจายตามสถานะ",
      priorityDistribution: "การกระจายตามความสำคัญ",
      departmentDistribution: "การกระจายตามแผนก",
      noIssuesFound: "ไม่พบปัญหา",
      loading: "กำลังโหลดข้อมูลแดชบอร์ด...",
      loadingError: "โหลดข้อมูลแดชบอร์ดล้มเหลว",
      recentIssues: "ปัญหาล่าสุด",
      noRecentIssues: "ไม่มีปัญหาล่าสุด",
      score: "คะแนน",
      points: "คะแนน",
      issues: "ปัญหา",
      comments: "ความคิดเห็น",
      dateFilter: {
        quickSelect: "เลือกด่วน"
      }
    },
    issues: {
      title: "ชื่อเรื่อง",
      search: "ค้นหาปัญหา",
      newIssue: "สร้างปัญหาใหม่",
      department: "แผนก",
      status: "สถานะ",
      priority: "ความสำคัญ",
      category: "หมวดหมู่",
      createdAt: "สร้างเมื่อ",
      updatedAt: "อัปเดตเมื่อ",
      dueDate: "กำหนดส่ง",
      filters: "ตัวกรอง",
      resetFilters: "รีเซ็ตตัวกรอง",
      noIssuesFound: "ไม่พบปัญหา",
      issueFinder: "ผู้พบปัญหา",
      issueResolver: "ผู้แก้ไขปัญหา",
      selectAssignee: "เลือกผู้พบปัญหา",
      selectSolver: "เลือกผู้แก้ไขปัญหา",
      assignedTo: "ผู้พบปัญหา",
      solver: "ผู้แก้ไขปัญหา",
      fields: {
        title: "หัวข้อ",
        description: "รายละเอียด",
        status: "สถานะ",
        priority: "ความสำคัญ",
        category: "หมวดหมู่",
        department: "แผนก",
        assignee: "ผู้พบปัญหา",
        solver: "ผู้แก้ไขปัญหา",
        dueDate: "วันครบกำหนด"
      },
      history: {
        statusChange: "เปลี่ยนสถานะ",
        priorityChange: "เปลี่ยนความสำคัญ",
        categoryChange: "เปลี่ยนหมวดหมู่",
        departmentChange: "เปลี่ยนแผนก",
        assigneeChange: "เปลี่ยนผู้รับผิดชอบ",
        solverChange: "เปลี่ยนผู้แก้ไข",
        contentChange: "เปลี่ยนเนื้อหา",
        fileAdded: "เพิ่มไฟล์แล้ว",
        deleteConfirmTitle: "ลบรายการประวัติ",
        deleteConfirmMessage: "คุณแน่ใจหรือไม่ว่าต้องการลบรายการประวัตินี้? การกระทำนี้ไม่สามารถย้อนกลับได้",
        noHistory: "ไม่มีประวัติสำหรับปัญหานี้",
        title: "ประวัติ"
      },
      dateFilter: {
        from: "จาก",
        to: "ถึง",
        quickSelect: "การเลือกด่วน",
        today: "วันนี้",
        thisWeek: "สัปดาห์นี้",
        thisMonth: "เดือนนี้",
        lastMonth: "เดือนที่แล้ว",
        last3Months: "3 เดือนที่ผ่านมา",
        thisYear: "ปีนี้",
        selectDate: "เลือกวันที่"
      },
      changePassword: {
        title: "เปลี่ยนรหัสผ่าน",
        subtitle: "เปลี่ยนรหัสผ่าน",
        currentPassword: "รหัสผ่านปัจจุบัน",
        newPassword: "รหัสผ่านใหม่",
        confirmPassword: "ยืนยันรหัสผ่านใหม่",
        changeButton: "เปลี่ยนรหัสผ่าน",
        passwordMismatch: "รหัสผ่านใหม่และรหัสผ่านยืนยันไม่ตรงกัน",
        passwordTooShort: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร",
        changeSuccess: "เปลี่ยนรหัสผ่านสำเร็จแล้ว",
        changeError: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน",
        serverError: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์ โปรดลองอีกครั้งในภายหลัง",
        adminNotAllowed: "บัญชีผู้ดูแลระบบไม่สามารถเปลี่ยนรหัสผ่านได้"
      },
      datePicker: {
        yearMonthDay: "เลือกวันที่",
        selectDate: "เลือกวันที่",
        clear: "ลบ",
        today: "วันนี้"
      },
      fileUpload: {
        selectFile: "เลือกไฟล์",
        noFileSelected: "ไม่ได้เลือกไฟล์"
      },
      upload: "อัปโหลด",
      comments: "ความคิดเห็น",
      commentPlaceholder: "ใส่ความคิดเห็นของคุณ",
      attachFiles: "แนบไฟล์",
      addComment: "เพิ่มความคิดเห็น",
      autoCompressImage: "บีบอัดรูปภาพอัตโนมัติ",
      maxWidth800: "ความกว้างรูปภาพสูงสุด 800px",
      allDepartments: "ทุกแผนก",
      allStatus: "ทุกสถานะ",
      allStatuses: "ทุกสถานะ",
      allPriority: "ทุกความสำคัญ",
      allPriorities: "ทุกความสำคัญ",
      description: "รายละเอียด",
      management: "หัวข้อปัญหา",
      createIssue: "ลงทะเบียนปัญหา",
      titlePlaceholder: "ใส่หัวข้อปัญหา",
      descriptionPlaceholder: "ใส่รายละเอียดปัญหา",
      noAttachments: "ไม่มีไฟล์แนบ",
      noComments: "ไม่มีความคิดเห็น",
      confirmDelete: "ลบปัญหา",
      confirmDeleteMessage: "คุณแน่ใจหรือไม่ว่าต้องการลบปัญหานี้? การกระทำนี้ไม่สามารถเปลี่ยนกลับได้",
      deleteComment: "ลบความคิดเห็น",
      confirmDeleteComment: "ลบความคิดเห็น",
      confirmDeleteCommentDescription: "คุณแน่ใจหรือไม่ว่าต้องการลบความคิดเห็นนี้? การกระทำนี้ไม่สามารถเปลี่ยนกลับได้",
      deleteHistory: "ลบประวัติ",
      confirmDeleteHistory: "ลบประวัติ",
      confirmDeleteHistoryDescription: "คุณแน่ใจหรือไม่ว่าต้องการลบประวัตินี้? การกระทำนี้ไม่สามารถเปลี่ยนกลับได้",
      onlyCreatorCanDelete: "เฉพาะผู้สร้างเท่านั้นที่สามารถลบปัญหานี้ได้",
      loginRequired: "จำเป็นต้องเข้าสู่ระบบ"
    },
    status: {
      open: "เปิด",
      in_progress: "กำลังดำเนินการ",
      resolved: "แก้ไขแล้ว",
      closed: "ปิด"
    },
    priority: {
      critical: "วิกฤต",
      high: "สูง",
      medium: "ปานกลาง",
      low: "ต่ำ"
    },
    dateFilter: {
      from: "จาก",
      to: "ถึง",
      quickSelect: "การเลือกด่วน",
      today: "วันนี้",
      thisWeek: "สัปดาห์นี้",
      thisMonth: "เดือนนี้",
      lastMonth: "เดือนที่แล้ว",
      last3Months: "3 เดือนที่ผ่านมา",
      thisYear: "ปีนี้",
      selectDate: "เลือกวันที่"
    },
    changePassword: {
      title: "เปลี่ยนรหัสผ่าน",
      subtitle: "เปลี่ยนรหัสผ่าน",
      currentPassword: "รหัสผ่านปัจจุบัน",
      newPassword: "รหัสผ่านใหม่",
      confirmPassword: "ยืนยันรหัสผ่านใหม่",
      changeButton: "เปลี่ยนรหัสผ่าน",
      passwordMismatch: "รหัสผ่านใหม่และรหัสผ่านยืนยันไม่ตรงกัน",
      passwordTooShort: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร",
      changeSuccess: "เปลี่ยนรหัสผ่านสำเร็จแล้ว",
      changeError: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน",
      serverError: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์ โปรดลองอีกครั้งในภายหลัง",
      adminNotAllowed: "บัญชีผู้ดูแลระบบไม่สามารถเปลี่ยนรหัสผ่านได้"
    },
    datePicker: {
      yearMonthDay: "เลือกวันที่",
      selectDate: "เลือกวันที่",
      clear: "ลบ",
      today: "วันนี้"
    },
    fileUpload: {
      selectFile: "เลือกไฟล์",
      noFileSelected: "ไม่ได้เลือกไฟล์"
    }
  }
};

// 언어 스토어 생성
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      // 기본 언어: 한국어
      language: DEFAULT_LANGUAGE,
      
      // 번역 데이터 - 서버 사이드 렌더링 고려하여 기본값 설정
      translations: defaultTranslations,
      
      // 로딩 상태
      isLoading: false,
      
      // 초기화 완료 여부 - 기본값을 가지고 있으므로 true로 설정
      initialized: true,
      
      // 언어 설정 함수
      setLanguage: (language: Language) => {
        set({ language });
        
        // 해당 언어의 번역 데이터가 없으면 로드
        const { translations, loadTranslations } = get();
        if (!translations[language] || Object.keys(translations[language] || {}).length <= 3) {
          loadTranslations(language);
        }
      },
      
      // 번역 데이터 로드 함수
      loadTranslations: async (lang?: Language) => {
        const { language, translations } = get();
        const targetLang = lang || language;
        
        // 이미 전체 데이터가 로드된 경우 스킵
        const currentTranslations = translations[targetLang];
        if (currentTranslations && Object.keys(currentTranslations).length > 5) {
          return;
        }
        
        set({ isLoading: true });
        
        try {
          // 실제 번역 파일 로드
          const response = await fetch(getTranslationPath(targetLang), {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          
          if (!response.ok) {
            console.error(`번역 파일 로드 실패: ${targetLang}`, response.status);
            throw new Error(`번역 파일 로드 실패: ${response.status}`);
          }
          
          const data = await response.json();
          
          // 기존 기본 번역과 병합
          const mergedTranslations = {
            ...translations,
            [targetLang]: {
              ...defaultTranslations[targetLang],
              ...data
            }
          };
          
          set({
            translations: mergedTranslations,
            isLoading: false,
            initialized: true
          });
        } catch (error) {
          console.error('번역 로드 오류:', error);
          
          // 오류 발생 시 기본값이라도 저장
          set({
            translations: {
              ...translations,
              [targetLang]: {
                ...defaultTranslations[targetLang]
              }
            },
            isLoading: false,
            initialized: true
          });
        }
      },
      
      // 번역 함수
      t: (key: string) => {
        const { language, translations } = get();
        const parts = key.split('.');
        
        // 현재 선택된 언어의 번역 데이터
        const langTranslations = translations[language] || {};
        
        // 키를 따라가며 번역 데이터 찾기
        let result = langTranslations;
        for (const part of parts) {
          if (result && typeof result === 'object' && part in result) {
            result = result[part];
          } else {
            // 번역 데이터가 없는 경우 로그 기록
            console.warn(`ko 번역 데이터 없음, 키 그대로 반환: ${key}`);
            return key;
          }
        }
        
        // 최종 결과가 문자열이 아니면 키 반환
        return typeof result === 'string' ? result : key;
      }
    }),
    {
      name: 'language-storage', // 로컬 스토리지 키 이름
      partialize: (state) => ({ language: state.language }), // 언어 설정만 저장
    }
  )
);

// 컴포넌트에서 사용할 훅 - React 훅은 컴포넌트 내부에서만 호출해야 함
export function useTranslation() {
  return {
    language: useLanguageStore((state) => state.language),
    setLanguage: useLanguageStore((state) => state.setLanguage),
    t: useLanguageStore((state) => state.t),
    isLoading: useLanguageStore((state) => state.isLoading),
    supportedLanguages: SUPPORTED_LANGUAGES
  };
} 