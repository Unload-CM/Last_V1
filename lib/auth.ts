import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 실제 구현에서는 비밀번호 검증을 수행해야 합니다.
          // 여기서는 간단한 예시로 이메일로만 직원을 찾습니다.
          const employee = await prisma.employee.findFirst({
            where: {
              employeeId: credentials.email,
            },
            include: {
              department: true,
            },
          });

          if (!employee) {
            return null;
          }

          // 실제 애플리케이션에서는 비밀번호 검증을 수행해야 합니다.
          // 여기서는 개발용으로 인증이 항상 성공하도록 설정합니다.
          
          return {
            id: employee.id.toString(),
            email: employee.employeeId,
            name: employee.koreanName || employee.thaiName || employee.nickname || employee.employeeId,
            department: employee.department.name,
            isAdmin: employee.isAdmin,
          };
        } catch (error) {
          console.error("인증 오류:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.department = user.department;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.department = token.department as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "default-secret-key-change-in-production",
};

// next-auth.d.ts 파일에 추가할 타입 선언 (참고용)
// declare module "next-auth" {
//   interface User {
//     id: string;
//     email: string;
//     name: string;
//     department: string;
//     isAdmin: boolean;
//   }
  
//   interface Session {
//     user: User;
//   }
// }

// declare module "next-auth/jwt" {
//   interface JWT {
//     id: string;
//     email: string;
//     name: string;
//     department: string;
//     isAdmin: boolean;
//   }
// } 