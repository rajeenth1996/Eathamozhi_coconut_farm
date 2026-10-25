import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import { ReviewCreateSchema, validateRequest } from '@/lib/validations';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const reviews = await DataStore.getReviewsAsync();
    return NextResponse.json(reviews);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // 1. Rate Limiting: Max 5 reviews per 10 minutes per IP
  const rateLimit = checkRateLimit(request, 'review');
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit, 'Too many review submissions. Please wait before submitting another review.');
  }

  try {
    const body = await request.json();

    // 2. Input Validation with Zod
    const validation = validateRequest(ReviewCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error,
          issues: validation.issues,
        },
        { status: 400 }
      );
    }

    const newReview = await DataStore.addReviewAsync(validation.data);
    return NextResponse.json(newReview, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create review' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Review ID is required for editing' }, { status: 400 });
    }

    const updated = await DataStore.updateReviewAsync(body.id, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update review' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    await DataStore.deleteReviewAsync(id);
    return NextResponse.json({ success: true, message: `Review ${id} deleted.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete review' }, { status: 500 });
  }
}
