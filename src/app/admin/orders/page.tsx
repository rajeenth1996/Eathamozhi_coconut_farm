'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Date Range Filters
  const [orderStartDate, setOrderStartDate] = useState('');
  const [orderEndDate, setOrderEndDate] = useState('');
  const [deliveryStartDate, setDeliveryStartDate] = useState('');
  const [deliveryEndDate, setDeliveryEndDate] = useState('');

  // Modal / Dispatch State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [courierName, setCourierName] = useState('Professional Couriers');
  const [trackingId, setTrackingId] = useState('');

  // Screenshot Preview Modal
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);

  const fetchOrders = async () => {
    const res = await fetch('/api/bookings');
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, status: string) => {
    const ord = orders.find(o => o.bookingId === orderId);

    // RESTRICTION: Only allow confirming if payment screenshot is available!
    if (status !== 'Payment review' && status !== 'Pre-order' && status !== 'Cancelled' && (!ord?.paymentScreenshotUrl || ord.paymentScreenshotUrl.trim() === '')) {
      alert('⚠️ CANNOT CONFIRM ORDER WITHOUT SCREENSHOT!\n\nNo payment screenshot has been uploaded/received for this order. You can only confirm orders after a valid payment screenshot is available.');
      fetchOrders(); // reset select element
      return;
    }

    if (status === 'Dispatched') {
      setSelectedOrder(ord);
      return;
    }

    await updateOrder(orderId, status);
  };

  const updateOrder = async (orderId: string, status: string, courier?: string, trackId?: string) => {
    try {
      const res = await fetch(`/api/bookings/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, courierName: courier, trackingId: trackId })
      });

      if (res.ok) {
        alert(`Order ${orderId} updated to "${status}". Inventory & payment records synchronized!`);
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Live status counts computed across all loaded customer bookings
  const statusCounts = {
    all: orders.length,
    preOrder: orders.filter(o => o.bookingStatus === 'Pre-order' || o.isPreOrder || o.orderType === 'PRE_ORDER').length,
    paymentReview: orders.filter(o => o.bookingStatus === 'Payment review').length,
    confirmed: orders.filter(o => o.bookingStatus === 'Confirmed').length,
    preparing: orders.filter(o => o.bookingStatus === 'Preparing').length,
    packed: orders.filter(o => o.bookingStatus === 'Packed').length,
    dispatched: orders.filter(o => o.bookingStatus === 'Dispatched').length,
    delivered: orders.filter(o => o.bookingStatus === 'Delivered').length,
    cancelled: orders.filter(o => o.bookingStatus === 'Cancelled').length,
  };

  // Filtered orders with date range & expected delivery date range
  const filteredOrders = orders.filter(o => {
    const matchSearch = !search || 
      o.bookingId?.toLowerCase().includes(search.toLowerCase()) || 
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.mobile?.includes(search) ||
      o.batchCode?.toLowerCase().includes(search.toLowerCase()) ||
      o.district?.toLowerCase().includes(search.toLowerCase());

    const isPreOrder = Boolean(o.bookingStatus === 'Pre-order' || o.isPreOrder || o.orderType === 'PRE_ORDER');
    const matchStatus = filterStatus === 'ALL' 
      ? true 
      : filterStatus === 'Pre-order'
        ? isPreOrder
        : o.bookingStatus === filterStatus;

    // Order Placed Date (from o.createdAt YYYY-MM-DD)
    const orderDate = o.createdAt ? o.createdAt.split('T')[0] : '';
    const matchOrderStart = !orderStartDate || (orderDate && orderDate >= orderStartDate);
    const matchOrderEnd = !orderEndDate || (orderDate && orderDate <= orderEndDate);

    // Expected Delivery Date (from o.expectedDeliveryDate YYYY-MM-DD)
    const delivDate = o.expectedDeliveryDate ? o.expectedDeliveryDate.split('T')[0] : '';
    const matchDelivStart = !deliveryStartDate || (delivDate && delivDate >= deliveryStartDate);
    const matchDelivEnd = !deliveryEndDate || (delivDate && delivDate <= deliveryEndDate);

    return matchSearch && matchStatus && matchOrderStart && matchOrderEnd && matchDelivStart && matchDelivEnd;
  });

  const isAnyFilterActive = Boolean(
    search || 
    filterStatus !== 'ALL' || 
    orderStartDate || 
    orderEndDate || 
    deliveryStartDate || 
    deliveryEndDate
  );

  const clearAllFilters = () => {
    setSearch('');
    setFilterStatus('ALL');
    setOrderStartDate('');
    setOrderEndDate('');
    setDeliveryStartDate('');
    setDeliveryEndDate('');
  };

  const handlePreset = (preset: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (preset === 'today') {
      setOrderStartDate(today);
      setOrderEndDate(today);
    } else if (preset === 'oct-orders') {
      setOrderStartDate('2026-10-01');
      setOrderEndDate('2026-10-31');
    } else if (preset === 'deliv-oct') {
      setDeliveryStartDate('2026-10-01');
      setDeliveryEndDate('2026-10-31');
    } else if (preset === 'deliv-upcoming') {
      setDeliveryStartDate('2026-10-20');
      setDeliveryEndDate('2026-10-31');
    }
  };

  // Construct dynamic API export URL
  const getExportUrl = () => {
    const params = new URLSearchParams();
    params.set('type', 'orders');
    if (search.trim()) params.set('search', search.trim());
    if (filterStatus !== 'ALL') params.set('status', filterStatus);
    if (orderStartDate) params.set('orderStartDate', orderStartDate);
    if (orderEndDate) params.set('orderEndDate', orderEndDate);
    if (deliveryStartDate) params.set('deliveryStartDate', deliveryStartDate);
    if (deliveryEndDate) params.set('deliveryEndDate', deliveryEndDate);
    return `/api/admin/export?${params.toString()}`;
  };

  // Instant Client-Side Excel Export for the filtered set
  const downloadFilteredOrdersExcel = () => {
    if (filteredOrders.length === 0) {
      alert('⚠️ No orders match your active filter criteria to export.');
      return;
    }

    const exportRows = filteredOrders.map(b => ({
      'Booking ID': b.bookingId,
      'Order Date': b.createdAt ? b.createdAt.split('T')[0] : 'N/A',
      'Expected Delivery Date': b.expectedDeliveryDate || 'N/A',
      'Customer Name': b.customerName,
      'Mobile': b.mobile,
      'WhatsApp': b.whatsapp || b.mobile,
      'Batch Code': b.batchCode,
      'Quantity (Saplings)': b.quantity,
      'Subtotal (₹)': b.subtotal,
      'Delivery Charge (₹)': b.deliveryCharge,
      'Total Amount (₹)': b.totalAmount,
      'Order Type': b.isPreOrder || b.orderType === 'PRE_ORDER' || b.bookingStatus === 'Pre-order' ? 'Pre-Order (50% Advance)' : 'Complete Order (100%)',
      'Advance Paid (₹)': (b.paidAmount || b.advancePaid || (b.isPreOrder ? Math.round(b.totalAmount / 2) : b.totalAmount)),
      'Balance Amount (₹)': (b.balanceAmount ?? (b.isPreOrder || b.bookingStatus === 'Pre-order' ? Math.max(0, b.totalAmount - (b.paidAmount || Math.round(b.totalAmount / 2))) : 0)),
      'Payment Status': b.paymentStatus,
      'Order Status': b.bookingStatus,
      'Delivery Address': b.address,
      'District': b.district,
      'State': b.state,
      'PIN Code': b.pinCode,
      'Delivery Service / Courier': b.deliveryService || b.courierName || 'MSS Parcel Service',
      'Nearest Delivery Hub': b.nearestHub || 'District Main Hub',
      'Tracking ID': b.trackingId || 'Pending',
      'Dispatch Date': b.dispatchDate || 'N/A',
      'Special Instructions': b.specialInstructions || 'None',
      'Booking Created Timestamp': b.createdAt ? new Date(b.createdAt).toLocaleString('en-IN') : 'N/A',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Filtered Orders');

    const parts: string[] = ['Eathamozhi_Orders'];
    if (orderStartDate || orderEndDate) parts.push(`Placed_${orderStartDate || 'Start'}_to_${orderEndDate || 'End'}`);
    if (deliveryStartDate || deliveryEndDate) parts.push(`Deliv_${deliveryStartDate || 'Start'}_to_${deliveryEndDate || 'End'}`);
    if (filterStatus !== 'ALL') parts.push(filterStatus.replace(/\s+/g, '_'));
    parts.push(new Date().toISOString().split('T')[0]);

    XLSX.writeFile(wb, `${parts.join('_')}.xlsx`);
  };

  return (
    <>
      <section className="bg-dark text-white py-3 border-bottom">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <span className="badge bg-primary me-2">ORDERS ADMIN</span>
            <h3 className="fw-bold mb-0 text-light d-inline align-middle">Order &amp; Payment Verification</h3>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <button 
              type="button"
              onClick={downloadFilteredOrdersExcel}
              className="btn btn-success btn-sm fw-bold shadow-sm d-flex align-items-center gap-1"
              title="Download only the currently filtered orders in Excel"
            >
              <i className="bi bi-file-earmark-excel-fill text-white"></i>
              <span>Download Filtered ({filteredOrders.length})</span>
            </button>
            <a 
              href={getExportUrl()} 
              download 
              className="btn btn-outline-light btn-sm"
              title="Download via API endpoint"
            >
              <i className="bi bi-cloud-arrow-down me-1"></i> API Link
            </a>
            <Link href="/admin" className="btn btn-outline-secondary btn-sm text-light">
              <i className="bi bi-arrow-left me-1"></i> Admin Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          
          {/* Top Booking Pipeline Status Overview & Quick Counters */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white border-top border-primary border-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-bar-chart-fill text-primary"></i>
                  <span>Customer Bookings Status Breakdown</span>
                </h5>
                <small className="text-secondary">Click any status card below to immediately filter the customer booking sheet without going through the entire list</small>
              </div>
              {filterStatus !== 'ALL' && (
                <button 
                  type="button" 
                  onClick={() => setFilterStatus('ALL')}
                  className="btn btn-sm btn-outline-secondary rounded-pill extra-small fw-semibold py-1 px-3 d-inline-flex align-items-center gap-1 shadow-sm"
                >
                  <i className="bi bi-x-circle"></i> Show All ({statusCounts.all})
                </button>
              )}
            </div>

            <div className="row g-2">
              {/* All Bookings */}
              <div className="col-6 col-sm-4 col-md-3 col-lg">
                <div 
                  onClick={() => setFilterStatus('ALL')}
                  className={`card p-2 text-center h-100 rounded-3 cursor-pointer transition-all ${filterStatus === 'ALL' ? 'border-dark bg-dark text-white shadow-sm' : 'border bg-light text-dark hover-lift-subtle'}`}
                  role="button"
                  title="Show all bookings"
                >
                  <small className={`extra-small text-uppercase fw-bold ${filterStatus === 'ALL' ? 'text-light opacity-75' : 'text-muted'}`}>Total Bookings</small>
                  <div className="fs-3 fw-bold my-1">{loading ? '...' : statusCounts.all}</div>
                  <small className={`extra-small ${filterStatus === 'ALL' ? 'text-light' : 'text-secondary'}`}>All Records</small>
                </div>
              </div>

              {/* Pre-order */}
              <div className="col-6 col-sm-4 col-md-3 col-lg">
                <div 
                  onClick={() => setFilterStatus('Pre-order')}
                  className={`card p-2 text-center h-100 rounded-3 cursor-pointer transition-all ${filterStatus === 'Pre-order' ? 'border-warning bg-warning text-dark shadow-sm' : 'border border-warning border-opacity-50 bg-warning-subtle text-dark hover-lift-subtle'}`}
                  role="button"
                  title="Filter by Pre-orders"
                >
                  <small className="extra-small text-uppercase fw-bold text-dark opacity-75">
                    <i className="bi bi-clock-history me-1"></i> Pre-Order
                  </small>
                  <div className="fs-3 fw-bold my-1 text-dark">{loading ? '...' : statusCounts.preOrder}</div>
                  <small className="extra-small text-dark opacity-75">Advance Paid</small>
                </div>
              </div>

              {/* Payment Review */}
              <div className="col-6 col-sm-4 col-md-3 col-lg">
                <div 
                  onClick={() => setFilterStatus('Payment review')}
                  className={`card p-2 text-center h-100 rounded-3 cursor-pointer transition-all ${filterStatus === 'Payment review' ? 'border-danger bg-danger text-white shadow-sm' : 'border border-danger border-opacity-50 bg-danger-subtle text-danger hover-lift-subtle'}`}
                  role="button"
                  title="Filter by Payment Review"
                >
                  <small className={`extra-small text-uppercase fw-bold ${filterStatus === 'Payment review' ? 'text-white opacity-90' : 'text-danger'}`}>
                    <i className="bi bi-hourglass-split me-1"></i> Review
                  </small>
                  <div className={`fs-3 fw-bold my-1 ${filterStatus === 'Payment review' ? 'text-white' : 'text-danger'}`}>{loading ? '...' : statusCounts.paymentReview}</div>
                  <small className={`extra-small ${filterStatus === 'Payment review' ? 'text-white opacity-90' : 'text-danger'}`}>Verify Screenshot</small>
                </div>
              </div>

              {/* Confirmed */}
              <div className="col-6 col-sm-4 col-md-3 col-lg">
                <div 
                  onClick={() => setFilterStatus('Confirmed')}
                  className={`card p-2 text-center h-100 rounded-3 cursor-pointer transition-all ${filterStatus === 'Confirmed' ? 'border-success bg-success text-white shadow-sm' : 'border border-success border-opacity-50 bg-success-subtle text-success hover-lift-subtle'}`}
                  role="button"
                  title="Filter by Confirmed"
                >
                  <small className={`extra-small text-uppercase fw-bold ${filterStatus === 'Confirmed' ? 'text-white opacity-90' : 'text-success'}`}>
                    <i className="bi bi-check-circle-fill me-1"></i> Confirmed
                  </small>
                  <div className={`fs-3 fw-bold my-1 ${filterStatus === 'Confirmed' ? 'text-white' : 'text-success'}`}>{loading ? '...' : statusCounts.confirmed}</div>
                  <small className={`extra-small ${filterStatus === 'Confirmed' ? 'text-white opacity-90' : 'text-success'}`}>Payment Verified</small>
                </div>
              </div>

              {/* Preparing */}
              <div className="col-6 col-sm-4 col-md-3 col-lg">
                <div 
                  onClick={() => setFilterStatus('Preparing')}
                  className={`card p-2 text-center h-100 rounded-3 cursor-pointer transition-all ${filterStatus === 'Preparing' ? 'border-primary bg-primary text-white shadow-sm' : 'border border-primary border-opacity-50 bg-primary-subtle text-primary hover-lift-subtle'}`}
                  role="button"
                  title="Filter by Preparing"
                >
                  <small className={`extra-small text-uppercase fw-bold ${filterStatus === 'Preparing' ? 'text-white opacity-90' : 'text-primary'}`}>
                    <i className="bi bi-gear-fill me-1"></i> Preparing
                  </small>
                  <div className={`fs-3 fw-bold my-1 ${filterStatus === 'Preparing' ? 'text-white' : 'text-primary'}`}>{loading ? '...' : statusCounts.preparing}</div>
                  <small className={`extra-small ${filterStatus === 'Preparing' ? 'text-white opacity-90' : 'text-primary'}`}>Farm Grove</small>
                </div>
              </div>

              {/* Packed */}
              <div className="col-6 col-sm-4 col-md-3 col-lg">
                <div 
                  onClick={() => setFilterStatus('Packed')}
                  className={`card p-2 text-center h-100 rounded-3 cursor-pointer transition-all ${filterStatus === 'Packed' ? 'border-info bg-info text-dark shadow-sm' : 'border border-info border-opacity-50 bg-info-subtle text-dark hover-lift-subtle'}`}
                  role="button"
                  title="Filter by Packed"
                >
                  <small className="extra-small text-uppercase fw-bold text-dark opacity-90">
                    <i className="bi bi-box-seam me-1"></i> Packed
                  </small>
                  <div className="fs-3 fw-bold my-1 text-dark">{loading ? '...' : statusCounts.packed}</div>
                  <small className="extra-small text-dark opacity-75">Ready to Ship</small>
                </div>
              </div>

              {/* Dispatched */}
              <div className="col-6 col-sm-4 col-md-3 col-lg">
                <div 
                  onClick={() => setFilterStatus('Dispatched')}
                  className={`card p-2 text-center h-100 rounded-3 cursor-pointer transition-all ${filterStatus === 'Dispatched' ? 'border-primary bg-primary text-white shadow-sm' : 'border border-primary border-opacity-50 bg-primary-subtle text-primary hover-lift-subtle'}`}
                  role="button"
                  title="Filter by Dispatched"
                >
                  <small className={`extra-small text-uppercase fw-bold ${filterStatus === 'Dispatched' ? 'text-white opacity-90' : 'text-primary'}`}>
                    <i className="bi bi-truck me-1"></i> Dispatched
                  </small>
                  <div className={`fs-3 fw-bold my-1 ${filterStatus === 'Dispatched' ? 'text-white' : 'text-primary'}`}>{loading ? '...' : statusCounts.dispatched}</div>
                  <small className={`extra-small ${filterStatus === 'Dispatched' ? 'text-white opacity-90' : 'text-primary'}`}>In Transit</small>
                </div>
              </div>

              {/* Delivered */}
              <div className="col-6 col-sm-4 col-md-3 col-lg">
                <div 
                  onClick={() => setFilterStatus('Delivered')}
                  className={`card p-2 text-center h-100 rounded-3 cursor-pointer transition-all ${filterStatus === 'Delivered' ? 'border-success bg-success text-white shadow-sm' : 'border border-success border-opacity-50 bg-success-subtle text-success hover-lift-subtle'}`}
                  role="button"
                  title="Filter by Delivered"
                >
                  <small className={`extra-small text-uppercase fw-bold ${filterStatus === 'Delivered' ? 'text-white opacity-90' : 'text-success'}`}>
                    <i className="bi bi-house-check-fill me-1"></i> Delivered
                  </small>
                  <div className={`fs-3 fw-bold my-1 ${filterStatus === 'Delivered' ? 'text-white' : 'text-success'}`}>{loading ? '...' : statusCounts.delivered}</div>
                  <small className={`extra-small ${filterStatus === 'Delivered' ? 'text-white opacity-90' : 'text-success'}`}>Completed</small>
                </div>
              </div>

              {/* Cancelled */}
              <div className="col-6 col-sm-4 col-md-3 col-lg">
                <div 
                  onClick={() => setFilterStatus('Cancelled')}
                  className={`card p-2 text-center h-100 rounded-3 cursor-pointer transition-all ${filterStatus === 'Cancelled' ? 'border-secondary bg-secondary text-white shadow-sm' : 'border bg-light text-secondary hover-lift-subtle'}`}
                  role="button"
                  title="Filter by Cancelled"
                >
                  <small className={`extra-small text-uppercase fw-bold ${filterStatus === 'Cancelled' ? 'text-white opacity-90' : 'text-secondary'}`}>
                    <i className="bi bi-x-circle me-1"></i> Cancelled
                  </small>
                  <div className={`fs-3 fw-bold my-1 ${filterStatus === 'Cancelled' ? 'text-white' : 'text-secondary'}`}>{loading ? '...' : statusCounts.cancelled}</div>
                  <small className={`extra-small ${filterStatus === 'Cancelled' ? 'text-white opacity-90' : 'text-secondary'}`}>Cancelled</small>
                </div>
              </div>
            </div>
          </div>
          
          {/* Advanced Search & Filter Bar */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark mb-0">
                <i className="bi bi-funnel-fill text-success me-2"></i> Filter &amp; Search Orders
              </h5>
              {isAnyFilterActive && (
                <button 
                  onClick={clearAllFilters} 
                  className="btn btn-outline-danger btn-sm py-1 px-3 rounded-pill extra-small fw-semibold"
                >
                  <i className="bi bi-x-circle me-1"></i> Clear All Filters
                </button>
              )}
            </div>

            <div className="row g-3">
              {/* Keyword Search */}
              <div className="col-md-7">
                <label className="form-label small fw-bold text-secondary mb-1">
                  <i className="bi bi-search me-1"></i> Search Order
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search by Booking ID, Customer Name, Mobile, District, Batch..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="col-md-5">
                <label className="form-label small fw-bold text-secondary mb-1">
                  <i className="bi bi-flag-fill me-1"></i> Fulfillment Status
                </label>
                <select 
                  className="form-select"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">All Order Statuses ({statusCounts.all})</option>
                  <option value="Pre-order">Pre-orders ({statusCounts.preOrder})</option>
                  <option value="Payment review">Payment review ({statusCounts.paymentReview})</option>
                  <option value="Confirmed">Confirmed ({statusCounts.confirmed})</option>
                  <option value="Preparing">Preparing ({statusCounts.preparing})</option>
                  <option value="Packed">Packed ({statusCounts.packed})</option>
                  <option value="Dispatched">Dispatched ({statusCounts.dispatched})</option>
                  <option value="Delivered">Delivered ({statusCounts.delivered})</option>
                  <option value="Cancelled">Cancelled ({statusCounts.cancelled})</option>
                </select>
              </div>

              {/* Order Date Range */}
              <div className="col-md-6">
                <div className="p-3 bg-light rounded-3 border">
                  <label className="form-label small fw-bold text-dark mb-2 d-flex align-items-center gap-1">
                    <i className="bi bi-calendar-event text-primary"></i>
                    <span>Order Placed Date Range</span>
                    {(orderStartDate || orderEndDate) && (
                      <span className="badge bg-primary-subtle text-primary extra-small ms-auto">Active</span>
                    )}
                  </label>
                  <div className="row g-2">
                    <div className="col-6">
                      <small className="text-muted d-block extra-small">From Date</small>
                      <input 
                        type="date" 
                        className="form-control form-control-sm"
                        value={orderStartDate}
                        onChange={e => setOrderStartDate(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block extra-small">To Date</small>
                      <input 
                        type="date" 
                        className="form-control form-control-sm"
                        value={orderEndDate}
                        onChange={e => setOrderEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Expected Delivery Date Range */}
              <div className="col-md-6">
                <div className="p-3 bg-light rounded-3 border">
                  <label className="form-label small fw-bold text-dark mb-2 d-flex align-items-center gap-1">
                    <i className="bi bi-truck text-success"></i>
                    <span>Expected Delivery Date Range</span>
                    {(deliveryStartDate || deliveryEndDate) && (
                      <span className="badge bg-success-subtle text-success extra-small ms-auto">Active</span>
                    )}
                  </label>
                  <div className="row g-2">
                    <div className="col-6">
                      <small className="text-muted d-block extra-small">From Date</small>
                      <input 
                        type="date" 
                        className="form-control form-control-sm"
                        value={deliveryStartDate}
                        onChange={e => setDeliveryStartDate(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block extra-small">To Date</small>
                      <input 
                        type="date" 
                        className="form-control form-control-sm"
                        value={deliveryEndDate}
                        onChange={e => setDeliveryEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons & Export Bar */}
              <div className="col-12 pt-2 border-top">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div className="d-flex flex-wrap align-items-center gap-1">
                    <small className="text-muted fw-bold me-1 extra-small">QUICK PRESETS:</small>
                    <button 
                      type="button" 
                      onClick={() => handlePreset('oct-orders')} 
                      className="btn btn-sm btn-outline-secondary py-1 extra-small rounded-pill"
                    >
                      Oct 2026 Placed
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handlePreset('deliv-upcoming')} 
                      className="btn btn-sm btn-outline-secondary py-1 extra-small rounded-pill"
                    >
                      Delivering Late Oct (20-31)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handlePreset('deliv-oct')} 
                      className="btn btn-sm btn-outline-secondary py-1 extra-small rounded-pill"
                    >
                      All Oct Deliveries
                    </button>
                    {isAnyFilterActive && (
                      <button 
                        type="button" 
                        onClick={clearAllFilters} 
                        className="btn btn-sm btn-link text-danger py-1 extra-small text-decoration-none"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Primary Download Filtered Data Button */}
                  <button 
                    type="button"
                    onClick={downloadFilteredOrdersExcel}
                    className="btn btn-success fw-bold px-3 py-2 shadow-sm d-inline-flex align-items-center gap-2"
                  >
                    <i className="bi bi-file-earmark-excel-fill fs-5"></i>
                    <span>Download Only Filtered Data (.xlsx) — {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}</span>
                  </button>
                </div>
              </div>

              {/* Active Filter Pills Bar */}
              {isAnyFilterActive && (
                <div className="col-12 pt-1">
                  <div className="d-flex flex-wrap align-items-center gap-2 bg-light p-2 rounded-3 border">
                    <small className="text-muted fw-bold extra-small">ACTIVE FILTERS ({filteredOrders.length} of {orders.length} orders match):</small>
                    {search && (
                      <span className="badge bg-secondary">
                        Search: &ldquo;{search}&rdquo;
                        <i className="bi bi-x ms-1 cursor-pointer" onClick={() => setSearch('')}></i>
                      </span>
                    )}
                    {filterStatus !== 'ALL' && (
                      <span className="badge bg-primary">
                        Status: {filterStatus}
                        <i className="bi bi-x ms-1 cursor-pointer" onClick={() => setFilterStatus('ALL')}></i>
                      </span>
                    )}
                    {(orderStartDate || orderEndDate) && (
                      <span className="badge bg-info text-dark">
                        Order Date: {orderStartDate || 'Any'} &rarr; {orderEndDate || 'Any'}
                        <i className="bi bi-x ms-1 cursor-pointer" onClick={() => { setOrderStartDate(''); setOrderEndDate(''); }}></i>
                      </span>
                    )}
                    {(deliveryStartDate || deliveryEndDate) && (
                      <span className="badge bg-success">
                        Delivery Date: {deliveryStartDate || 'Any'} &rarr; {deliveryEndDate || 'Any'}
                        <i className="bi bi-x ms-1 cursor-pointer" onClick={() => { setDeliveryStartDate(''); setDeliveryEndDate(''); }}></i>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Orders Table */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
              <div>
                <h4 className="fw-bold text-dark mb-1">
                  Customer Bookings ({filteredOrders.length} / {orders.length})
                </h4>
                {/* Real-time Status Badges on Top of Sheet */}
                <div className="d-flex flex-wrap gap-1 align-items-center mt-2">
                  <span 
                    className={`badge cursor-pointer ${filterStatus === 'ALL' ? 'bg-dark text-white' : 'bg-light text-dark border'}`} 
                    onClick={() => setFilterStatus('ALL')}
                    role="button"
                    title="Show all bookings"
                  >
                    All: <strong>{statusCounts.all}</strong>
                  </span>
                  <span 
                    className={`badge cursor-pointer ${filterStatus === 'Pre-order' ? 'bg-warning text-dark' : 'bg-warning-subtle text-dark border border-warning'}`} 
                    onClick={() => setFilterStatus('Pre-order')}
                    role="button"
                    title="Filter Pre-orders"
                  >
                    <i className="bi bi-clock-history me-1"></i>Pre-order: <strong>{statusCounts.preOrder}</strong>
                  </span>
                  <span 
                    className={`badge cursor-pointer ${filterStatus === 'Payment review' ? 'bg-danger text-white' : 'bg-danger-subtle text-danger border border-danger'}`} 
                    onClick={() => setFilterStatus('Payment review')}
                    role="button"
                    title="Filter Payment Review"
                  >
                    <i className="bi bi-hourglass-split me-1"></i>Review: <strong>{statusCounts.paymentReview}</strong>
                  </span>
                  <span 
                    className={`badge cursor-pointer ${filterStatus === 'Confirmed' ? 'bg-success text-white' : 'bg-success-subtle text-success border border-success'}`} 
                    onClick={() => setFilterStatus('Confirmed')}
                    role="button"
                    title="Filter Confirmed"
                  >
                    <i className="bi bi-check-circle-fill me-1"></i>Confirmed: <strong>{statusCounts.confirmed}</strong>
                  </span>
                  <span 
                    className={`badge cursor-pointer ${filterStatus === 'Preparing' ? 'bg-primary text-white' : 'bg-primary-subtle text-primary border border-primary'}`} 
                    onClick={() => setFilterStatus('Preparing')}
                    role="button"
                    title="Filter Preparing"
                  >
                    <i className="bi bi-gear-fill me-1"></i>Preparing: <strong>{statusCounts.preparing}</strong>
                  </span>
                  <span 
                    className={`badge cursor-pointer ${filterStatus === 'Packed' ? 'bg-info text-dark' : 'bg-info-subtle text-dark border border-info'}`} 
                    onClick={() => setFilterStatus('Packed')}
                    role="button"
                    title="Filter Packed"
                  >
                    <i className="bi bi-box-seam me-1"></i>Packed: <strong>{statusCounts.packed}</strong>
                  </span>
                  <span 
                    className={`badge cursor-pointer ${filterStatus === 'Dispatched' ? 'bg-primary text-white' : 'bg-primary-subtle text-primary border border-primary'}`} 
                    onClick={() => setFilterStatus('Dispatched')}
                    role="button"
                    title="Filter Dispatched"
                  >
                    <i className="bi bi-truck me-1"></i>Dispatched: <strong>{statusCounts.dispatched}</strong>
                  </span>
                  <span 
                    className={`badge cursor-pointer ${filterStatus === 'Delivered' ? 'bg-success text-white' : 'bg-success-subtle text-success border border-success'}`} 
                    onClick={() => setFilterStatus('Delivered')}
                    role="button"
                    title="Filter Delivered"
                  >
                    <i className="bi bi-house-check-fill me-1"></i>Delivered: <strong>{statusCounts.delivered}</strong>
                  </span>
                  <span 
                    className={`badge cursor-pointer ${filterStatus === 'Cancelled' ? 'bg-secondary text-white' : 'bg-light text-secondary border'}`} 
                    onClick={() => setFilterStatus('Cancelled')}
                    role="button"
                    title="Filter Cancelled"
                  >
                    <i className="bi bi-x-circle me-1"></i>Cancelled: <strong>{statusCounts.cancelled}</strong>
                  </span>
                </div>
              </div>
              <button 
                type="button"
                onClick={downloadFilteredOrdersExcel}
                className="btn btn-outline-success btn-sm fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
              >
                <i className="bi bi-download"></i> Export This Filtered View (.xlsx)
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4">Loading orders...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Booking ID &amp; Order Date</th>
                      <th>Customer Details</th>
                      <th>Expected Delivery</th>
                      <th>Batch</th>
                      <th>Qty</th>
                      <th>Order &amp; Total</th>
                      <th>Balance Amount</th>
                      <th>UPI &amp; Screenshot</th>
                      <th>Fulfillment Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(ord => (
                      <tr key={ord.id}>
                        <td>
                          <strong className="text-success d-block">{ord.bookingId}</strong>
                          <small className="text-muted d-block extra-small mt-1">
                            <i className="bi bi-calendar-event me-1 text-primary"></i>
                            {ord.createdAt ? ord.createdAt.split('T')[0] : 'N/A'}
                          </small>
                        </td>
                        <td>
                          <strong className="d-block">{ord.customerName}</strong>
                          <small className="text-muted d-block"><i className="bi bi-phone me-1"></i>{ord.mobile} | {ord.district}</small>
                          <small className="badge bg-light text-dark border extra-small mt-1">
                            <i className="bi bi-truck me-1 text-success"></i>{ord.deliveryService || 'MSS Parcel Service'} ({ord.nearestHub || 'Main Hub'})
                          </small>
                        </td>
                        <td>
                          <span className="badge bg-success-subtle text-success border me-1 d-block fw-bold py-1">
                            <i className="bi bi-calendar-check me-1"></i>{ord.expectedDeliveryDate || 'N/A'}
                          </span>
                          {ord.dispatchDate && (
                            <small className="badge bg-info-subtle text-info border extra-small d-block mt-1">
                              Dispatched: {ord.dispatchDate}
                            </small>
                          )}
                        </td>
                        <td><span className="badge bg-secondary">{ord.batchCode}</span></td>
                        <td><strong className="fs-6">{ord.quantity} Saplings</strong></td>
                        {/* Order Type & Total */}
                        <td>
                          <strong className="text-dark d-block">₹{ord.totalAmount?.toLocaleString()}</strong>
                          {ord.isPreOrder || ord.orderType === 'PRE_ORDER' || ord.bookingStatus === 'Pre-order' ? (
                            <span className="badge bg-warning text-dark extra-small mt-1 d-inline-block">
                              <i className="bi bi-clock-history me-1"></i> Pre-order (Adv: ₹{(ord.paidAmount || ord.advancePaid || Math.round(ord.totalAmount / 2)).toLocaleString()})
                            </span>
                          ) : (
                            <span className="badge bg-success-subtle text-success border border-success extra-small mt-1 d-inline-block">
                              <i className="bi bi-check-circle me-1"></i> Complete (100%)
                            </span>
                          )}
                        </td>

                        {/* Balance Amount Column */}
                        <td>
                          {ord.isPreOrder || ord.orderType === 'PRE_ORDER' || ord.bookingStatus === 'Pre-order' || (ord.balanceAmount && ord.balanceAmount > 0) ? (
                            <div>
                              <strong className="text-danger fs-6 d-block">
                                ₹{(ord.balanceAmount ?? Math.max(0, ord.totalAmount - (ord.paidAmount || Math.round(ord.totalAmount / 2)))).toLocaleString()}
                              </strong>
                              <small className="text-danger fw-semibold extra-small">
                                <i className="bi bi-exclamation-circle me-1"></i> Balance to be paid
                              </small>
                            </div>
                          ) : (
                            <div>
                              <span className="text-success fw-bold small d-block">
                                ₹0 <i className="bi bi-check-circle-fill text-success ms-1"></i>
                              </span>
                              <small className="text-muted extra-small">Paid in full</small>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-success-subtle text-success border border-success d-block mb-1">
                            {process.env.NEXT_PUBLIC_UPI_ID || 'rajeenth1@ybl'}
                          </span>
                          {ord.paymentScreenshotUrl ? (
                            <div className="text-center">
                              <img 
                                src={ord.paymentScreenshotUrl} 
                                alt="Payment Screenshot" 
                                className="rounded border mb-1 shadow-sm cursor-pointer"
                                style={{ width: '50px', height: '50px', objectFit: 'cover', cursor: 'pointer' }}
                                onClick={() => setPreviewScreenshot(ord.paymentScreenshotUrl)}
                              />
                              <button 
                                className="btn btn-sm btn-outline-primary py-0 d-block w-100 text-nowrap extra-small"
                                onClick={() => setPreviewScreenshot(ord.paymentScreenshotUrl)}
                              >
                                <i className="bi bi-eye me-1"></i> View Screenshot
                              </button>
                            </div>
                          ) : (
                            <span className="badge bg-danger-subtle text-danger border border-danger extra-small d-block py-1">
                              <i className="bi bi-exclamation-triangle-fill me-1"></i> Missing Screenshot
                            </span>
                          )}
                        </td>
                        <td>
                          <select 
                            className={`form-select form-select-sm fw-bold ${ord.bookingStatus === 'Pre-order' ? 'border-warning bg-warning bg-opacity-25 text-dark' : ord.bookingStatus === 'Payment review' ? 'border-warning bg-warning-subtle text-dark' : 'border-success text-success'}`}
                            value={ord.bookingStatus}
                            onChange={(e) => handleStatusChange(ord.bookingId, e.target.value)}
                          >
                            <option value="Pre-order">Pre-order</option>
                            <option value="Payment review">Payment review</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Packed">Packed</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>
                          {(() => {
                            const isPreOrderOrder = ord.isPreOrder || ord.orderType === 'PRE_ORDER' || ord.bookingStatus === 'Pre-order';
                            const balanceVal = ord.balanceAmount ?? (isPreOrderOrder ? Math.max(0, ord.totalAmount - (ord.paidAmount || Math.round(ord.totalAmount / 2))) : 0);
                            const advanceVal = ord.paidAmount || ord.advancePaid || (isPreOrderOrder ? Math.round(ord.totalAmount / 2) : ord.totalAmount);
                            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eathamozhi-coconut-farm.vercel.app';
                            const trackingLink = `${siteUrl}/tracking?bookingId=${encodeURIComponent(ord.bookingId)}&mobile=${encodeURIComponent(ord.whatsapp || ord.mobile)}`;

                            const chatMsg = 
                              `Hello ${ord.customerName},\n\n` +
                              `This is Eathamozhi Coconut Farm regarding your sapling order:\n\n` +
                              `📋 *Booking ID:* ${ord.bookingId}\n` +
                              `🌿 *Batch:* ${ord.batchCode}\n` +
                              `🪴 *Saplings:* ${ord.quantity} Saplings\n` +
                              `📦 *Order Type:* ${isPreOrderOrder ? 'Pre-Order (50% Advance Booking)' : 'Complete Order'}\n` +
                              `💰 *Total Order Amount:* ₹${ord.totalAmount?.toLocaleString()}\n` +
                              (isPreOrderOrder ? `💵 *Advance Paid:* ₹${advanceVal?.toLocaleString()}\n` : '') +
                              (isPreOrderOrder ? `⚠️ *Balance to be Paid:* ₹${balanceVal?.toLocaleString()}\n` : `💵 *Payment Status:* Paid in Full\n`) +
                              `🚚 *Courier / Delivery:* ${ord.deliveryService || 'MSS Parcel Service'} (${ord.nearestHub || 'Main Hub'})\n` +
                              `📅 *Expected Delivery:* ${ord.expectedDeliveryDate || 'TBD'}\n` +
                              `📦 *Fulfillment Status:* ${ord.bookingStatus}\n\n` +
                              `🔍 *Track your order live here:*\n` +
                              `${trackingLink}\n\n` +
                              `Please feel free to reach out for any queries. Thank you!`;

                            return (
                              <a
                                href={`https://wa.me/91${ord.whatsapp}?text=${encodeURIComponent(chatMsg)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 shadow-sm"
                                title="Open WhatsApp with order details, balance, and tracking link"
                              >
                                <i className="bi bi-whatsapp"></i> Chat
                              </a>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Screenshot Preview Modal */}
          {previewScreenshot && (
            <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center z-3">
              <div className="card border-0 shadow-lg rounded-4 p-3 bg-white" style={{ maxWidth: '500px', width: '90%' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0">Payment Screenshot Preview</h6>
                  <button className="btn-close" onClick={() => setPreviewScreenshot(null)}></button>
                </div>
                <img src={previewScreenshot} alt="Payment Screenshot" className="img-fluid rounded border" style={{ maxHeight: '450px', objectFit: 'contain' }} />
                <button className="btn btn-dark btn-sm mt-3 w-100" onClick={() => setPreviewScreenshot(null)}>Close Preview</button>
              </div>
            </div>
          )}

          {/* Dispatch Modal */}
          {selectedOrder && (
            <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center z-3">
              <div className="card border-0 shadow-lg rounded-4 p-4 bg-white" style={{ maxWidth: '500px', width: '90%' }}>
                <h4 className="fw-bold text-dark mb-3"><i className="bi bi-truck me-2 text-success"></i> Dispatch Order {selectedOrder.bookingId}</h4>
                <p className="text-secondary small mb-3">Entering courier & tracking details will save the dispatch record.</p>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Courier Partner Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={courierName}
                    onChange={e => setCourierName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Tracking ID / Consignment No. *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. PR12948572IN"
                    value={trackingId}
                    onChange={e => setTrackingId(e.target.value)}
                  />
                </div>

                <div className="d-flex gap-2 justify-content-end mt-4">
                  <button className="btn btn-outline-secondary" onClick={() => setSelectedOrder(null)}>Cancel</button>
                  <button 
                    className="btn btn-success fw-bold"
                    onClick={() => updateOrder(selectedOrder.bookingId, 'Dispatched', courierName, trackingId)}
                  >
                    Save & Dispatch
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>
    </>
  );
}
