'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { register, googleLogin } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [batchYear, setBatchYear] = useState('1st Year (Freshers)');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isIIITNREmail =
    email.toLowerCase().endsWith('@iiitnr.edu.in') ||
    email.toLowerCase().endsWith('@iiitnr.ac.in');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!isIIITNREmail) {
      setLoading(false);
      setErrorMsg('University restriction: Email must end with @iiitnr.edu.in');
      return;
    }

    if (password.length < 8) {
      setLoading(false);
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    try {
      await register(name, email, password, branch, batchYear);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as
          | { message?: string; errors?: Array<{ message: string }> }
          | undefined;

        if (data?.errors?.length) {
          setErrorMsg(data.errors.map((e) => e.message).join(', '));
        } else {
          setErrorMsg(data?.message || 'Registration failed.');
        }
      } else {
        setErrorMsg('Server connection failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#06080c] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans">
      <div className="w-full max-w-6xl min-h-160 bg-[#0c1017] border border-[#21262d] rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 relative">
        {/* Left Glowing Visual Column */}
        <div className="lg:col-span-5 relative bg-linear-to-b from-[#2e0854] via-[#160b2b] to-[#0c1017] p-8 sm:p-10 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#21262d]">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-[#ff2a2a]" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider text-white">
                CIPHER CELL CTF
              </span>
              <span className="text-[10px] block text-purple-300/70 font-mono tracking-widest uppercase">
                MURDER MYSTERY 2.0
              </span>
            </div>
          </div>

          <div className="relative z-10 my-10 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Register Detective <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-red-400 to-purple-400">
                Clearance
              </span>
            </h2>
            <p className="text-xs text-purple-200/70 leading-relaxed max-w-sm">
              All students and seniors are eligible. Create your detective account with email/password
              or your university Google account.
            </p>

            <div className="pt-4 space-y-2.5">
              <div className="flex items-center gap-3 bg-[#0c1017]/60 backdrop-blur-md border border-purple-500/20 p-2.5 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-white">Any @iiitnr.edu.in Email</p>
                  <p className="text-[10px] text-gray-400">Manual or Google — same domain lock</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#0c1017]/30 border border-white/5 p-2.5 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-[#1c212a] text-gray-400 font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-gray-300">All Batches Welcome</p>
                  <p className="text-[10px] text-gray-500">1st Year, 2nd, 3rd & 4th Year Seniors</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-[11px] text-purple-300/50 font-mono">
            Secure HttpOnly Cookie • University SSO
          </div>
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center max-w-lg mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">Create Detective Account</h1>
            <p className="text-xs text-gray-400 mt-1">
              Already have an account?{' '}
              <Link href="/login" className="text-[#ff2a2a] hover:underline font-semibold">
                Sign in here
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
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Divya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#121721] border border-[#21262d] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#ff2a2a] transition"
                />
              </div>
            </div>

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

              {email && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono">
                  {isIIITNREmail ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> IIIT-NR Domain Verified
                    </span>
                  ) : (
                    <span className="text-yellow-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Must end with @iiitnr.edu.in
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Year / Seniority
                </label>
                <select
                  value={batchYear}
                  onChange={(e) => setBatchYear(e.target.value)}
                  className="w-full bg-[#121721] border border-[#21262d] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff2a2a] transition"
                >
                  <option value="1st Year (Freshers)">1st Year (Freshers)</option>
                  <option value="2nd Year (Seniors)">2nd Year (Seniors)</option>
                  <option value="3rd Year (Super Seniors)">3rd Year (Super Seniors)</option>
                  <option value="4th Year (Super Super Seniors)">
                    4th Year (Super Super Seniors)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Branch</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-[#121721] border border-[#21262d] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff2a2a] transition"
                >
                  <option value="CSE">Computer Science (CSE)</option>
                  <option value="ECE">Electronics & Comm (ECE)</option>
                  <option value="DSAI">Data Science & AI (DSAI)</option>
                  <option value="Other">Other / Faculty</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Password</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#ff2a2a] hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 disabled:opacity-50"
            >
              {loading ? (
                'Registering...'
              ) : (
                <>
                  Register Detective Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Google SSO */}
          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="flex items-center w-full gap-4">
              <div className="flex-1 h-px bg-[#21262d]" />
              <span className="text-xs text-gray-500 font-mono">OR CONTINUE WITH</span>
              <div className="flex-1 h-px bg-[#21262d]" />
            </div>

            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (!credentialResponse.credential) return;
                  setLoading(true);
                  setErrorMsg(null);
                  try {
                    // Creates account on first Google login if missing
                    await googleLogin(credentialResponse.credential);
                  } catch (err: unknown) {
                    if (axios.isAxiosError(err)) {
                      setErrorMsg(err.response?.data?.message || 'Google registration failed.');
                    } else {
                      setErrorMsg('Google registration failed.');
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => setErrorMsg('Google signup was cancelled or failed.')}
                theme="filled_black"
                shape="pill"
                text="signup_with"
                size="large"
              />
            </div>

            <p className="text-[10px] text-gray-500 text-center font-mono leading-relaxed">
              Google signup only accepts @iiitnr.edu.in accounts.
              <br />
              Branch/year default to CSE / 1st Year (editable later if you add profile).
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