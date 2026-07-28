import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

type ExtendedUser = DefaultSession["user"] & {
  id: string;
  role: Role;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
  interface User {
    id: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}