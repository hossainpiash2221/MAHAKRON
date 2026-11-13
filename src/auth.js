
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export function isAdminEmail(email) {
  if (typeof email !== "string" || !email.trim()) {
    return false;
  }

  const allowedEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(email.trim().toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 12,
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return false;

      if (profile?.email_verified !== true) return false;

      return isAdminEmail(user?.email);
    },

    async session({ session }) {
      return session;
    },
  },
});
