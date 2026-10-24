import { NextResponse } from 'next/server';
import {
  isEmailWhitelisted,
  verifyAdminPassword,
  generateOtpCode,
  hashOtp,
  createPreAuthToken,
  ADMIN_WHITELISTED_EMAIL,
} from '@/lib/auth';
import { sendAdminOtpEmail } from '@/lib/email';
import { LoginSchema, validateRequest } from '@/lib/validations';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(req: Request) {
  // 1. Rate Limiting: Max 5 attempts per 15 minutes per IP
  const rateLimit = checkRateLimit(req, 'auth');
  if (!rateLimit.success) {
    return rateLimitResponse(
      rateLimit,
      `Too many failed login attempts. Please wait ${rateLimit.resetSeconds} seconds before trying again.`
    );
  }

  try {
    const body = await req.json();

    // 2. Input Validation with Zod
    const validation = validateRequest(LoginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          issues: validation.issues,
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // 3. Strict whitelist check: Only authorized admin allowed
    if (!isEmailWhitelisted(email)) {
      return NextResponse.json(
        { error: 'Invalid administrator credentials.' },
        { status: 401 }
      );
    }

    // 4. Password verification
    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: 'Invalid administrator credentials.' },
        { status: 401 }
      );
    }

    // 5. Generate 6-digit OTP
    const otp = generateOtpCode();
    const otpHash = hashOtp(otp);

    // 6. Send the OTP directly to registered admin email
    const emailResult = await sendAdminOtpEmail(ADMIN_WHITELISTED_EMAIL, otp);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: `Failed to dispatch verification email: ${emailResult.error}` },
        { status: 500 }
      );
    }

    // 7. Generate 10-minute pre-auth token holding the OTP hash
    const preAuthToken = await createPreAuthToken(ADMIN_WHITELISTED_EMAIL, otpHash);

    return NextResponse.json({
      success: true,
      requires2FA: true,
      preAuthToken,
      devMode: emailResult.devMode,
      message: 'Verification code sent to your registered administrator email address. Please check your inbox.',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred during login.' },
      { status: 500 }
    );
  }
}
