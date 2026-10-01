import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { parseAndValidateIIITNR } from '../utils/collegeValidator.js';
import { sendOtpEmail, sendPasswordResetEmail } from '../utils/email.js';

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
  maxAge: 1 * 24 * 60 * 60 * 1000, // FIX: Changed to 1 day (was 7 days)
  path: '/',
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

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

// 1. REGISTER — creates verified user & logs them in immediately (No OTP required)
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
    let existingUser = await User.findOne({ email: validation.normalizedEmail });

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
      isVerified: true, // Auto-verified immediately
    });

    // Generate login session token immediately
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome detective.',
      user: publicUser(user),
    });
  } catch (error) {
    console.error('[-] register error:', error.message);
    return res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'Registration failed.' : error.message,
    });
  }
};

// 2. VERIFY OTP — marks verified + issues session cookie
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

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account already verified. Please sign in.' });
    }

    if (!user.otpHash || !user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new code.' });
    }

    const isMatch = await bcrypt.compare(String(otp).trim(), user.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid clearance code.' });
    }

    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Identity verified. Welcome, detective.',
      user: publicUser(user),
    });
  } catch (error) {
    console.error('[-] verifyOtp error:', error.message);
    return res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'Verification failed.' : error.message,
    });
  }
};

// 3. RESEND OTP
export const resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const normalized = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalized }).select('+otpHash +otpExpires');

    // Same generic message whether user exists or not (no enumeration)
    const generic = {
      success: true,
      message: 'If an unverified account exists, a new code has been sent.',
    };

    if (!user || user.isVerified) {
      return res.json(generic);
    }

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    user.otpHash = await bcrypt.hash(otp, salt);
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const emailResult = await sendOtpEmail(user.email, otp);

    return res.json({
      ...generic,
      ...(process.env.NODE_ENV !== 'production' && !emailResult.sent
        ? { devOtp: otp }
        : {}),
    });
  } catch (error) {
    console.error('[-] resendOtp error:', error.message);
    return res.status(500).json({
      message: process.env.NODE_ENV === 'production' ? 'Request failed.' : error.message,
    });
  }
};

// 4. LOGIN — blocks unverified; auto-sends OTP if needed
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const normalized = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalized }).select('+password +otpHash +otpExpires');

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

    if (!user.isVerified) {
      const otp = generateOTP();
      const salt = await bcrypt.genSalt(10);
      user.otpHash = await bcrypt.hash(otp, salt);
      user.otpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();

      const emailResult = await sendOtpEmail(user.email, otp);

      return res.status(403).json({
        requiresOtp: true,
        email: user.email,
        message: 'Email not verified. A new clearance code has been sent.',
        ...(process.env.NODE_ENV !== 'production' && !emailResult.sent
          ? { devOtp: otp }
          : {}),
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      success: true,
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
    // Resetting password proves inbox access — mark verified
    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;

    // FIX: Record the time the password changed to invalidate old JWTs
    user.passwordChangedAt = Date.now(); 

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

// 9. GOOGLE SSO — auto-verified (Google already proved email ownership)
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
      // Pre-account takeover fix: revoke any manual password
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(randomPassword, salt);
      user.isVerified = true;
      user.otpHash = undefined;
      user.otpExpires = undefined;
      await user.save();
      console.log(`[+] Google login (password revoked, verified): ${email}`);
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
        isVerified: true, // Google verified
      });

      console.log(`[+] Created new Google user (verified): ${email}`);
    }

    if (user.isDisqualified) {
      return res.status(403).json({ message: 'Account disqualified.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({
      success: true,
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