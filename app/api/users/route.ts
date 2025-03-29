import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// 샘플 사용자 데이터와 인메모리 저장소
let users = [
  {
    id: 1,
    name: '김철수',
    email: 'kim@example.com',
    password: 'hashed_password1',
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
    password: 'hashed_password2',
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
    password: 'hashed_password3',
    role: 'STAFF',
    departmentId: '3',
    department: { name: '물류창고' },
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

// 다음 ID 값
let nextId = users.length + 1;

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
    
    // 인메모리 데이터 필터링
    let filteredUsers = [...users];
    
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(searchLower) || 
        user.email.toLowerCase().includes(searchLower)
      );
    }
    
    // 비밀번호 필드 제외하고 결과 반환
    const result = filteredUsers.map(({ password, ...user }) => user);
    
    return NextResponse.json({ users: result });
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
    const existingUser = users.find(user => user.email === email);
    
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      );
    }
    
    // 실제 구현에서는 비밀번호 해싱 필요
    // const hashedPassword = await bcrypt.hash(password, 10);
    
    // 사용자 생성
    const newUser = {
      id: nextId++,
      name,
      email,
      password, // 실제 구현에서는 hashedPassword 사용
      role: role || 'user',
      departmentId: data.departmentId || '1',
      department: { name: data.departmentName || '생산부' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // 사용자 추가
    users.push(newUser);
    
    // 비밀번호 제외한 정보 반환
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json({ 
      success: true, 
      message: '사용자가 성공적으로 생성되었습니다.',
      user: userWithoutPassword 
    }, { status: 201 });
  } catch (error) {
    console.error('사용자 생성 중 오류 발생:', error);
    return NextResponse.json(
      { error: '사용자를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 