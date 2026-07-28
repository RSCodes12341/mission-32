import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";

// Compared against when no user matches, so a missing account takes about as
// long to reject as a wrong password and can't be told apart by timing.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO2Vp1G1eF8vI0nqR1F1cIeQ0kFqzB9lC";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }
        if (!(await bcrypt.compare(password, user.passwordHash))) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
});
