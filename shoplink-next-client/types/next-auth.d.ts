import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: SessionUser;
    role?: string;
    experiences?: string[];
  }

  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    experiences?: string[];
  }
}

type SessionUser = {
  id: string;
};


