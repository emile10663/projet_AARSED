// auth.config.ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      // 1. Si l'utilisateur est sur /login mais DÉJÀ connecté -> Rediriger vers /dashboard
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true; // Laisser l'accès libre à /login pour les non-connectés
      }

      // 2. Si l'utilisateur essaie d'accéder au dashboard sans être connecté -> Bloquer (NextAuth redirigera vers /login)
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Déclenche la redirection automatique vers pages.signIn (/login)
      }

      // 3. Pour toutes les autres pages publiques (comme /)
      return true;
    },
  },
  providers: [], // Garder vide ici (compatible Edge)
} satisfies NextAuthConfig;