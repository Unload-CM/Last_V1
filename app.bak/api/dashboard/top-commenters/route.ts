import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from '@prisma/client';
import { DEFAULT_LANGUAGE, Language } from '@/store/languageStore';

// 데이터 캐싱을 위한 변수
let cachedCommenters: any[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30분 캐시

// 유효한 날짜 형식인지 확인하는 함수
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  const valid = !isNaN(date.getTime());
  console.log(`[top-commenters] 날짜 유효성 검사: ${dateString} => ${valid ? '유효' : '유효하지 않음'}`);
  return valid;
}

// 캐시된 데이터가 유효한지 확인하는 함수
function isCacheValid(): boolean {
  const now = Date.now();
  return cachedCommenters !== null && now - lastCacheTime < CACHE_DURATION;
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

// 가중치를 적용하여 점수를 계산하는 함수
async function calculateCommenterScore(commentCount: number, authorId: number, dateRange: any = {}) {
  try {
    // 작성자가 댓글을 달은 이슈들의 우선순위 정보 가져오기
    const commentIssues = await prisma.issueComment.findMany({
      where: {
        authorId,
        ...dateRange
      },
      select: {
        issue: {
          select: {
            priorityId: true,
            statusId: true
          }
        }
      }
    });

    // 각 우선순위별 가중치 정의
    const priorityWeights: Record<number, number> = {
      1: 3,  // 긴급 (Highest)
      2: 2,  // 높음 (High)
      3: 1,  // 보통 (Medium)
      4: 0.5 // 낮음 (Low)
    };

    // 상태별 가중치 정의 (해결된 이슈에 좀 더 가중치)
    const statusWeights: Record<number, number> = {
      3: 1.5,  // 완료 (Done)
      4: 1.2,  // 확인 (Verified)
      5: 1.1   // 종료 (Closed)
    };

    // 기본 점수는 댓글 수
    let totalScore = commentCount;

    // 각 댓글에 대해 이슈의 우선순위와 상태를 고려하여 가중치 적용
    commentIssues.forEach(comment => {
      const priorityId = comment.issue?.priorityId;
      const statusId = comment.issue?.statusId;
      
      let commentScore = 1; // 기본 댓글 점수

      // 우선순위 가중치 적용
      if (priorityId && priorityWeights[priorityId]) {
        commentScore *= priorityWeights[priorityId];
      }

      // 상태 가중치 적용 (해결된 이슈에 더 가중치)
      if (statusId && statusWeights[statusId]) {
        commentScore *= statusWeights[statusId];
      }

      // 기본 점수에 이 댓글의 가중치 점수 추가
      totalScore += commentScore - 1; // 기본 점수는 이미 포함되어 있음
    });

    // 점수를 반올림하여 정수로 변환
    return Math.round(totalScore);
  } catch (error) {
    console.error('[top-commenters] 점수 계산 중 오류 발생:', error);
    // 오류 발생 시 기본 댓글 수 반환
    return commentCount;
  }
}

// 공동 순위를 계산하는 함수
function calculateRanks(commenters: any[]): any[] {
  // 점수 기준으로 내림차순 정렬
  const sortedCommenters = [...commenters].sort((a, b) => b.score - a.score);
  
  // 공동 순위 계산
  let currentRank = 1;
  let prevScore = -1;
  let skipCount = 0;
  
  return sortedCommenters.map((commenter, index) => {
    // 이전 사용자와 점수가 같으면 동일한 순위 부여
    if (commenter.score === prevScore) {
      skipCount++;
    } else {
      currentRank = index + 1;
      skipCount = 0;
    }
    
    prevScore = commenter.score;
    
    return {
      ...commenter,
      rank: currentRank
    };
  });
}

// 댓글 작성자 인터페이스 정의 추가
interface TopCommenter {
  id: number;
  koreanName: string;
  thaiName: string | null;
  nickname: string | null;
  departmentName: string;
  commentCount: number;
  score: number;
  rank?: number;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);  
  const forceRefresh = url.searchParams.get('refresh') === 'true';
  // 날짜 파라미터 가져오기
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');
  
  // 언어 파라미터 가져오기
  const langParam = url.searchParams.get('lang') as Language || DEFAULT_LANGUAGE;
  console.log(`[top-commenters] 언어 설정: ${langParam}`);
  
  try {      
    const session = await getServerSession(authOptions);    
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }  
      ); 
    }  
    
    // 날짜 필터가 있는 경우 캐시 무시
    if (!forceRefresh && !startDate && !endDate && isCacheValid()) {
      return NextResponse.json(cachedCommenters, {
        headers: {  
          'Cache-Control': 'public, max-age=1800', // 30분 캐싱
        }  
      });  
    }
    
    // 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    // 구 파라미터 이름도 지원 (이전 버전 호환성)
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    // 날짜 처리 디버깅 로그 추가
    console.log(`[top-commenters] 받은 날짜 파라미터: from=${fromParam}, to=${toParam}, startDate=${startDateParam}, endDate=${endDateParam}`);
    
    // 날짜 범위 설정
    let fromDate: Date | undefined;
    let toDate: Date | undefined;
    
    // 새 파라미터 우선 처리
    if (fromParam && isValidDate(fromParam)) {
      fromDate = new Date(fromParam);
      console.log(`[top-commenters] fromDate 파싱 결과: ${fromDate.toISOString()}`);
    } else if (startDateParam && isValidDate(startDateParam)) {
      fromDate = new Date(startDateParam);
      console.log(`[top-commenters] startDate 파싱 결과: ${fromDate.toISOString()}`);
    }
    
    if (toParam && isValidDate(toParam)) {
      toDate = new Date(toParam);
      // 이미 ISO 형식의 경우 시간 정보가 포함되어 있으므로 확인 후 설정
      if (!toParam.includes('T')) {
        // 날짜 범위를 해당 일의 끝까지 포함
        toDate.setHours(23, 59, 59, 999);
      }
      console.log(`[top-commenters] toDate 파싱 결과: ${toDate.toISOString()}`);
    } else if (endDateParam && isValidDate(endDateParam)) {
      toDate = new Date(endDateParam);
      if (!endDateParam.includes('T')) {
        toDate.setHours(23, 59, 59, 999);
      }
      console.log(`[top-commenters] endDate 파싱 결과: ${toDate.toISOString()}`);
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
      console.log(`[top-commenters] 날짜 필터 적용: ${fromDate.toISOString()} ~ ${toDate.toISOString()}`);
    }
    
    // 직접 SQL 쿼리를 사용하여 데이터 가져오기
    let result;
    
    // 날짜 필터 적용 여부 확인 및 로깅
    const hasDateFilter = Object.keys(dateFilter).length > 0;
    console.log(`[top-commenters] 날짜 필터 적용 여부: ${hasDateFilter}`);
    
    // Prisma API를 사용하여 그룹화하는 방식으로 변경
    const commentCountByAuthor = await prisma.issueComment.groupBy({
      by: ['authorId'],
      where: hasDateFilter ? dateFilter : undefined,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 3
    });
    
    // 형식 변환
    result = commentCountByAuthor.map(item => ({
      authorId: item.authorId,
      commentCount: item._count.id
    }));
    
    console.log("[top-commenters] 댓글 작성자 집계 결과:", JSON.stringify(result));
    
    // 쿼리 결과가 비어 있는지 확인
    if (result.length === 0) {
      console.log("[top-commenters] 지정된 날짜 범위에 댓글 데이터가 없습니다.");
    }
    
    // 각 작성자의 상세 정보 가져오기
    const authorIds = (result as any[]).map(c => c.authorId);
    
    // 선택된 언어에 맞는 부서 필드 가져오기
    const departmentField = getDepartmentFieldByLanguage(langParam);
    console.log(`[top-commenters] 선택된 부서 필드: ${departmentField}`);
    
    // 사용자 정보 한 번에 가져오기
    const authors = await prisma.employee.findMany({
      where: {
        id: {
          in: authorIds
        }
      },
      include: {
        department: {
          select: {
            name: true,
            label: true,
            thaiLabel: true,
          },
        },
      },
    });
    
    // 각 작성자의 가중치 점수 계산
    const commenterDetailsPromises = (result as any[]).map(async commenter => {
      const author = authors.find(a => a.id === commenter.authorId);
      
      // 선택된 언어에 맞는 부서명 필드 사용
      const departmentName = author?.department 
        ? author.department[departmentField as keyof typeof author.department] as string || author.department.label || ''
        : '';
      
      // 가중치를 적용한 점수 계산
      const score = await calculateCommenterScore(
        Number(commenter.commentCount), 
        commenter.authorId, 
        hasDateFilter ? dateFilter : undefined
      );
      
      return {
        id: author?.id || 0,
        koreanName: author?.koreanName || '',
        thaiName: author?.thaiName || null,
        nickname: author?.nickname || null,
        departmentName,
        commentCount: Number(commenter.commentCount),
        score: score
      } as TopCommenter;
    });
    
    // 모든 점수 계산 완료 대기
    let commenterDetails = await Promise.all(commenterDetailsPromises);
    
    // 점수를 기준으로 내림차순 정렬
    commenterDetails = commenterDetails.sort((a, b) => b.score - a.score);
    
    // 동일 점수일 경우 공동 순위 계산
    commenterDetails = calculateRanks(commenterDetails) as TopCommenter[];
    
    console.log("[top-commenters] 최종 처리된 댓글 작성자 결과:", 
      JSON.stringify(commenterDetails.map(c => ({ 
        id: c.id, 
        name: c.koreanName, 
        commentCount: c.commentCount, 
        score: c.score,
        rank: c.rank 
      }))));
    
    // 날짜 필터가 없는 경우에만 결과 캐싱
    if (!startDate && !endDate) {
      cachedCommenters = commenterDetails;
      lastCacheTime = Date.now();
    }
    
    return NextResponse.json(commenterDetails, {
      headers: {
        'Cache-Control': 'public, max-age=1800',
      }
    });
  } catch (error) {
    console.error("댓글 작성자 TOP 3 조회 중 오류 발생:", error);
    
    // 오류 발생 시 캐시된 데이터가 있으면 그대로 반환
    if (cachedCommenters) {
      return NextResponse.json(cachedCommenters, {
        headers: {
          'Cache-Control': 'public, max-age=1800',
        }
      });
    }
    
    // 오류 반환
    return NextResponse.json(
      { error: "댓글 작성자 데이터를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
} 