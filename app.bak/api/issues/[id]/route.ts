import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import path from 'path';
import fs from 'fs/promises';

/**
 * 이슈 상세 조회 API
 * GET /api/issues/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = parseInt(params.id);
    
    if (isNaN(issueId)) {
      return NextResponse.json(
        { error: "유효하지 않은 이슈 ID입니다." },
        { status: 400 }
      );
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
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
                label: true,
                thaiLabel: true
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
        transferredFromDept: true,
        status: true,
        priority: true,
        category: true,
        attachments: {
          include: {
            uploader: {
              select: {
                id: true,
                koreanName: true,
                thaiName: true,
                nickname: true
              }
            }
          }
        }
      }
    });

    if (!issue) {
      return NextResponse.json(
        { error: "이슈를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 마감일 형식 변환
    const formattedIssue = {
      ...issue,
      dueDate: issue.dueDate ? new Date(issue.dueDate).toISOString().split('T')[0] : null
    };

    console.log('[디버그:GET] 마감일:', {
      original: issue.dueDate,
      formatted: formattedIssue.dueDate
    });

    return NextResponse.json(formattedIssue);
  } catch (error) {
    console.error("이슈 조회 중 오류 발생:", error);
    return NextResponse.json(
      { error: "이슈를 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 이슈 수정 API
 * PUT /api/issues/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = parseInt(params.id);
    
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
    }

    const { title, description, assigneeId, solverId, departmentId, statusId, priorityId, categoryId, dueDate } = data;

    if (!title || !departmentId || !statusId || !priorityId || !categoryId) {
      return NextResponse.json(
        { error: "필수 입력 항목이 누락되었습니다." },
        { status: 400 }
      );
    }

    const existingIssue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        assignee: true,
        solver: true,
        department: true,
        status: true,
        priority: true,
        category: true
      }
    });

    if (!existingIssue) {
      return NextResponse.json({ error: "이슈를 찾을 수 없습니다." }, { status: 404 });
    }

    const [newDepartment, newStatus, newPriority, newCategory] = await Promise.all([
      prisma.department.findUnique({ where: { id: parseInt(departmentId.toString()) } }),
      prisma.status.findUnique({ where: { id: parseInt(statusId.toString()) } }),
      prisma.priority.findUnique({ where: { id: parseInt(priorityId.toString()) } }),
      prisma.category.findUnique({ where: { id: parseInt(categoryId.toString()) } })
    ]);

    const changes: string[] = [];
    if (existingIssue.title !== title) changes.push(`제목이 "${existingIssue.title}"에서 "${title}"로 변경됨`);
    if (existingIssue.description !== description) changes.push('설명이 변경됨');
    if (existingIssue.departmentId !== parseInt(departmentId.toString())) {
      changes.push(`부서가 "${existingIssue.department.label}"에서 "${newDepartment?.label}"로 변경됨`);
    }
    if (existingIssue.statusId !== parseInt(statusId.toString())) {
      changes.push(`상태가 "${existingIssue.status.label}"에서 "${newStatus?.label}"로 변경됨`);
    }
    if (existingIssue.priorityId !== parseInt(priorityId.toString())) {
      changes.push(`우선순위가 "${existingIssue.priority.label}"에서 "${newPriority?.label}"로 변경됨`);
    }
    if (existingIssue.categoryId !== parseInt(categoryId.toString())) {
      changes.push(`카테고리가 "${existingIssue.category.label}"에서 "${newCategory?.label}"로 변경됨`);
    }
    
    const oldAssigneeName = existingIssue.assignee?.koreanName;
    const newAssigneeId = assigneeId ? parseInt(assigneeId.toString()) : null;
    if (existingIssue.assigneeId !== newAssigneeId) {
      if (!oldAssigneeName && newAssigneeId) changes.push('이슈 발견자가 지정됨');
      else if (oldAssigneeName && !newAssigneeId) changes.push('이슈 발견자가 제거됨');
      else changes.push(`이슈 발견자가 변경됨`);
    }

    const oldSolverName = existingIssue.solver?.koreanName;
    const newSolverId = solverId ? parseInt(solverId.toString()) : null;
    if (existingIssue.solverId !== newSolverId) {
      if (!oldSolverName && newSolverId) changes.push('이슈 해결자가 지정됨');
      else if (oldSolverName && !newSolverId) changes.push('이슈 해결자가 제거됨');
      else changes.push(`이슈 해결자가 변경됨`);
    }

    const session = await getServerSession(authOptions);
    console.log('[이슈 수정] 세션 정보:', session?.user?.id);
    
    let userId: number | null = null;
    const isSystemAdmin = session?.user?.isSystemAdmin === true;
    
    if (isSystemAdmin) {
      const adminUser = await prisma.employee.findFirst({
        where: { isAdmin: true },
        orderBy: { id: 'asc' }
      });
      
      if (adminUser) {
        userId = adminUser.id;
      } else {
        return NextResponse.json(
          { error: "관리자 권한이 있는 사용자가 필요합니다." },
          { status: 400 }
        );
      }
    } else if (session?.user?.id) {
      try {
        // 세션 ID가 문자열인 경우 숫자로 변환
        const numericId = typeof session.user.id === 'string' ? 
          parseInt(session.user.id) : 
          session.user.id;
        
        // 변환된 ID로 사용자 확인
        const userCheck = await prisma.employee.findUnique({
          where: { id: numericId }
        });
        
        if (userCheck) {
          userId = userCheck.id;
          console.log('[이슈 수정] 세션 사용자 확인:', {
            sessionId: session.user.id,
            foundUserId: userId,
            name: userCheck.koreanName
          });
        } else {
          console.log('[이슈 수정] 세션 ID로 사용자를 찾을 수 없음:', numericId);
          userId = null;
        }
      } catch (error) {
        console.error('[이슈 수정] 사용자 ID 변환 오류:', error);
        userId = null;
      }
    }
    
    if (userId === null) {
      const adminUser = await prisma.employee.findFirst({
        where: { isAdmin: true },
        orderBy: { id: 'asc' }
      });
      
      if (adminUser) {
        userId = adminUser.id;
      } else {
        const anyUser = await prisma.employee.findFirst({
          orderBy: { id: 'asc' }
        });
        
        if (anyUser) {
          userId = anyUser.id;
        } else {
          return NextResponse.json(
            { error: "시스템에 등록된 사용자가 없습니다." },
            { status: 500 }
          );
        }
      }
    }

    if (!userId) {
      console.error('[이슈 수정] 로그인한 사용자를 찾을 수 없음:', session?.user?.id);
      return NextResponse.json(
        { error: "유효한 사용자를 찾을 수 없습니다." },
        { status: 400 }
      );
    }

    const user = await prisma.employee.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: "유효한 사용자를 찾을 수 없습니다." },
        { status: 400 }
      );
    }

    console.log('[이슈 수정] 사용자 확인:', {
      id: user.id,
      name: user.koreanName
    });

    const updateData = {
      title,
      description,
      departmentId: parseInt(departmentId.toString()),
      statusId: parseInt(statusId.toString()),
      priorityId: parseInt(priorityId.toString()),
      categoryId: parseInt(categoryId.toString()),
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: assigneeId ? parseInt(assigneeId.toString()) : null,
      solverId: solverId ? parseInt(solverId.toString()) : null,
    };

    try {
      const updatedIssue = await prisma.issue.update({
        where: { id: issueId },
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
              department: true
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
                  label: true
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

      if (changes.length > 0) {
        console.log('[이슈 수정] 변경사항:', changes.join('\n'));
        
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host') || '192.168.1.33:3333';
        const historyApiUrl = `${protocol}://${host}/api/issues/${issueId}/history`;
        
        console.log('[이슈 수정] 히스토리 API URL:', historyApiUrl);
        
        const historyData = {
          changeType: 'EDIT',
          summary: changes.join('\n'),
          previousData: {
            title: existingIssue.title,
            description: existingIssue.description,
            departmentId: existingIssue.departmentId,
            statusId: existingIssue.statusId,
            priorityId: existingIssue.priorityId,
            categoryId: existingIssue.categoryId,
            assigneeId: existingIssue.assigneeId,
            solverId: existingIssue.solverId,
            dueDate: existingIssue.dueDate
          },
          newData: {
            title: updateData.title,
            description: updateData.description,
            departmentId: updateData.departmentId,
            statusId: updateData.statusId,
            priorityId: updateData.priorityId,
            categoryId: updateData.categoryId,
            assigneeId: updateData.assigneeId,
            solverId: updateData.solverId,
            dueDate: updateData.dueDate
          }
        };
        
        const historyResponse = await fetch(historyApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify(historyData)
        });
        
        if (!historyResponse.ok) {
          console.error('[이슈 수정] 히스토리 생성 실패:', await historyResponse.json());
        } else {
          console.log('[이슈 수정] 히스토리 생성 완료');
        }
      }

      return NextResponse.json({ issue: updatedIssue });
    } catch (error) {
      console.error('[이슈 수정] 오류 발생:', error);
      return NextResponse.json(
        { error: '이슈 수정에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[이슈 수정] 오류 발생:', error);
    return NextResponse.json(
      { error: '이슈 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 이슈 삭제 API
 * DELETE /api/issues/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 삭제할 이슈 찾기
    let issue;
    
    // ID가 숫자인 경우 (DB ID)
    if (/^\d+$/.test(id)) {
      issue = await prisma.issue.findUnique({
        where: { id: parseInt(id) },
        include: {
          creator: true
        }
      });
    } 
    // ID가 문자열인 경우 (issueId)
    else {
      issue = await prisma.issue.findUnique({
        where: { issueId: id } as any,
        include: {
          creator: true
        }
      });
    }
    
    if (!issue) {
      return NextResponse.json(
        { error: '해당 ID의 이슈를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 현재 사용자가 이슈 작성자인지 확인
    if (issue.creator.employeeId !== session.user.email) {
      return NextResponse.json(
        { error: '본인이 작성한 이슈만 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }
    
    // 이슈에 댓글이나 이력이 있는지 확인
    const issueId = issue.id;
    
    const commentsCount = await prisma.issueComment.count({
      where: { issueId }
    });
    
    const historyCount = await prisma.issueHistory.count({
      where: { issueId }
    });
    
    // 댓글이나 이력이 있는 경우 삭제 불가
    if (commentsCount > 0 || historyCount > 0) {
      return NextResponse.json(
        { 
          error: '댓글이나 이력이 있는 이슈는 삭제할 수 없습니다.',
          commentsCount,
          historyCount
        },
        { status: 400 }
      );
    }
    
    // 이슈 삭제 전 관련 데이터 삭제
    try {
      // 알림 삭제
      await prisma.issueNotification.deleteMany({
        where: { issueId }
      });
      console.log('[디버그] 이슈 알림 삭제 완료:', issueId);
      
      // 첨부 파일 삭제
      await prisma.issueAttachment.deleteMany({
        where: { issueId }
      });
      console.log('[디버그] 이슈 첨부 파일 삭제 완료:', issueId);
      
      // 이슈 삭제
      await prisma.issue.delete({
        where: { id: issueId },
      });
      console.log('[디버그] 이슈 삭제 완료:', issueId);
      
      return NextResponse.json({ message: '이슈가 성공적으로 삭제되었습니다.' });
    } catch (deleteError) {
      console.error('[디버그] 이슈 삭제 중 오류:', deleteError);
      return NextResponse.json(
        { error: '이슈 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('이슈 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { error: '이슈 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 