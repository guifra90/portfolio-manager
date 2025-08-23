// src/app/api/auth/[...nextauth]/route.js
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth.js';

const handler = NextAuth.default ? NextAuth.default(authOptions) : NextAuth(authOptions);

export { handler as GET, handler as POST };