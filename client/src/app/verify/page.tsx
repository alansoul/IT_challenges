'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      await api.post('/api/auth/verify-otp', { email, otp });
      await refreshUser();
      router.push('/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMsg(err.response?.data?.message || 'Invalid clearance code.');
      } else {
        setErrorMsg('Server connection failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const res = await api.post<{ message: string; devOtp?: string }>('/api/auth/resend-otp', {
        email,
      });
      setInfoMsg(res.data.message);
      if (res.data.devOtp) {
        setInfoMsg(`Dev OTP: ${res.data.devOtp}`);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMsg(err.response?.data?.message || 'Failed to resend code.');
      } else {
        setErrorMsg('Server connection failed.');
      }
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <div className="text-center space-y-4 py-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <p className="text-red-300 text-sm">Missing email. Start from registration or login.</p>
        <Link href="/login" className="text-[#ff2a2a] text-xs hover:underline font-mono">
          ← Return to Access Terminal
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {infoMsg && (
        <div className="p-3 bg-green-950/60 border border-green-800 text-green-300 text-xs rounded-lg flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{infoMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2 text-center uppercase tracking-widest">
          6-Digit Clearance Code
        </label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full bg-[#121721] border border-[#21262d] rounded-xl text-center py-4 text-3xl text-white tracking-[0.5em] font-mono focus:outline-none focus:border-[#ff2a2a] transition"
          placeholder="••••••"
          autoFocus
        />
      </div>

      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="w-full bg-[#ff2a2a] hover:bg-red-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition disabled:opacity-50 shadow-lg shadow-red-950/40"
      >
        {loading ? 'Verifying…' : 'Confirm Identity'}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="w-full flex items-center justify-center gap-2 text-[11px] text-gray-400 hover:text-gray-200 transition font-mono disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
        {resending ? 'Dispatching…' : 'Resend clearance code'}
      </button>
    </form>
  );
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen bg-[#06080c] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-[#0c1017] border border-[#21262d] rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-linear-to-r from-[#2e0854] via-[#160b2b] to-[#0c1017] px-8 py-5 border-b border-[#21262d] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#ff2a2a]" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wider text-white">CIPHER CELL CTF</span>
            <span className="text-[10px] block text-purple-300/70 font-mono tracking-widest uppercase">
              Verify Comm Link
            </span>
          </div>
        </div>

        <div className="p-8">
          <h1 className="text-2xl font-bold text-white tracking-tight text-center mb-2">
            Email Clearance
          </h1>
          <Suspense fallback={null}>
            <EmailHint />
          </Suspense>

          <div className="mt-6">
            <Suspense
              fallback={
                <p className="text-center text-gray-500 text-xs font-mono py-8">
                  Loading verification channel…
                </p>
              }
            >
              <VerifyForm />
            </Suspense>
          </div>

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

function EmailHint() {
  const email = useSearchParams().get('email');
  if (!email) return null;
  return (
    <p className="text-xs text-gray-400 text-center">
      Code dispatched to <strong className="text-white font-mono">{email}</strong>
    </p>
  );
}