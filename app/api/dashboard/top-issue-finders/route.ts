import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { DEFAULT_LANGUAGE, Language } from '@/store/languageStore';

// 유효한 날짜 형식인지 확인하는 함수
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  const valid = !isNaN(date.getTime());
  console.log(`[top-issue-finders] 날짜 유효성 검사: ${dateString} => ${valid ? '유효' : '유효하지 않음'}`);
  return valid;
}

// 언어에 따라 부서 필드를 선택하는 함수
function getDepartmentFieldByLanguage(language: Language): string {
  switch (language) {
    case 'en': return 'name'; // 영어
    case 'th': return 'thaiLabel'; // 태국어 
    case 'ko': // 한국어
    default: return 'label';
  }
}

// 우선 순위 ID에 따른 가중치 값 정의 (동점자 처리용)
const PRIORITY_WEIGHTS = {
  1: 5,  // 심각(Critical)
  2: 3,  // 높음(High)
  3: 2,  // 중간(Medium)
  4: 1,  // 낮음(Low)
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않았습니다' }, { status: 401 });
    }
    
    // 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    // 구 파라미터 이름도 지원 (이전 버전 호환성)
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    // 언어 파라미터 가져오기
    const langParam = searchParams.get('lang') as Language || DEFAULT_LANGUAGE;
    
    // 날짜 처리 디버깅 로그 추가
    console.log(`[top-issue-finders] 받은 날짜 파라미터: from=${fromParam}, to=${toParam}, startDate=${startDateParam}, endDate=${endDateParam}`);
    console.log(`[top-issue-finders] 언어 설정: ${langParam}`);
    
    // 날짜 범위 설정
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    
    // 새 파라미터 우선 처리
    if (fromParam && isValidDate(fromParam)) {
      fromDate = new Date(fromParam);
      console.log(`[top-issue-finders] fromDate 파싱 결과: ${fromDate.toISOString()}`);
    } else if (startDateParam && isValidDate(startDateParam)) {
      fromDate = new Date(startDateParam);
      console.log(`[top-issue-finders] startDate 파싱 결과: ${fromDate.toISOString()}`);
    }
    
    if (toParam && isValidDate(toParam)) {
      toDate = new Date(toParam);
      // 이미 ISO 형식의 경우 시간 정보가 포함되어 있으므로 확인 후 설정
      if (!toParam.includes('T')) {
        // 날짜 범위를 해당 일의 끝까지 포함
        toDate.setHours(23, 59, 59, 999);
      }
      console.log(`[top-issue-finders] toDate 파싱 결과: ${toDate.toISOString()}`);
    } else if (endDateParam && isValidDate(endDateParam)) {
      toDate = new Date(endDateParam);
      if (!endDateParam.includes('T')) {
        toDate.setHours(23, 59, 59, 999);
      }
      console.log(`[top-issue-finders] endDate 파싱 결과: ${toDate.toISOString()}`);
    }
    
    // 날짜 필터 조건 생성
    let dateFilter = {};
    if (fromDate && toDate) {
      dateFilter = {
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      };
      console.log(`[top-issue-finders] 날짜 필터 적용: ${fromDate.toISOString()} ~ ${toDate.toISOString()}`);
    }
    
    // 1. 먼저 이슈 발견자별로 이슈 개수를 집계
    const topIssueFinders = await prisma.issue.groupBy({
      by: ['assigneeId'],
      where: {
        assigneeId: {
          not: null
        },
        ...dateFilter
      },
      _count: {
        id: true
      },
    });
    
    // 2. 동점자를 확인하기 위해 이슈 수별로 그룹화
    const issueCountGroups = new Map<number, number[]>();
    
    topIssueFinders.forEach(finder => {
      if (!finder.assigneeId) return;
      
      const count = finder._count.id;
      if (!issueCountGroups.has(count)) {
        issueCountGroups.set(count, []);
      }
      issueCountGroups.get(count)?.push(finder.assigneeId);
    });
    
    // 3. 동점자가 있는 그룹을 확인하고, 해당 그룹만 2차 정렬을 위한 점수 계산
    const needSecondarySort = Array.from(issueCountGroups.entries())
      .filter(([_count, assigneeIds]) => assigneeIds.length > 1)
      .map(([_count, assigneeIds]) => assigneeIds)
      .flat();
    
    // 모든 사용자의 심각도 가중치 계산 (이전에는 동점자만 계산)
    let userScores: {[key: number]: number} = {};
    
    // 모든 사용자의 이슈를 조회하여 심각도 점수 계산
    const allIssuesWithDetails = await prisma.issue.findMany({
      where: {
        assigneeId: {
          not: null
        },
        ...dateFilter
      },
      select: {
        assigneeId: true,
        priorityId: true,
      },
    });
    
    // 사용자별 심각도 점수 계산
    allIssuesWithDetails.forEach(issue => {
      if (!issue.assigneeId) return;
      
      const priorityWeight = PRIORITY_WEIGHTS[issue.priorityId as keyof typeof PRIORITY_WEIGHTS] || 1;
      
      if (!userScores[issue.assigneeId]) {
        userScores[issue.assigneeId] = 0;
      }
      
      userScores[issue.assigneeId] += priorityWeight;
    });
    
    console.log(`[top-issue-finders] 모든 사용자에 대한 심각도 점수 계산:`, userScores);
    
    // 4. 사용자 정보 및 점수를 결합하고 정렬
    const finderEntries = topIssueFinders.map(finder => {
      return {
        assigneeId: finder.assigneeId!,
        count: finder._count.id,
        score: userScores[finder.assigneeId!] || 0
      };
    });
    
    // 5. 정렬: 주 정렬 기준은 이슈 개수, 2차 정렬 기준은 심각도 점수
    finderEntries.sort((a, b) => {
      // 이슈 개수로 먼저 정렬
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      
      // 이슈 개수가 같으면 심각도 점수로 정렬
      return b.score - a.score;
    });
    
    // 상위 3명만 선택
    const topFinderEntries = finderEntries.slice(0, 3);
    
    // 선택된 언어에 맞는 부서 필드 가져오기
    const departmentField = getDepartmentFieldByLanguage(langParam);
    console.log(`[top-issue-finders] 선택된 부서 필드: ${departmentField}`);
    
    // 사용자 정보 포함하여 결과 매핑
    const mappedFinders = await Promise.all(
      topFinderEntries.map(async (finder) => {
        const user = await prisma.employee.findUnique({
          where: { id: finder.assigneeId },
          include: {
            department: true,
          },
        });
        
        if (!user) {
          return null;
        }
        
        // 선택된 언어에 맞는 부서명 필드 사용
        const departmentName = user.department 
          ? user.department[departmentField as keyof typeof user.department] as string || user.department.label || '부서 없음'
          : '부서 없음';
        
        return {
          id: user.id,
          koreanName: user.koreanName,
          thaiName: user.thaiName,
          nickname: user.nickname,
          departmentName,
          issueCount: finder.count,
          score: Math.round(finder.score * 10) / 10 // 모든 사용자에게 점수 표시 (소수점 첫째자리까지 반올림)
        };
      })
    );
    
    // null 값 필터링
    const validFinders = mappedFinders.filter(finder => finder !== null) as Array<{
      id: number;
      koreanName: string;
      thaiName: string | null;
      nickname: string | null;
      departmentName: string;
      issueCount: number;
      score?: number;
    }>;
    
    // 공동 순위 시스템 적용
    const rankingsWithTies: Array<{
      id: number;
      koreanName: string;
      thaiName: string | null;
      nickname: string | null;
      departmentName: string;
      issueCount: number;
      score?: number;
      rank: number;
    }> = [];
    let currentRank = 1;
    let peopleWithSameRank = 0;
    
    for (let i = 0; i < validFinders.length; i++) {
      if (i === 0) {
        // 첫 번째 사람은 항상 1위로 시작
        rankingsWithTies.push({
          ...validFinders[i],
          rank: currentRank
        });
        peopleWithSameRank = 1;
      } else {
        // 이전 사람과 현재 사람의 점수 비교
        const prevFinder = validFinders[i-1];
        const currentFinder = validFinders[i];
        
        // 이슈 수가 같은지 확인
        const sameIssueCount = prevFinder.issueCount === currentFinder.issueCount;
        
        // 가중치 점수가 같은지 확인 (둘 다 undefined이거나 같은 값인 경우)
        const sameWeightScore = 
          (prevFinder.score === undefined && currentFinder.score === undefined) ||
          (prevFinder.score !== undefined && 
           currentFinder.score !== undefined && 
           prevFinder.score === currentFinder.score);
        
        if (sameIssueCount && sameWeightScore) {
          // 동점자인 경우 - 이전 사람과 같은 순위 부여
          rankingsWithTies.push({
            ...currentFinder,
            rank: currentRank
          });
          peopleWithSameRank++;
        } else {
          // 동점자가 아닌 경우 - 다음 순위 할당 (이전 공동 순위 건너뛰기)
          currentRank += peopleWithSameRank;
          rankingsWithTies.push({
            ...currentFinder,
            rank: currentRank
          });
          peopleWithSameRank = 1;
        }
      }
    }
    
    // 최대 3개 순위까지만 반환 (공동 순위 포함)
    const finalRankings = rankingsWithTies.filter(item => item.rank <= 3);
    
    return NextResponse.json(finalRankings);
    
  } catch (error) {
    console.error("이슈 발견자 TOP 3 조회 중 오류:", error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
} 