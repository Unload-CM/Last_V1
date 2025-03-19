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
