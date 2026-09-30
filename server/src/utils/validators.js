import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().toLowerCase().email().max(100),
  password: z.string().min(8).max(128),
  branch: z.enum(['CSE', 'ECE', 'DSAI', 'Other']),
  batchYear: z.enum([
    '1st Year (Freshers)',
    '2nd Year (Seniors)',
    '3rd Year (Super Seniors)',
    '4th Year (Super Super Seniors)',
  ]),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(20),
});

export const submitFlagSchema = z.object({
  flag: z.string().trim().min(1).max(200),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z.string().trim().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});