import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import authConfig from "@/auth.config";
import { getUserById } from "@/lib/data/user";
import { UserRole } from "@/lib/generated/prisma";

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update,
} = NextAuth({
  ...authConfig,
  // Don't use PrismaAdapter with JWT sessions and credentials provider
  // adapter: PrismaAdapter(db),
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        (session.user as any).role = token.role as UserRole;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);

      if (!existingUser) return token;

      token.role = existingUser.role;

      return token;
    },
    async signIn({ user, account, profile }) {
      // Allow OAuth sign-ins
      if (account?.provider !== "credentials") return true;

      // For credentials, user should already be validated
      return !!user;
    },
  },
});
