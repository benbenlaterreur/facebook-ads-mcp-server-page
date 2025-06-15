import NextAuth from 'next-auth'
import FacebookProvider from 'next-auth/providers/facebook'
import { createUser, getUserByFacebookId, updateUserToken } from '../../../../lib/db'

export const authOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'ads_read,business_management,email'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // Store user in database
        try {
          createUser.run(
            profile.id,
            profile.email,
            profile.name,
            account.access_token
          );
          
          token.facebookId = profile.id;
          token.accessToken = account.access_token;
        } catch (error) {
          console.error('Error storing user:', error);
          // Still set the token even if DB storage fails
          token.facebookId = profile.id;
          token.accessToken = account.access_token;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.facebookId = token.facebookId;
      session.accessToken = token.accessToken;
      return session;
    }
  },
  pages: {
    signIn: '/',
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST } 