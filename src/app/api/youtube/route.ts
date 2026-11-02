import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true' || searchParams.get('admin') === 'true';
    const videos = await DataStore.getYouTubeVideosAsync();
    const result = all ? videos : videos.filter(v => v.isVisible !== false);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch YouTube videos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.url) {
      return NextResponse.json({ error: 'YouTube video URL is required' }, { status: 400 });
    }
    const created = await DataStore.addYouTubeVideoAsync(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add YouTube video' }, { status: 500 });
  }
}
