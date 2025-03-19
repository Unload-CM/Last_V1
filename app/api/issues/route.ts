import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');
    const assigneeId = searchParams.get('assigneeId');
    const statusId = searchParams.get('statusId');
    const priorityId = searchParams.get('priorityId');
    const search = searchParams.get('search');

    const where: Prisma.IssueWhereInput = {};

    if (departmentId) where.departmentId = parseInt(departmentId);
    if (assigneeId) where.assigneeId = parseInt(assigneeId);
    if (statusId) where.statusId = parseInt(statusId);
    if (priorityId) where.priorityId = parseInt(priorityId);
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
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
                label: true
              }
            }
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            label: true
          }
        },
        status: true,
        priority: true,
        category: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({ issues });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { error: '이슈 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 이슈 생성 API
 * POST /api/issues
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      title,
      description,
      assigneeId,
      departmentId,
      statusId,
      priorityId,
      categoryId,
      dueDate
    } = data;

    // 필수 필드 검증
    if (!title || !departmentId || !statusId || !priorityId || !categoryId) {
      return NextResponse.json(
        { error: '필수 항목이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 이슈 생성
    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        departmentId: parseInt(departmentId),
        statusId: parseInt(statusId),
        priorityId: parseInt(priorityId),
        categoryId: parseInt(categoryId),
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        assignee: {
          select: {
            id: true,
            koreanName: true,
            thaiName: true,
            nickname: true,
            department: true
          }
        },
        department: true,
        status: true,
        priority: true,
        category: true
      }
    });

    // 담당자가 지정된 경우 알림 생성
    if (assigneeId) {
      await prisma.issueNotification.create({
        data: {
          issueId: issue.id,
          employeeId: parseInt(assigneeId),
          type: 'ASSIGNED',
          message: `새로운 이슈가 할당되었습니다: ${title}`
        }
      });
    }

    return NextResponse.json({ issue });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json(
      { error: '이슈 생성에 실패했습니다.' },
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
    const data = await request.json();
    const {
      id,
      title,
      description,
      assigneeId,
      departmentId,
      statusId,
      priorityId,
      categoryId,
      dueDate
    } = data;

    // 필수 필드 검증
    if (!id || !title || !departmentId || !statusId || !priorityId || !categoryId) {
      return NextResponse.json(
        { error: '필수 항목이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 기존 이슈 조회
    const existingIssue = await prisma.issue.findUnique({
      where: { id: parseInt(id) },
      include: {
        assignee: true,
        department: true
      }
    });

    if (!existingIssue) {
      return NextResponse.json(
        { error: '이슈를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 담당자 변경 이력 기록
    if (assigneeId && existingIssue.assigneeId !== parseInt(assigneeId)) {
      await prisma.issueHistory.create({
        data: {
          issueId: parseInt(id),
          changedById: existingIssue.assigneeId || parseInt(assigneeId),
          changeType: 'ASSIGNEE_CHANGE',
          previousValue: existingIssue.assignee?.koreanName || null,
          newValue: assigneeId.toString()
        }
      });

      // 새 담당자에게 알림
      await prisma.issueNotification.create({
        data: {
          issueId: parseInt(id),
          employeeId: parseInt(assigneeId),
          type: 'ASSIGNED',
          message: `이슈가 할당되었습니다: ${title}`
        }
      });
    }

    // 부서 이관 이력 기록
    if (departmentId && existingIssue.departmentId !== parseInt(departmentId)) {
      await prisma.issueHistory.create({
        data: {
          issueId: parseInt(id),
          changedById: existingIssue.assigneeId || parseInt(assigneeId),
          changeType: 'DEPARTMENT_TRANSFER',
          previousValue: existingIssue.department.name,
          newValue: departmentId.toString()
        }
      });
    }

    // 이슈 업데이트
    const updatedIssue = await prisma.issue.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        previousAssigneeId: existingIssue.assigneeId,
        departmentId: parseInt(departmentId),
        transferredFromDeptId: existingIssue.departmentId,
        statusId: parseInt(statusId),
        priorityId: parseInt(priorityId),
        categoryId: parseInt(categoryId),
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        assignee: {
          select: {
            id: true,
            koreanName: true,
            thaiName: true,
            nickname: true,
            department: true
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
    
    if (!id) {
      return NextResponse.json(
        { error: '이슈 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 이슈 삭제 전 관련 데이터 삭제
    await prisma.$transaction([
      prisma.issueNotification.deleteMany({
        where: { issueId: parseInt(id) }
      }),
      prisma.issueHistory.deleteMany({
        where: { issueId: parseInt(id) }
      }),
      prisma.issue.delete({
        where: { id: parseInt(id) }
      })
    ]);

    return NextResponse.json({ message: '이슈가 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting issue:', error);
    return NextResponse.json(
      { error: '이슈 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
} 