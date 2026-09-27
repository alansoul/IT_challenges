import express from 'express';
import { getChallenges, submitFlag } from '../controllers/challengeController.js';
import { requireAuth } from '../middlewares/auth.js';
import { submitRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.get('/', requireAuth, getChallenges);
router.post('/:id/submit', requireAuth, submitRateLimiter, submitFlag);

export default router;