import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const requireAuth = async (req, res, next) => {
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