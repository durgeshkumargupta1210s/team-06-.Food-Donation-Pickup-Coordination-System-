'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const links = [
  { href: '/donor', label: 'Donor' },
  { href: '/volunteer', label: 'Volunteer' },
  { href: '/admin', label: 'Admin' },
];

export const AppHeader = () => {
  const pathname = usePathname();
  const { user, profile, signOut, signIn } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-emerald-600">
          MealBridge
        </Link>
        <nav className="hidden gap-4 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                pathname.startsWith(link.href)
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user && profile?.role && (
            <span className="hidden text-sm text-slate-500 sm:block">
              {profile.role.toUpperCase()} · {user.displayName ?? user.email}
            </span>
          )}
          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={signIn}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
