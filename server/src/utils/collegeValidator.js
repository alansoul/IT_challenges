/**
 * Validates that the email belongs to IIIT-NR and rejects email aliases (+tag).
 * Branch and batch year come from the registration form — not from email guessing.
 */
export function parseAndValidateIIITNR(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required.' };
  }

  const normalized = email.trim().toLowerCase();

  // Basic shape check
  if (!normalized.includes('@') || normalized.length > 100) {
    return { isValid: false, error: 'Invalid email format.' };
  }

  // 🔴 ANTI-FARMING PATCH: Disallow email sub-addressing (+aliases like test+1@iiitnr.edu.in)
  if (normalized.includes('+')) {
    return {
      isValid: false,
      error: 'Email aliases containing "+" are not permitted. Please use your standard student address.',
    };
  }

  const isIIITNR =
    normalized.endsWith('@iiitnr.edu.in') || normalized.endsWith('@iiitnr.ac.in');

  if (!isIIITNR) {
    return {
      isValid: false,
      error:
        'Access Restricted: You must use your university email ending with @iiitnr.edu.in',
    };
  }

  // Local-part must not be empty (e.g. "@iiitnr.edu.in")
  const localPart = normalized.split('@')[0];
  if (!localPart || localPart.length < 1) {
    return { isValid: false, error: 'Invalid email format.' };
  }

  return {
    isValid: true,
    normalizedEmail: normalized,
  };
}