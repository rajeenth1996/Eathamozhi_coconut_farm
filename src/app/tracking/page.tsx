'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function TrackingContent() {
  const searchParams = useSearchParams();
  const initialMobile = searchParams.get('mobile') || searchParams.get('id') || '';

  const [mobile, setMobile] = useState(initialMobile);
  const [bookings, setBookings] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = async (mob: string) => {
    const cleanMob = mob.trim();
    if (!cleanMob) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/bookings?mobile=${encodeURIComponent(cleanMob)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBookings(data);
        } else {
          setBookings([]);
          setError(`No coconut sapling orders found registered with phone number "${cleanMob}".`);
        }
      } else {
        setBookings([]);
        setError('Unable to fetch orders. Please try again.');
      }
    } catch (err) {
      setError('Error fetching tracking info. Please check network.');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  useEffect(() => {
    if (initialMobile) {
      fetchOrders(initialMobile);
    }
  }, [initialMobile]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(mobile);
  };

  const steps = ['Payment review', 'Confirmed', 'Preparing', 'Packed', 'Dispatched', 'Delivered'];

  return (
    <>
      <section className="hero-ambient-mesh text-white py-5 position-relative overflow-hidden border-bottom border-success border-opacity-25">
        <div className="container position-relative py-3">
          <span className="badge bg-warning text-dark px-3 py-2 rounded-pill mb-2 fw-bold">REAL-TIME ORDER TRACKER</span>
          <h1 className="fw-bold mb-0 text-light">Track Your Sapling Orders</h1>
          <p className="text-light opacity-75 small mt-1">Enter your phone number to view all your coconut sapling orders and status</p>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container" style={{ maxWidth: '850px' }}>
          
          {/* Phone Number Only Search Card */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <h5 className="fw-bold text-dark mb-3"><i className="bi bi-phone-vibrate me-2 text-success"></i> Enter Your Phone Number</h5>
            <form onSubmit={handleSearch} className="row g-2 align-items-center">
              <div className="col-md-9">
                <input 
                  type="tel" 
                  className="form-control form-control-lg border-2 border-success" 
                  placeholder="Enter 10-digit Phone / WhatsApp Number..."
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-3">
                <button type="submit" className="btn btn-success btn-lg fw-bold w-100 shadow-sm" disabled={loading}>
                  {loading ? (
                    <span><span className="spinner-border spinner-border-sm me-1"></span> Searching...</span>
                  ) : (
                    <span><i className="bi bi-search me-1"></i> Track Orders</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="alert alert-warning rounded-4 p-4 text-center mb-4 border-warning shadow-sm">
              <i className="bi bi-exclamation-triangle-fill fs-3 text-warning d-block mb-2"></i>
              <h6 className="fw-bold text-dark">{error}</h6>
              <small className="text-muted">Double check your mobile number or contact farm support for help.</small>
            </div>
          )}

          {/* Orders List Result */}
          {bookings.length > 0 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 px-1">
                <h5 className="fw-bold text-dark mb-0">Your Orders ({bookings.length})</h5>
                <small className="text-muted">Showing all orders for <strong>{mobile}</strong></small>
              </div>

              <div className="d-flex flex-column gap-4">
                {bookings.map((booking) => {
                  const currentStepIndex = steps.indexOf(booking.bookingStatus) !== -1 
                    ? steps.indexOf(booking.bookingStatus) 
                    : 0;

                  const whatsappMsg = 
`🌴 *ORDER INQUIRY - EATHAMOZHI COCONUT FARM*

*Booking ID:* ${booking.bookingId}
*Customer:* ${booking.customerName}
*Saplings:* ${booking.quantity} Saplings (${booking.batchCode})
*Status:* ${booking.bookingStatus}

I would like an update on my order status. Thank you!`;
                  const waUrl = `https://wa.me/919486880641?text=${encodeURIComponent(whatsappMsg)}`;

                  return (
                    <div key={booking.id || booking.bookingId} className="card border-0 shadow-lg rounded-4 p-4 bg-white">
                      
                      {/* Header */}
                      <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-3">
                        <div>
                          <small className="text-muted text-uppercase d-block fw-bold">BOOKING REFERENCE</small>
                          <h4 className="fw-bold text-success mb-0">{booking.bookingId}</h4>
                          <small className="text-secondary">{new Date(booking.createdAt).toLocaleDateString()} at {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                        </div>
                        <div className="text-end mt-2 mt-sm-0">
                          <span className="badge bg-success fs-6 me-2 mb-1">PAID (₹{booking.totalAmount.toLocaleString()})</span>
                          <span className={`badge fs-6 d-block d-sm-inline-block ${booking.bookingStatus === 'Payment review' ? 'bg-warning text-dark' : 'bg-dark'}`}>
                            {booking.bookingStatus}
                          </span>
                        </div>
                      </div>

                      {/* Timeline Bar */}
                      <div className="py-2 mb-4 bg-light p-3 rounded-4 border">
                        <small className="fw-bold text-dark d-block text-center mb-3">FULFILLMENT TIMELINE</small>
                        <div className="position-relative mx-2">
                          <div className="progress" style={{ height: '6px' }}>
                            <div 
                              className="progress-bar bg-success" 
                              style={{ width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%` }}
                            ></div>
                          </div>

                          <div className="d-flex justify-content-between position-relative" style={{ marginTop: '-18px' }}>
                            {steps.map((st, idx) => {
                              const isDone = idx <= currentStepIndex;
                              return (
                                <div key={st} className="text-center" style={{ width: '15%' }}>
                                  <div 
                                    className={`rounded-circle d-inline-flex align-items-center justify-content-center border border-2 ${isDone ? 'bg-success text-white border-success' : 'bg-white text-muted border-secondary'}`} 
                                    style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}
                                  >
                                    {isDone ? <i className="bi bi-check-lg"></i> : idx + 1}
                                  </div>
                                  <small className={`d-block mt-1 extra-small ${isDone ? 'text-success fw-bold' : 'text-muted'}`}>
                                    {st}
                                  </small>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Order Logistics Details */}
                      <div className="row g-3 bg-light p-3 rounded-4 border small mb-3">
                        <div className="col-md-4">
                          <span className="text-muted d-block">Batch & Quantity:</span>
                          <strong className="text-dark">{booking.quantity} Saplings ({booking.batchCode})</strong>
                        </div>

                        <div className="col-md-4">
                          <span className="text-muted d-block">Preferred Courier:</span>
                          <strong className="text-success">{booking.deliveryService || 'MSS Parcel Service'}</strong>
                        </div>

                        <div className="col-md-4">
                          <span className="text-muted d-block">Nearest Delivery Hub:</span>
                          <strong className="text-dark">{booking.nearestHub || 'District Main Hub'}</strong>
                        </div>

                        <div className="col-md-6">
                          <span className="text-muted d-block">Expected Delivery Date:</span>
                          <strong className="text-dark">{booking.expectedDeliveryDate || 'As scheduled'}</strong>
                        </div>

                        <div className="col-md-6">
                          <span className="text-muted d-block">Delivery Address:</span>
                          <span className="text-dark fw-bold">{booking.address}, {booking.district}, {booking.state} - {booking.pinCode}</span>
                        </div>
                      </div>

                      {/* Dispatch Courier Information */}
                      {booking.bookingStatus === 'Dispatched' || booking.bookingStatus === 'Delivered' ? (
                        <div className="alert alert-success border-success-subtle mb-3 p-3 rounded-3">
                          <h6 className="fw-bold mb-2"><i className="bi bi-truck me-2"></i> Courier Dispatch Details</h6>
                          <div className="row g-2 small">
                            <div className="col-6">Partner: <strong>{booking.courierName || 'Professional Couriers'}</strong></div>
                            <div className="col-6 text-end">Tracking No: <strong className="font-monospace text-dark">{booking.trackingId || 'PR12948572IN'}</strong></div>
                          </div>
                          <div className="mt-2 text-end">
                            <a href={`https://www.google.com/search?q=${booking.trackingId}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-success fw-bold">
                              <i className="bi bi-box-arrow-up-right me-1"></i> Track Shipment Online
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="alert alert-info border-info-subtle mb-3 p-3 rounded-3 extra-small">
                          <i className="bi bi-info-circle me-1"></i> <strong>Order Status:</strong> {booking.bookingStatus === 'Payment review' ? 'Payment is under review by farm admin. Stock reserved!' : 'Saplings are being prepared in our farm dispatch crate.'}
                        </div>
                      )}

                      {/* Action Links */}
                      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center pt-2 border-top">
                        <Link href={`/confirmation/${booking.bookingId}?name=${encodeURIComponent(booking.customerName)}&qty=${booking.quantity}&batch=${booking.batchCode}&amount=${booking.totalAmount}&mobile=${booking.whatsapp}&date=${encodeURIComponent(booking.expectedDeliveryDate || '')}&courier=${encodeURIComponent(booking.deliveryService || '')}&hub=${encodeURIComponent(booking.nearestHub || '')}`} className="btn btn-sm btn-outline-dark">
                          <i className="bi bi-file-earmark-text me-1"></i> View Order Receipt
                        </Link>
                        <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-success fw-bold">
                          <i className="bi bi-whatsapp me-1"></i> WhatsApp Farm Admin
                        </a>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!searched && (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-search fs-3 d-block mb-2 text-secondary"></i>
              Enter your mobile number above to view all your coconut sapling orders & live delivery progress.
            </div>
          )}

        </div>
      </section>
    </>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="text-center py-5">Loading order tracker...</div>}>
      <TrackingContent />
    </Suspense>
  );
}
