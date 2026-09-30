'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login, googleLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      await login(email, password);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMsg(err.response?.data?.message || 'Invalid email or password.');
      } else {
        setErrorMsg('Server connection failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#06080c] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans">
      <div className="w-full max-w-4xl min-h-135 bg-[#0c1017] border border-[#21262d] rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 relative">
        {/* Left */}
        <div className="lg:col-span-5 relative bg-linear-to-b from-[#2e0854] via-[#160b2b] to-[#0c1017] p-8 sm:p-10 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#21262d]">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-[#ff2a2a]" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider text-white">CIPHER CELL CTF</span>
              <span className="text-[10px] block text-purple-300/70 font-mono tracking-widest uppercase">
                MURDER MYSTERY 2.0
              </span>
            </div>
          </div>

          <div className="relative z-10 my-8 space-y-3">
            <h2 className="text-3xl font-black text-white leading-tight">
              Detective <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-red-400 to-purple-400">
                Sign In
              </span>
            </h2>
            <p className="text-xs text-purple-200/70 leading-relaxed">
              Authenticate with your IIIT-NR credentials or university Google account.
            </p>
          </div>

          <div className="relative z-10 text-[11px] text-purple-300/50 font-mono">
            Secure HttpOnly Cookie Session
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">Access Terminal</h1>
            <p className="text-xs text-gray-400 mt-1">
              Need an account?{' '}
              <Link href="/register" className="text-[#ff2a2a] hover:underline font-semibold">
                Register here
              </Link>
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                University Email <span className="text-[#ff2a2a]">(@iiitnr.edu.in)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@iiitnr.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121721] border border-[#21262d] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#ff2a2a] transition font-mono"
                />
              </div>
            </div>

            <div>
              {/* UPDATED: Forgot Password Link added here */}
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-gray-300">Password</label>
                <Link href="/forgot-password" className="text-[10px] text-[#ff2a2a] hover:underline font-mono">
                  Forgot Password?
                </Link>
              </div>
              
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#ff2a2a] hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 disabled:opacity-50"
            >
              {loading ? (
                'Authenticating...'
              ) : (
                <>
                  Sign In to Investigation <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Google SSO */}
          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="flex items-center w-full gap-4">
              <div className="flex-1 h-px bg-[#21262d]" />
              <span className="text-xs text-gray-500 font-mono">OR IDENTIFY VIA</span>
              <div className="flex-1 h-px bg-[#21262d]" />
            </div>

            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (!credentialResponse.credential) return;
                  setLoading(true);
                  setErrorMsg(null);
                  try {
                    await googleLogin(credentialResponse.credential);
                  } catch (err: unknown) {
                    if (axios.isAxiosError(err)) {
                      setErrorMsg(err.response?.data?.message || 'Google auth failed.');
                    } else {
                      setErrorMsg('Google auth failed.');
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => setErrorMsg('Google login was cancelled or failed.')}
                theme="filled_black"
                shape="pill"
                text="continue_with"
                size="large"
              />
            </div>

            <p className="text-[10px] text-gray-500 text-center font-mono">
              Only @iiitnr.edu.in Google accounts are accepted
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-[#1c212a] text-center">
            <Link href="/" className="text-[11px] text-gray-500 hover:text-gray-300 transition">
              ← Return to Case Briefing & Suspects
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
