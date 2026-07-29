import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Le matcher filtre les routes statiques, images et API pour ne pas surcharger le middleware
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};