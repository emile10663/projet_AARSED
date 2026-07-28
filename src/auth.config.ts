// src/auth.config.ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Laissez vide ou ajoutez uniquement des providers basiques sans callbacks lourds
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
      const isPublicRoute = nextUrl.pathname === "/login";
      const isApiRoute = nextUrl.pathname.startsWith("/api");

      if (isApiAuthRoute) return true;

      if (isApiRoute && !isLoggedIn) {
        return false; // Renvoie automatiquement une 401
      }

      if (!isLoggedIn && !isPublicRoute) {
        return false; // Redirige vers /login (configuré dans pages.signIn)
      }

      if (isLoggedIn && isPublicRoute) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;