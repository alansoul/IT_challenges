import express from 'express';
import {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  googleAuth,
} from '../controllers/authController.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { loginRateLimiter } from '../middlewares/loginLimiter.js';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from '../utils/validators.js';

const router = express.Router();

router.post('/register', loginRateLimiter, validate(registerSchema), register);
router.post('/login', loginRateLimiter, validate(loginSchema), login);
router.post('/google', loginRateLimiter, validate(googleAuthSchema), googleAuth);

router.post('/verify-otp', loginRateLimiter, validate(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', loginRateLimiter, validate(resendOtpSchema), resendOtp);

router.post(
  '/forgot-password',
  loginRateLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);

router.post(
  '/reset-password',
  loginRateLimiter,
  validate(resetPasswordSchema),
  resetPassword
);

router.get('/me', requireAuth, getMe);
router.post('/logout', logout);

export default router;