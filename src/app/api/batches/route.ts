import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export async function GET() {
  const batches = DataStore.getBatches();
  return NextResponse.json(batches);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.batchCode) {
      return NextResponse.json({ error: 'batchCode is required' }, { status: 400 });
    }

    const newBatch = DataStore.addBatch(body);
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
    const updated = DataStore.updateBatch(batchCode, updatedFields);
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
    DataStore.deleteBatch(code);
    return NextResponse.json({ success: true, message: `Batch ${code} deleted.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete batch' }, { status: 500 });
  }
}
