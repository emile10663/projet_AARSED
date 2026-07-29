import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login", // Redirige les utilisateurs non authentifiés ici
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      // Si l'utilisateur est sur /login et déjà connecté, on l'envoie sur le dashboard
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }

      // Si l'utilisateur n'est pas connecté et qu'il n'est pas sur /login, NextAuth le redirige automatiquement
      return isLoggedIn;
    },
  },
  providers: [], // Toujours vide ici pour le middleware Edge !
} satisfies NextAuthConfig;