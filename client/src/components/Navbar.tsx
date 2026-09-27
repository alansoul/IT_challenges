'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, Terminal, LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; score: number } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('user');
        }
      } else {
        setUser(null);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <nav className="border-b border-[#21262d] bg-[#090c10]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <ShieldAlert className="w-7 h-7 text-[#ff2a2a] group-hover:drop-shadow-[0_0_8px_rgba(255,42,42,0.8)] transition" />
          <div>
            <span className="font-extrabold text-lg tracking-wider text-[#ff2a2a]">MURDER MYSTERY 2.0</span>
            <span className="text-[10px] block text-gray-500 font-mono tracking-widest uppercase">CIPHER CELL CTF</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/"
            className={`transition hover:text-[#ff2a2a] ${pathname === '/' ? 'text-[#ff2a2a] font-bold' : 'text-gray-400'}`}
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

        {/* User Account / Login Button */}
        <div>
          {!user ? (
            <Link
              href="/login"
              className="bg-[#ff2a2a] hover:bg-red-700 text-white font-bold text-xs uppercase px-4 py-2 rounded transition flex items-center gap-2 shadow-lg shadow-red-950/40"
            >
              <UserIcon className="w-3.5 h-3.5" /> Detective Sign In
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-[#161b22] px-3.5 py-1.5 rounded-lg border border-[#30363d]">
                <div className="w-6 h-6 rounded-full bg-[#ff2a2a] flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <span className="text-xs font-semibold block">{user.name}</span>
                  <span className="text-[10px] text-[#ff2a2a] font-mono font-bold block">{user.score} pts</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
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