import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        employeeId: { label: '사원번호', type: 'text' },
        password: { label: '비밀번호', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.employeeId || !credentials?.password) {
          throw new Error('사원번호와 비밀번호를 입력해주세요.');
        }

        try {
          // 직원 찾기
          const employee = await prisma.employee.findUnique({
            where: {
              employeeId: credentials.employeeId
            }
          });

          if (!employee || !employee.password) {
            throw new Error('유효하지 않은 사원번호입니다.');
          }

          // 비밀번호 비교
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            employee.password
          );

          if (!passwordMatch) {
            throw new Error('비밀번호가 일치하지 않습니다.');
          }

          return {
            id: employee.id.toString(),
            name: employee.name,
            employeeId: employee.employeeId,
            department: employee.department,
            position: employee.position,
            role: employee.role
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
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.employeeId = user.employeeId;
        token.department = user.department;
        token.position = user.position;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.employeeId = token.employeeId;
        session.user.department = token.department;
        session.user.position = token.position;
        session.user.role = token.role;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions); 