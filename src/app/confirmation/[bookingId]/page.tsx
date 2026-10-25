'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function BookingConfirmationPage({
  params
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.bookingId;
  const searchParams = useSearchParams();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Query parameter fallbacks (so page NEVER shows 404)
  const nameParam = searchParams.get('name') || 'Customer';
  const qtyParam = searchParams.get('qty') || '0';
  const batchParam = searchParams.get('batch') || 'EM-BATCH';
  const amountParam = searchParams.get('amount') || '0';
  const mobileParam = searchParams.get('mobile') || '';
  const dateParam = searchParams.get('date') || 'Within 7 Days';
  const courierParam = searchParams.get('courier') || 'ST Couriers';
  const hubParam = searchParams.get('hub') || 'District Main Hub';
  const addrParam = searchParams.get('addr') || 'Address registered with order';
  const isPreOrderParam = searchParams.get('isPreOrder') === 'true';
  const paidParam = searchParams.get('paid');
  const balParam = searchParams.get('bal');

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then(res => {
        if (res.ok) return res.json();
        return null;
      })
      .then(data => {
        if (data && !data.error) {
          setBooking(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bookingId]);

  const displayId = booking?.bookingId || bookingId;
  const displayName = booking?.customerName || nameParam;
  const displayMobile = booking?.whatsapp || booking?.mobile || mobileParam;
  const displayQty = booking?.quantity || Number(qtyParam);
  const displayBatch = booking?.batchCode || batchParam;
  const displayAmount = booking?.totalAmount || Number(amountParam);
  const displayDate = booking?.expectedDeliveryDate || dateParam;
  const displayCourier = booking?.deliveryService || courierParam || 'MSS Parcel Service';
  const displayHub = booking?.nearestHub || hubParam || 'Main Hub';
  const displayAddr = booking 
    ? (booking.address && !booking.address.includes(booking.district)
        ? `${booking.address}, ${booking.district}, ${booking.state} - ${booking.pinCode}`
        : (booking.address || `${booking.district}, ${booking.state} - ${booking.pinCode}`))
    : (addrParam || 'District Main Hub');
  const displayScreenshot = booking?.paymentScreenshotUrl;
  const isPreOrder = Boolean(booking?.isPreOrder || booking?.orderType === 'PRE_ORDER' || booking?.bookingStatus === 'Pre-order' || isPreOrderParam);
  const displayPaid = booking?.paidAmount || booking?.advancePaid || (paidParam ? Number(paidParam) : (isPreOrder ? Math.round(displayAmount / 2) : displayAmount));
  const displayBal = booking?.balanceAmount ?? (balParam ? Number(balParam) : (isPreOrder ? Math.max(0, displayAmount - displayPaid) : 0));

  const upiId = process.env.NEXT_PUBLIC_UPI_ID || 'rajeenth1@ybl';
  const upiDisplayName = process.env.NEXT_PUBLIC_UPI_DISPLAY_NAME || 'eathamozhi coconut farm';
  const billNotePrefix = process.env.NEXT_PUBLIC_UPI_BILL_NOTE_PREFIX || 'Coconut order';

  // WhatsApp Pre-filled text
  const whatsappMsg = 
`🌴 *NEW SAPLING ORDER - EATHAMOZHI COCONUT FARM*

*Booking ID:* ${displayId}
*Customer Name:* ${displayName}
*Phone / WhatsApp:* ${displayMobile}
*Sapling Count:* ${displayQty} Saplings
*Batch Code:* ${displayBatch}
*Order Type:* ${isPreOrder ? 'Pre-Order (50% Advance Booking)' : 'Complete Order (100% Payment)'}\n*Total Order Value:* ₹${Number(displayAmount).toLocaleString()}\n*Amount Paid (50% Advance):* ₹${Number(displayPaid).toLocaleString()}${isPreOrder ? `\n*⚠️ Balance to be Paid (at dispatch):* ₹${Number(displayBal).toLocaleString()}` : ''}
*Expected Delivery Date:* ${displayDate}
*Preferred Courier / Delivery Service:* ${displayCourier}
*Nearest Delivery Hub / Town Hub:* ${displayHub}
*UPI ID Paid to:* ${upiId} (${upiDisplayName})
*Bill Note:* ${billNotePrefix} - ${displayQty} saplings

*Delivery Location:*
${displayAddr}

🔍 *Track Order Status Online:*\n${process.env.NEXT_PUBLIC_SITE_URL || 'https://eathamozhi-coconut-farm.vercel.app'}/tracking?bookingId=${encodeURIComponent(displayId)}&mobile=${encodeURIComponent(displayMobile)}\n\nPlease confirm our order and dispatch details. Thank you!`;

  const encodedWa = encodeURIComponent(whatsappMsg);
  const waUrl = `https://wa.me/919486880641?text=${encodedWa}`;

  return (
    <>
      <section className="bg-success text-white py-5 text-center">
        <div className="container py-3">
          <div className="display-1 mb-2">🎉</div>
          <span className="badge bg-warning text-dark px-3 py-2 rounded-pill mb-2 fw-bold">PAYMENT SUBMITTED</span>
          <h1 className="display-4 fw-bold">Booking Details Recorded!</h1>
          <p className="lead mb-0">Thank you for supporting Eathamozhi Coconut Farm.</p>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container" style={{ maxWidth: '800px' }}>
          
          {/* Action Box: Trigger WhatsApp Chat Directly */}
          <div className="bg-success-subtle border border-success p-4 rounded-4 mb-4 text-center shadow-sm">
            <h5 className="fw-bold text-success mb-2">
              <i className="bi bi-whatsapp me-2 fs-4"></i> Complete Order via WhatsApp
            </h5>
            <p className="text-secondary small mb-3">
              Click the green button below to send your pre-filled order receipt directly to our farm admin on WhatsApp!
            </p>
            <a 
              href={waUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-success btn-lg fw-bold w-100 shadow py-3 fs-5"
            >
              <i className="bi bi-whatsapp me-2"></i> Send Order Receipt to WhatsApp Now
            </a>
          </div>
          
          <div className="card border-0 shadow-lg rounded-4 p-4 mb-4 bg-white">
            <div className="text-center border-bottom pb-4 mb-4">
              <small className="text-muted d-block text-uppercase">YOUR UNIQUE BOOKING REFERENCE</small>
              <h2 className="fw-bold text-success display-6 mb-1">{displayId}</h2>
              {isPreOrder ? (
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  <span className="badge bg-warning text-dark border border-warning px-3 py-2 fw-bold">
                    <i className="bi bi-clock-history me-1"></i> PRE-ORDER (50% ADVANCE: ₹{Number(displayPaid).toLocaleString()})
                  </span>
                  <span className="badge bg-danger px-3 py-2 fw-bold">
                    BALANCE DUE: ₹{Number(displayBal).toLocaleString()}
                  </span>
                </div>
              ) : (
                <span className="badge bg-success-subtle text-success border border-success px-3 py-2 fw-bold">
                  <i className="bi bi-check-circle-fill me-1"></i> SUBMITTED (₹{Number(displayAmount).toLocaleString()})
                </span>
              )}
            </div>

            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <h6 className="fw-bold text-dark mb-2">Booking Summary</h6>
                <ul className="list-unstyled text-secondary small">
                  <li className="mb-1">Batch Code: <strong className="text-dark">{displayBatch}</strong></li>
                  <li className="mb-1">Quantity: <strong className="text-dark">{displayQty} Saplings</strong></li>
                  <li className="mb-1">Expected Delivery: <strong className="text-success fw-bold">{displayDate}</strong></li>
                  <li className="mb-1">Total Order Value: <strong className="text-dark fw-bold">₹{Number(displayAmount).toLocaleString()}</strong></li>
                  {isPreOrder && (
                    <>
                      <li className="mb-1 text-success">50% Advance Paid: <strong className="text-success fw-bold">₹{Number(displayPaid).toLocaleString()}</strong></li>
                      <li className="mb-1 text-danger">Balance Due at Dispatch: <strong className="text-danger fw-bold">₹{Number(displayBal).toLocaleString()}</strong></li>
                    </>
                  )}
                </ul>
              </div>

              <div className="col-md-6">
                <h6 className="fw-bold text-dark mb-2">Delivery & Logistics Details</h6>
                <p className="text-secondary small mb-2">
                  <strong>{displayName}</strong><br />
                  {displayAddr}<br />
                  Mobile: {displayMobile}
                </p>
                <div className="p-2 bg-light rounded border small">
                  <div className="mb-1"><strong>Courier Service:</strong> <span className="text-success fw-bold">{displayCourier}</span></div>
                  <div><strong>Nearest Delivery Hub:</strong> <span className="text-dark fw-bold">{displayHub}</span></div>
                </div>
              </div>
            </div>

            {displayScreenshot && (
              <div className="p-3 bg-light rounded-4 border mb-4 text-center">
                <small className="text-muted d-block fw-bold mb-2"><i className="bi bi-camera me-1 text-success"></i> Payment Screenshot Attached</small>
                <img src={displayScreenshot} alt="Payment Receipt" className="img-fluid rounded border mb-2" style={{ maxHeight: '200px' }} />
                <div className="alert alert-success border-success mt-2 mb-0 py-2 px-3 rounded-3 small">
                  <i className="bi bi-cloud-check-fill text-success me-1"></i> Uploaded receipts are saved directly to Cloudinary storage for admin approval. The receipts will be reviewed and approved by farm admin.
                </div>
              </div>
            )}

            <div className="d-flex flex-wrap gap-2 justify-content-center border-top pt-4">
              <Link href={`/tracking?id=${displayId}&mobile=${displayMobile}`} className="btn btn-success fw-bold px-4">
                <i className="bi bi-truck me-1"></i> Track Order Status
              </Link>
              <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-outline-success fw-bold">
                <i className="bi bi-whatsapp me-1"></i> Resend WhatsApp Message
              </a>
              <Link href="/" className="btn btn-outline-secondary">
                Return to Home
              </Link>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
