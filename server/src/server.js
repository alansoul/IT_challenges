import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import './config/redis.js';

import authRoutes from './routes/authRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import rateLimit from 'express-rate-limit';

dotenv.config();

// ─── Improvement #14: fail fast if critical env is missing ───────────────
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`[-] FATAL: Missing environment variable ${key}`);
    process.exit(1);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('[-] FATAL: JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

// FRONTEND_URL is strongly recommended (required in production)
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.error('[-] FATAL: FRONTEND_URL must be set in production');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// CRITICAL for Railway / Vercel cross-domain HTTPS cookies:
app.set('trust proxy', 1);

// High-Capacity Campus Wi-Fi Limiter:
// Allows 5,000 requests/min so 700 students sharing 1 campus IP don't get blocked
const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5000, // Raised from 120 to 5000
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'High traffic detected from your campus network. Please wait a moment.',
  },
});

// Protect all /api/ endpoints with the speed camera
app.use('/api/', globalApiLimiter);

// ─── Security headers (Helmet) ───────────────────────────────────────────
// API server: sensible defaults + explicit hardened options
app.use(
  helmet({
    // API returns JSON, not HTML documents — disable CSP that blocks nothing useful here
    // If you later serve HTML from Express, configure contentSecurityPolicy properly.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cookieParser());

// ─── Improvement #13: explicit CORS allowlist ────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

// de-duplicate
const uniqueOrigins = [...new Set(allowedOrigins)];

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (Postman/curl) that send no Origin header
      if (!origin) return callback(null, true);

      if (uniqueOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`[-] Blocked CORS origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // required for HttpOnly cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Limit JSON body size (basic DoS / abuse protection)
app.use(express.json({ limit: '16kb' }));
app.use(morgan('dev'));

// Database
connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

// Global Error Handler (must be after all routes)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[+] Cipher Cell API running on http://localhost:${PORT}`);
  console.log(`[+] Allowed CORS origins: ${uniqueOrigins.join(', ')}`);
});