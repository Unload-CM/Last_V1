import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

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

/**
 * 대시보드 데이터 조회 API
 * GET /api/dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 이슈 통계
    const totalIssues = await prisma.issue.count();

    // 상태별 이슈 수
    const statusCounts = await prisma.issue.groupBy({
      by: ["statusId"],
      _count: {
        id: true,
      },
    });

    // 상태 정보 조회
    const statuses = await prisma.status.findMany();
    const statusMap = new Map(
      statuses.map((status) => [status.id, status.label])
    );

    // 우선순위별 이슈 수
    const priorityCounts = await prisma.issue.groupBy({
      by: ["priorityId"],
      _count: {
        id: true,
      },
    });

    // 우선순위 정보 조회
    const priorities = await prisma.priority.findMany();
    const priorityMap = new Map(
      priorities.map((priority) => [priority.id, priority.label])
    );

    // 부서별 이슈 수
    const departmentCounts = await prisma.issue.groupBy({
      by: ["departmentId"],
      _count: {
        id: true,
      },
    });

    // 부서 정보 조회
    const departments = await prisma.department.findMany();
    const departmentMap = new Map(
      departments.map((dept) => [dept.id, dept.label])
    );

    // 2. 최근 생성된 이슈
    const recentIssues = await prisma.issue.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        department: {
          select: {
            name: true,
            label: true,
          },
        },
        status: {
          select: {
            name: true,
            label: true,
          },
        },
        priority: {
          select: {
            name: true,
            label: true,
          },
        },
        category: {
          select: {
            name: true,
            label: true,
          },
        },
      },
    });

    // 3. 마감일이 임박한 이슈
    const upcomingDueIssues = await prisma.issue.findMany({
      where: {
        dueDate: {
          gte: new Date(),
          lte: new Date(new Date().setDate(new Date().getDate() + 7)), // 7일 이내
        },
        statusId: {
          notIn: [3, 4], // 해결됨, 종료 상태가 아닌 것 (ID를 적절히 수정)
        },
      },
      take: 5,
      orderBy: {
        dueDate: "asc",
      },
      include: {
        department: {
          select: {
            name: true,
            label: true,
          },
        },
        status: {
          select: {
            name: true,
            label: true,
          },
        },
        priority: {
          select: {
            name: true,
            label: true,
          },
        },
      },
    });

    // 4. 월별 이슈 생성 수
    const currentYear = new Date().getFullYear();
    const monthlyIssueCreation = await Promise.all(
      Array.from({ length: 12 }, async (_, i) => {
        const startDate = new Date(currentYear, i, 1);
        const endDate = new Date(currentYear, i + 1, 0);

        const count = await prisma.issue.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        return {
          month: i + 1,
          count,
        };
      })
    );

    // 응답 데이터 구성
    const dashboardData = {
      totalIssues,
      statusDistribution: statusCounts.map((item) => ({
        id: item.statusId,
        name: statusMap.get(item.statusId) || "알 수 없음",
        count: item._count.id,
      })),
      priorityDistribution: priorityCounts.map((item) => ({
        id: item.priorityId,
        name: priorityMap.get(item.priorityId) || "알 수 없음",
        count: item._count.id,
      })),
      departmentDistribution: departmentCounts.map((item) => ({
        id: item.departmentId,
        name: departmentMap.get(item.departmentId) || "알 수 없음",
        count: item._count.id,
      })),
      recentIssues,
      upcomingDueIssues,
      monthlyIssueCreation,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("대시보드 데이터 조회 중 오류 발생:", error);
    return NextResponse.json(
      { error: "대시보드 데이터를 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 