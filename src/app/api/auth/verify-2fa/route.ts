import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyEmailOtp, createAdminSessionToken } from '@/lib/auth';
import { VerifyOtpSchema, validateRequest } from '@/lib/validations';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export async function POST(req: Request) {
  // 1. Rate Limiting: Max 5 attempts per 15 minutes per IP
  const rateLimit = checkRateLimit(req, 'auth');
  if (!rateLimit.success) {
    return rateLimitResponse(
      rateLimit,
      `Too many verification attempts. Please wait ${rateLimit.resetSeconds} seconds before trying again.`
    );
  }

  try {
    const body = await req.json();

    // 2. Input Validation with Zod
    const validation = validateRequest(VerifyOtpSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          issues: validation.issues,
        },
        { status: 400 }
      );
    }

    const { preAuthToken, code } = validation.data;

    // 3. Verify Email OTP
    const verification = await verifyEmailOtp(preAuthToken, code);

    if (!verification.valid || !verification.email) {
      return NextResponse.json(
        { error: verification.error || 'Invalid or expired verification code.' },
        { status: 400 }
      );
    }

    // 4. Issue 12-hour session JWT
    const sessionToken = await createAdminSessionToken(verification.email);

    // 5. Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return NextResponse.json({
      success: true,
      message: 'Email verification successful. Access granted.',
      redirectUrl: '/admin',
    });
  } catch (err: any) {
    console.error('Email OTP verification error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during verification.' },
      { status: 500 }
    );
  }
}
