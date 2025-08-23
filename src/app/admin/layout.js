// src/app/admin/layout.js
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield, Users, Briefcase, Activity, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // Usa un default se usePathname fallisce
  let pathname = '/admin';
  try {
    pathname = usePathname() || '/admin';
  } catch (error) {
    console.warn('usePathname error, using default:', error);
  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (isMounted && status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router, isMounted]);

  // Prevent hydration mismatch by showing nothing until mounted
  if (!isMounted || status === 'loading' || !session || session.user.role !== 'admin') {
    return <LoadingSpinner />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Activity },
    { name: 'Utenti', href: '/admin/users', icon: Users },
    { name: 'Portfolio', href: '/admin/portfolios', icon: Briefcase },
    { name: 'Audit Log', href: '/admin/audit', icon: Shield },
    { name: 'Impostazioni', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
        </div>
        
        <nav className="mt-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-blue-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-300">Logged in as</p>
            <p className="font-medium text-white">{session.user.name}</p>
            <Link 
              href="/dashboard"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Torna al Dashboard →
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}