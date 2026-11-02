import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeHidden = searchParams.get('all') === 'true' || searchParams.get('admin') === 'true';
  const farmCode = searchParams.get('farmCode')?.toLowerCase();
  const farmId = searchParams.get('farmId');
  const variety = searchParams.get('variety')?.toLowerCase();
  const selectionStatus = searchParams.get('selectionStatus');
  const verificationStatus = searchParams.get('verificationStatus');
  const search = searchParams.get('search')?.toLowerCase();

  let palms = await DataStore.getParentPalmsAsync();

  if (farmCode && farmCode !== 'all') {
    palms = palms.filter(p => p.farmCode.toLowerCase() === farmCode);
  }

  if (farmId && farmId !== 'all') {
    palms = palms.filter(p => p.farmId === farmId);
  }

  if (variety && variety !== 'all') {
    palms = palms.filter(p => p.variety?.toLowerCase().includes(variety));
  }

  if (selectionStatus && selectionStatus !== 'all') {
    palms = palms.filter(p => p.selectionStatus === selectionStatus);
  }

  if (verificationStatus && verificationStatus !== 'all') {
    palms = palms.filter(p => p.verificationStatus === verificationStatus);
  }

  if (search) {
    palms = palms.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.code?.toLowerCase().includes(search) ||
      p.motherTreeCode?.toLowerCase().includes(search) ||
      p.farmCode?.toLowerCase().includes(search)
    );
  }

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
    if (!body.name) {
      return NextResponse.json({ error: 'Mother tree name is required' }, { status: 400 });
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
    const identifier = body.id || body.code || body.motherTreeCode;
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
