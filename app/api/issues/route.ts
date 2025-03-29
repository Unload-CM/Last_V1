import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import path from 'path';
import fs from 'fs/promises';

/**
 * 이슈 목록 조회 API
 * GET /api/issues
 * Query Parameters:
 * - departmentId: 부서 ID
 * - assigneeId: 담당자 ID
 * - statusId: 상태 ID
 * - priorityId: 우선순위 ID
 * - search: 검색어 (제목, 설명)
 */
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터 가져오기
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const departmentId = searchParams.get('departmentId');
    const statusId = searchParams.get('statusId');
    const priorityId = searchParams.get('priorityId');
    
    // 언어 파라미터 가져오기
    const langParam = searchParams.get('lang') || 'ko';
    console.log(`[issues/route] 언어 설정: ${langParam}, 타입: ${typeof langParam}`);
    
    // 필드 선택 함수
    const getFieldByLanguage = (language: string): string => {
      switch (language) {
        case 'en': return 'name';
        case 'th': return 'thaiLabel';
        case 'ko':
        default: return 'label';
      }
    };
    
    // 선택된 필드
    const selectedField = getFieldByLanguage(langParam);
    console.log(`[issues/route] 선택된 필드: ${selectedField}`);

    // 검색 조건 구성
    let where: any = {};

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (departmentId && departmentId !== 'all') {
      where.departmentId = parseInt(departmentId);
    }

    if (statusId && statusId !== 'all') {
      where.statusId = parseInt(statusId);
    }

    if (priorityId && priorityId !== 'all') {
      where.priorityId = parseInt(priorityId);
    }

    // 전체 아이템 수 조회
    const totalItems = await prisma.issue.count({ where });

    // 페이지네이션 적용하여 이슈 조회
    const issues = await prisma.issue.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
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
        },
        assignee: {
          select: {
            id: true,
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
        solver: {
          select: {
            id: true,
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
        department: {
          select: {
            id: true,
            name: true,
            label: true,
            thaiLabel: true
          }
        },
        status: true,
        priority: true,
        category: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // 디버깅: 이슈 목록의 부서 정보 확인
    console.log(`[issues/route] 이슈 조회 결과 (${issues.length}개):`);
    issues.forEach(issue => {
      if (issue.department) {
        console.log(`이슈 ${issue.id}의 부서 정보:`, {
          id: issue.department.id,
          name: issue.department.name,
          label: issue.department.label,
          thaiLabel: issue.department.thaiLabel || 'null'
        });
      }
    });

    return NextResponse.json({
      issues,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit)
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { error: '이슈 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 이슈 생성 API (수정버전)
 * POST /api/issues
 */
export async function POST(request: NextRequest) {
  try {
    // 세션에서 현재 사용자 정보 가져오기
    const session = await getServerSession(authOptions);
    console.log('[디버그:POST] 세션 정보:', session?.user?.id);
    
    // 인증 확인
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }
    
    // 사용자 ID 가져오기
    let userId: number | null = null;
    
    if (session.user.id) {
      try {
        // 'admin' 문자열이 아니고 문자열인 경우에만 parseInt 시도
        userId = typeof session.user.id === 'string' && session.user.id !== 'admin' 
          ? parseInt(session.user.id) 
          : null;
        console.log('[디버그:POST] 세션에서 가져온 사용자 ID:', userId);
      } catch (error) {
        console.error('[디버그:POST] 사용자 ID 변환 오류:', error);
        userId = null;
      }
    }
    
    // 세션에서 사용자 ID를 가져오지 못한 경우
    if (userId === null) {
      console.log('[디버그:POST] 세션에서 사용자 ID를 가져오지 못함, 대체 사용자 검색');
      
      // 기존 사용자 중 첫 번째 관리자 사용
      const adminUser = await prisma.employee.findFirst({
        where: { isAdmin: true },
        orderBy: { id: 'asc' }
      });
      
      if (adminUser) {
        userId = adminUser.id;
        console.log('[디버그:POST] 관리자 ID 사용:', userId);
      } else {
        const anyUser = await prisma.employee.findFirst({
          orderBy: { id: 'asc' }
        });
        
        if (anyUser) {
          userId = anyUser.id;
          console.log('[디버그:POST] 첫 번째 사용자 ID 사용:', userId);
        } else {
          console.error('[디버그:POST] 유효한 사용자가 없음');
          return NextResponse.json(
            { error: "시스템에 등록된 사용자가 없습니다." },
            { status: 500 }
          );
        }
      }
    }
    
    console.log('[디버그:POST] 최종 선택된 사용자 ID:', userId);
    
    // JSON 데이터 파싱
    const data = await request.json();
    console.log('[디버그:POST] 요청 데이터:', data);

    const { title, description, assigneeId, solverId, departmentId, statusId, priorityId, categoryId, dueDate } = data;

    if (!title || !departmentId || !statusId || !priorityId || !categoryId) {
      console.log('[디버그:POST] 필수 입력 항목 누락:', {
        title: !!title,
        departmentId: !!departmentId,
        statusId: !!statusId,
        priorityId: !!priorityId,
        categoryId: !!categoryId
      });
      return NextResponse.json(
        { error: "필수 입력 항목이 누락되었습니다." },
        { status: 400 }
      );
    }

    // 이슈 생성
    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        assigneeId: assigneeId ? parseInt(assigneeId.toString()) : null,
        solverId: solverId ? parseInt(solverId.toString()) : null,
        departmentId: parseInt(departmentId.toString()),
        statusId: parseInt(statusId.toString()),
        priorityId: parseInt(priorityId.toString()),
        categoryId: parseInt(categoryId.toString()),
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: userId,
      },
      include: {
        creator: true,
        assignee: true,
        solver: true,
        department: true,
        status: true,
        priority: true,
        category: true,
      },
    });

    console.log('[디버그:POST] 이슈 생성 성공:', issue.id);
    return NextResponse.json({ issue }, { status: 201 });
  } catch (error) {
    console.error('[디버그:POST] 이슈 생성 중 오류:', error);
    return NextResponse.json(
      { error: "이슈를 생성하는데 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 이슈 수정 API
 * PUT /api/issues
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 });
    }

    const data = await request.json();
    const { id, title, description, assigneeId, solverId, departmentId, statusId, priorityId, categoryId, dueDate } = data;

    if (!id || !title || !departmentId || !statusId || !priorityId || !categoryId) {
      return NextResponse.json(
        { error: "필수 입력 항목이 누락되었습니다." },
        { status: 400 }
      );
    }

    // 이슈 존재 확인
    const existingIssue = await prisma.issue.findUnique({
      where: { id: parseInt(id) },
      include: {
        assignee: true,
        solver: true,
        department: true,
      },
    });

    if (!existingIssue) {
      return NextResponse.json({ error: "이슈를 찾을 수 없습니다." }, { status: 404 });
    }

    // 직원 정보 가져오기
    const employee = await prisma.employee.findFirst({
      where: {
        employeeId: session.user.id,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 업데이트 데이터 준비
    const updateData: any = {
      title,
      description,
      departmentId: parseInt(departmentId),
      statusId: parseInt(statusId),
      priorityId: parseInt(priorityId),
      categoryId: parseInt(categoryId),
      dueDate: dueDate ? new Date(dueDate) : null,
    };

    // assigneeId가 있으면 설정
    if (assigneeId) {
      updateData.assigneeId = parseInt(assigneeId);
    } else if (assigneeId === undefined || assigneeId === null) {
      updateData.assigneeId = null;
    }

    // solverId가 있으면 설정
    if (solverId) {
      updateData.solverId = parseInt(solverId);
    } else if (solverId === undefined || solverId === null) {
      updateData.solverId = null;
    }

    // 이슈 업데이트
    const updatedIssue = await prisma.issue.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
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
        },
        assignee: {
          select: {
            id: true,
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
        solver: {
          select: {
            id: true,
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
        department: true,
        status: true,
        priority: true,
        category: true
      }
    });

    return NextResponse.json({ issue: updatedIssue });
  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json(
      { error: '이슈 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 이슈 삭제 API
 * DELETE /api/issues
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('[디버그] 이슈 삭제 요청:', id);
    
    if (!id) {
      return NextResponse.json(
        { error: '이슈 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 이슈 존재 여부 확인
    try {
      const issue = await prisma.issue.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!issue) {
        console.log('[디버그] 삭제할 이슈가 존재하지 않음:', id);
        return NextResponse.json(
          { error: '해당 ID의 이슈를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    } catch (findError) {
      console.error('[디버그] 이슈 조회 중 오류:', findError);
      return NextResponse.json(
        { error: '이슈 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 이슈 삭제 전 관련 데이터 삭제
    try {
      // 알림 삭제
      await prisma.issueNotification.deleteMany({
        where: { issueId: parseInt(id) }
      });
      console.log('[디버그] 이슈 알림 삭제 완료:', id);
      
      // 히스토리 삭제
      await prisma.issueHistory.deleteMany({
        where: { issueId: parseInt(id) }
      });
      console.log('[디버그] 이슈 히스토리 삭제 완료:', id);
      
      // 첨부 파일 삭제
      await prisma.issueAttachment.deleteMany({
        where: { issueId: parseInt(id) }
      });
      console.log('[디버그] 이슈 첨부 파일 삭제 완료:', id);
      
      // 댓글 삭제
      await prisma.issueComment.deleteMany({
        where: { issueId: parseInt(id) }
      });
      console.log('[디버그] 이슈 댓글 삭제 완료:', id);
      
      // 이슈 삭제
      await prisma.issue.delete({
        where: { id: parseInt(id) }
      });
      console.log('[디버그] 이슈 삭제 완료:', id);
      
      return NextResponse.json({ message: '이슈가 삭제되었습니다.' });
    } catch (deleteError) {
      console.error('[디버그] 이슈 삭제 중 오류:', deleteError);
      return NextResponse.json(
        { error: '이슈 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[디버그] 이슈 삭제 처리 중 오류:', error);
    return NextResponse.json(
      { error: '이슈 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
} 