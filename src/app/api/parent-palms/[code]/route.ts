import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const palm = await DataStore.getParentPalmByCodeAsync(code);
  if (!palm) {
    return NextResponse.json({ error: 'Mother tree not found' }, { status: 404 });
  }
  return NextResponse.json(palm, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();

    const updated = await DataStore.updateParentPalmAsync(code, body);
    if (!updated) {
      return NextResponse.json({ error: 'Mother tree not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update mother tree' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    await DataStore.deleteParentPalmAsync(code);
    return NextResponse.json({ success: true, message: `Mother tree ${code} deleted.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete mother tree' }, { status: 500 });
  }
}
