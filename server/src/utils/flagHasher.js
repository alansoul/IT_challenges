import crypto from 'crypto';

// Hash raw flag with unique challenge salt
export function hashFlag(rawFlag, salt) {
  const normalized = rawFlag.trim();
  return crypto.createHmac('sha256', salt).update(normalized).digest('hex');
}

// Timing-safe flag verification to stop side-channel attacks
export function verifyFlag(submittedFlag, storedHash, salt) {
  const submittedHash = hashFlag(submittedFlag, salt);
  const bufA = Buffer.from(submittedHash, 'utf8');
  const bufB = Buffer.from(storedHash, 'utf8');

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}