import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 알림 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 이메일로 직원 정보 조회
    const employee = await prisma.employee.findFirst({
      where: { 
        employeeId: session.user.email 
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 쿼리 파라미터 처리
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    // 알림 조회 조건
    const where = {
      employeeId: employee.id,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    // 알림 목록 조회
    const notifications = await prisma.issueNotification.findMany({
      where,
      include: {
        issue: {
          select: {
            id: true,
            title: true,
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
      skip: offset,
      take: limit,
    });

    // 전체 알림 개수 조회
    const totalCount = await prisma.issueNotification.count({ where });

    // 읽지 않은 알림 개수 조회
    const unreadCount = await prisma.issueNotification.count({
      where: {
        employeeId: employee.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      notifications,
      totalCount,
      unreadCount,
    });
  } catch (error) {
    console.error("알림 목록 조회 중 오류 발생:", error);
    return NextResponse.json(
      { error: "알림 목록을 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 알림 읽음 처리
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const employee = await prisma.employee.findFirst({
      where: { 
        employeeId: session.user.email 
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { id, readAll } = body;

    if (readAll) {
      // 모든 알림 읽음 처리
      await prisma.issueNotification.updateMany({
        where: {
          employeeId: employee.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({
        message: "모든 알림을 읽음 처리했습니다.",
      });
    } else if (id) {
      // 특정 알림 읽음 처리
      const notification = await prisma.issueNotification.findUnique({
        where: { id },
      });

      if (!notification) {
        return NextResponse.json(
          { error: "알림을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      if (notification.employeeId !== employee.id) {
        return NextResponse.json(
          { error: "해당 알림에 대한 권한이 없습니다." },
          { status: 403 }
        );
      }

      await prisma.issueNotification.update({
        where: { id },
        data: { isRead: true },
      });

      return NextResponse.json({
        message: "알림을 읽음 처리했습니다.",
      });
    } else {
      return NextResponse.json(
        { error: "알림 ID 또는 readAll 플래그가 필요합니다." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("알림 읽음 처리 중 오류 발생:", error);
    return NextResponse.json(
      { error: "알림을 읽음 처리하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 알림 삭제
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const employee = await prisma.employee.findFirst({
      where: { 
        employeeId: session.user.email 
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "");
    const deleteAll = searchParams.get("deleteAll") === "true";

    if (deleteAll) {
      // 모든 알림 삭제
      await prisma.issueNotification.deleteMany({
        where: {
          employeeId: employee.id,
        },
      });

      return NextResponse.json({
        message: "모든 알림이 삭제되었습니다.",
      });
    } else if (!isNaN(id)) {
      // 특정 알림 삭제
      const notification = await prisma.issueNotification.findUnique({
        where: { id },
      });

      if (!notification) {
        return NextResponse.json(
          { error: "알림을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      if (notification.employeeId !== employee.id) {
        return NextResponse.json(
          { error: "해당 알림에 대한 권한이 없습니다." },
          { status: 403 }
        );
      }

      await prisma.issueNotification.delete({
        where: { id },
      });

      return NextResponse.json({
        message: "알림이 삭제되었습니다.",
      });
    } else {
      return NextResponse.json(
        { error: "알림 ID 또는 deleteAll 플래그가 필요합니다." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("알림 삭제 중 오류 발생:", error);
    return NextResponse.json(
      { error: "알림을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 