import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
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
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback
   */
  interface User {
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
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken` */
  interface JWT {
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
  }
} 