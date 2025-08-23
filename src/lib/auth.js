// src/lib/auth.js
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import db from './db/index.js';
import { users } from './db/schema.js';
import { createAuditLog, AUDIT_ACTIONS, TARGET_TYPES } from './auth/audit.js';

export const authOptions = {
  providers: [
    {
      id: 'credentials',
      name: 'credentials',
      type: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await db.select().from(users).where(eq(users.email, credentials.email)).get();
          
          if (!user || !user.isActive) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            return null;
          }

          // Log del login
          await createAuditLog({
            userId: user.id,
            action: AUDIT_ACTIONS.LOGIN,
            targetType: TARGET_TYPES.USER,
            targetId: user.id
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    }
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};