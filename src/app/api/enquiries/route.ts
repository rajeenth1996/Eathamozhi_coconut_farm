import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import { EnquiryCreateSchema, validateRequest } from '@/lib/validations';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const enquiries = await DataStore.getEnquiriesAsync();
  return NextResponse.json(enquiries);
}

export async function POST(request: Request) {
  // 1. Rate Limiting: Max 5 enquiries per 10 minutes per IP
  const rateLimit = checkRateLimit(request, 'enquiry');
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit, 'Too many enquiries submitted. Please wait a few minutes before submitting another.');
  }

  try {
    const body = await request.json();

    // 2. Input Validation with Zod
    const validation = validateRequest(EnquiryCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          issues: validation.issues,
        },
        { status: 400 }
      );
    }

    const newEnquiry = await DataStore.addEnquiryAsync(validation.data);
    return NextResponse.json(newEnquiry, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to submit enquiry' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }
    const updated = await DataStore.updateEnquiryStatusAsync(id, status);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update enquiry' }, { status: 500 });
  }
}
