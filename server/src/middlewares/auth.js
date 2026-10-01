import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token found.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Include passwordChangedAt to check for stale tokens
    const user = await User.findById(decoded.id).select('-__v +passwordChangedAt');

    if (!user || user.isDisqualified) {
      return res.status(403).json({ message: 'Account disqualified or not found.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Email not verified. Complete OTP clearance first.',
        requiresOtp: true,
        email: user.email,
      });
    }

    // FIX: Check if password was changed AFTER this token was issued
    if (user.passwordChangedAt) {
      const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({ message: 'Password recently changed. Please log in again.' });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expired or invalid token.' });
  }
};