import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

// 첨부 파일 목록 조회
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

    const attachments = await prisma.issueAttachment.findMany({
      where: { issueId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("첨부 파일 목록 조회 중 오류 발생:", error);
    return NextResponse.json(
      { error: "첨부 파일 목록을 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 첨부 파일 생성
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

    // 이슈 존재 여부 확인
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      return NextResponse.json(
        { error: "이슈를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    // 파일명 중복 방지를 위한 타임스탬프 추가
    const timestamp = new Date().getTime();
    const originalName = file.name;
    const fileExt = path.extname(originalName);
    const fileName = `${path.basename(originalName, fileExt)}_${timestamp}${fileExt}`;
    
    // 파일 저장 경로 (public/uploads/)
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    const filePath = path.join(uploadsDir, fileName);
    
    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    // 데이터베이스에 파일 정보 저장
    const fileUrl = `/uploads/${fileName}`;
    const attachment = await prisma.issueAttachment.create({
      data: {
        fileName: originalName,
        fileUrl,
        fileType: file.type,
        fileSize: file.size,
        issueId,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("첨부 파일 생성 중 오류 발생:", error);
    return NextResponse.json(
      { error: "첨부 파일을 생성하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 첨부 파일 삭제
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
    const attachmentId = parseInt(searchParams.get("attachmentId") || "");

    if (isNaN(attachmentId)) {
      return NextResponse.json(
        { error: "유효하지 않은 첨부 파일 ID입니다." },
        { status: 400 }
      );
    }

    const attachment = await prisma.issueAttachment.findUnique({
      where: { id: attachmentId },
      include: { issue: true },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "첨부 파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 실제 구현에서는 스토리지에서 파일도 삭제해야 합니다.
    // 여기서는 데이터베이스 레코드만 삭제합니다.

    await prisma.issueAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ message: "첨부 파일이 삭제되었습니다." });
  } catch (error) {
    console.error("첨부 파일 삭제 중 오류 발생:", error);
    return NextResponse.json(
      { error: "첨부 파일을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 