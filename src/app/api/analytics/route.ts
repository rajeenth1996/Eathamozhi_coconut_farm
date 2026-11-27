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
    const { sessionId, path, title, referrer, referrerSource, device, screenSize, orderId, isSessionEnd } = body;

    if (!sessionId || !path) {
      return NextResponse.json({ error: 'sessionId and path are required' }, { status: 400 });
    }

    // Never track admin pages to keep customer analytics accurate
    if (path.startsWith('/admin') || path.startsWith('/api/')) {
      return NextResponse.json({ skipped: true });
    }

    // Handle session end ping without creating duplicate pageviews
    if (isSessionEnd) {
      DataStore.updateSessionEnd(sessionId);
      if (process.env.MONGODB_URI) {
        try {
          const conn = await connectToDatabase();
          if (conn) {
            await VisitorJourneyModel.updateOne(
              { sessionId },
              { $set: { lastActiveAt: new Date().toISOString() } }
            );
          }
        } catch {
          // Non-fatal
        }
      }
      return NextResponse.json({ success: true, sessionEnded: true }, { status: 200 });
    }

    const confirmMatch = path.match(/^\/confirmation\/([^/?#]+)/i);
    const derivedOrderId = orderId || (confirmMatch ? decodeURIComponent(confirmMatch[1]) : undefined);

    // 1. Record in DataStore (updates both pageViews and visitorJourneys)
    const recordedEvent = DataStore.recordPageView({
      sessionId,
      path,
      title,
      referrer,
      referrerSource,
      device,
      screenSize,
      orderId: derivedOrderId,
    });

    // 1.1 Automatically capture farmer batch views for batch & booking pages
    const batchMatch = path.match(/^\/(?:batches|book)\/([^/?#]+)/i);
    if (batchMatch && batchMatch[1]) {
      const batchCode = decodeURIComponent(batchMatch[1]);
      try {
        await DataStore.recordBatchViewAsync(batchCode, sessionId);
      } catch {
        // non-fatal
      }
    }

    // 2. Persist to MongoDB Atlas if connected (awaited so serverless functions don't drop writes)
    if (process.env.MONGODB_URI) {
      try {
        const conn = await connectToDatabase();
        if (conn) {
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

          const isConversion = Boolean(derivedOrderId || path.startsWith('/confirmation'));
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
                ...(isConversion ? { convertedToOrder: true, ...(derivedOrderId ? { orderId: derivedOrderId } : {}) } : {}),
              },
              $inc: { pathCount: 1 },
              $addToSet: { steps: path },
            },
            { upsert: true }
          );
        }
      } catch {
        // Non-fatal sync error
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record analytics' }, { status: 500 });
  }
}
