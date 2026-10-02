import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { parseAndValidateIIITNR } from '../utils/collegeValidator.js';
import { sendPasswordResetEmail } from '../utils/email.js';

function getGoogleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is missing from server environment');
  }
  return new OAuth2Client(clientId);
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for CTF convenience
  path: '/',
};

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    branch: user.branch,
    batchYear: user.batchYear,
    score: user.score,
    role: user.role,
    isVerified: user.isVerified,
  };
}

function signAndSetCookie(res, user) {
  const token = jwt.sign(
    { 
      id: user._id, 
      role: user.role, 
      email: user.email,
      tokenVersion: user.tokenVersion ?? 0 // Embed current version
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie('token', token, COOKIE_OPTIONS);
  return token;  
}

// 1. REGISTER — auto-verified + instant session (no OTP)
export const register = async (req, res) => {
  const { name, email, password, branch, batchYear } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }
  if (password.length > 128) {
    return res.status(400).json({ message: 'Password is too long.' });
  }

  const validation = parseAndValidateIIITNR(email);
  if (!validation.isValid) {
    return res.status(400).json({ message: validation.error });
  }

  try {
    const existingUser = await User.findOne({ email: validation.normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        message: 'An account with this IIIT-NR email already exists. Please sign in.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: validation.normalizedEmail,
      password: hashedPassword,
      branch: branch || 'CSE',
      batchYear: batchYear || '1st Year (Freshers)',
      isVerified: true,
    });


     const token = signAndSetCookie(res, user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome detective.',
      token, // <-- Send token in response
      user: publicUser(user),
    });
  } catch (error) {
    console.error('[-] register error:', error.message);
    return res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'Registration failed.' : error.message,
    });
  }
};

// 2. VERIFY OTP — kept for compatibility, but optional now
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  try {
    const normalized = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalized }).select('+otpHash +otpExpires +password');

    if (!user) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    // Already verified → just log them in
    if (user.isVerified) {
      const token = signAndSetCookie(res, user);
      return res.json({
        success: true,
        message: 'Already verified. Welcome back.',
        token,
        user: publicUser(user),
      });
    }

    if (!user.otpHash || !user.otpExpires || user.otpExpires < Date.now()) {
      // No OTP flow anymore — auto-verify old accounts
      user.isVerified = true;
      user.otpHash = undefined;
      user.otpExpires = undefined;
      await user.save();
      signAndSetCookie(res, user);
      return res.json({
        success: true,
        message: 'Identity verified. Welcome, detective.',
        user: publicUser(user),
      });
    }

    const isMatch = await bcrypt.compare(String(otp).trim(), user.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid clearance code.' });
    }

    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = signAndSetCookie(res, user);

    return res.json({
      success: true,
      message: 'Identity verified. Welcome, detective.',
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error('[-] verifyOtp error:', error.message);
    return res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'Verification failed.' : error.message,
    });
  }
};

// 3. RESEND OTP — no-op friendly response (OTP disabled)
export const resendOtp = async (req, res) => {
  return res.json({
    success: true,
    message: 'Email verification is disabled. Please sign in directly.',
  });
};

// 4. LOGIN — no OTP gate; auto-verify old accounts
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const normalized = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalized }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid IIIT-NR email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid IIIT-NR email or password.' });
    }

    if (user.isDisqualified) {
      return res.status(403).json({ message: 'Account disqualified.' });
    }

    // Auto-heal old unverified accounts (from previous OTP system)
    if (!user.isVerified) {
      user.isVerified = true;
      user.otpHash = undefined;
      user.otpExpires = undefined;
      await user.save();
    }

    const token = signAndSetCookie(res, user);

    return res.json({
      success: true,
      signAndSetCookie: true,
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error('[-] login error:', error.message);
    return res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'Login failed.' : error.message,
    });
  }
};

// 5. FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const genericResponse = {
    message: 'If an account exists, a recovery link has been sent to your university email.',
  };

  try {
    const normalized = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalized });

    if (!user) {
      return res.json(genericResponse);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const emailResult = await sendPasswordResetEmail(user.email, resetToken);

    if (process.env.NODE_ENV !== 'production') {
      return res.json({
        ...genericResponse,
        devToken: resetToken,
        devLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`,
        emailSent: emailResult.sent,
      });
    }

    return res.json(genericResponse);
  } catch (error) {
    console.error('[-] forgotPassword error:', error.message);
    return res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'Request failed.' : error.message,
    });
  }
};

// 6. RESET PASSWORD
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword || newPassword.length < 8) {
    return res.status(400).json({
      message: 'Valid token and new password (min 8 characters) required.',
    });
  }
  if (newPassword.length > 128) {
    return res.status(400).json({ message: 'Password is too long.' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;

    // 🔴 ADD THIS LINE HERE:
    user.passwordChangedAt = new Date();

    await user.save();

    res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: 0 });

    return res.json({
      success: true,
      message: 'Password successfully reset! You can now log in.',
    });
  } catch (error) {
    console.error('[-] resetPassword error:', error.message);
    return res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'Reset failed.' : error.message,
    });
  }
};

// 7. GET ME
export const getMe = async (req, res) => {
  return res.json({
    user: publicUser(req.user),
  });
};

// 8. LOGOUT
export const logout = async (req, res) => {
  res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: 0 });
  return res.json({ success: true, message: 'Logged out successfully.' });
};

// 9. GOOGLE SSO — auto-verified
export const googleAuth = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'Google token is required.' });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error('[-] GOOGLE_CLIENT_ID is missing from server/.env');
    return res.status(500).json({ message: 'Google login is not configured on the server.' });
  }

  try {
    const googleClient = getGoogleClient();

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(400).json({ message: 'Google token missing email.' });
    }

    const email = String(payload.email).toLowerCase().trim();
    const name = String(payload.name || email.split('@')[0]).trim();

    console.log(`[+] Google login attempt: ${email}`);

    const isIIITNR =
      email.endsWith('@iiitnr.edu.in') || email.endsWith('@iiitnr.ac.in');

    if (!isIIITNR) {
      return res.status(403).json({
        message: 'Access Restricted: Use your university Google account (@iiitnr.edu.in).',
      });
    }

    let user = await User.findOne({ email }).select('+password');

    if (user) {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(randomPassword, salt);
      user.isVerified = true;
      user.otpHash = undefined;
      user.otpExpires = undefined;
      await user.save();
      console.log(`[+] Google login (verified): ${email}`);
    } else {
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name,
        email,
        password: hashedPassword,
        branch: 'CSE',
        batchYear: '1st Year (Freshers)',
        isVerified: true,
      });

      console.log(`[+] Created new Google user (verified): ${email}`);
    }

    if (user.isDisqualified) {
      return res.status(403).json({ message: 'Account disqualified.' });
    }

    // 🔴 Fixed: Captured into const token
    const token = signAndSetCookie(res, user);

    return res.json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error('[-] Google auth error:', error?.message || error);
    return res.status(401).json({
      message:
        process.env.NODE_ENV === 'production'
          ? 'Google authentication failed.'
          : `Google authentication failed: ${error?.message || 'unknown error'}`,
    });
  }
};