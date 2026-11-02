import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const batch = await DataStore.getBatchByCodeAsync(code);
  if (!batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }
  return NextResponse.json(batch);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    if (!Array.isArray(body.images)) {
      return NextResponse.json({ error: 'images array is required' }, { status: 400 });
    }
    const updated = await DataStore.updateBatchAsync(code, { images: body.images });
    if (!updated) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update images' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json().catch(() => ({}));
    const visitorId = body.visitorId || 'anon-visitor';
    const result = await DataStore.recordBatchViewAsync(code, visitorId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record view' }, { status: 500 });
  }
}
