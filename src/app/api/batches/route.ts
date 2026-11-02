import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeHidden = searchParams.get('all') === 'true' || searchParams.get('admin') === 'true';
  const farmCode = searchParams.get('farmCode')?.toLowerCase();
  
  let batches = await DataStore.getBatchesAsync();

  if (farmCode && farmCode !== 'all') {
    batches = batches.filter(b => 
      b.primaryFarmCode?.toLowerCase() === farmCode ||
      b.sources?.some(s => s.farmCode.toLowerCase() === farmCode)
    );
  }

  if (includeHidden) {
    return NextResponse.json(batches);
  }
  return NextResponse.json(batches.filter(b => b.isVisible !== false));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newBatch = await DataStore.addBatchAsync(body);
    return NextResponse.json(newBatch, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create batch' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { batchCode, ...updatedFields } = body;
    if (!batchCode) {
      return NextResponse.json({ error: 'batchCode is required for editing' }, { status: 400 });
    }
    const updated = await DataStore.updateBatchAsync(batchCode, updatedFields);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update batch' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'Batch code parameter required' }, { status: 400 });
    }
    await DataStore.deleteBatchAsync(code);
    return NextResponse.json({ success: true, message: `Batch ${code} deleted.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete batch' }, { status: 500 });
  }
}
