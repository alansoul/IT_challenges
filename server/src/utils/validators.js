import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().trim().toLowerCase().email('Invalid email address').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  branch: z.enum(['CSE', 'ECE', 'DSAI', 'Other']),
  batchYear: z.enum([
    '1st Year (Freshers)',
    '2nd Year (Seniors)',
    '3rd Year (Super Seniors)',
    '4th Year (Super Super Seniors)',
  ]),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required').max(128),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(20, 'Invalid Google credential token'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().length(64, 'Reset token must be a 64-character hex string'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const submitFlagSchema = z.object({
  flag: z.string().trim().min(1, 'Flag cannot be empty').max(200),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  otp: z
    .string()
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must be 6 numeric digits'),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});