import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  // STRICTLY use the HttpOnly cookie. No fallback to headers.
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. No token found.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-__v');

    if (!user || user.isDisqualified) {
      return res.status(403).json({ message: 'Account disqualified or not found.' });
    }

    // NEW: Enforce OTP Verification
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Email not verified. Complete OTP clearance first.',
        requiresOtp: true,
        email: user.email,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expired or invalid token.' });
  }
};