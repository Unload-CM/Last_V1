# 인덕터 공장 관리 시스템

인덕터 공장을 위한 다국어 지원 관리 시스템입니다. 한국어, 태국어, 영어를 지원합니다.

## 주요 기능

- **로그인 시스템**: 관리자와 일반 사용자 권한 구분
- **대시보드**: 이슈 데이터 시각화, 문제 본질과 직원 성과 표시, 주차별 그래프
- **이슈보드**: 문제 기록(발견자, 발견 시간, 문제 유형), 사진/동영상 업로드, 해결 상태 추적
- **설정**: 직원 관리(등록/수정/삭제), 문제 유형 관리(설비/관리/원자재 등)
- **다국어 지원**: 한국어, 태국어, 영어 지원

## 기술 스택

- **프론트엔드**: Next.js, React, TypeScript, Tailwind CSS
- **백엔드**: Next.js API Routes
- **데이터베이스**: PostgreSQL
- **ORM**: Prisma
- **인증**: NextAuth.js
- **다국어 지원**: next-i18next
- **차트**: Chart.js, react-chartjs-2

## 설치 및 실행 방법

1. 저장소 클론
```bash
git clone https://github.com/coilmastergpt/last.git
cd last
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env` 파일을 수정하여 데이터베이스 연결 정보 등을 설정합니다.

4. 데이터베이스 마이그레이션
```bash
npx prisma migrate dev
```

5. 개발 서버 실행
```bash
npm run dev
```

6. 브라우저에서 확인
```
http://localhost:3000
```

## 데이터베이스 스키마

- **User**: 사용자 정보 (관리자, 매니저, 직원)
- **Department**: 부서 정보
- **IssueCategory**: 문제 카테고리 (설비, 관리, 원자재 등)
- **Issue**: 문제 정보 (제목, 설명, 상태, 우선순위 등)
- **Media**: 이슈 관련 미디어 파일 (사진, 동영상)
- **Comment**: 이슈에 대한 코멘트

# 코일마스터 프로젝트 개발 종합 요약

## 개발 환경
- **프레임워크**: Next.js 14 (App Router)
- **데이터베이스**: PostgreSQL (Prisma ORM 사용)
- **스타일링**: Tailwind CSS + Shadcn/UI 컴포넌트
- **상태 관리**: Zustand
- **인증**: NextAuth.js

## 데이터베이스 구조
실제 데이터베이스는 다음과 같은 모델로 구성되어 있습니다:

1. **Status**: 이슈의 상태 관리 (오픈, 진행 중, 해결됨, 종료됨)
2. **Priority**: 이슈의 우선순위 관리 (중요, 높음, 중간, 낮음)
3. **Category**: 이슈의 카테고리 분류
4. **Department**: 부서 정보 관리
5. **Employee**: 직원 정보 관리 (한국인/태국인 여부, 관리자 권한 등)
6. **Issue**: 이슈 관리 (제목, 설명, 담당자, 부서, 상태, 우선순위, 카테고리)
7. **IssueHistory**: 이슈 이력 관리 (변경 내역, 해결 방안, 예방 조치 등)
8. **IssueComment**: 이슈에 대한 댓글 관리
9. **IssueAttachment**: 이슈 관련 첨부 파일 관리
10. **IssueCommentAttachment**: 댓글 첨부 파일 관리
11. **IssueNotification**: 이슈 관련 알림 관리
12. **ThaiPhrase**: 태국어 구문 관리
13. **Tag**: 태국어 구문 관련 태그 관리

## 다국어 지원 (i18n)
- **지원 언어**: 한국어(기본), 영어, 태국어
- **구현 방식**: 
  1. 커스텀 언어 스토어(languageStore.ts)를 Zustand로 구현
  2. 각 언어별로 번역 파일 관리
  3. 레이블, 설명 등의 필드에 다국어 버전 추가(예: thaiLabel, thaiDescription)
  4. 사용자 인터페이스에서 언어 전환 기능 제공
  5. 언어별 폰트 지원 (태국어용 Noto Sans Thai 폰트 사용)

## 모바일 대응
- **반응형 디자인**:
  1. Tailwind CSS의 반응형 클래스 활용
  2. `react-responsive` 라이브러리로 디바이스 크기 감지
  3. 모바일 전용 내비게이션 컴포넌트 (`MobileNavigation.tsx`)
  4. 화면 크기에 따른 레이아웃 조정
  5. 모바일 전용 뷰 분기 처리 (예: 테이블 대신 카드 형태로 표시)

## 주요 기능
1. **인증 시스템**
   - 직원 ID 기반 로그인
   - 관리자 권한 체크
   - 비밀번호 변경 기능

2. **대시보드**
   - 주요 통계 시각화 (차트.js 활용)
   - 이슈 상태별 카운트
   - 월별 이슈 생성 추이
   - 상위 이슈 등록자/해결자 통계

3. **이슈 관리**
   - 이슈 생성, 조회, 수정, 삭제
   - 상태, 우선순위, 카테고리, 담당자 지정
   - 부서간 이슈 이관
   - 해결책 및 예방 조치 기록

4. **직원 관리**
   - 직원 정보 등록 및 관리
   - 한국인/태국인 구분
   - 부서 배정
   - 관리자 권한 부여

5. **태국어 구문 관리**
   - 자주 사용하는 태국어 구문 등록
   - 태그로 분류 및 검색

6. **첨부 파일 관리**
   - 이미지 최적화 및 썸네일 생성
   - 다양한 파일 형식 지원

7. **알림 시스템**
   - 이슈 상태 변경, 댓글 등록 시 알림
   - 읽음/안읽음 상태 관리

8. **설정**
   - 상태, 우선순위, 카테고리, 부서 관리
   - 메타데이터 등록 및 수정

## 기술적 특징
1. **서버 컴포넌트와 클라이언트 컴포넌트 분리**
   - Next.js 14 App Router의 장점 활용
   - 성능 최적화

2. **데이터 페칭 최적화**
   - Prisma를 활용한 효율적인 쿼리
   - 관계형 데이터 효과적 처리

3. **반응형 디자인**
   - 모바일부터 데스크톱까지 모든 화면 크기 지원
   - 디바이스별 최적화된 UI/UX

4. **다국어 처리**
   - 한국어, 영어, 태국어 지원으로 다국적 팀 협업 가능
   - 언어별 폰트 최적화

5. **보안**
   - 권한 기반 접근 제어
   - 세션 관리
   - 데이터 검증

## 앱 구조
- **`/app`**: Next.js 14 App Router 기반 페이지
- **`/components`**: 재사용 가능한 UI 컴포넌트
- **`/lib`**: 유틸리티 함수, API 클라이언트
- **`/prisma`**: 데이터베이스 스키마 및 마이그레이션
- **`/public`**: 정적 에셋
- **`/store`**: Zustand 기반 상태 관리
- **`/utils`**: 헬퍼 함수
- **`/types`**: TypeScript 타입 정의
