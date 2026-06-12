import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL;
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        if (!adminEmail || !passwordHash) {
          throw new Error(
            "Admin credentials are not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD_HASH in .env"
          );
        }
        if (!credentials?.email || !credentials.password) return null;
        if (credentials.email.toLowerCase() !== adminEmail.toLowerCase()) {
          return null;
        }
        if (!bcrypt.compareSync(credentials.password, passwordHash)) {
          return null;
        }
        return { id: "admin", email: adminEmail, name: "Admin" };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
