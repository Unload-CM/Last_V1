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

          if (!employee || !employee.password) {
            throw new Error('유효하지 않은 사원번호입니다.');
          }

          // 비밀번호 비교
          const passwordMatch = credentials.password === employee.password;

          if (!passwordMatch) {
            throw new Error('비밀번호가 일치하지 않습니다.');
          }

          // NextAuth User 인터페이스와 일치하는 객체 반환
          return {
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
        } catch (error) {
          console.error('로그인 오류:', error);
          throw new Error('로그인 처리 중 오류가 발생했습니다.');
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt" as SessionStrategy,
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
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions); 