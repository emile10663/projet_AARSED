// middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Exclut les fichiers statiques, images, favicon et les routes API
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};