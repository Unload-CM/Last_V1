import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { DEFAULT_LANGUAGE, Language } from '@/store/languageStore';

// 유효한 날짜 형식인지 확인하는 함수
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  const valid = !isNaN(date.getTime());
  console.log(`[top-issue-resolvers] 날짜 유효성 검사: ${dateString} => ${valid ? '유효' : '유효하지 않음'}`);
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

// 가중치를 적용하여 해결자 점수를 계산하는 함수
async function calculateResolverScore(resolvedCount: number, solverId: number, dateRange: any = {}) {
  try {
    // 해결한 이슈들의 우선순위 정보 가져오기
    const resolvedIssues = await prisma.issue.findMany({
      where: {
        solverId,
        statusId: 3, // RESOLVED 상태
        ...dateRange
      },
      select: {
        priorityId: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // 각 우선순위별 가중치 정의
    const priorityWeights: Record<number, number> = {
      1: 5,  // 긴급 (Highest)
      2: 3,  // 높음 (High)
      3: 2,  // 보통 (Medium)
      4: 1   // 낮음 (Low)
    };

    // 기본 점수는 해결한 이슈 수
    let totalScore = resolvedCount;

    // 각 이슈에 대해 우선순위를 고려하여 가중치 적용
    resolvedIssues.forEach(issue => {
      const priorityId = issue.priorityId;
      
      let issueScore = 1; // 기본 이슈 점수

      // 우선순위 가중치 적용
      if (priorityId && priorityWeights[priorityId]) {
        issueScore *= priorityWeights[priorityId];
      }

      // 해결 소요 시간 가중치 (빠른 해결에 더 높은 점수)
      if (issue.createdAt && issue.updatedAt) {
        const createdAt = new Date(issue.createdAt);
        const updatedAt = new Date(issue.updatedAt);
        const resolutionTimeHours = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        // 24시간 이내 해결은 보너스 점수
        if (resolutionTimeHours <= 24) {
          issueScore *= 1.5;
        } else if (resolutionTimeHours <= 48) {
          issueScore *= 1.2;
        }
      }

      // 기본 점수에 이 이슈의 가중치 점수 추가
      totalScore += issueScore - 1; // 기본 점수는 이미 포함되어 있음
    });

    // 점수를 반올림하여 정수로 변환
    return Math.round(totalScore);
  } catch (error) {
    console.error('[top-issue-resolvers] 점수 계산 중 오류 발생:', error);
    // 오류 발생 시 기본 해결 이슈 수 반환
    return resolvedCount;
  }
}

// 공동 순위를 계산하는 함수
function calculateRanks(resolvers: TopIssueResolver[]): TopIssueResolver[] {
  // 점수 기준으로 내림차순 정렬
  const sortedResolvers = [...resolvers].sort((a, b) => b.score - a.score);
  
  // 공동 순위 계산
  let currentRank = 1;
  let prevScore = -1;
  let skipCount = 0;
  
  return sortedResolvers.map((resolver, index) => {
    // 이전 사용자와 점수가 같으면 동일한 순위 부여
    if (resolver.score === prevScore) {
      skipCount++;
    } else {
      currentRank = index + 1;
      skipCount = 0;
    }
    
    prevScore = resolver.score;
    
    return {
      ...resolver,
      rank: currentRank
    };
  });
}

// 이슈 해결자 인터페이스 정의
interface TopIssueResolver {
  id: number;
  koreanName: string;
  thaiName: string | null;
  nickname: string | null;
  departmentName: string;
  resolvedCount: number;
  score: number;
  rank?: number;
}

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
    console.log(`[top-issue-resolvers] 받은 날짜 파라미터: from=${fromParam}, to=${toParam}, startDate=${startDateParam}, endDate=${endDateParam}`);
    console.log(`[top-issue-resolvers] 언어 설정: ${langParam}`);
    
    // 날짜 범위 설정
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    
    // 새 파라미터 우선 처리
    if (fromParam && isValidDate(fromParam)) {
      fromDate = new Date(fromParam);
      console.log(`[top-issue-resolvers] fromDate 파싱 결과: ${fromDate.toISOString()}`);
    } else if (startDateParam && isValidDate(startDateParam)) {
      fromDate = new Date(startDateParam);
      console.log(`[top-issue-resolvers] startDate 파싱 결과: ${fromDate.toISOString()}`);
    }
    
    if (toParam && isValidDate(toParam)) {
      toDate = new Date(toParam);
      // 이미 ISO 형식의 경우 시간 정보가 포함되어 있으므로 확인 후 설정
      if (!toParam.includes('T')) {
        // 날짜 범위를 해당 일의 끝까지 포함
        toDate.setHours(23, 59, 59, 999);
      }
      console.log(`[top-issue-resolvers] toDate 파싱 결과: ${toDate.toISOString()}`);
    } else if (endDateParam && isValidDate(endDateParam)) {
      toDate = new Date(endDateParam);
      if (!endDateParam.includes('T')) {
        toDate.setHours(23, 59, 59, 999);
      }
      console.log(`[top-issue-resolvers] endDate 파싱 결과: ${toDate.toISOString()}`);
    }
    
    // 날짜 필터 조건 생성
    let dateFilter = {};
    if (fromDate && toDate) {
      // resolvedAt 필드가 없어서 문제가 발생하는 것으로 보임
      // Issue 테이블에는 resolvedAt 필드가 없어서 해당 필터가 적용되지 않음
      /*
      dateFilter = {
        resolvedAt: {
          gte: fromDate,
          lte: toDate
        }
      };
      */
      
      // 대신 Issue 테이블의 updatedAt 필드로 대체
      dateFilter = {
        updatedAt: {
          gte: fromDate,
          lte: toDate
        }
      };
      
      console.log(`[top-issue-resolvers] 날짜 필터 적용(updatedAt 사용): ${fromDate.toISOString()} ~ ${toDate.toISOString()}`);
    }
    
    // 쿼리 실행 전 로그 추가
    console.log(`[top-issue-resolvers] 쿼리 실행: statusId=3, dateFilter=${JSON.stringify(dateFilter)}`);
    
    // 이슈 해결자 TOP 3 조회 (statusId가 3(RESOLVED)이고 solver가 지정된 이슈)
    const topIssueResolvers = await prisma.issue.groupBy({
      by: ['solverId'],
      where: {
        statusId: 3, // RESOLVED 상태 (Status 테이블의 id=3)
        solverId: {
          not: null
        },
        ...dateFilter // 날짜 필터 조건 추가
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 3,
    });
    
    // 결과 로그 추가
    console.log(`[top-issue-resolvers] 쿼리 결과: ${JSON.stringify(topIssueResolvers)}`);
    
    // 선택된 언어에 맞는 부서 필드 가져오기
    const departmentField = getDepartmentFieldByLanguage(langParam);
    console.log(`[top-issue-resolvers] 선택된 부서 필드: ${departmentField}`);
    
    // 사용자 정보 포함하여 결과 매핑
    const mappedResolversPromises = 
      topIssueResolvers.map(async (resolver) => {
        if (!resolver.solverId) return null;
        
        const user = await prisma.employee.findUnique({
          where: { id: resolver.solverId },
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
        
        // 가중치 점수 계산
        const score = await calculateResolverScore(
          resolver._count.id, 
          resolver.solverId, 
          Object.keys(dateFilter).length > 0 ? dateFilter : undefined
        );
        
        return {
          id: user.id,
          koreanName: user.koreanName,
          thaiName: user.thaiName,
          nickname: user.nickname,
          departmentName,
          resolvedCount: resolver._count.id,
          score: score
        } as TopIssueResolver;
      });
    
    // 모든 결과 대기
    let mappedResolvers = await Promise.all(mappedResolversPromises);
    
    // null 값 필터링
    let validResolvers = mappedResolvers.filter(resolver => resolver !== null) as TopIssueResolver[];
    
    // 점수 기준으로 내림차순 정렬
    validResolvers = validResolvers.sort((a, b) => b.score - a.score);
    
    // 공동 순위 계산
    validResolvers = calculateRanks(validResolvers);
    
    console.log("[top-issue-resolvers] 최종 처리된 해결자 결과:", 
      JSON.stringify(validResolvers.map(r => ({ 
        id: r.id, 
        name: r.koreanName, 
        resolvedCount: r.resolvedCount, 
        score: r.score,
        rank: r.rank 
      }))));
    
    return NextResponse.json(validResolvers);
    
  } catch (error) {
    console.error("이슈 해결자 TOP 3 조회 중 오류:", error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
} 