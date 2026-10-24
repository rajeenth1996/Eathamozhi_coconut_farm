import { NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number;      // Maximum requests allowed in that window
}

export type RateLimitType = 'auth' | 'booking' | 'enquiry' | 'review' | 'upload' | 'general' | 'analytics';

const RATE_LIMIT_PRESETS: Record<RateLimitType, RateLimitConfig> = {
  // Auth: 5 attempts per 15 minutes (protects login & OTP abuse)
  auth: { windowMs: 15 * 60 * 1000, max: 5 },

  // Booking: 10 bookings per 10 minutes per IP
  booking: { windowMs: 10 * 60 * 1000, max: 10 },

  // Enquiry: 5 inquiries per 10 minutes per IP
  enquiry: { windowMs: 10 * 60 * 1000, max: 5 },

  // Reviews: 5 reviews per 10 minutes per IP
  review: { windowMs: 10 * 60 * 1000, max: 5 },

  // Upload: 20 uploads per 10 minutes per IP
  upload: { windowMs: 10 * 60 * 1000, max: 20 },

  // General API: 60 requests per 1 minute per IP
  general: { windowMs: 60 * 1000, max: 60 },

  // Analytics: 120 pageviews per 10 minutes per IP
  analytics: { windowMs: 10 * 60 * 1000, max: 120 },
};

interface RateLimitRecord {
  timestamps: number[];
}

// Global in-memory storage across hot reloads in dev mode
declare global {
  // eslint-disable-next-line no-var
  var _rateLimitStore: Map<string, RateLimitRecord> | undefined;
}

const store: Map<string, RateLimitRecord> = global._rateLimitStore || new Map();
if (!global._rateLimitStore) {
  global._rateLimitStore = store;
}

// Garbage collection every 2 minutes to prevent memory leak
let lastCleanup = Date.now();
function cleanupExpiredRecords() {
  const now = Date.now();
  if (now - lastCleanup < 2 * 60 * 1000) return;
  lastCleanup = now;

  for (const [key, record] of store.entries()) {
    // Keep records that have timestamps within the longest preset (15 minutes)
    record.timestamps = record.timestamps.filter((t) => now - t < 15 * 60 * 1000);
    if (record.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

/**
 * Extracts client IP from standard reverse proxy headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    '127.0.0.1'
  );
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Checks and updates rate limit for a client IP and action type
 */
export function checkRateLimit(req: Request, type: RateLimitType): RateLimitResult {
  cleanupExpiredRecords();

  const ip = getClientIp(req);
  const key = `${type}:${ip}`;
  const config = RATE_LIMIT_PRESETS[type] || RATE_LIMIT_PRESETS.general;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let record = store.get(key);
  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  const currentCount = record.timestamps.length;
  const oldestTimestamp = record.timestamps[0] || now;
  const resetSeconds = Math.max(1, Math.ceil((oldestTimestamp + config.windowMs - now) / 1000));

  if (currentCount >= config.max) {
    return {
      success: false,
      limit: config.max,
      remaining: 0,
      resetSeconds,
    };
  }

  // Record this request
  record.timestamps.push(now);

  return {
    success: true,
    limit: config.max,
    remaining: config.max - record.timestamps.length,
    resetSeconds,
  };
}

/**
 * Generates an HTTP 429 Too Many Requests response with standard headers
 */
export function rateLimitResponse(result: RateLimitResult, customMessage?: string): NextResponse {
  const message =
    customMessage ||
    `Too many requests. Please wait ${result.resetSeconds} seconds before trying again.`;

  return NextResponse.json(
    {
      error: message,
      retryAfter: result.resetSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.resetSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetSeconds),
      },
    }
  );
}
