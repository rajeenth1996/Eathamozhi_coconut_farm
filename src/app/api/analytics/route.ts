// src/app/api/analytics/route.ts
import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { connectToDatabase } from '@/lib/mongodb';
import { PageViewModel, VisitorJourneyModel } from '@/lib/models';

export async function POST(request: Request) {
  // Rate Limiting: Max 120 pageview pings per 10 minutes per IP
  const rateLimit = checkRateLimit(request, 'analytics');
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit, 'Rate limit exceeded');
  }

  try {
    const body = await request.json();
    const { sessionId, path, title, referrer, referrerSource, device, screenSize, orderId } = body;

    if (!sessionId || !path) {
      return NextResponse.json({ error: 'sessionId and path are required' }, { status: 400 });
    }

    // Never track admin pages to keep customer analytics accurate
    if (path.startsWith('/admin') || path.startsWith('/api/')) {
      return NextResponse.json({ skipped: true });
    }

    // 1. Record in DataStore
    const recordedEvent = DataStore.recordPageView({
      sessionId,
      path,
      title,
      referrer,
      referrerSource,
      device,
      screenSize,
      orderId,
    });

    // 2. Asynchronously save to MongoDB Atlas if connected
    if (process.env.MONGODB_URI) {
      (async () => {
        try {
          await connectToDatabase();
          await PageViewModel.create({
            id: recordedEvent.id,
            sessionId: recordedEvent.sessionId,
            path: recordedEvent.path,
            title: recordedEvent.title,
            referrer: recordedEvent.referrer,
            referrerSource: recordedEvent.referrerSource,
            device: recordedEvent.device,
            screenSize: recordedEvent.screenSize,
            timestamp: recordedEvent.timestamp,
          });

          const isConversion = Boolean(orderId || path.startsWith('/confirmation'));
          await VisitorJourneyModel.updateOne(
            { sessionId },
            {
              $setOnInsert: {
                sessionId,
                startedAt: recordedEvent.timestamp,
                device: recordedEvent.device,
                referrerSource: recordedEvent.referrerSource,
              },
              $set: {
                lastActiveAt: recordedEvent.timestamp,
                ...(isConversion ? { convertedToOrder: true, ...(orderId ? { orderId } : {}) } : {}),
              },
              $inc: { pathCount: 1 },
              $addToSet: { steps: path },
            },
            { upsert: true }
          );
        } catch (dbErr) {
          // Non-fatal background sync error
        }
      })();
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record analytics' }, { status: 500 });
  }
}
