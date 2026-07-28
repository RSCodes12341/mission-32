import type { NextAuthConfig } from "next-auth";

/**
 * The half of the auth config that is safe to run in middleware: no Prisma, no
 * bcrypt, no Node built-ins. `src/auth.ts` spreads this and adds the providers.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.name) session.user.name = token.name;
      return session;
    },
  },
} satisfies NextAuthConfig;
