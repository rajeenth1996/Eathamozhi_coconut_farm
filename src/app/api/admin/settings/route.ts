import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await DataStore.getSiteSettingsAsync();
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updatePayload: any = {};

    if (typeof body.showBatchesOnMainPage === 'boolean') {
      updatePayload.showBatchesOnMainPage = body.showBatchesOnMainPage;
    }
    if (typeof body.showMotherTreesOnMainPage === 'boolean') {
      updatePayload.showMotherTreesOnMainPage = body.showMotherTreesOnMainPage;
    }

    const updated = await DataStore.updateSiteSettingsAsync(updatePayload);
    return NextResponse.json({
      success: true,
      settings: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 400 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
