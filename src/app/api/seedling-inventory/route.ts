import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchCode = searchParams.get('batchCode') || undefined;
    const farmCode = searchParams.get('farmCode')?.toLowerCase();

    let inventory = await DataStore.getBatchInventoryAsync(batchCode);
    if (farmCode && farmCode !== 'all') {
      inventory = inventory.filter(i => i.farmCode.toLowerCase() === farmCode);
    }

    const trees = await DataStore.getParentPalmsAsync();
    const farms = await DataStore.getFarmsAsync();

    const enriched = inventory.map(i => {
      const tree = trees.find(t => t.motherTreeCode === i.motherTreeCode || t.code === i.motherTreeCode);
      const farm = farms.find(f => f.farmCode === i.farmCode);
      return {
        ...i,
        treeName: tree?.name || i.motherTreeCode,
        variety: tree?.variety || 'West Coast Tall (Eathamozhi Tall)',
        farmName: farm?.farmName || i.farmCode
      };
    });

    return NextResponse.json(enriched, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch seedling inventory' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { sourceId, ...changes } = body;
    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId / batchSourceId is required' }, { status: 400 });
    }

    const updated = await DataStore.adjustSourceInventoryAsync(sourceId, changes);
    if (!updated) {
      return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update seedling inventory' }, { status: 400 });
  }
}
