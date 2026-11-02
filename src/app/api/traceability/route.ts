import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchCode = searchParams.get('batchCode');
    const bookingId = searchParams.get('bookingId');

    if (batchCode) {
      const trace = await DataStore.getBatchTraceabilityAsync(batchCode);
      if (!trace) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
      }
      return NextResponse.json(trace, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

    if (bookingId) {
      const trace = await DataStore.getOrderTraceabilityAsync(bookingId);
      if (!trace) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json(trace, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

    // Default overview
    const batches = await DataStore.getBatchesAsync();
    const batchList = batches.map(b => DataStore.getBatchTraceability(b.batchCode));

    return NextResponse.json({
      totalBatches: batches.length,
      batches: batchList
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to retrieve traceability data' }, { status: 500 });
  }
}
