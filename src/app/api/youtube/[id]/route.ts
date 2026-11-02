import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await DataStore.updateYouTubeVideoAsync(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update YouTube video' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await DataStore.deleteYouTubeVideoAsync(id);
    if (!success) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Video ${id} deleted.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete YouTube video' }, { status: 500 });
  }
}
