'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Skull, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';

const suspects = [
  { initial: 'B', name: 'Bhavyaa', role: 'Head of Club', note: 'Always analyzing detective novels. Seen hovering near server room.' },
  { initial: 'O', name: 'Onkar', role: 'Vice Head', note: 'Complained about being stressed. Missing during time of murder.' },
  { initial: 'H', name: 'Harimohan', role: 'Core Member', note: 'Caught trying to bypass electronic server locks yesterday.' },
  { initial: 'A', name: 'Arjun', role: 'Core Member', note: 'Fits the suspect profile. His alibi for the night is shaky.' },
  { initial: 'S', name: 'Surya', role: 'Core Member', note: 'The ECE network sniffer. Knows exactly when CCTV went down.' },
  { initial: 'S', name: 'Shivali', role: 'Core Member', note: 'Fascinated by true crime. Was seen carrying a suspiciously large bag.' },
  { initial: 'R', name: 'Rudra', role: 'Member', note: 'Learning fast. Always asking suspiciously specific security questions.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-[#f0f6fc]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-red-950/40 border border-red-800/40 px-3 py-1 rounded-full text-xs font-mono text-red-400">
            <Skull className="w-3.5 h-3.5" /> MURDER INVESTIGATION IN PROGRESS
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-widest text-[#ff2a2a] glow-crimson uppercase">
            Murder Mystery 2.0
          </h1>

          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            A catastrophic breach has occurred at the college. The victim,{' '}
            <span className="text-white font-bold">Mr. Bedekar</span>, was found murdered in the
            club&apos;s server room! 27 encrypted evidence nodes remain across 7 categories.
          </p>

          <div className="pt-4 flex justify-center gap-4 flex-wrap">
            <Link
              href="/dashboard"
              className="bg-[#ff2a2a] hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg text-sm transition flex items-center gap-2 shadow-xl shadow-red-950/50"
            >
              Enter Investigation Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="border border-[#30363d] hover:border-[#ff2a2a]/50 text-gray-200 font-bold px-6 py-3 rounded-lg text-sm transition"
            >
              Register Detective Account
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#0f131a] border border-[#21262d] rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#ff2a2a]">/</span> The Premise
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              You are a rookie detective tasked with finding the killer among the club members. You
              must crack the 27 cryptographic, binary, and forensic challenges left across the crime
              scene.
            </p>
            <div className="bg-[#07090e] border border-[#1c212a] p-3 rounded font-mono text-xs text-red-400">
              Flag Format: <span className="text-white font-bold">CTF&#123;...&#125;</span>
            </div>
          </div>

          <div className="bg-[#0f131a] border border-[#21262d] rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#ff2a2a]">!</span> Contest Rules & Scoring
            </h2>
            <ul className="text-xs text-gray-400 space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>
                  <strong>College Email Only:</strong> Must authenticate with university credentials
                  or Google (@iiitnr.edu.in).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>
                  <strong>27 Investigation Nodes:</strong> Points scale from 100 pts up to 1,000 pts
                  (Kernel/SSRF).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Tie-Breaker:</strong> Earliest solver ranks higher via Redis millisecond
                  precision.
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold tracking-wider text-gray-200 flex items-center gap-2">
            <UserCheck className="text-[#ff2a2a] w-5 h-5" /> The Cast (Suspects)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {suspects.map((sus, idx) => (
              <div
                key={idx}
                className="bg-[#0f131a] border border-[#21262d] p-5 rounded-lg space-y-3 relative group hover:border-red-900 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#161b22] border border-[#30363d] flex items-center justify-center font-bold text-lg text-[#ff2a2a]">
                    {sus.initial}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{sus.name}</h3>
                    <p className="text-[10px] text-gray-400 uppercase font-mono">{sus.role}</p>
                  </div>
                </div>
                <div className="bg-[#07090e] p-2.5 rounded border border-[#1c212a] text-[11px] text-gray-400 leading-snug">
                  {sus.note}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}