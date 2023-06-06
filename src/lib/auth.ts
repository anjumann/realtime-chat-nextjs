import { NextAuthOptions } from "next-auth";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";
import { db } from "@/lib/db";
import GoogleProvider from "next-auth/providers/google";

function getGoogleCredentials() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!googleClientId || !googleClientSecret) {
    throw new Error(
      "Missing environment variables `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`"
    );
  }
  return { googleClientId, googleClientSecret };
}

export const authOptions: NextAuthOptions = {

  adapter: UpstashRedisAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: getGoogleCredentials().googleClientId,
      clientSecret: getGoogleCredentials().googleClientSecret,
    }),
  ],
  callbacks: {

    async jwt({ token, user }) {
      const dbUser = (await db.get(`user :${user.id}`)) as User | null;

      if (!dbUser) {
        token.id = user!.id;
        return token;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      };
    },

    async session({ session, token }) {
      
      if (token){
        session.user.id = token.id;
        session.user.name = token.name;
      }
      return session;
    },

    redirect() {
      return '/dashboard'
    }


  },
};
