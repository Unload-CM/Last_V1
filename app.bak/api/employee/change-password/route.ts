import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Employee 타입에 password 필드를 추가한 인터페이스 정의
interface EmployeeWithPassword {
  id: number;
  employeeId: string;
  password: string;
  // 기타 필요한 필드들...
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "현재 비밀번호와 새 비밀번호를 입력해주세요" },
        { status: 400 }
      );
    }

    // ADMIN 계정은 변경 불가
    /*
    if (["ADMIN", "CMADMIN1", "CMADMIN2"].includes(session.user.email)) {
      return NextResponse.json(
        { error: "시스템 관리자 계정의 비밀번호는 변경할 수 없습니다" },
        { status: 403 }
      );
    }
    */

    // 사용자 정보 조회
    const employee = await prisma.employee.findFirst({
      where: {
        employeeId: session.user.email
      }
    }) as unknown as EmployeeWithPassword; // 타입 단언 사용

    if (!employee) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 현재 비밀번호 확인
    if (employee.password !== currentPassword) {
      return NextResponse.json(
        { error: "현재 비밀번호가 일치하지 않습니다" },
        { status: 400 }
      );
    }

    // 새 비밀번호로 업데이트
    await prisma.$executeRaw`UPDATE employees SET password = ${newPassword} WHERE id = ${employee.id}`;

    return NextResponse.json({
      success: true,
      message: "비밀번호가 성공적으로 변경되었습니다"
    });
  } catch (error) {
    console.error("비밀번호 변경 오류:", error);
    return NextResponse.json(
      { error: "비밀번호 변경 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 