import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import {
  generateOtpCode,
  hashOtp,
  createPreAuthToken,
  ADMIN_WHITELISTED_EMAIL,
  JWT_SECRET_STRING,
  isEmailWhitelisted,
} from '@/lib/auth';
import { sendAdminOtpEmail } from '@/lib/email';

const JWT_KEY = new TextEncoder().encode(JWT_SECRET_STRING);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { preAuthToken } = body || {};

    if (!preAuthToken) {
      return NextResponse.json({ error: 'Pre-auth token is required' }, { status: 400 });
    }

    let email = ADMIN_WHITELISTED_EMAIL;
    try {
      const { payload } = await jwtVerify(preAuthToken, JWT_KEY);
      if (!isEmailWhitelisted(payload.email as string)) {
        return NextResponse.json({ error: 'Unauthorized email' }, { status: 403 });
      }
      email = payload.email as string;
    } catch {
      // If token expired, we can still resend to whitelisted email
    }

    const otp = generateOtpCode();
    const otpHash = hashOtp(otp);

    const emailResult = await sendAdminOtpEmail(email, otp);
    if (!emailResult.success) {
      return NextResponse.json(
        { error: `Failed to resend verification email: ${emailResult.error}` },
        { status: 500 }
      );
    }

    const newPreAuthToken = await createPreAuthToken(email, otpHash);

    return NextResponse.json({
      success: true,
      preAuthToken: newPreAuthToken,
      devMode: emailResult.devMode,
      message: `A new 6-digit code has been sent to ${email}`,
    });
  } catch (err: any) {
    console.error('Resend OTP error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while resending code.' },
      { status: 500 }
    );
  }
}
