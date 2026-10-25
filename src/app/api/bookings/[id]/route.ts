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
  const { id } = await params;
  const body = await request.json();
  const updated = await DataStore.updateBookingStatusAsync(id, body.status, body.courierName, body.trackingId);
  if (!updated) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}
