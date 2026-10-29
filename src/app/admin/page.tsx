'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLogoutButton from '@/components/AdminLogoutButton';

export default function AdminDashboardPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [parentPalms, setParentPalms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [batchesRes, palmsRes, bookingsRes] = await Promise.all([
        fetch('/api/batches?all=true'),
        fetch('/api/parent-palms?all=true'),
        fetch('/api/bookings'),
      ]);
      const batchesData = await batchesRes.json();
      const palmsData = await palmsRes.json();
      const bookingsData = await bookingsRes.json();
      
      setBatches(Array.isArray(batchesData) ? batchesData : []);
      setParentPalms(Array.isArray(palmsData) ? palmsData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalProduced = batches.reduce((acc, b) => acc + (b.totalQuantity || 0), 0);
  const totalBooked = batches.reduce((acc, b) => acc + (b.bookedQuantity || 0), 0);
  const totalAvailable = batches.reduce((acc, b) => acc + (b.availableQuantity || 0), 0);
  const activeOrders = bookings.filter(b => b.bookingStatus !== 'Delivered' && b.bookingStatus !== 'Cancelled').length;
  const totalOrders = bookings.length;

  const statusCounts = {
    all: bookings.length,
    preOrder: bookings.filter(b => b.bookingStatus === 'Pre-order' || b.isPreOrder || b.orderType === 'PRE_ORDER').length,
    paymentReview: bookings.filter(b => b.bookingStatus === 'Payment review').length,
    confirmed: bookings.filter(b => b.bookingStatus === 'Confirmed').length,
    preparing: bookings.filter(b => b.bookingStatus === 'Preparing').length,
    packed: bookings.filter(b => b.bookingStatus === 'Packed').length,
    dispatched: bookings.filter(b => b.bookingStatus === 'Dispatched').length,
    delivered: bookings.filter(b => b.bookingStatus === 'Delivered').length,
    cancelled: bookings.filter(b => b.bookingStatus === 'Cancelled').length,
  };

  return (
    <>
      <section className="bg-dark text-white py-4 border-bottom border-success border-3">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="badge bg-danger mb-1">SECURE ADMIN PORTAL</span>
              <h1 className="fw-bold mb-0 text-light">Eathamozhi Farm Admin Dashboard</h1>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="badge bg-dark border border-secondary text-light px-2 py-1 small d-none d-md-inline-flex align-items-center gap-1">
                <i className="bi bi-shield-check text-success"></i> Administrator
              </span>
              <Link href="/admin/analytics" className="btn btn-warning fw-bold btn-sm d-inline-flex align-items-center gap-1 shadow-sm text-dark">
                <i className="bi bi-graph-up-arrow fs-6"></i>
                <span>Visitor Analytics</span>
              </Link>
              <a 
                href="/api/admin/export?type=all" 
                download
                className="btn btn-success fw-bold btn-sm d-inline-flex align-items-center gap-1 shadow-sm"
                title="Download all farm records in Excel spreadsheet"
              >
                <i className="bi bi-file-earmark-excel-fill fs-6"></i>
                <span>Download (Excel)</span>
              </a>
              <Link href="/" className="btn btn-outline-light btn-sm">
                <i className="bi bi-house-door me-1"></i> Public Site
              </Link>
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          
          {/* Executive Stat Cards */}
          <div className="row g-4 mb-5">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-primary border-4">
                <small className="text-muted d-block text-uppercase fw-bold">Total Produced</small>
                <h2 className="fw-bold text-dark mb-0">{loading ? '...' : totalProduced.toLocaleString()}</h2>
                <small className="text-secondary">All Sapling Batches</small>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-success border-4">
                <small className="text-muted d-block text-uppercase fw-bold">Total Booked</small>
                <h2 className="fw-bold text-success mb-0">{loading ? '...' : totalBooked.toLocaleString()}</h2>
                <small className="text-secondary">Confirmed Orders</small>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-warning border-4">
                <small className="text-muted d-block text-uppercase fw-bold">Available Inventory</small>
                <h2 className="fw-bold text-warning mb-0">{loading ? '...' : totalAvailable.toLocaleString()}</h2>
                <small className="text-secondary">Live Stock Remaining</small>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-danger border-4">
                <small className="text-muted d-block text-uppercase fw-bold">Active Orders</small>
                <h2 className="fw-bold text-danger mb-0">{loading ? '...' : activeOrders.toLocaleString()}</h2>
                <small className="text-secondary d-block">{loading ? '' : `${totalOrders} Total Booking(s)`}</small>
                {!loading && (
                  <div className="d-flex flex-wrap gap-1 mt-2">
                    <span className="badge bg-warning text-dark extra-small">Pre: {statusCounts.preOrder}</span>
                    <span className="badge bg-danger-subtle text-danger extra-small">Rev: {statusCounts.paymentReview}</span>
                    <span className="badge bg-success-subtle text-success extra-small">Conf: {statusCounts.confirmed}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Visibility Overview Card */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-5 bg-white border-start border-success border-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <span className="badge bg-success-subtle text-success border border-success extra-small mb-1">
                  <i className="bi bi-eye-fill me-1"></i> CUSTOMER VISIBILITY
                </span>
                <h5 className="fw-bold text-dark mb-1">Catalog &amp; Main Page Visibility</h5>
                <p className="text-secondary small mb-0">
                  Per-item visibility switches (ON/OFF) and filters are located directly in the respective management modules.
                </p>
              </div>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <Link href="/admin/batches" className="btn btn-outline-success btn-sm fw-bold rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2">
                  <i className="bi bi-grid-3x3-gap-fill"></i>
                  <span>Batches ({batches.filter(b => b.isVisible !== false).length} / {batches.length} Visible)</span>
                  <i className="bi bi-arrow-right"></i>
                </Link>
                <Link href="/admin/mother-trees" className="btn btn-outline-success btn-sm fw-bold rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2">
                  <i className="bi bi-tree-fill"></i>
                  <span>Mother Trees ({parentPalms.filter(p => p.isVisible !== false).length} / {parentPalms.length} Visible)</span>
                  <i className="bi bi-arrow-right"></i>
                </Link>
                <Link href="/" target="_blank" className="btn btn-success text-white btn-sm fw-bold rounded-pill px-3 py-2 d-inline-flex align-items-center gap-1 shadow-sm">
                  <i className="bi bi-box-arrow-up-right"></i>
                  <span>Preview Customer View</span>
                </Link>
              </div>
            </div>
          </div>

          {/* System Status Badges */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-5 bg-white">
            <h5 className="fw-bold text-dark mb-3"><i className="bi bi-cpu me-2 text-success"></i> System Integrations & Live Data</h5>
            <div className="d-flex flex-wrap gap-3">
              <span className="badge bg-success-subtle text-success border border-success p-2">
                <i className="bi bi-whatsapp me-1"></i> WhatsApp Business API: Connected
              </span>
              <span className="badge bg-success-subtle text-success border border-success p-2">
                <i className="bi bi-credit-card me-1"></i> UPI Payment Gateway: Active
              </span>
              <span className="badge bg-success-subtle text-success border border-success p-2">
                <i className="bi bi-database me-1"></i> Real-Time Inventory Sync: Active
              </span>
              <span className="badge bg-info-subtle text-info border border-info p-2">
                <i className="bi bi-shield-lock me-1"></i> Audit Logging: Enabled
              </span>
            </div>
          </div>

          {/* Farm Data Export & Excel Reports Center */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-5 bg-white border-start border-success border-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-1">
                  <i className="bi bi-file-earmark-spreadsheet-fill text-success me-2"></i>
                  Farm Data Export &amp; Excel Reports
                </h5>
                <p className="text-secondary small mb-0">
                  Download all verified records (Mother Trees, Customer Orders, Batch Stock, Enquiries, Inventory Audit) directly to Excel (.xlsx).
                </p>
              </div>
              <a 
                href="/api/admin/export?type=all" 
                download
                className="btn btn-success fw-bold px-4 py-2 d-inline-flex align-items-center gap-2 shadow-sm"
              >
                <i className="bi bi-cloud-arrow-down-fill fs-5"></i>
                <span>Download Complete Farm Workbook (.xlsx)</span>
              </a>
            </div>

            <div className="row g-2 pt-3 border-top">
              <div className="col-6 col-lg">
                <a href="/api/admin/export?type=trees" download className="btn btn-outline-secondary btn-sm w-100 text-dark fw-semibold d-flex align-items-center justify-content-center gap-1 py-2 rounded-3 hover-lift-subtle">
                  <i className="bi bi-tree-fill text-success"></i> Mother Trees (.xlsx)
                </a>
              </div>
              <div className="col-6 col-lg">
                <a href="/api/admin/export?type=orders" download className="btn btn-outline-secondary btn-sm w-100 text-dark fw-semibold d-flex align-items-center justify-content-center gap-1 py-2 rounded-3 hover-lift-subtle">
                  <i className="bi bi-bag-check-fill text-primary"></i> Orders &amp; Bookings (.xlsx)
                </a>
              </div>
              <div className="col-6 col-lg">
                <a href="/api/admin/export?type=batches" download className="btn btn-outline-secondary btn-sm w-100 text-dark fw-semibold d-flex align-items-center justify-content-center gap-1 py-2 rounded-3 hover-lift-subtle">
                  <i className="bi bi-grid-3x3-gap-fill text-success"></i> Batches Inventory (.xlsx)
                </a>
              </div>
              <div className="col-6 col-lg">
                <a href="/api/admin/export?type=enquiries" download className="btn btn-outline-secondary btn-sm w-100 text-dark fw-semibold d-flex align-items-center justify-content-center gap-1 py-2 rounded-3 hover-lift-subtle">
                  <i className="bi bi-envelope-paper-fill text-warning"></i> Enquiries (.xlsx)
                </a>
              </div>
              <div className="col-6 col-lg">
                <a href="/api/admin/export?type=audit" download className="btn btn-outline-secondary btn-sm w-100 text-dark fw-semibold d-flex align-items-center justify-content-center gap-1 py-2 rounded-3 hover-lift-subtle">
                  <i className="bi bi-shield-check text-secondary"></i> Inventory Audit (.xlsx)
                </a>
              </div>
              <div className="col-6 col-lg">
                <a href="/api/admin/export?type=reviews" download className="btn btn-outline-secondary btn-sm w-100 text-dark fw-semibold d-flex align-items-center justify-content-center gap-1 py-2 rounded-3 hover-lift-subtle">
                  <i className="bi bi-chat-quote-fill text-warning"></i> Farmer Reviews (.xlsx)
                </a>
              </div>
            </div>

            <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
              <small className="text-secondary extra-small">
                <i className="bi bi-info-circle-fill text-success me-1"></i>
                <strong>Need custom date-range exports?</strong> In <Link href="/admin/orders" className="text-success fw-semibold text-decoration-none">Orders Admin</Link>, you can filter by Order Date range and Expected Delivery Date range and click <em>&ldquo;Download Only Filtered Data&rdquo;</em>.
              </small>
              <Link href="/admin/orders" className="btn btn-sm btn-outline-success extra-small fw-semibold py-1">
                <i className="bi bi-funnel me-1"></i> Filter &amp; Export Orders
              </Link>
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <h5 className="fw-bold text-dark mb-2"><i className="bi bi-grid-3x3-gap text-success me-2"></i> Batch Management</h5>
                <p className="text-secondary small mb-3">Create new batches, assign Mother Palms, set prices, photo gallery & statuses.</p>
                <Link href="/admin/batches" className="btn btn-outline-success fw-bold mt-auto">
                  Manage Batches & Photos <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="fw-bold text-dark mb-0"><i className="bi bi-bag-check text-primary me-2"></i> Order Management</h5>
                  <span className="badge bg-primary-subtle text-primary fw-bold">{loading ? '...' : `${totalOrders} Orders`}</span>
                </div>
                <p className="text-secondary small mb-2">View bookings, check payment screenshots, update status & enter tracking IDs.</p>
                
                {/* Live count tracking */}
                {!loading && (
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    <span className="badge bg-warning bg-opacity-25 text-dark border border-warning extra-small">
                      <i className="bi bi-clock-history me-1"></i>Pre-order: <strong>{statusCounts.preOrder}</strong>
                    </span>
                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger extra-small">
                      <i className="bi bi-hourglass-split me-1"></i>Review: <strong>{statusCounts.paymentReview}</strong>
                    </span>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success extra-small">
                      <i className="bi bi-check-circle-fill me-1"></i>Confirmed: <strong>{statusCounts.confirmed}</strong>
                    </span>
                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary extra-small">
                      <i className="bi bi-truck me-1"></i>Dispatched: <strong>{statusCounts.dispatched}</strong>
                    </span>
                  </div>
                )}

                <Link href="/admin/orders" className="btn btn-outline-primary fw-bold mt-auto">
                  Manage Customer Orders <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <h5 className="fw-bold text-dark mb-2"><i className="bi bi-star-fill text-warning me-2"></i> Farmer Reviews</h5>
                <p className="text-secondary small mb-3">Create, edit, and moderate verified farmer testimonials, star ratings & customer feedback.</p>
                <Link href="/admin/reviews" className="btn btn-outline-warning text-dark fw-bold mt-auto">
                  Manage Farmer Reviews <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <h5 className="fw-bold text-dark mb-2"><i className="bi bi-envelope-paper text-warning me-2"></i> Customer Enquiries</h5>
                <p className="text-secondary small mb-3">View contact form enquiries, customer questions, locations & reply directly on WhatsApp.</p>
                <Link href="/admin/enquiries" className="btn btn-outline-secondary text-dark fw-bold mt-auto">
                  View Customer Enquiries <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <h5 className="fw-bold text-dark mb-2"><i className="bi bi-tree-fill text-success me-2"></i> Mother Tree Genetics</h5>
                <p className="text-secondary small mb-3">Add and update Mother Palms (Parent Trees), yield history, age, plot location & photos.</p>
                <Link href="/admin/mother-trees" className="btn btn-outline-success fw-bold mt-auto">
                  Manage Mother Trees <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                <h5 className="fw-bold text-dark mb-2"><i className="bi bi-box-seam text-secondary me-2"></i> Inventory Audit</h5>
                <p className="text-secondary small mb-3">Adjust inventory for damaged/rejected saplings with mandatory audit log reasons.</p>
                <Link href="/admin/inventory" className="btn btn-outline-secondary fw-bold mt-auto">
                  Adjust Inventory Audit <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 border-start border-warning border-4">
                <h5 className="fw-bold text-dark mb-2"><i className="bi bi-graph-up-arrow text-warning me-2"></i> Visitor &amp; Navigation Analytics</h5>
                <p className="text-secondary small mb-3">Real-time visitor counts, customer purchase funnel, live navigation trails &amp; WhatsApp acquisition.</p>
                <Link href="/admin/analytics" className="btn btn-warning text-dark fw-bold mt-auto">
                  Explore Visitor Analytics <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
