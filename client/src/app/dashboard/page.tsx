'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Terminal, Trophy, CheckCircle2, Search, GraduationCap, ShieldCheck, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Challenge {
  _id: string;
  title: string;
  category: string;
  difficultyRank: number;
  points: number;
  description: string;
  isSolved: boolean;
}

interface LeaderboardUser {
  _id: string;
  name: string;
  score: number;
  email: string;
}

const categories = ['All', 'Web', 'Pwn', 'Crypto', 'Forensics', 'Rev', 'OSINT', 'Misc'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [flags, setFlags] = useState<Record<string, string>>({});
  const [statusMsg, setStatusMsg] = useState<Record<string, string>>({});

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await api.get<Challenge[]>('/api/challenges');
      setChallenges(res.data);
    } catch (err: unknown) {
      console.error('Failed to load challenges:', err);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await api.get<LeaderboardUser[]>('/api/leaderboard');
      setLeaderboard(res.data);
    } catch (err: unknown) {
      console.error('Failed to load leaderboard:', err);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!authLoading) {
        if (!user) {
          router.push('/login');
        } else {
          void fetchChallenges();
          void fetchLeaderboard();
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [user, authLoading, router, fetchChallenges, fetchLeaderboard]);

  const submitFlag = async (challengeId: string) => {
    const flag = flags[challengeId];
    if (!flag) return;

    try {
      const res = await api.post<{ message: string; newScore: number }>(
        `/api/challenges/${challengeId}/submit`,
        { flag }
      );

      setStatusMsg((prev) => ({ ...prev, [challengeId]: res.data.message }));
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

      await refreshUser();
      await fetchChallenges();
      await fetchLeaderboard();
    } catch (err: unknown) {
      const errorMsg = axios.isAxiosError(err)
        ? (err.response?.data?.message as string) || 'Wrong flag!'
        : 'Submission error';

      setStatusMsg((prev) => ({ ...prev, [challengeId]: errorMsg }));
    }
  };

  const filteredChallenges = challenges.filter((ch) => {
    const matchesCat = selectedCategory === 'All' || ch.category === selectedCategory;
    const matchesSearch =
      ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const solvedCount = challenges.filter((c) => c.isSolved).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-gray-500 font-mono text-sm">
        Verifying clearance session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f0f6fc]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* DETECTIVE DOSSIER PROFILE HEADER */}
        {user && (
          <div className="relative overflow-hidden bg-linear-to-r from-[#160b2b] via-[#0f131a] to-[#160b2b] border border-[#21262d] rounded-2xl p-6 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              {/* User Identity */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#ff2a2a] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-red-950/60 border border-red-400/40">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-white tracking-tight">{user.name}</h1>
                    <span className="bg-red-500/10 border border-red-500/30 text-[#ff2a2a] text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold">
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{user.email}</p>

                  {/* Branch & Seniority Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 bg-[#1c212a] border border-[#30363d] text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                      <GraduationCap className="w-3.5 h-3.5 text-purple-400" /> {user.branch}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-[#1c212a] border border-[#30363d] text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> {user.batchYear}
                    </span>
                  </div>
                </div>
              </div>

              {/* Solves and Score Statistics */}
              <div className="flex items-center gap-6 bg-[#07090e]/80 border border-[#21262d] px-6 py-4 rounded-xl">
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-mono">Bounty Score</p>
                  <p className="text-2xl font-black text-[#ff2a2a] font-mono glow-crimson">{user.score} pts</p>
                </div>
                <div className="h-10 w-px bg-[#21262d]" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider font-mono">Progress</p>
                  <p className="text-2xl font-black text-green-400 font-mono flex items-center gap-1.5">
                    <Award className="w-5 h-5 text-yellow-400" /> {solvedCount} / 27
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-1.5 bg-[#0f131a] p-1.5 rounded-lg border border-[#21262d] w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition ${
                  selectedCategory === cat
                    ? 'bg-[#ff2a2a] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search evidence node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f131a] border border-[#21262d] rounded-lg pl-9 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#ff2a2a]"
            />
          </div>
        </div>

        {/* Main Grid: Challenges + Live Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 27 Challenges */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Terminal className="text-[#ff2a2a] w-4 h-4" /> Active Investigation Nodes ({filteredChallenges.length})
              </h2>
            </div>

            {filteredChallenges.length === 0 ? (
              <div className="p-8 text-center bg-[#0f131a] border border-[#21262d] rounded-lg text-gray-500 text-xs font-mono">
                No matching investigation nodes found.
              </div>
            ) : (
              filteredChallenges.map((ch) => (
                <div
                  key={ch._id}
                  className={`p-5 rounded-lg border transition ${
                    ch.isSolved
                      ? 'border-green-600/40 bg-[#0a1811]'
                      : 'border-[#21262d] bg-[#0f131a] hover:border-[#38414e]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase bg-[#1c212a] px-2 py-0.5 rounded text-gray-300 mr-2">
                        {ch.category}
                      </span>
                      <span className="text-xs font-mono text-gray-500">Rank #{ch.difficultyRank}</span>
                      <h3 className="text-base font-bold mt-1 text-white">{ch.title}</h3>
                    </div>
                    <span className="text-xs font-bold text-[#ff2a2a] bg-[#ff2a2a]/10 px-3 py-1 rounded-full border border-[#ff2a2a]/20">
                      {ch.points} pts
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">{ch.description}</p>

                  {ch.isSolved ? (
                    <div className="flex items-center gap-2 text-green-400 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Node Solved & Verified
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="CTF{...}"
                        className="bg-[#07090e] border border-[#21262d] rounded px-3 py-1.5 text-xs flex-1 font-mono focus:outline-none focus:border-[#ff2a2a]"
                        value={flags[ch._id] || ''}
                        onChange={(e) => setFlags({ ...flags, [ch._id]: e.target.value })}
                      />
                      <button
                        onClick={() => submitFlag(ch._id)}
                        className="bg-[#ff2a2a] hover:bg-red-700 text-white font-bold px-4 py-1.5 rounded text-xs transition"
                      >
                        Submit Flag
                      </button>
                    </div>
                  )}

                  {statusMsg[ch._id] && (
                    <p className="text-[11px] mt-2 text-yellow-400 font-mono">{statusMsg[ch._id]}</p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Live Leaderboard */}
          <div className="bg-[#0f131a] border border-[#21262d] p-5 rounded-lg h-fit space-y-4">
            <h2 className="text-sm font-bold tracking-wider text-gray-200 flex items-center gap-2">
              <Trophy className="text-yellow-400 w-4 h-4" /> LIVE LEADERBOARD
            </h2>

            <div className="space-y-2">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No solves recorded yet.</p>
              ) : (
                leaderboard.map((player, idx) => (
                  <div
                    key={player._id || idx}
                    className="flex justify-between items-center p-2 rounded bg-[#07090e] border border-[#1c212a]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-xs font-bold w-5 ${
                          idx === 0
                            ? 'text-yellow-400'
                            : idx === 1
                            ? 'text-gray-300'
                            : idx === 2
                            ? 'text-amber-600'
                            : 'text-gray-500'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-medium text-gray-200">{player.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#ff2a2a]">{player.score} pts</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}