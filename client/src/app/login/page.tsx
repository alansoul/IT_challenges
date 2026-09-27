'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { ShieldAlert, AlertTriangle, Lock, Fingerprint, FileText } from 'lucide-react';
import axios from 'axios';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.post<{ token: string; user: { name: string; email: string; score: number } }>(
        '/api/auth/google',
        { credential: credentialResponse.credential }
      );

      // Save token and user session to localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Redirect detective to investigation headquarters
      router.push('/');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(
          err.response?.data?.message || 'Access Denied: Only authorized college accounts permitted.'
        );
      } else {
        setErrorMessage('Authentication server unreachable.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <main className="min-h-screen bg-[#07090e] flex flex-col justify-center items-center px-4 selection:bg-red-500 selection:text-white">
        {/* Glow backdrop behind card */}
        <div className="absolute w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md bg-[#0f131a] border border-[#21262d] rounded-xl p-8 shadow-2xl shadow-red-950/30">
          {/* Header Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-700/50 flex items-center justify-center mb-3">
              <ShieldAlert className="w-8 h-8 text-[#ff2a2a]" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-widest text-[#ff2a2a] glow-crimson uppercase">
              Murder Mystery 2.0
            </h1>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
              Cipher Cell CTF • Access Terminal
            </p>
          </div>

          {/* Case File Briefing */}
          <div className="bg-[#090c10] border border-[#1c212a] rounded-lg p-4 mb-6 text-xs text-gray-300 space-y-2 leading-relaxed">
            <p className="flex items-center gap-1.5 font-bold text-gray-200 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-red-500" /> Case File
            </p>
            <p>
                A high-level breach has occurred inside the club&apos;s server room. Mr. Bedekar has been found dead.
                27 cryptographically protected evidence nodes remain.
            </p>
            <p className="text-[#ff2a2a] font-mono font-bold">
              Rule 1: Detectives must sign in using college domain emails only.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Sign-in */}
          <div className="flex flex-col items-center justify-center space-y-4">
            {loading ? (
              <p className="text-xs text-gray-400 animate-pulse">Verifying detective clearance...</p>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErrorMessage('Google Sign-in popup closed or failed.')}
                theme="filled_black"
                shape="rectangular"
                size="large"
                text="signin_with"
              />
            )}
          </div>

          {/* Footer Security Badges */}
          <div className="mt-8 pt-4 border-t border-[#1c212a] flex justify-between items-center text-[10px] text-gray-500 font-mono">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-green-500" /> SHA-256 SALT GUARD
            </span>
            <span className="flex items-center gap-1">
              <Fingerprint className="w-3 h-3 text-blue-500" /> REDIS TIE-BREAKER
            </span>
          </div>
        </div>
      </main>
    </GoogleOAuthProvider>
  );
}