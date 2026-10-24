// src/app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export async function GET() {
  try {
    const summary = DataStore.getAnalyticsSummary();
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
