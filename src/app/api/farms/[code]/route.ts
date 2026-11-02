import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const details = await DataStore.getFarmDetailsAsync(code);
    if (!details) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
    }
    return NextResponse.json(details, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch farm details' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const result = await DataStore.deleteFarmAsync(code);
    if (!result.success) {
      return NextResponse.json({ error: result.reason || 'Failed to delete farm' }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: 'Farm deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete farm' }, { status: 500 });
  }
}
