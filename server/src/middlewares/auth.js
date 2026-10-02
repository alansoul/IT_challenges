import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No session cookie found.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user and include passwordChangedAt and tokenVersion
    const user = await User.findById(decoded.id).select('-__v +passwordChangedAt +tokenVersion');

    if (!user || user.isDisqualified) {
      return res.status(403).json({ message: 'Account disqualified or not found.' });
    }

    // 1. Check if an admin kicked this user out (Token Version check)
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        message: 'Session has been revoked by administrators. Please log in again.',
      });
    }

    // Security Check: Invalidate token if password was changed AFTER this token was issued
    if (user.passwordChangedAt) {
      const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({
          message: 'Password was recently changed. Please log in again with your new credentials.',
        });
      }
    }

    // Auto-heal any leftover unverified accounts from old OTP system
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expired or invalid token.' });
  }
};