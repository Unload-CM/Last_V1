import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { employeeId: session.user.email },
      select: {
        id: true,
        koreanName: true,
        thaiName: true,
        nickname: true,
        isAdmin: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
            label: true
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: "직원 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("사용자 정보 조회 중 오류 발생:", error);
    return NextResponse.json(
      { error: "사용자 정보를 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 