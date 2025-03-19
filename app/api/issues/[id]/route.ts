import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * 이슈 상세 조회 API
 * GET /api/issues/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 이슈 ID입니다.' },
        { status: 400 }
      );
    }

    const issue = await prisma.issue.findUnique({
      where: { id },
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
        previousAssignee: {
          select: {
            id: true,
            koreanName: true,
            thaiName: true,
            nickname: true,
            department: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            label: true
          }
        },
        transferredFromDept: {
          select: {
            id: true,
            name: true,
            label: true
          }
        },
        status: true,
        priority: true,
        category: true,
        history: {
          include: {
            changedBy: {
              select: {
                id: true,
                koreanName: true,
                thaiName: true,
                nickname: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        notifications: {
          include: {
            employee: {
              select: {
                id: true,
                koreanName: true,
                thaiName: true,
                nickname: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!issue) {
      return NextResponse.json(
        { error: '이슈를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ issue });
  } catch (error) {
    console.error('Error fetching issue:', error);
    return NextResponse.json(
      { error: '이슈 조회에 실패했습니다.' },
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
    const id = params.id;
    const data = await request.json();
    
    // 수정할 이슈 찾기
    let issue;
    
    // ID가 숫자인 경우 (DB ID)
    if (/^\d+$/.test(id)) {
      issue = await (prisma as any).issue.findUnique({
        where: { id: parseInt(id) },
      });
    } 
    // ID가 문자열인 경우 (issueId)
    else {
      issue = await (prisma as any).issue.findUnique({
        where: { issueId: id },
      });
    }
    
    if (!issue) {
      return NextResponse.json(
        { error: '해당 ID의 이슈를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 수정할 데이터 준비
    const updateData: any = {};
    
    // 수정 가능한 필드 목록
    const updatableFields = [
      'title', 'description', 'status', 'priority', 
      'category', 'department', 'assigneeId', 'dueDate'
    ];
    
    // 제공된 필드만 업데이트
    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        if (field === 'dueDate') {
          updateData[field] = data[field] ? new Date(data[field]) : null;
        } else if (field === 'assigneeId') {
          updateData[field] = parseInt(data[field]);
        } else {
          updateData[field] = data[field];
        }
      }
    }
    
    // 상태가 'RESOLVED'로 변경되면 resolvedAt 설정
    if (data.status === 'RESOLVED' && issue.status !== 'RESOLVED') {
      updateData.resolvedAt = new Date();
    } else if (data.status !== 'RESOLVED' && issue.status === 'RESOLVED') {
      updateData.resolvedAt = null;
    }
    
    // 담당자 변경 시 존재 여부 확인
    if (data.assigneeId) {
      const assignee = await (prisma as any).employee.findUnique({
        where: { id: parseInt(data.assigneeId) },
      });
      
      if (!assignee) {
        return NextResponse.json(
          { error: '지정된 담당자를 찾을 수 없습니다.' },
          { status: 400 }
        );
      }
    }
    
    // 이슈 정보 업데이트
    const updatedIssue = await (prisma as any).issue.update({
      where: { id: issue.id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            position: true,
            department: true,
          },
        },
        assignee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            position: true,
            department: true,
          },
        },
      },
    });
    
    return NextResponse.json(updatedIssue);
  } catch (error: any) {
    console.error('이슈 정보 수정 중 오류 발생:', error);
    return NextResponse.json(
      { error: '이슈 정보 수정 중 오류가 발생했습니다.' },
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
    
    // 삭제할 이슈 찾기
    let issue;
    
    // ID가 숫자인 경우 (DB ID)
    if (/^\d+$/.test(id)) {
      issue = await (prisma as any).issue.findUnique({
        where: { id: parseInt(id) },
      });
    } 
    // ID가 문자열인 경우 (issueId)
    else {
      issue = await (prisma as any).issue.findUnique({
        where: { issueId: id },
      });
    }
    
    if (!issue) {
      return NextResponse.json(
        { error: '해당 ID의 이슈를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 이슈 삭제
    await (prisma as any).issue.delete({
      where: { id: issue.id },
    });
    
    return NextResponse.json({ message: '이슈가 성공적으로 삭제되었습니다.' });
  } catch (error: any) {
    console.error('이슈 삭제 중 오류 발생:', error);
    return NextResponse.json(
      { error: '이슈 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 