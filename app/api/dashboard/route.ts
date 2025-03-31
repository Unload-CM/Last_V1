import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// API 설정 모두 제거 (정적 내보내기와 호환되지 않음)

// 타입 정의
interface IssueSummary {
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
}

interface DepartmentStat {
  id: string;
  name: string;
  issueCount: number;
}

interface CategoryStat {
  id: string;
  name: string;
  issueCount: number;
}

interface CreatorStat {
  id: number;
  name: string;
  department: string;
  issueCount: number;
}

interface ResolverStat {
  id: number;
  name: string;
  department: string;
  issueCount: number;
}

interface MonthData {
  month: string;
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
}

// 샘플 데이터
const SAMPLE_DEPARTMENTS = [
  { id: '1', name: '생산부', issueCount: 12 },
  { id: '2', name: '품질관리부', issueCount: 8 },
  { id: '3', name: '물류창고', issueCount: 5 },
  { id: '4', name: '자재관리', issueCount: 3 }
];

const SAMPLE_CATEGORIES = [
  { id: '1', name: '기계 고장', issueCount: 10 },
  { id: '2', name: '품질 문제', issueCount: 8 },
  { id: '3', name: '안전 문제', issueCount: 5 },
  { id: '4', name: '자재 부족', issueCount: 3 },
  { id: '5', name: '기타', issueCount: 2 }
];

const SAMPLE_RECENT_ISSUES = [
  {
    id: 1,
    title: '생산라인 1번 기계 고장',
    status: 'OPEN',
    priority: 'HIGH',
    createdAt: new Date().toISOString(),
    department: { name: '생산부' },
    category: { name: '기계 고장' },
    createdBy: { id: 1, name: '김철수' }
  },
  {
    id: 2,
    title: '품질 검사 장비 오작동',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1일 전
    department: { name: '품질관리부' },
    category: { name: '기계 고장' },
    createdBy: { id: 2, name: '이영희' }
  },
  {
    id: 3,
    title: '자재 부족으로 인한 생산 지연',
    status: 'RESOLVED',
    priority: 'HIGH',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2일 전
    department: { name: '자재관리' },
    category: { name: '자재 부족' },
    createdBy: { id: 3, name: '박지성' }
  }
];

const SAMPLE_CREATORS = [
  { id: 1, name: '김철수', department: '생산부', issueCount: 8 },
  { id: 2, name: '이영희', department: '품질관리부', issueCount: 6 },
  { id: 3, name: '박지성', department: '자재관리', issueCount: 4 }
];

const SAMPLE_RESOLVERS = [
  { id: 1, name: '김철수', department: '생산부', issueCount: 5 },
  { id: 2, name: '이영희', department: '품질관리부', issueCount: 7 },
  { id: 3, name: '박지성', department: '자재관리', issueCount: 3 }
];

const SAMPLE_MONTHLY_TREND = [
  { month: '1월', open: 5, inProgress: 3, resolved: 2, total: 10 },
  { month: '2월', open: 7, inProgress: 4, resolved: 3, total: 14 },
  { month: '3월', open: 4, inProgress: 6, resolved: 5, total: 15 },
  { month: '4월', open: 6, inProgress: 5, resolved: 7, total: 18 },
  { month: '5월', open: 8, inProgress: 4, resolved: 6, total: 18 },
  { month: '6월', open: 5, inProgress: 7, resolved: 8, total: 20 }
];

// URL 파라미터에서 날짜가 유효한지 확인하는 함수
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

// 샘플 데이터
const SAMPLE_DASHBOARD_DATA = {
  issueSummary: {
    open: 12,
    inProgress: 8,
    resolved: 24,
    total: 44
  },
  monthlyIssueCreation: [
    { month: 1, count: 5 },
    { month: 2, count: 8 },
    { month: 3, count: 12 },
    { month: 4, count: 7 },
    { month: 5, count: 10 },
    { month: 6, count: 15 },
    { month: 7, count: 9 },
    { month: 8, count: 14 },
    { month: 9, count: 11 },
    { month: 10, count: 6 },
    { month: 11, count: 13 },
    { month: 12, count: 10 }
  ]
};

/**
 * 대시보드 데이터 API
 * GET /api/dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const lang = searchParams.get('lang') || 'ko';

  try {
    try {
      // 필터링 조건 구성
      const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
      const toDate = to ? new Date(to) : new Date();

      // 이슈 상태별 카운트 조회
      const openCount = await prisma.issue.count({
        where: {
          statusId: 1, // 열림 상태 ID
          createdAt: {
            gte: fromDate,
            lte: toDate
          }
        }
      });

      const inProgressCount = await prisma.issue.count({
        where: {
          statusId: 2, // 진행중 상태 ID
          createdAt: {
            gte: fromDate,
            lte: toDate
          }
        }
      });

      const resolvedCount = await prisma.issue.count({
        where: {
          statusId: { in: [3, 4] }, // 해결됨, 종료 상태 ID
          createdAt: {
            gte: fromDate,
            lte: toDate
          }
        }
      });

      const totalCount = openCount + inProgressCount + resolvedCount;

      // 월별 이슈 생성 데이터 조회 (현재 연도)
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
      
      // PrismaClient가 월별 집계를 직접 지원하지 않으므로 모든 이슈를 가져와 메모리에서 집계
      const issues = await prisma.issue.findMany({
        where: {
          createdAt: {
            gte: startOfYear,
            lte: endOfYear
          }
        },
        select: {
          createdAt: true
        }
      });

      // 월별 집계
      const monthlyData = Array(12).fill(0).map((_, index) => ({
        month: index + 1,
        count: 0
      }));

      issues.forEach(issue => {
        const month = issue.createdAt.getMonth();
        monthlyData[month].count += 1;
      });

      // 대시보드 데이터 구성
      const dashboardData = {
        issueSummary: {
          open: openCount,
          inProgress: inProgressCount,
          resolved: resolvedCount,
          total: totalCount
        },
        monthlyIssueCreation: monthlyData
      };

      return NextResponse.json(dashboardData);
    } catch (dbError) {
      // 데이터베이스 오류 시 샘플 데이터 반환
      console.error('대시보드 데이터 조회 중 DB 오류:', dbError);
      return NextResponse.json(SAMPLE_DASHBOARD_DATA);
    }
  } catch (error) {
    console.error('대시보드 데이터 조회 중 오류:', error);
    return NextResponse.json(
      { error: '대시보드 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 