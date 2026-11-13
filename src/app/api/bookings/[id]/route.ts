import { NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const mobile = searchParams.get('mobile') || undefined;

  const booking = await DataStore.getBookingByIdAsync(id, mobile);
  if (!booking) {
    return NextResponse.json({ error: 'Booking reference not found' }, { status: 404 });
  }

  return NextResponse.json(booking);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 1. If status is being updated, first execute status transitions (for inventory & payment sync)
    if (body.status) {
      await DataStore.updateBookingStatusAsync(id, body.status, body.courierName, body.trackingId);
    }

    // 2. Prepare comprehensive update payload for any modified fields
    const changes: Record<string, any> = {};
    if (body.status) changes.bookingStatus = body.status;
    if (body.status === 'Confirmed') changes.paymentStatus = 'PAID';
    if (body.paymentStatus) changes.paymentStatus = body.paymentStatus;
    if (body.courierName !== undefined) changes.courierName = body.courierName;
    if (body.trackingId !== undefined) changes.trackingId = body.trackingId;
    if (body.paymentScreenshotUrl !== undefined) changes.paymentScreenshotUrl = body.paymentScreenshotUrl;
    if (body.customerName !== undefined) changes.customerName = body.customerName;
    if (body.mobile !== undefined) changes.mobile = body.mobile;
    if (body.whatsapp !== undefined) changes.whatsapp = body.whatsapp;
    if (body.email !== undefined) changes.email = body.email;
    if (body.address !== undefined) changes.address = body.address;
    if (body.district !== undefined) changes.district = body.district;
    if (body.state !== undefined) changes.state = body.state;
    if (body.pinCode !== undefined) changes.pinCode = body.pinCode;
    if (body.nearestHub !== undefined) changes.nearestHub = body.nearestHub;
    if (body.deliveryService !== undefined) changes.deliveryService = body.deliveryService;
    if (body.expectedDeliveryDate !== undefined) changes.expectedDeliveryDate = body.expectedDeliveryDate;
    if (body.specialInstructions !== undefined) changes.specialInstructions = body.specialInstructions;
    if (body.dispatchDate !== undefined) changes.dispatchDate = body.dispatchDate;
    if (body.paidAmount !== undefined) changes.paidAmount = Number(body.paidAmount);
    if (body.balanceAmount !== undefined) changes.balanceAmount = Number(body.balanceAmount);
    if (body.totalAmount !== undefined) changes.totalAmount = Number(body.totalAmount);
    if (body.quantity !== undefined) changes.quantity = Number(body.quantity);

    const updated = await DataStore.updateOrderAsync(id, changes);
    if (!updated) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update booking' }, { status: 500 });
  }
}
