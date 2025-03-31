import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import type { SessionStrategy } from 'next-auth';
// import bcrypt from 'bcrypt'; // 주석 처리

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        employeeId: { label: '사원번호', type: 'text' },
        password: { label: '비밀번호', type: 'password' }
      },
      async authorize(credentials, req) {
        // console.log('authorize 함수 호출됨', { credentials });
        
        if (!credentials?.employeeId || !credentials?.password) {
          throw new Error('사원번호와 비밀번호를 입력해주세요.');
        }

        try {
          // 직원 찾기
          const employee = await prisma.employee.findUnique({
            where: {
              employeeId: credentials.employeeId
            },
            include: {
              department: true
            }
          });

          if (!employee) {
            throw new Error('유효하지 않은 사원번호입니다.');
          }

          // 비밀번호 비교 (평문)
          const passwordMatch = credentials.password === employee.password;

          if (!passwordMatch) {
            throw new Error('비밀번호가 일치하지 않습니다.');
          }

          // 사용자 정보 준비
          const user = {
            id: employee.id.toString(),
            email: employee.employeeId,
            name: employee.koreanName,
            department: employee.department?.name || '',
            departmentLabel: employee.department?.label || '',
            departmentThaiLabel: employee.department?.thaiLabel || '',
            koreanName: employee.koreanName,
            thaiName: employee.thaiName || undefined,
            nickname: employee.nickname || undefined,
            isThai: employee.isThai,
            isAdmin: employee.isAdmin,
            isSystemAdmin: employee.isAdmin // 관리자는 시스템 관리자로 취급
          };
          
          return user;
        } catch (error) {
          // 구체적인 오류 메시지 반환
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error('로그인 처리 중 오류가 발생했습니다.');
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login', // 오류 발생 시 로그인 페이지로 리디렉션
  },
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.department = user.department;
        token.departmentLabel = user.departmentLabel;
        token.departmentThaiLabel = user.departmentThaiLabel;
        token.koreanName = user.koreanName;
        token.thaiName = user.thaiName;
        token.nickname = user.nickname;
        token.isThai = user.isThai;
        token.isAdmin = user.isAdmin;
        token.isSystemAdmin = user.isSystemAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.department = token.department;
        session.user.departmentLabel = token.departmentLabel;
        session.user.departmentThaiLabel = token.departmentThaiLabel;
        session.user.koreanName = token.koreanName;
        session.user.thaiName = token.thaiName;
        session.user.nickname = token.nickname;
        session.user.isThai = token.isThai;
        session.user.isAdmin = token.isAdmin;
        session.user.isSystemAdmin = token.isSystemAdmin;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false, // 디버그 모드 비활성화
};

export default NextAuth(authOptions); 