import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';

// 샘플 댓글 데이터
const SAMPLE_COMMENTS = [
  {
    id: 1,
    content: '이 문제는 빠른 해결이 필요합니다.',
    issueId: '1',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    authorId: 1,
    author: {
      koreanName: '김철수'
    }
  },
  {
    id: 2,
    content: '담당자에게 전달했습니다.',
    issueId: '1',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    authorId: 2,
    author: {
      koreanName: '이영희'
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

    // 언어 파라미터 처리
    const { searchParams } = new URL(request.url);
    const langParam = searchParams.get('lang') || 'ko';
    console.log(`[comments/GET] 언어 설정: ${langParam}`);

    const comments = await prisma.issueComment.findMany({
      where: { issueId },
      include: {
        author: {
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
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
            createdAt: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // 디버깅: 댓글 목록의 부서 정보 확인
    console.log(`[comments/GET] 댓글 조회 결과 (${comments.length}개):`);
    comments.forEach(comment => {
      if (comment.author && comment.author.department) {
        console.log(`댓글 ${comment.id}의 작성자(${comment.author.koreanName}) 부서 정보:`, {
          id: comment.author.department.id,
          name: comment.author.department.name,
          label: comment.author.department.label,
          thaiLabel: comment.author.department.thaiLabel || 'null'
        });
      }
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

// 파일 저장 함수
async function saveFile(file: File, directory: string): Promise<{ fileName: string; filePath: string; fileSize: number; fileType: string }> {
  // 파일 저장 디렉토리가 없으면 생성
  if (!existsSync(directory)) {
    await mkdir(directory, { recursive: true });
  }
  
  // 고유한 파일 이름 생성 (원본 파일명 유지하면서 UUID 추가)
  const fileName = file.name;
  const uniqueId = uuidv4();
  const fileExtension = fileName.split('.').pop() || '';
  const uniqueFileName = `${uniqueId}.${fileExtension}`;
  
  // 파일 저장 경로
  const filePath = join(directory, uniqueFileName);
  
  // 파일 내용을 Buffer로 변환
  const fileBuffer = await file.arrayBuffer();
  
  // 파일 저장
  await writeFile(filePath, Buffer.from(fileBuffer));
  
  return {
    fileName,
    filePath: `/uploads/comments/${uniqueFileName}`,
    fileSize: file.size,
    fileType: file.type,
  };
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

    // 멀티파트 폼 데이터 처리
    const formData = await request.formData();
    const content = formData.get('content') as string || '';
    const files = formData.getAll('files') as File[];

    if (!content?.trim() && files.length === 0) {
      return NextResponse.json(
        { error: "댓글 내용이나 첨부 파일이 필요합니다." },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { employeeId: session.user.email },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 댓글 생성
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
            koreanName: true,
            thaiName: true,
            nickname: true,
            department: {
              select: {
                id: true,
                name: true,
                label: true,
                thaiLabel: true
              },
            },
          },
        },
      },
    });

    // 파일 업로드 처리
    const uploadDirectory = join(process.cwd(), 'public', 'uploads', 'comments');
    const attachments: any[] = [];

    for (const file of files) {
      try {
        const { fileName, filePath, fileSize, fileType } = await saveFile(file, uploadDirectory);
        
        // 첨부 파일 DB 등록
        const attachment = await prisma.issueCommentAttachment.create({
          data: {
            fileName,
            fileUrl: filePath,
            fileType,
            fileSize,
            commentId: comment.id,
          }
        });
        
        attachments.push(attachment);
      } catch (error) {
        console.error("파일 업로드 중 오류:", error);
      }
    }

    // 이슈 작성자에게 알림 생성
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { assigneeId: true },
    });

    if (issue && issue.assigneeId && issue.assigneeId !== employee.id) {
      await prisma.issueNotification.create({
        data: {
          type: "COMMENT",
          message: `${employee.koreanName}님이 댓글을 작성했습니다: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
          issueId,
          employeeId: issue.assigneeId,
        },
      });
    }

    // 완성된 댓글 및 첨부 파일 정보 반환
    const commentWithAttachments = {
      ...comment,
      attachments
    };

    return NextResponse.json(commentWithAttachments);
  } catch (error) {
    console.error("댓글 생성 중 오류 발생:", error);
    return NextResponse.json(
      { error: "댓글을 생성하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 댓글 삭제 API
 * DELETE /api/issues/[id]/comments
 */
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
      where: { employeeId: session.user.email },
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

    // 작성자가 아니라면 관리자 권한 확인
    if (comment.authorId !== employee.id) {
      return NextResponse.json(
        { error: "본인이 작성한 댓글만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 첨부 파일도 같이 삭제 (CASCADE 설정으로 자동 삭제)
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