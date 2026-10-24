import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import { InventoryAdjustmentSchema, validateRequest } from '@/lib/validations';

export async function GET() {
  return NextResponse.json(DataStore.getAdjustments());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { batchCode, change, reason, adminName } = body || {};

    const validation = validateRequest(InventoryAdjustmentSchema, {
      batchCode,
      quantityChange: change,
      reason,
      adminName: adminName || 'Farm Admin',
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, issues: validation.issues },
        { status: 400 }
      );
    }

    const {
      batchCode: validBatch,
      quantityChange: validChange,
      reason: validReason,
      adminName: validAdmin,
    } = validation.data;

    const log = DataStore.adjustInventory(validBatch, validChange, validReason, validAdmin);
    const updatedBatch = DataStore.getBatchByCode(validBatch);

    return NextResponse.json({
      success: true,
      log,
      updatedBatch,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record inventory adjustment' }, { status: 400 });
  }
}
