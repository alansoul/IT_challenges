'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Terminal,
  LogOut,
  User as UserIcon,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-[#21262d] bg-[#090c10]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <ShieldAlert className="w-7 h-7 text-[#ff2a2a] group-hover:drop-shadow-[0_0_8px_rgba(255,42,42,0.8)] transition" />
          <div>
            <span className="font-extrabold text-lg tracking-wider text-[#ff2a2a]">
              MURDER MYSTERY 2.0
            </span>
            <span className="text-[10px] block text-gray-500 font-mono tracking-widest uppercase">
              CIPHER CELL CTF
            </span>
          </div>
        </Link>

        {/* Center nav links */}
        <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className={`transition hover:text-[#ff2a2a] ${
              pathname === '/' ? 'text-[#ff2a2a] font-bold' : 'text-gray-400'
            }`}
          >
            The Premise
          </Link>
          <Link
            href="/dashboard"
            className={`flex items-center gap-1.5 transition hover:text-[#ff2a2a] ${
              pathname === '/dashboard' ? 'text-[#ff2a2a] font-bold' : 'text-gray-400'
            }`}
          >
            <Terminal className="w-4 h-4" /> Dashboard
          </Link>
        </div>

        {/* Auth actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!user ? (
            <>
              {/* Register CTA — visible when logged out */}
              <Link
                href="/register"
                className="hidden sm:flex items-center gap-1.5 border border-[#30363d] hover:border-[#ff2a2a]/50 text-gray-300 hover:text-white font-semibold text-xs uppercase px-3 py-2 rounded transition"
              >
                <UserPlus className="w-3.5 h-3.5" /> Register
              </Link>

              <Link
                href="/login"
                className="bg-[#ff2a2a] hover:bg-red-700 text-white font-bold text-xs uppercase px-4 py-2 rounded transition flex items-center gap-2 shadow-lg shadow-red-950/40"
              >
                <UserIcon className="w-3.5 h-3.5" /> Sign In
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2.5 bg-[#161b22] px-3.5 py-1.5 rounded-lg border border-[#30363d]">
                <div className="w-6 h-6 rounded-full bg-[#ff2a2a] flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <span className="text-xs font-semibold block">{user.name}</span>
                  <span className="text-[10px] text-[#ff2a2a] font-mono font-bold block">
                    {user.score} pts
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-lg bg-[#161b22] border border-[#30363d] hover:bg-red-950/40 text-gray-400 hover:text-red-400 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}