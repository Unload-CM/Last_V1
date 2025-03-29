import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

// Employee 타입에 password 필드를 추가한 인터페이스 정의
interface EmployeeWithPassword {
  id: number;
  employeeId: string;
  password: string;
  koreanName: string;
  thaiName: string | null;
  nickname: string | null;
  isAdmin: boolean;
  isThai: boolean;
  department: {
    name: string;
    label: string;
    thaiLabel: string;
  };
  // 기타 필요한 필드들...
}

// ADMIN 계정 정보
const ADMIN_ACCOUNTS = ['ADMIN', 'CMADMIN1', 'CMADMIN2'];

// 로그인 로그를 기록하는 함수
async function logLoginAttempt(req: any, employeeId: string, isSuccess: boolean, reason?: string) {
  try {
    // 클라이언트 IP 주소 가져오기
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress;
    
    // 유저 에이전트(브라우저/기기 정보) 가져오기
    const userAgent = req.headers["user-agent"] || "Unknown";
    
    // 로그 데이터 구성
    const logData = {
      timestamp: new Date().toISOString(),
      employeeId,
      ip,
      userAgent,
      isSuccess,
      reason: reason || (isSuccess ? "로그인 성공" : "로그인 실패"),
    };
    
    // 콘솔에 로그 출력
    console.log("로그인 시도:", JSON.stringify(logData, null, 2));
    
    // 파일에 로그 기록 (fs 모듈 사용)
    // 참고: Next.js 서버리스 환경에서는 파일 쓰기가 제한될 수 있음
    const fs = require('fs');
    const path = require('path');
    const logDir = path.join(process.cwd(), 'logs');
    
    // 로그 디렉토리가 없으면 생성
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, 'login-attempts.log');
    fs.appendFileSync(logFile, JSON.stringify(logData) + '\n');
    
    // 데이터베이스에 로그 저장 (선택 사항)
    // await prisma.loginLog.create({ data: logData });
    
  } catch (error) {
    console.error("로그인 로그 기록 중 오류:", error);
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "사원번호", type: "text" },
        password: { label: "비밀번호", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          await logLoginAttempt(req, credentials?.email || "unknown", false, "이메일 또는 비밀번호 누락");
          return null;
        }

        try {
          // 사원번호를 대문자로 변환
          const employeeId = credentials.email.toUpperCase();
          console.log(`입력된 사원번호를 대문자로 변환: ${credentials.email} -> ${employeeId}`);
          
          // ADMIN 계정인 경우
          if (ADMIN_ACCOUNTS.includes(employeeId)) {
            console.log(`관리자 계정(${employeeId}) 로그인 시도`);
            
            // DB에서 해당 사용자 정보 조회 시도
            const adminEmployee = await prisma.employee.findFirst({
              where: {
                employeeId: employeeId,
              },
              include: {
                department: true,
              },
            });
            
            console.log('Admin DB 조회 결과:', adminEmployee ? JSON.stringify(adminEmployee, null, 2) : '정보 없음');
            
            // DB에 사용자 정보가 있으면 해당 정보를, 없으면 기본 정보 사용
            if (adminEmployee) {
              console.log(`관리자 계정(${employeeId}) DB 정보 발견, 해당 정보 사용`);
              
              // 로그인 성공 로그 기록
              await logLoginAttempt(req, employeeId, true, "관리자 계정 (DB 정보 사용)");
              
              // 태국인인 경우와 태국인이 아닌 경우에 따라 다른 형식의 이름 표시
              let displayName = '';
              if (adminEmployee.isThai && adminEmployee.thaiName) {
                // 태국인인 경우: 한국어 이름 (태국어 이름) - 별명 | 부서
                displayName = `${adminEmployee.koreanName} (${adminEmployee.thaiName})${adminEmployee.nickname ? ` - ${adminEmployee.nickname}` : ''} | ${adminEmployee.department.name}`;
              } else {
                // 태국인이 아닌 경우: 한국어 이름 | 부서
                displayName = `${adminEmployee.koreanName} | ${adminEmployee.department.name}`;
              }
              
              const userData = {
                id: adminEmployee.id.toString(),
                email: adminEmployee.employeeId,
                name: displayName,
                department: adminEmployee.department.name,
                departmentLabel: adminEmployee.department.label,
                departmentThaiLabel: adminEmployee.department.thaiLabel,
                koreanName: adminEmployee.koreanName,
                thaiName: adminEmployee.thaiName || undefined,
                nickname: adminEmployee.nickname || undefined,
                isThai: adminEmployee.isThai,
                isAdmin: true,
                isSystemAdmin: true
              };
              
              console.log('Admin 로그인 반환 데이터:', JSON.stringify(userData, null, 2));
              return userData;
            } else {
              // DB에 정보가 없는 경우, 해당 부서 정보만 DB에서 가져옴
              console.log(`관리자 계정(${employeeId}) DB 정보 없음, 기본 정보 사용`);
              
              // 로그인 성공 로그 기록
              await logLoginAttempt(req, employeeId, true, "관리자 계정");
              
              // 경영부 정보 가져오기
              const managementDept = await prisma.department.findFirst({
                where: { name: 'MANAGEMENT' }
              });
              
              return {
                id: "admin",
                email: employeeId,
                name: employeeId,
                department: managementDept?.name || 'MANAGEMENT',
                departmentLabel: managementDept?.label || '경영부',
                departmentThaiLabel: managementDept?.thaiLabel || 'แผนกบริหาร',
                koreanName: employeeId,
                thaiName: undefined,
                nickname: undefined,
                isThai: false,
                isAdmin: true,
                isSystemAdmin: true
              };
            }
          }

          // 일반 직원 검색 (사원번호로 검색하여 관리자만 로그인 허용)
          const employee = await prisma.employee.findFirst({
            where: {
              employeeId: employeeId, // 대문자로 변환된 사원번호로 검색
              isAdmin: true // 관리자(isAdmin: true)만 로그인 허용
            },
            include: {
              department: true,
            },
          }) as unknown as EmployeeWithPassword;

          if (!employee) {
            console.log(`로그인 실패: ${employeeId} (관리자 권한 없음 또는 존재하지 않는 사용자)`);
            await logLoginAttempt(req, employeeId, false, "관리자 권한 없음 또는 존재하지 않는 사용자");
            return null;
          }

          // 비밀번호 검증
          if (employee.password !== credentials.password) {
            console.log(`로그인 실패: ${employeeId} (비밀번호 불일치)`);
            await logLoginAttempt(req, employeeId, false, "비밀번호 불일치");
            return null;
          }

          console.log(`관리자 로그인 성공: ${employee.koreanName} (ID: ${employee.id}, 사원번호: ${employee.employeeId})`);
          await logLoginAttempt(req, employeeId, true);
          
          // 태국인인 경우와 태국인이 아닌 경우에 따라 다른 형식의 이름 표시
          let displayName = '';
          if (employee.isThai && employee.thaiName) {
            // 태국인인 경우: 한국어 이름 (태국어 이름) - 별명 | 부서
            displayName = `${employee.koreanName} (${employee.thaiName})${employee.nickname ? ` - ${employee.nickname}` : ''} | ${employee.department.name}`;
          } else {
            // 태국인이 아닌 경우: 한국어 이름 | 부서
            displayName = `${employee.koreanName} | ${employee.department.name}`;
          }
          
          return {
            id: employee.id.toString(),
            email: employee.employeeId,
            name: displayName,
            department: employee.department.name,
            departmentLabel: employee.department.label,
            departmentThaiLabel: employee.department.thaiLabel,
            koreanName: employee.koreanName,
            thaiName: employee.thaiName || undefined,
            nickname: employee.nickname || undefined,
            isThai: employee.isThai,
            isAdmin: employee.isAdmin,
            isSystemAdmin: false
          };
        } catch (error) {
          console.error("인증 오류:", error);
          await logLoginAttempt(req, credentials.email, false, "서버 오류");
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
        token.departmentLabel = user.departmentLabel;
        token.departmentThaiLabel = user.departmentThaiLabel;
        token.koreanName = user.koreanName;
        token.thaiName = user.thaiName;
        token.nickname = user.nickname;
        token.isThai = user.isThai;
        token.isAdmin = user.isAdmin;
        token.isSystemAdmin = user.isSystemAdmin || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.department = token.department as string;
        session.user.departmentLabel = token.departmentLabel as string;
        session.user.departmentThaiLabel = token.departmentThaiLabel as string;
        session.user.koreanName = token.koreanName as string;
        session.user.thaiName = token.thaiName as string;
        session.user.nickname = token.nickname as string;
        session.user.isThai = token.isThai as boolean;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.isSystemAdmin = token.isSystemAdmin as boolean;
      }
      return session;
    }
  },
  pages: {
    signIn: "/admin-login",
    error: "/admin-login",
  },
  secret: process.env.NEXTAUTH_SECRET || "default-secret-key-change-in-production",
};