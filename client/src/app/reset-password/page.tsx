'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import axios from 'axios';
import api from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, newPassword: password });
      setMessage({ type: 'success', text: 'Password reset successful. Redirecting to login…' });
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage({
          type: 'error',
          text: err.response?.data?.message || 'Invalid or expired recovery token.',
        });
      } else {
        setMessage({ type: 'error', text: 'Server connection failed.' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4 py-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <p className="text-red-300 text-sm">Missing or invalid recovery token.</p>
        <Link href="/forgot-password" className="text-[#ff2a2a] text-xs hover:underline font-mono">
          Request a new recovery link →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Engage New Cipher</h1>
        <p className="text-xs text-gray-400 mt-1">
          Choose a strong password for your detective clearance.
        </p>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 border text-xs rounded-lg flex items-start gap-2 ${
            message.type === 'error'
              ? 'bg-red-950/60 border-red-800 text-red-300'
              : 'bg-green-950/60 border-green-800 text-green-300'
          }`}
        >
          {message.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {message?.type !== 'success' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#121721] border border-[#21262d] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#ff2a2a] transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-[#121721] border border-[#21262d] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#ff2a2a] transition font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#ff2a2a] hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 disabled:opacity-50"
          >
            {loading ? (
              'Encrypting…'
            ) : (
              <>
                Save New Password <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#06080c] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans">
      <div className="w-full max-w-md bg-[#0c1017] border border-[#21262d] rounded-2xl overflow-hidden shadow-2xl">
        {/* Mini brand header */}
        <div className="bg-linear-to-r from-[#2e0854] via-[#160b2b] to-[#0c1017] px-8 py-5 border-b border-[#21262d] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-[#ff2a2a]" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wider text-white">CIPHER CELL CTF</span>
            <span className="text-[10px] block text-purple-300/70 font-mono tracking-widest uppercase">
              Secure Recovery Channel
            </span>
          </div>
        </div>

        <div className="p-8">
          <Suspense
            fallback={
              <div className="text-center text-gray-500 text-xs font-mono py-8">
                Decrypting recovery parameters…
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>

          <div className="mt-8 pt-4 border-t border-[#1c212a] text-center">
            <Link href="/login" className="text-[11px] text-gray-500 hover:text-gray-300 transition">
              ← Return to Access Terminal
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}