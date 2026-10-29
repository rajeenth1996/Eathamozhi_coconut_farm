import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeHidden = searchParams.get('all') === 'true' || searchParams.get('admin') === 'true';
  const palms = await DataStore.getParentPalmsAsync();
  const result = includeHidden ? palms : palms.filter(p => p.isVisible !== false);
  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.code || !body.name) {
      return NextResponse.json({ error: 'Mother tree code and name required' }, { status: 400 });
    }

    const created = await DataStore.addParentPalmAsync(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create mother tree record' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const identifier = body.id || body.code;
    if (!identifier) {
      return NextResponse.json({ error: 'Mother tree id or code is required' }, { status: 400 });
    }
    const updated = await DataStore.updateParentPalmAsync(identifier, body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update mother tree' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'code parameter required' }, { status: 400 });
    }
    await DataStore.deleteParentPalmAsync(code);
    return NextResponse.json({ success: true, message: `Mother tree ${code} deleted.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete mother tree' }, { status: 500 });
  }
}
