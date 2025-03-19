import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// 샘플 사용자 데이터
const SAMPLE_USERS = [
  {
    id: 1,
    name: '김철수',
    email: 'kim@example.com',
    role: 'ADMIN',
    departmentId: '1',
    department: { name: '생산부' },
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 2,
    name: '이영희',
    email: 'lee@example.com',
    role: 'MANAGER',
    departmentId: '2',
    department: { name: '품질관리부' },
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 3,
    name: '박지성',
    email: 'park@example.com',
    role: 'STAFF',
    departmentId: '3',
    department: { name: '물류창고' },
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

/**
 * 사용자 목록 조회 API
 * GET /api/users
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // 쿼리 파라미터 추출
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    
    // 필터링 조건 구성
    const where: any = {};
    
    if (role) {
      where.role = role;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // 사용자 목록 조회 (비밀번호 제외)
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('사용자 목록 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '사용자 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 새 사용자 생성 API
 * POST /api/users
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // 필수 필드 검증
    const { name, email, password, role } = data;
    
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: '이름, 이메일, 비밀번호는 필수입니다.' },
        { status: 400 }
      );
    }
    
    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      );
    }
    
    // 실제 구현에서는 비밀번호 해싱 필요
    // const hashedPassword = await bcrypt.hash(password, 10);
    
    // 사용자 생성
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password, // 실제 구현에서는 hashedPassword 사용
        role: role || 'user'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: '사용자가 성공적으로 생성되었습니다.',
      user: newUser 
    }, { status: 201 });
  } catch (error) {
    console.error('사용자 생성 중 오류 발생:', error);
    return NextResponse.json(
      { error: '사용자를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 