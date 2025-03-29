import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

// 유효한 날짜 형식인지 확인하는 함수
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  const valid = !isNaN(date.getTime());
  console.log(`날짜 유효성 검사: ${dateString} => ${valid ? '유효' : '유효하지 않음'}`);
  return valid;
}

/**
 * 대시보드 데이터 조회 API
 * GET /api/dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const fromParam = url.searchParams.get('from'); 
    const toParam = url.searchParams.get('to');
    
    // 언어 파라미터 가져오기
    const langParam = url.searchParams.get('lang') || 'ko';
    console.log(`[dashboard/route] 언어 설정: ${langParam}, 타입: ${typeof langParam}`);

    // 날짜 범위 설정
    let fromDate: Date, toDate: Date;
    
    if (fromParam && isValidDate(fromParam)) {
      fromDate = new Date(fromParam);
      console.log(`fromDate 파싱 결과: ${fromDate.toISOString()}`);
    } else {
      // 기본값: 이번 달 1일
      fromDate = new Date();
      fromDate.setDate(1);
      fromDate.setHours(0, 0, 0, 0);
      console.log(`fromDate 기본값 설정: ${fromDate.toISOString()}`);
    }
    
    if (toParam && isValidDate(toParam)) {
      toDate = new Date(toParam);
      // 이미 ISO 형식의 경우 시간 정보가 포함되어 있으므로 확인 후 설정
      if (toParam.includes('T')) {
        console.log(`toDate에 이미 시간 정보 포함: ${toDate.toISOString()}`);
      } else {
        // 날짜 범위를 해당 일의 끝까지 포함
        toDate.setHours(23, 59, 59, 999);
        console.log(`toDate에 시간 정보 추가: ${toDate.toISOString()}`);
      }
    } else {
      // 기본값: 오늘
      toDate = new Date();
      toDate.setHours(23, 59, 59, 999);
      console.log(`toDate 기본값 설정: ${toDate.toISOString()}`);
    }

    // 이슈 상태별 통계 (날짜 필터 적용)
    const openIssues = await prisma.issue.count({
      where: {
        status: {
          name: "OPEN"
        },
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      }
    });

    const inProgressIssues = await prisma.issue.count({
      where: {
        status: {
          name: "IN_PROGRESS"
        },
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      }
    });

    const resolvedIssues = await prisma.issue.count({
      where: {
        status: {
          name: "RESOLVED"
        },
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      }
    });

    const closedIssues = await prisma.issue.count({
      where: {
        status: {
          name: "CLOSED"
        },
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      }
    });

    // 상태별 분포 (날짜 필터 적용)
    const statusCounts = await prisma.issue.groupBy({
      by: ['statusId'],
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      },
      _count: {
        id: true
      }
    });

    const statuses = await prisma.status.findMany({
      select: {
        id: true,
        name: true,
        label: true,
        thaiLabel: true
      }
    });

    const formattedStatusDistribution = statuses.map(status => {
      const countData = statusCounts.find(s => s.statusId === status.id);
      // 언어에 따라 적절한 필드 선택
      let displayName;
      if (langParam === 'en') {
        displayName = status.name;
      } else if (langParam === 'th') {
        displayName = status.thaiLabel || status.label;
        console.log(`Status ID ${status.id}: thaiLabel=${status.thaiLabel}, label=${status.label}, 사용된 이름=${displayName}`);
      } else {
        displayName = status.label;
      }
      
      return {
        id: status.id,
        name: displayName,
        count: countData ? countData._count.id : 0
      };
    });

    // 우선순위별 분포 (날짜 필터 적용)
    const priorityCounts = await prisma.issue.groupBy({
      by: ['priorityId'],
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      },
      _count: {
        id: true
      }
    });

    const priorities = await prisma.priority.findMany({
      select: {
        id: true,
        name: true,
        label: true,
        thaiLabel: true
      }
    });

    const formattedPriorityDistribution = priorities.map(priority => {
      const countData = priorityCounts.find(p => p.priorityId === priority.id);
      // 언어에 따라 적절한 필드 선택
      let displayName;
      if (langParam === 'en') {
        displayName = priority.name;
      } else if (langParam === 'th') {
        displayName = priority.thaiLabel || priority.label;
        console.log(`Priority ID ${priority.id}: thaiLabel=${priority.thaiLabel}, label=${priority.label}, 사용된 이름=${displayName}`);
      } else {
        displayName = priority.label;
      }
      
      return {
        id: priority.id,
        name: displayName,
        count: countData ? countData._count.id : 0
      };
    });

    // 부서별 분포 (날짜 필터 적용)
    const departmentCounts = await prisma.issue.groupBy({
      by: ['departmentId'],
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      },
      _count: {
        id: true
      }
    });

    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        label: true,
        thaiLabel: true
      }
    });

    const formattedDepartmentDistribution = departments.map(department => {
      const countData = departmentCounts.find(d => d.departmentId === department.id);
      // 언어에 따라 적절한 필드 선택
      let displayName;
      if (langParam === 'en') {
        displayName = department.name;
      } else if (langParam === 'th') {
        displayName = department.thaiLabel || department.label;
        console.log(`Department ID ${department.id}: thaiLabel=${department.thaiLabel}, label=${department.label}, 사용된 이름=${displayName}`);
      } else {
        displayName = department.label;
      }
      
      return {
        id: department.id,
        name: displayName,
        count: countData ? countData._count.id : 0
      };
    });

    // 카테고리별 분포 (날짜 필터 적용)
    const categoryCounts = await prisma.issue.groupBy({
      by: ['categoryId'],
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      },
      _count: {
        id: true
      }
    });

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        label: true
      }
    });

    const formattedCategoryDistribution = categories.map(category => {
      const countData = categoryCounts.find(c => c.categoryId === category.id);
      return {
        id: category.id,
        name: category.label,
        count: countData ? countData._count.id : 0
      };
    });

    // 월별 이슈 생성 통계 (연도-월 기준으로 필터링)
    const fromYear = fromDate.getFullYear();
    const fromMonth = fromDate.getMonth() + 1;
    const toYear = toDate.getFullYear();
    const toMonth = toDate.getMonth() + 1;
    
    // 필터링된 기간의 모든 월 생성
    const months: Array<{year: number, month: number}> = [];
    for (let year = fromYear; year <= toYear; year++) {
      const startMonth = (year === fromYear) ? fromMonth : 1;
      const endMonth = (year === toYear) ? toMonth : 12;
      
      for (let month = startMonth; month <= endMonth; month++) {
        months.push({ year, month });
      }
    }
    
    // 각 월의 이슈 통계 준비
    const monthlyIssueCreation = await Promise.all(
      months.map(async ({ year, month }) => {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const count = await prisma.issue.count({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        });
        
        return {
          month,
          year,
          count: count || 0
        };
      })
    );

    // 최근 생성된 이슈 가져오기
    const recentIssues = await prisma.issue.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            label: true,
            thaiLabel: true
          }
        },
        status: {
          select: {
            id: true,
            name: true,
            label: true,
            thaiLabel: true
          }
        },
        priority: {
          select: {
            id: true,
            name: true,
            label: true,
            thaiLabel: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            label: true,
            thaiLabel: true
          }
        },
        // 이슈 발견자 (assignee)
        assignee: {
          select: {
            id: true,
            employeeId: true,
            koreanName: true,
            thaiName: true,
            nickname: true,
            department: {
              select: {
                id: true,
                name: true,
                label: true,
                thaiLabel: true
              }
            }
          }
        },
        // 이슈 해결자 (solver)
        solver: {
          select: {
            id: true,
            employeeId: true,
            koreanName: true,
            thaiName: true,
            nickname: true,
            department: {
              select: {
                id: true,
                name: true,
                label: true,
                thaiLabel: true
              }
            }
          }
        },
        // 이슈 작성자
        creator: {
          select: {
            id: true,
            employeeId: true,
            koreanName: true,
            thaiName: true,
            nickname: true,
            department: {
              select: {
                id: true,
                name: true,
                label: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      totalIssues: openIssues + inProgressIssues + resolvedIssues + closedIssues,
      openIssuesCount: openIssues,
      inProgressIssuesCount: inProgressIssues,
      resolvedIssuesCount: resolvedIssues,
      closedIssuesCount: closedIssues,
      statusDistribution: formattedStatusDistribution,
      priorityDistribution: formattedPriorityDistribution,
      departmentDistribution: formattedDepartmentDistribution,
      categoryDistribution: formattedCategoryDistribution,
      monthlyIssueCreation,
      dateFilter: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      },
      recentIssues: recentIssues,
      upcomingDueIssues: []
    });
  } catch (error) {
    console.error("대시보드 데이터 조회 중 오류 발생:", error);
    return NextResponse.json(
      { error: "대시보드 데이터를 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 