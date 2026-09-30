'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import axios from 'axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.post('/api/auth/forgot-password', { email });
      setMessage({ type: 'success', text: 'If an account exists, a reset link has been sent to your university email.' });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to process request.' });
      } else {
        setMessage({ type: 'error', text: 'Server connection failed.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#06080c] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0c1017] border border-[#21262d] rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Initiate Password Reset</h1>
        <p className="text-xs text-gray-400 mb-6">Enter your IIIT-NR email to receive a secure recovery token.</p>

        {message && (
          <div className={`mb-6 p-3 border text-xs rounded-lg flex items-start gap-2 ${
            message.type === 'error' ? 'bg-red-950/60 border-red-800 text-red-300' : 'bg-green-950/60 border-green-800 text-green-300'
          }`}>
            {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {!message || message.type === 'error' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">University Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@iiitnr.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#121721] border border-[#21262d] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:border-[#ff2a2a] transition font-mono outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff2a2a] hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Transmitting...' : <>Send Recovery Token <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        ) : null}

        <div className="mt-6 pt-4 border-t border-[#1c212a] text-center">
          <Link href="/login" className="text-[11px] text-gray-500 hover:text-gray-300 transition">
            ← Return to Access Terminal
          </Link>
        </div>
      </div>
    </main>
  );
}