import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get('admin') === 'true';

    let posts = await DataStore.getInstagramPostsAsync();
    if (!includeHidden) {
      posts = posts.filter(p => p.isVisible !== false);
    }

    return NextResponse.json(posts, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch Instagram posts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.url) {
      return NextResponse.json({ error: 'Instagram URL is required' }, { status: 400 });
    }

    const created = await DataStore.addInstagramPostAsync(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create Instagram content' }, { status: 400 });
  }
}
