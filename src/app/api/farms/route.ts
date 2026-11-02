import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const location = searchParams.get('location')?.toLowerCase();
    const status = searchParams.get('status');

    let farms = await DataStore.getFarmsAsync();

    if (search) {
      farms = farms.filter(f =>
        f.farmCode.toLowerCase().includes(search) ||
        f.farmName.toLowerCase().includes(search) ||
        f.ownerName.toLowerCase().includes(search)
      );
    }

    if (location && location !== 'all') {
      farms = farms.filter(f => f.location.toLowerCase().includes(location) || f.locationCode.toLowerCase() === location);
    }

    if (status && status !== 'all') {
      farms = farms.filter(f => f.status.toLowerCase() === status.toLowerCase());
    }

    return NextResponse.json(farms, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch farms' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.farmName || !body.ownerName || !body.location) {
      return NextResponse.json({ error: 'Farm Name, Owner Name, and Location are required' }, { status: 400 });
    }

    const created = await DataStore.addFarmAsync(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to register farm' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { farmCode, ...data } = body;
    if (!farmCode) {
      return NextResponse.json({ error: 'Farm ID / Code is required for updates' }, { status: 400 });
    }

    const updated = await DataStore.updateFarmAsync(farmCode, data);
    if (!updated) {
      return NextResponse.json({ error: 'Farm not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update farm' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'Farm code is required' }, { status: 400 });
    }

    // Check if farm has mother trees or batches
    const details = await DataStore.getFarmDetailsAsync(code);
    if (details && (details.motherTrees?.length > 0 || details.batches?.length > 0)) {
      // Rather than deleting, deactivate the farm to preserve historical data
      const deactivated = await DataStore.updateFarmAsync(code, { status: 'Inactive' });
      return NextResponse.json({
        success: true,
        message: `Farm ${code} has active trees or batches and has been set to Inactive to preserve traceability.`,
        farm: deactivated
      });
    }

    const success = await DataStore.deleteFarmAsync(code);
    return NextResponse.json({ success, message: `Farm ${code} removed.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete farm' }, { status: 500 });
  }
}
