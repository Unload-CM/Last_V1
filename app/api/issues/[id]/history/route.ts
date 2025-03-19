import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 이슈 히스토리 조회
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

    // 히스토리 조회
    const history = await prisma.issueHistory.findMany({
      where: { issueId },
      include: {
        changedBy: {
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
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 타임라인 형식으로 가공
    const timeline = history.map((item) => {
      let content = "";
      let title = "";

      switch (item.changeType) {
        case "STATUS_CHANGE":
          title = "상태 변경";
          content = `${item.previousValue || "없음"} → ${item.newValue}`;
          break;
        case "ASSIGNEE_CHANGE":
          title = "담당자 변경";
          content = `${item.previousValue || "미지정"} → ${item.newValue}`;
          break;
        case "DEPARTMENT_TRANSFER":
          title = "부서 이관";
          content = `${item.previousValue || "없음"} → ${item.newValue}`;
          break;
        case "PRIORITY_CHANGE":
          title = "우선순위 변경";
          content = `${item.previousValue || "없음"} → ${item.newValue}`;
          break;
        case "CATEGORY_CHANGE":
          title = "카테고리 변경";
          content = `${item.previousValue || "없음"} → ${item.newValue}`;
          break;
        case "DUE_DATE_CHANGE":
          title = "마감일 변경";
          content = `${item.previousValue || "없음"} → ${item.newValue}`;
          break;
        default:
          title = "변경 사항";
          content = `${item.previousValue || "없음"} → ${item.newValue}`;
      }

      return {
        id: item.id,
        title,
        content,
        comment: item.comment,
        createdAt: item.createdAt,
        changedBy: item.changedBy,
        changeType: item.changeType,
      };
    });

    return NextResponse.json({ history: timeline });
  } catch (error) {
    console.error("이슈 히스토리 조회 중 오류 발생:", error);
    return NextResponse.json(
      { error: "이슈 히스토리를 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 