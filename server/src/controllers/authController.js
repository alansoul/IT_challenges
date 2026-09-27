import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: 'Missing credential' });

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, hd } = payload;

    // Verify college email domain
    const allowedDomain = process.env.COLLEGE_DOMAIN;
    if (allowedDomain && allowedDomain !== '*' && hd !== allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
      return res.status(403).json({
        message: `Unauthorized! You must use your college email (@${allowedDomain})`,
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, picture });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (error) {
    res.status(400).json({ message: 'Google authentication failed', error: error.message });
  }
};