import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    department: string;
    isAdmin: boolean;
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      department: string;
      isAdmin: boolean;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    department: string;
    isAdmin: boolean;
  }
} 