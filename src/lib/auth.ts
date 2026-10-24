import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';

// Whitelisted Admin Email - Configured in .env.local
export const ADMIN_WHITELISTED_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

// Configurable via .env.local
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
export const JWT_SECRET_STRING = process.env.JWT_SECRET || 'eathamozhy-coconut-farm-secure-jwt-secret-key-min-32-chars';

const JWT_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

/**
 * Validates whether the given email is the whitelisted admin
 */
export function isEmailWhitelisted(email: string): boolean {
  if (!email || !ADMIN_WHITELISTED_EMAIL) return false;
  return email.trim().toLowerCase() === ADMIN_WHITELISTED_EMAIL;
}

/**
 * Validates step 1 password
 */
export function verifyAdminPassword(password: string): boolean {
  if (!password || !ADMIN_PASSWORD) return false;
  return password === ADMIN_PASSWORD;
}

/**
 * Generates a random 6-digit numeric OTP
 */
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hashes an OTP code using HMAC-SHA256
 */
export function hashOtp(otp: string): string {
  return crypto.createHmac('sha256', JWT_SECRET_STRING).update(otp.trim()).digest('hex');
}

/**
 * Generates temporary 10-minute pre-auth token for Step 2 (Email OTP entry)
 */
export async function createPreAuthToken(email: string, otpHash: string): Promise<string> {
  return new SignJWT({
    email,
    otpHash,
    purpose: 'email_2fa_pending',
    attempts: 0
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(JWT_KEY);
}

/**
 * Verifies the Email OTP code against the pre-auth token
 */
export async function verifyEmailOtp(
  token: string,
  enteredCode: string
): Promise<{ valid: boolean; email?: string; error?: string }> {
  try {
    const { payload } = await jwtVerify(token, JWT_KEY);

    if (payload.purpose !== 'email_2fa_pending') {
      return { valid: false, error: 'Invalid verification session. Please log in again.' };
    }

    if (!isEmailWhitelisted(payload.email as string)) {
      return { valid: false, error: 'Unauthorized email address.' };
    }

    const cleanCode = enteredCode.replace(/\s+/g, '').trim();
    const computedHash = hashOtp(cleanCode);

    if (computedHash !== payload.otpHash) {
      return { valid: false, error: 'Invalid verification code. Please check your Gmail and try again.' };
    }

    return { valid: true, email: payload.email as string };
  } catch (err: any) {
    if (err?.code === 'ERR_JWT_EXPIRED') {
      return { valid: false, error: 'Verification code has expired. Please request a new code.' };
    }
    return { valid: false, error: 'Session expired or invalid. Please log in again.' };
  }
}

/**
 * Creates an authenticated session JWT valid for 12 hours
 */
export async function createAdminSessionToken(email: string): Promise<string> {
  return new SignJWT({ email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(JWT_KEY);
}

/**
 * Verifies the authenticated session JWT
 */
export async function verifyAdminSessionToken(token: string): Promise<{ valid: boolean; email?: string }> {
  try {
    const { payload } = await jwtVerify(token, JWT_KEY);
    if (payload.role !== 'admin' || !isEmailWhitelisted(payload.email as string)) {
      return { valid: false };
    }
    return { valid: true, email: payload.email as string };
  } catch {
    return { valid: false };
  }
}
