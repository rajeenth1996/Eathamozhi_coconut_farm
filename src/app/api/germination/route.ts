import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchCode = searchParams.get('batchCode') || undefined;
    const farmCode = searchParams.get('farmCode')?.toLowerCase();

    let sources = await DataStore.getBatchSourcesAsync(batchCode);
    if (farmCode && farmCode !== 'all') {
      sources = sources.filter(s => s.farmCode.toLowerCase() === farmCode);
    }

    const inventory = await DataStore.getBatchInventoryAsync(batchCode);

    // Enrich sources with inventory produced & available
    const enriched = sources.map(s => {
      const inv = inventory.find(i => i.batchSourceId === s.id);
      const pending = Math.max(0, (s.coconutsSown || s.coconutQuantity) - (s.germinatedQuantity || 0) - (s.rejectedQuantity || 0));
      return {
        ...s,
        pendingGermination: pending,
        seedlingsProduced: inv?.seedlingsProduced || s.germinatedQuantity || 0,
        availableQuantity: inv?.availableQuantity || 0,
        bookedQuantity: inv?.bookedQuantity || 0,
        dispatchedQuantity: inv?.dispatchedQuantity || 0,
        damagedQuantity: inv?.damagedQuantity || 0
      };
    });

    return NextResponse.json(enriched, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch germination records' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { sourceId, ...data } = body;
    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId is required' }, { status: 400 });
    }

    const updated = await DataStore.updateGerminationAsync(sourceId, data);
    if (!updated) {
      return NextResponse.json({ error: 'Batch source record not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update germination record' }, { status: 400 });
  }
}
