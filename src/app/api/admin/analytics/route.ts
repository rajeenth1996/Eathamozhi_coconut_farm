import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get('range')?.toLowerCase() || 'weekly';
    const range: 'daily' | 'weekly' | 'monthly' | 'all' = 
      rangeParam === 'daily' || rangeParam === 'day' ? 'daily' :
      rangeParam === 'monthly' || rangeParam === 'month' ? 'monthly' :
      rangeParam === 'all' ? 'all' : 'weekly';

    const summary = await DataStore.getAnalyticsSummaryAsync(range);
    return NextResponse.json(summary, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
