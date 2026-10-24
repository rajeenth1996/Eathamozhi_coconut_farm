import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || process.env.ADMIN_EMAIL || '';
const SMTP_PASS = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

/**
 * Creates and returns the nodemailer transporter
 */
function getTransporter() {
  if (!SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/**
 * Sends a 6-digit OTP verification code to the whitelisted admin Gmail address
 */
export async function sendAdminOtpEmail(toEmail: string, otp: string): Promise<{ success: boolean; devMode?: boolean; error?: string }> {
  const transporter = getTransporter();

  // If SMTP password is not configured yet, log OTP to console for development testing
  if (!transporter) {
    console.log('\n======================================================');
    console.log(`🔐 [LOCAL DEV OTP] Code for ${toEmail}: ${otp}`);
    console.log('⚠️  SMTP_PASS is not configured in .env.local.');
    console.log('   To receive real emails in Gmail, create a Google App Password');
    console.log('   at: https://myaccount.google.com/apppasswords');
    console.log('======================================================\n');
    return { success: true, devMode: true };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Admin Security Verification Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
        .container { max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; }
        .header { background: linear-gradient(135deg, #022c22 0%, #064e3b 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; }
        .header p { margin: 0; font-size: 13px; opacity: 0.85; }
        .body { padding: 32px 28px; text-align: center; color: #1f2937; }
        .greeting { font-size: 16px; margin-bottom: 16px; font-weight: 600; }
        .instructions { font-size: 14px; color: #4b5563; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background-color: #ecfdf5; border: 2px dashed #059669; border-radius: 10px; padding: 18px 20px; display: inline-block; margin-bottom: 24px; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #047857; letter-spacing: 8px; margin: 0; }
        .meta { font-size: 13px; color: #6b7280; line-height: 1.5; margin-bottom: 24px; }
        .warning { background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #92400e; text-align: left; }
        .footer { background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌴 Eathamozhy Coconut Farm</h1>
          <p>Two-Factor Admin Authentication</p>
        </div>
        <div class="body">
          <div class="greeting">Hello Administrator,</div>
          <p class="instructions">
            We received a request to access the Eathamozhy Farm Admin Portal with your email:
            <br><strong>${toEmail}</strong>
          </p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p class="meta">
            ⏳ This code is valid for <strong>10 minutes</strong>.
            <br>Enter this code in the admin login screen to complete verification.
          </p>
          <div class="warning">
            ⚠️ <strong>Security Notice:</strong> Never share this code with anyone. Farm staff will never ask for your verification code. If you did not attempt to log in, someone may know your password.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Eathamozhy Coconut Farm. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Eathamozhy Farm Security" <${SMTP_USER}>`,
      to: toEmail,
      subject: `🔑 Your Admin Verification Code: ${otp}`,
      text: `Your Eathamozhy Farm admin login verification code is: ${otp}. It expires in 10 minutes.`,
      html: htmlContent,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send admin OTP email:', error);
    return { success: false, error: error.message || 'Failed to dispatch email' };
  }
}
