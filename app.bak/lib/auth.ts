import { getServerSession } from "next-auth";

// DB의 사용자 타입 정의
export interface DBUser {
  id: string;
  email: string;
  name: string;
  department: string;
  departmentLabel?: string;
  departmentThaiLabel?: string;
  koreanName?: string;
  thaiName?: string;
  nickname?: string;
  isThai?: boolean;
  isAdmin: boolean;
  isSystemAdmin: boolean;
  employeeId?: number;
}

// 서버 세션 가져오기 헬퍼 함수
export const getAuthSession = () => getServerSession(); 