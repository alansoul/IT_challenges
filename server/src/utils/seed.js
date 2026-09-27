import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Challenge } from '../models/Challenge.js';
import { hashFlag } from './flagHasher.js';
import crypto from 'crypto';

dotenv.config();

const challengesData = [
  { rank: 1, title: 'The Root of All Evil', cat: 'Pwn', pts: 1000, desc: 'Exploit ring 0 kernel module vulnerability.', flag: 'CTF{k3rn3l_r00t_0f_4ll_3v1l}' },
  { rank: 2, title: 'Phantom Syndicate', cat: 'Web', pts: 950, desc: 'Blind SSRF through internal registry to pop RCE.', flag: 'CTF{ssrf_t0_d0ck3r_rce_unlocked}' },
  { rank: 3, title: 'Zero-Knowledge Nightmare', cat: 'Crypto', pts: 900, desc: 'Discrete logarithm flaw in elliptic curve signatures.', flag: 'CTF{zkg_d1scr3t3_l0g_br0k3n}' },
  { rank: 4, title: 'Subverted Firmware', cat: 'Rev', pts: 850, desc: 'Reverse-engineer Ghidra decompiled router firmware.', flag: 'CTF{f1rmw4r3_gh1dr4_m1ps_pwnd}' },
  { rank: 5, title: 'The ROP Emporium', cat: 'Pwn', pts: 800, desc: '64-bit ELF with NX/ASLR. Craft a clean ROP chain.', flag: 'CTF{r0p_g4dg3t_ch41n_m4st3r}' },
  { rank: 6, title: 'Jinja2 Escapology', cat: 'Web', pts: 750, desc: 'Python SSTI with strict WAF (no underscores or brackets).', flag: 'CTF{sst1_j1nj42_byp4ss_g0d}' },
  { rank: 7, title: 'In-Memory Intruder', cat: 'Forensics', pts: 700, desc: 'Volatility 3 dump showing injected thread hollowing.', flag: 'CTF{v0l4t1l1ty3_m4lf1nd_pr0c}' },
  { rank: 8, title: 'Bit-Flipper', cat: 'Crypto', pts: 700, desc: 'AES-CBC ciphertext bit-flipping attack to forge admin token.', flag: 'CTF{c1ph3rt3xt_b1t_fl1pp1ng_cbc}' },
  { rank: 9, title: 'The Redacted Inode', cat: 'Forensics', pts: 650, desc: 'Ext4 raw disk forensics: recover fragmented PDF.', flag: 'CTF{3xt4_1n0d3_c4rv1ng_succ3ss}' },
  { rank: 10, title: 'License Enforcer v3', cat: 'Rev', pts: 650, desc: 'Anti-debugging with ptrace and custom VM bytecode.', flag: 'CTF{vm_byt3c0d3_d30bfusc4t3d}' },
  { rank: 11, title: 'Broken Pipe', cat: 'Web', pts: 550, desc: 'Node.js Prototype Pollution leading to remote code execution.', flag: 'CTF{pr0t0typ3_p0llut10n_rce}' },
  { rank: 12, title: 'Heap of Trouble', cat: 'Pwn', pts: 550, desc: 'Fastbin dup and use-after-free heap exploitation.', flag: 'CTF{u4f_f4stb1n_dup_cl4ss1c}' },
  { rank: 13, title: 'The Covert Tunnel', cat: 'Forensics', pts: 500, desc: 'Extract data exfiltrated through covert DNS subqueries.', flag: 'CTF{dns_c0v3rt_tunn3l_3xf1l}' },
  { rank: 14, title: 'Wiener’s Dilemma', cat: 'Crypto', pts: 500, desc: 'RSA small private exponent attack.', flag: 'CTF{w13n3r_sm4ll_d_4tt4ck}' },
  { rank: 15, title: 'PyJail Lockdown', cat: 'Misc', pts: 450, desc: 'Escape restricted Python sandbox with stripped builtins.', flag: 'CTF{pyj41l_subcl4ss_3sc4p3}' },
  { rank: 16, title: 'The OAuth Hijack', cat: 'Web', pts: 450, desc: 'Flawed redirect_uri regex stealing authorization codes.', flag: 'CTF{04uth_r3d1r3ct_st0l3n}' },
  { rank: 17, title: 'Many-Time Pad', cat: 'Crypto', pts: 400, desc: 'XOR key reuse across 8 ciphertexts (Crib Dragging).', flag: 'CTF{cr1b_dr4gg1ng_otp_r3us3}' },
  { rank: 18, title: 'Shattered Commit', cat: 'OSINT', pts: 400, desc: 'Find deleted credentials in Git reflog and orphan commits.', flag: 'CTF{g1t_r3fl0g_s3cr3t_f0und}' },
  { rank: 19, title: 'IDOR Matrix', cat: 'Web', pts: 350, desc: 'Insecure Direct Object Reference leaking victim records.', flag: 'CTF{1d0r_uuid_pr3d1ct4bl3}' },
  { rank: 20, title: 'The Traitor’s Audio', cat: 'Forensics', pts: 350, desc: 'Decode SSTV audio transmission hidden in WAV static.', flag: 'CTF{sstv_aud10_ tr4nsm1ss10n}' },
  { rank: 21, title: 'SQLi Time Delay', cat: 'Web', pts: 300, desc: 'Blind time-based SQL injection with pg_sleep.', flag: 'CTF{t1m3_b4s3d_sql1_unl0ck3d}' },
  { rank: 22, title: 'XOR Labyrinth', cat: 'Rev', pts: 300, desc: 'Reverse multi-stage XOR loops in a stripped Go binary.', flag: 'CTF{g0_x0r_l4byr1nth_c0nqu3r3d}' },
  { rank: 23, title: 'The Phantom Header', cat: 'Web', pts: 250, desc: 'Inspect hidden response headers and debug cookies.', flag: 'CTF{c00k13_m0nst3r_burp3d}' },
  { rank: 24, title: 'The Deep Metadata', cat: 'Forensics', pts: 200, desc: 'BSSID wireless triangulation and camera serial lookup.', flag: 'CTF{3x1f_gps_bss1d_tr4ck3d}' },
  { rank: 25, title: 'Corrupt Header', cat: 'Forensics', pts: 200, desc: 'Repair damaged magic bytes on a corrupt PNG file.', flag: 'CTF{png_m4g1c_byt3s_r3st0r3d}' },
  { rank: 26, title: 'Layered Secrets', cat: 'Forensics', pts: 150, desc: 'LSB bitplane steganography on the red channel.', flag: 'CTF{lsb_st3g_und3r_bl00d}' },
  { rank: 27, title: 'The Cipher Cell Chit', cat: 'Crypto', pts: 100, desc: 'Decipher the 13-step Caesar cipher chit found at the scene.', flag: 'CTF{13_st3ps_4h34d_0f_k1ll3r}' },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[+] Connected to MongoDB for seeding...');

  await Challenge.deleteMany({});
  console.log('[-] Cleared old challenges.');

  for (const item of challengesData) {
    const salt = crypto.randomBytes(16).toString('hex');
    const flagHash = hashFlag(item.flag, salt);

    await Challenge.create({
      title: item.title,
      slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: item.desc,
      category: item.cat,
      difficultyRank: item.rank,
      initialPoints: item.pts,
      points: item.pts,
      flagHash,
      salt,
      solvesCount: 0,
    });
  }

  console.log('🎉 Successfully seeded all 27 challenges into MongoDB Atlas!');
  process.exit(0);
}

seed().catch(console.error);