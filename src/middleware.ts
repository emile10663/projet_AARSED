// src/middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = nextUrl.pathname === "/login";
  const isApiRoute = nextUrl.pathname.startsWith("/api");

  // 1. Autoriser les routes d'authentification de l'API
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // 2. Protéger les routes API génériques
  if (isApiRoute && !isLoggedIn) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // 3. Rediriger l'utilisateur non connecté vers /login
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 4. Rediriger l'utilisateur déjà connecté qui tente d'accéder à /login vers /dashboard
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};