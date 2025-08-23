// src/components/providers/AuthProvider.js
'use client';

import { SessionProvider } from 'next-auth/react';
import NoSSR from '../NoSSR';
import LoadingSpinner from '../LoadingSpinner';

export function AuthProvider({ children }) {
  const fallback = <LoadingSpinner />;

  return (
    <SessionProvider>
      <NoSSR fallback={fallback}>
        {children}
      </NoSSR>
    </SessionProvider>
  );
}