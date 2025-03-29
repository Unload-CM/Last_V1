# 코일마스터 프로젝트 구조 설명서

## 1. 프로젝트 개요
이 프로젝트는 Next.js를 기반으로 한 다국어(한국어, 영어, 태국어) 지원 웹 애플리케이션입니다. PostgreSQL 데이터베이스를 사용하며, Prisma ORM을 통해 데이터를 관리합니다.

## 2. 주요 디렉토리 구조

### 📁 app/
메인 애플리케이션 코드가 위치한 디렉토리입니다.

#### 주요 페이지 컴포넌트 (app/ 하위)
- `login/`: 사용자 로그인 페이지
- `admin-login/`: 관리자 로그인 페이지
- `dashboard/`: 메인 대시보드 화면
- `employees/`: 직원 관리 화면
- `issues/`: 이슈 관리 화면
- `settings/`: 시스템 설정 화면
- `change-password/`: 비밀번호 변경 화면
- `thai-phrases/`: 태국어 구문 관리 화면
- `translation-admin/`: 번역 관리자 화면
- `manual/`: 매뉴얼 페이지
- `network-test/`: 네트워크 테스트 화면
- `reports/`: 보고서 관련 화면

### 📁 components/
재사용 가능한 UI 컴포넌트들이 위치합니다.

### 📁 store/
상태 관리 관련 파일들이 위치합니다.
- `languageStore.ts`: 다국어 처리를 위한 언어 설정 스토어

### 📁 prisma/
데이터베이스 스키마 및 마이그레이션 파일들이 위치합니다.

### 📁 public/
정적 파일들(이미지, 폰트 등)이 위치합니다.

### 📁 utils/
유틸리티 함수들이 위치합니다.

### 📁 types/
TypeScript 타입 정의 파일들이 위치합니다.

### 📁 hooks/
커스텀 React 훅들이 위치합니다.

## 3. 주요 설정 파일
- `next.config.js`: Next.js 설정 파일
- `tailwind.config.js`: Tailwind CSS 설정
- `next-i18next.config.js`: 다국어 지원 설정
- `.env`: 환경 변수 설정
- `tsconfig.json`: TypeScript 설정

## 4. 데이터베이스 관련
- `prisma/schema.prisma`: 데이터베이스 스키마 정의
- `db-seed.sql`: 초기 데이터 시드 파일
- 주요 테이블:
  - Status
  - Priority
  - Category
  - Department
  - Employees
  - Issues

## 5. 특이사항
- 다국어 지원 (한국어, 영어, 태국어)
- PostgreSQL 데이터베이스 사용
- Prisma ORM 활용
- 모바일 대응 (`(mobile)` 디렉토리)
- 관리자/일반 사용자 구분된 로그인 시스템

## 6. 개발 가이드라인
- DRY 원칙 준수
- 코드 중복 최소화
- 가독성 우선
- 성능 최적화 고려
- 데이터베이스 변경은 승인 필요

# TSX 파일 상세 설명

## 1. 메인 레이아웃 및 공통 컴포넌트

### 📄 app/layout.tsx
- 전체 애플리케이션의 기본 레이아웃을 정의
- 네비게이션 바, 사이드바 등 공통 UI 요소 포함
- 다국어 설정 및 전역 상태 관리 설정

### 📄 app/providers.tsx
- 전역 상태 관리를 위한 Provider 컴포넌트들 설정
- 테마, 다국어, 인증 등의 Context Provider 포함

## 2. 인증 관련 페이지

### 📄 app/login/page.tsx
- 일반 사용자 로그인 페이지
- 이메일/사번과 비밀번호를 통한 인증
- 다국어 지원 로그인 폼

### 📄 app/admin-login/page.tsx
- 관리자 전용 로그인 페이지
- 관리자 권한 검증
- 보안 강화된 로그인 프로세스

### 📄 app/change-password/page.tsx
- 비밀번호 변경 페이지
- 현재 비밀번호 확인 및 새 비밀번호 설정
- 비밀번호 규칙 검증

## 3. 메인 기능 페이지

### 📄 app/dashboard/page.tsx
- 메인 대시보드 화면
- 주요 통계 및 현황 표시
- 차트 및 그래프를 통한 데이터 시각화

### 📄 app/issues/page.tsx
- 이슈 목록 페이지
- 이슈 필터링 및 정렬 기능
- 상태별 이슈 분류

### 📄 app/issues/new/page.tsx
- 새 이슈 생성 페이지
- 이슈 제목, 설명, 우선순위 등 입력
- 파일 첨부 기능

### 📄 app/issues/[id]/page.tsx
- 개별 이슈 상세 페이지
- 이슈 정보 조회 및 수정
- 댓글 및 작업 로그 표시

### 📄 app/employees/page.tsx
- 직원 관리 페이지
- 직원 목록 조회 및 검색
- 부서별 직원 필터링

## 4. 설정 및 관리 페이지

### 📄 app/settings/page.tsx
- 시스템 설정 페이지
- 일반 설정, 알림 설정 등
- 관리자 전용 설정 옵션

### 📄 app/translation-admin/page.tsx
- 번역 관리 페이지
- 다국어 텍스트 관리
- 번역 추가 및 수정

### 📄 app/thai-phrases/page.tsx
- 태국어 구문 관리 페이지
- 자주 사용되는 태국어 구문 등록/수정
- 발음 가이드 포함

## 5. 모바일 대응

### 📄 app/(mobile)/page.tsx
- 모바일 전용 메인 페이지
- 반응형 UI 구현
- 모바일에 최적화된 기능

## 6. 공통 컴포넌트

### 📄 app/components/Header.tsx
- 상단 헤더 컴포넌트
- 네비게이션 메뉴
- 사용자 프로필 정보

### 📄 app/components/Sidebar.tsx
- 사이드바 네비게이션
- 메뉴 항목 관리
- 접근 권한 제어

### 📄 app/components/LanguageSwitcher.tsx
- 언어 전환 컴포넌트
- 지원 언어 선택 UI
- 언어 설정 저장

### 📄 app/components/forms/
- `IssueForm.tsx`: 이슈 입력 폼
- `EmployeeForm.tsx`: 직원 정보 입력 폼
- `LoginForm.tsx`: 로그인 폼

### 📄 app/components/tables/
- `IssueTable.tsx`: 이슈 목록 테이블
- `EmployeeTable.tsx`: 직원 목록 테이블
- `DataTable.tsx`: 공통 데이터 테이블

## 7. 유틸리티 컴포넌트

### 📄 app/components/ui/
- `Button.tsx`: 커스텀 버튼 컴포넌트
- `Modal.tsx`: 모달 다이얼로그
- `Toast.tsx`: 알림 토스트
- `Loading.tsx`: 로딩 인디케이터

## 8. 차트 및 데이터 시각화

### 📄 app/components/charts/
- `IssueChart.tsx`: 이슈 통계 차트
- `ProgressChart.tsx`: 진행 상황 차트
- `StatisticsChart.tsx`: 통계 데이터 차트

## 특이사항
- 모든 페이지는 다국어 지원 (한국어, 영어, 태국어)
- 반응형 디자인 적용
- 접근성 고려 (ARIA 레이블, 키보드 네비게이션)
- 데이터 로딩 상태 처리
- 에러 핸들링 구현

이 문서는 프로젝트의 구조와 각 TSX 파일들의 역할을 상세히 설명합니다. 각 컴포넌트는 재사용성과 유지보수성을 고려하여 설계되었으며, 필요에 따라 지속적으로 업데이트됩니다. 