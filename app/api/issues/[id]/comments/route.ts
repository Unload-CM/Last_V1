import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 샘플 댓글 데이터
const SAMPLE_COMMENTS = [
  {
    id: 1,
    content: '이 문제는 빠른 해결이 필요합니다.',
    issueId: '1',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    userId: 1,
    user: {
      name: '김철수'
    }
  },
  {
    id: 2,
    content: '담당자에게 전달했습니다.',
    issueId: '1',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    userId: 2,
    user: {
      name: '이영희'
    }
  }
];

/**
 * 이슈 댓글 목록 조회 API
 * GET /api/issues/[id]/comments
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

    const comments = await prisma.issueComment.findMany({
      where: { issueId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("댓글 목록 조회 중 오류 발생:", error);
    return NextResponse.json(
      { error: "댓글 목록을 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 새 댓글 생성 API
 * POST /api/issues/[id]/comments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const issueId = parseInt(params.id);
    if (isNaN(issueId)) {
      return NextResponse.json(
        { error: "유효하지 않은 이슈 ID입니다." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "댓글 내용은 필수입니다." },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { email: session.user.email },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const comment = await prisma.issueComment.create({
      data: {
        content,
        issueId,
        authorId: employee.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // 이슈 작성자에게 알림 생성
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { assigneeId: true },
    });

    if (issue && issue.assigneeId !== employee.id) {
      await prisma.issueNotification.create({
        data: {
          type: "COMMENT",
          content: `${employee.name}님이 댓글을 작성했습니다: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
          issueId,
          employeeId: issue.assigneeId,
        },
      });
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error("댓글 생성 중 오류 발생:", error);
    return NextResponse.json(
      { error: "댓글을 생성하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 댓글 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const commentId = parseInt(searchParams.get("commentId") || "");

    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: "유효하지 않은 댓글 ID입니다." },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { email: session.user.email },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const comment = await prisma.issueComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (comment.authorId !== employee.id) {
      return NextResponse.json(
        { error: "댓글을 삭제할 권한이 없습니다." },
        { status: 403 }
      );
    }

    await prisma.issueComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ message: "댓글이 삭제되었습니다." });
  } catch (error) {
    console.error("댓글 삭제 중 오류 발생:", error);
    return NextResponse.json(
      { error: "댓글을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 