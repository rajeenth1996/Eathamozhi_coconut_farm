'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin';
  const urlError = searchParams.get('error');

  // Step 1: Email + Password
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [preAuthToken, setPreAuthToken] = useState('');
  const [isDevMode, setIsDevMode] = useState(false);

  // Step 2: Email OTP Code
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (urlError === 'session_expired') {
      setErrorMsg('Your session has expired. Please log in again.');
    } else if (urlError === 'unauthorized_email') {
      setErrorMsg('Unauthorized access attempt detected.');
    }
  }, [urlError]);

  // Focus first OTP box when entering Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
      setResendCooldown(30);
    }
  }, [step]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1 Handler: Verify Password & Dispatch Email OTP
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Authentication failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      setPreAuthToken(data.preAuthToken);
      setIsDevMode(Boolean(data.devMode));
      setSuccessMsg(data.message || `Verification code sent to ${email}`);
      setStep(2);
    } catch {
      setErrorMsg('Network error. Unable to connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Input navigation
  const handleOtpChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, ''); // Digits only

    const newCode = [...otpCode];
    if (cleanVal.length > 1) {
      // User pasted full 6 digits
      const pasted = cleanVal.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        newCode[i] = char;
      });
      setOtpCode(newCode);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    newCode[index] = cleanVal;
    setOtpCode(newCode);

    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Step 2 Handler: Verify Email OTP Code
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeString = otpCode.join('');

    if (codeString.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the code sent to your Gmail.');
      return;
    }

    setErrorMsg('');
    setVerifyingOtp(true);

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preAuthToken,
          code: codeString,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid 6-digit code. Please check your Gmail.');
        setVerifyingOtp(false);
        return;
      }

      // Success -> Redirect to Admin Dashboard
      router.push(redirectTarget);
      router.refresh();
    } catch {
      setErrorMsg('Verification failed due to a network error. Try again.');
      setVerifyingOtp(false);
    }
  };

  // Resend OTP Handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendingOtp) return;
    setResendingOtp(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preAuthToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setPreAuthToken(data.preAuthToken);
        setOtpCode(['', '', '', '', '', '']);
        setSuccessMsg(data.message || `New code sent to ${email}`);
        setResendCooldown(30);
        otpInputsRef.current[0]?.focus();
      } else {
        setErrorMsg(data.error || 'Failed to resend code.');
      }
    } catch {
      setErrorMsg('Network error while resending code.');
    } finally {
      setResendingOtp(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background: 'radial-gradient(circle at 50% 20%, #064e3b 0%, #022c22 60%, #01140e 100%)',
      }}
    >
      <div className="w-100" style={{ maxWidth: '460px' }}>
        {/* Brand / Logo Header */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow"
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <i className="bi bi-shield-lock-fill text-white fs-2"></i>
          </div>
          <h2 className="fw-bold text-white mb-1">Admin Security Portal</h2>
          <p className="text-light opacity-75 small mb-0">
            Eathamozhy Coconut Farm & Nursery Management
          </p>
        </div>

        {/* Security Alert / Error Notice */}
        {errorMsg && (
          <div className="alert alert-danger py-2 px-3 rounded-3 small mb-3 border-0 shadow-sm d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill flex-shrink-0 text-danger"></i>
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Success Message Notice */}
        {successMsg && !errorMsg && (
          <div className="alert alert-success py-2 px-3 rounded-3 small mb-3 border-0 shadow-sm d-flex align-items-center gap-2">
            <i className="bi bi-check-circle-fill flex-shrink-0 text-success"></i>
            <div>{successMsg}</div>
          </div>
        )}

        {/* Dev Mode Notice if SMTP_PASS not set */}
        {isDevMode && step === 2 && (
          <div className="alert alert-warning py-2 px-3 rounded-3 extra-small mb-3 border-0 shadow-sm">
            <i className="bi bi-info-circle-fill me-1"></i>
            <strong>Local Dev Mode:</strong> Since <code>SMTP_PASS</code> is not configured in <code>.env.local</code>, the 6-digit OTP code has been printed to your <strong>Terminal console</strong>.
          </div>
        )}

        {/* Main Card */}
        <div
          className="card border-0 shadow-lg rounded-4 overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Card Top Progress Bar */}
          <div className="p-3 border-bottom bg-light d-flex align-items-center justify-content-between">
            <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2 py-1">
              <i className="bi bi-envelope-check-fill me-1"></i> GMAIL 2-FACTOR AUTH
            </span>
            <span className="small text-muted fw-semibold">
              Step {step} of 2
            </span>
          </div>

          <div className="card-body p-4">
            {step === 1 ? (
              /* ─── STEP 1: PASSWORD & WHITELISTED EMAIL ─── */
              <form onSubmit={handleStep1Submit}>
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-bold text-dark mb-0">
                      Administrator Email
                    </label>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="bi bi-envelope-check-fill text-success"></i>
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-control border-start-0 ps-0"
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div className="form-text extra-small text-muted">
                    Enter your registered administrator email address to continue.
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold text-dark mb-1">
                    Admin Password
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="bi bi-key-fill text-success"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-control border-start-0 border-end-0 ps-0"
                      placeholder="Enter administrator password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="input-group-text bg-white border-start-0 text-muted"
                      tabIndex={-1}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-success w-100 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    border: 'none',
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Sending OTP to Gmail...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <i className="bi bi-arrow-right"></i>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* ─── STEP 2: GMAIL OTP CODE ENTRY ─── */
              <form onSubmit={handleStep2Submit}>
                <div className="text-center mb-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success mb-2"
                    style={{ width: '52px', height: '52px' }}
                  >
                    <i className="bi bi-envelope-open-fill fs-3"></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-1">Check Your Email</h5>
                  <p className="text-muted extra-small mb-1">
                    We sent a 6-digit verification code to your registered email:
                  </p>
                  <span className="badge bg-light text-dark border fw-semibold py-1 px-2 d-inline-block">
                    <i className="bi bi-shield-check me-1 text-success"></i> Registered Administrator Inbox
                  </span>
                </div>

                {/* 6-Digit OTP inputs */}
                <div className="d-flex justify-content-center gap-2 mb-3">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="form-control text-center fw-bold fs-4 p-0"
                      style={{
                        width: '46px',
                        height: '52px',
                        border: digit ? '2px solid #059669' : '1px solid #ced4da',
                        backgroundColor: digit ? '#ecfdf5' : '#ffffff',
                      }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={verifyingOtp || otpCode.join('').length !== 6}
                  className="btn btn-success w-100 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    border: 'none',
                  }}
                >
                  {verifyingOtp ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-unlock-fill"></i>
                      <span>Verify & Access Dashboard</span>
                    </>
                  )}
                </button>

                {/* Resend and Navigation buttons */}
                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtpCode(['', '', '', '', '', '']);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="btn btn-link text-muted extra-small p-0 text-decoration-none"
                  >
                    <i className="bi bi-arrow-left me-1"></i> Back
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || resendingOtp}
                    className="btn btn-link text-success extra-small p-0 fw-semibold text-decoration-none"
                  >
                    {resendingOtp ? (
                      <span>Sending...</span>
                    ) : resendCooldown > 0 ? (
                      <span className="text-muted">Resend in {resendCooldown}s</span>
                    ) : (
                      <span>
                        <i className="bi bi-arrow-clockwise me-1"></i> Resend Code
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card Footer */}
          <div className="p-3 bg-light border-top text-center">
            <Link
              href="/"
              className="text-decoration-none text-muted extra-small d-inline-flex align-items-center gap-1"
            >
              <i className="bi bi-arrow-left"></i> Return to Public Farm Website
            </Link>
          </div>
        </div>

        {/* Security Notice Footer */}
        <div className="text-center mt-3 text-light opacity-50 extra-small">
          <i className="bi bi-shield-lock-fill me-1"></i> Protected by Two-Factor Authentication (Email Verification)
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-vh-100 d-flex align-items-center justify-content-center text-white"
          style={{ background: '#022c22' }}
        >
          <div className="spinner-border text-success" role="status"></div>
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
