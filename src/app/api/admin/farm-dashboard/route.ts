import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const summary = await DataStore.getFarmDashboardSummaryAsync();
    return NextResponse.json(summary, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch farm dashboard summary' }, { status: 500 });
  }
}
