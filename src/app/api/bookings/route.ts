import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import { BookingCreateSchema, validateRequest } from '@/lib/validations';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // 1. Rate Limiting: Max 10 bookings per 10 minutes per IP
  const rateLimit = checkRateLimit(request, 'booking');
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit, 'Booking rate limit reached. Please wait a few minutes before submitting again.');
  }

  try {
    const body = await request.json();

    // 2. Input Validation with Zod
    const validation = validateRequest(BookingCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          issues: validation.issues,
        },
        { status: 400 }
      );
    }

    const bookingPayload = { ...validation.data };

    // If paymentScreenshotUrl was provided as base64 data URI, upload it to Cloudinary
    if (bookingPayload.paymentScreenshotUrl && bookingPayload.paymentScreenshotUrl.startsWith('data:image/')) {
      try {
        const uploadRes = await uploadToCloudinary(bookingPayload.paymentScreenshotUrl, 'receipts');
        if (uploadRes.success && uploadRes.url) {
          bookingPayload.paymentScreenshotUrl = uploadRes.url;
        }
      } catch (cloudErr) {
        console.error('Failed to convert base64 payment screenshot to Cloudinary:', cloudErr);
      }
    }

    const newBooking = await DataStore.createBookingAsync(bookingPayload);
    return NextResponse.json(newBooking, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create booking' }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mobile = searchParams.get('mobile');
  if (mobile) {
    const bookings = await DataStore.getBookingsByMobileAsync(mobile);
    return NextResponse.json(bookings);
  }
  const bookings = await DataStore.getBookingsAsync();
  return NextResponse.json(bookings);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, status, courierName, trackingId } = body;
    if (!bookingId || !status) {
      return NextResponse.json({ error: 'bookingId and status are required' }, { status: 400 });
    }
    const changes: any = { bookingStatus: status };
    if (courierName) changes.courierName = courierName;
    if (trackingId) changes.trackingId = trackingId;
    if (status === 'Dispatched') changes.dispatchDate = new Date().toISOString().split('T')[0];

    const updated = await DataStore.updateOrderAsync(bookingId, changes);
    if (!updated) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update booking' }, { status: 500 });
  }
}
