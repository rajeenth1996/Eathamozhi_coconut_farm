'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import AdminLogoutButton from '@/components/AdminLogoutButton';

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [parentPalms, setParentPalms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, batchesRes, palmsRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/farm-dashboard'),
        fetch('/api/batches?all=true'),
        fetch('/api/parent-palms?all=true'),
        fetch('/api/bookings'),
      ]);
      const dashData = await dashRes.json();
      const batchesData = await batchesRes.json();
      const palmsData = await palmsRes.json();
      const bookingsData = await bookingsRes.json();

      setDashboardData(dashData);
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
      <section className="bg-dark text-white py-3 border-bottom border-success border-3">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="badge bg-danger mb-1">SECURE ADMIN PORTAL</span>
              <h1 className="fw-bold mb-0 text-light fs-3">Eathamozhi Farm Executive Dashboard</h1>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="badge bg-dark border border-secondary text-light px-2 py-1 small d-none d-md-inline-flex align-items-center gap-1">
                <i className="bi bi-shield-check text-success"></i> Administrator
              </span>
              <Link href="/admin/traceability" className="btn btn-outline-light btn-sm fw-bold d-inline-flex align-items-center gap-1">
                <i className="bi bi-diagram-3-fill text-success"></i> Traceability
              </Link>
              <Link href="/admin/analytics" className="btn btn-warning fw-bold btn-sm d-inline-flex align-items-center gap-1 shadow-sm text-dark">
                <i className="bi bi-graph-up-arrow fs-6"></i>
                <span>Analytics</span>
              </Link>
              <a 
                href="/api/admin/export?type=all" 
                download
                className="btn btn-success fw-bold btn-sm d-inline-flex align-items-center gap-1 shadow-sm"
                title="Download all farm records in Excel spreadsheet"
              >
                <i className="bi bi-file-earmark-excel-fill fs-6"></i>
                <span>Excel (.xlsx)</span>
              </a>
              <Link href="/" className="btn btn-outline-light btn-sm">
                <i className="bi bi-house-door me-1"></i> Public Site
              </Link>
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </section>

      <AdminNav />

      <section className="py-4 bg-light min-vh-100">
        <div className="container">
          
          {/* Module 2.1: Summary Cards */}
          <div className="mb-4">
            <h5 className="fw-bold text-dark mb-3">
              <i className="bi bi-speedometer2 text-success me-2"></i>
              Farm-Wise Inventory &amp; Performance Summary
            </h5>

            <div className="row g-3">
              {/* Row 1: Farms & Trees */}
              <div className="col-6 col-md-4 col-lg-2">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-success border-4 h-100">
                  <small className="text-muted d-block text-uppercase extra-small fw-bold">Registered Farms</small>
                  <h3 className="fw-bold text-dark mb-0">{loading ? '...' : dashboardData?.totalFarms ?? 0}</h3>
                  <small className="text-secondary extra-small">Provenance Origins</small>
                </div>
              </div>

              <div className="col-6 col-md-4 col-lg-2">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-success border-4 h-100">
                  <small className="text-muted d-block text-uppercase extra-small fw-bold">Mother Trees</small>
                  <h3 className="fw-bold text-dark mb-0">{loading ? '...' : dashboardData?.totalMotherTrees ?? 0}</h3>
                  <small className="text-secondary extra-small">Total Cataloged</small>
                </div>
              </div>

              <div className="col-6 col-md-4 col-lg-2">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-primary border-4 h-100">
                  <small className="text-muted d-block text-uppercase extra-small fw-bold">Selected Trees</small>
                  <h3 className="fw-bold text-primary mb-0">{loading ? '...' : dashboardData?.totalSelectedMotherTrees ?? 0}</h3>
                  <small className="text-secondary extra-small">Verified Elite Stock</small>
                </div>
              </div>

              <div className="col-6 col-md-4 col-lg-2">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-info border-4 h-100">
                  <small className="text-muted d-block text-uppercase extra-small fw-bold">Trees in Batches</small>
                  <h3 className="fw-bold text-info mb-0">{loading ? '...' : dashboardData?.totalMotherTreesUsedInBatches ?? 0}</h3>
                  <small className="text-secondary extra-small">Used as Seed Nut Source</small>
                </div>
              </div>

              <div className="col-6 col-md-4 col-lg-2">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-primary border-4 h-100">
                  <small className="text-muted d-block text-uppercase extra-small fw-bold">Active Batches</small>
                  <h3 className="fw-bold text-dark mb-0">{loading ? '...' : dashboardData?.totalActiveBatches ?? 0}</h3>
                  <small className="text-secondary extra-small">In Cultivation/Sale</small>
                </div>
              </div>

              <div className="col-6 col-md-4 col-lg-2">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-warning border-4 h-100">
                  <small className="text-muted d-block text-uppercase extra-small fw-bold">Coconuts Collected</small>
                  <h3 className="fw-bold text-warning mb-0">{loading ? '...' : (dashboardData?.totalCoconutsCollected ?? 0).toLocaleString()}</h3>
                  <small className="text-secondary extra-small">Raw Seed Nuts</small>
                </div>
              </div>

              {/* Row 2: Seedlings Inventory */}
              <div className="col-6 col-md-3">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-primary border-4 h-100">
                  <small className="text-muted d-block text-uppercase extra-small fw-bold">Seedlings Produced</small>
                  <h3 className="fw-bold text-primary mb-0">{loading ? '...' : (dashboardData?.totalSeedlingsProduced ?? 0).toLocaleString()}</h3>
                  <small className="text-secondary extra-small">Germinated Successfully</small>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-success border-4 h-100">
                  <small className="text-muted d-block text-uppercase extra-small fw-bold">Available Seedlings</small>
                  <h3 className="fw-bold text-success mb-0">{loading ? '...' : (dashboardData?.totalAvailableSeedlings ?? 0).toLocaleString()}</h3>
                  <small className="text-secondary extra-small">Ready for Customer Order</small>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-warning border-4 h-100">
                  <small className="text-muted d-block text-uppercase extra-small fw-bold">Booked Seedlings</small>
                  <h3 className="fw-bold text-dark mb-0">{loading ? '...' : (dashboardData?.totalBookedSeedlings ?? 0).toLocaleString()}</h3>
                  <small className="text-secondary extra-small">Reserved by Customers</small>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-secondary border-4 h-100">
                  <small className="text-muted d-block text-uppercase extra-small fw-bold">Dispatched Seedlings</small>
                  <h3 className="fw-bold text-secondary mb-0">{loading ? '...' : (dashboardData?.totalDispatchedSeedlings ?? 0).toLocaleString()}</h3>
                  <small className="text-secondary extra-small">Shipped Consignments</small>
                </div>
              </div>
            </div>
          </div>

          {/* Module 2.2: Farm-Wise Summary Table */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-1">
                  <i className="bi bi-table text-success me-2"></i>
                  Farm-Wise Performance &amp; Inventory Breakdown
                </h5>
                <p className="text-secondary small mb-0">
                  Dynamically aggregated figures from verified database records.
                </p>
              </div>
              <Link href="/admin/farms" className="btn btn-outline-success btn-sm fw-bold rounded-pill px-3">
                Manage Farms <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-nowrap">
                <thead className="table-light">
                  <tr>
                    <th>Farm ID</th>
                    <th>Farm Name</th>
                    <th className="text-center">Total Trees</th>
                    <th className="text-center">Selected</th>
                    <th className="text-center">Trees in Batches</th>
                    <th className="text-center">Active Batches</th>
                    <th className="text-center">Coconuts Collected</th>
                    <th className="text-center">Produced</th>
                    <th className="text-center">Available</th>
                    <th className="text-center">Reserved / Booked</th>
                    <th className="text-center">Dispatched</th>
                    <th className="text-center">Damaged / Rejected</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="text-center py-4 text-muted">
                        <div className="spinner-border spinner-border-sm text-success me-2"></div>
                        Calculating dynamic farm metrics...
                      </td>
                    </tr>
                  ) : !dashboardData?.farms || dashboardData.farms.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-4 text-muted">
                        No farms registered yet. Click &quot;Manage Farms&quot; to register your first farm.
                      </td>
                    </tr>
                  ) : (
                    dashboardData.farms.map((f: any) => (
                      <tr key={f.farmCode}>
                        <td>
                          <span className="badge bg-secondary-subtle text-secondary font-monospace fw-bold">
                            {f.farmCode}
                          </span>
                        </td>
                        <td className="fw-semibold">
                          <Link href={`/admin/farms`} className="text-decoration-none text-dark hover-text-success">
                            {f.farmName}
                          </Link>
                        </td>
                        <td className="text-center">{f.totalMotherTrees ?? 0}</td>
                        <td className="text-center">
                          <span className="badge bg-success-subtle text-success">{f.selectedMotherTrees ?? 0}</span>
                        </td>
                        <td className="text-center">{f.treesUsedInBatches ?? 0}</td>
                        <td className="text-center">{f.activeBatches ?? 0}</td>
                        <td className="text-center fw-semibold text-warning">{(f.totalCoconutsCollected ?? 0).toLocaleString()}</td>
                        <td className="text-center fw-semibold text-primary">{(f.totalSeedlingsProduced ?? 0).toLocaleString()}</td>
                        <td className="text-center">
                          <span className="badge bg-success">{(f.availableSeedlings ?? 0).toLocaleString()}</span>
                        </td>
                        <td className="text-center fw-semibold text-dark">{(f.bookedSeedlings ?? 0).toLocaleString()}</td>
                        <td className="text-center text-secondary">{(f.dispatchedSeedlings ?? 0).toLocaleString()}</td>
                        <td className="text-center text-danger">{(Number(f.damagedSeedlings || 0) + Number(f.rejectedSeedlings || 0)).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Admin Actions & Navigation Hub */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                <h6 className="fw-bold text-dark mb-1"><i className="bi bi-geo-alt-fill text-success me-2"></i> Farm Registry</h6>
                <p className="text-secondary extra-small mb-2">Register farms, manage owner details, locations & auto-generated Farm IDs.</p>
                <Link href="/admin/farms" className="btn btn-outline-success btn-sm fw-bold mt-auto">
                  Open Farms <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>

            <div className="col-md-3">
              <div className="col-12 h-100">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                  <h6 className="fw-bold text-dark mb-1"><i className="bi bi-tree-fill text-success me-2"></i> Mother Tree Registry</h6>
                  <p className="text-secondary extra-small mb-2">Ancestral mother trees linked to farms, genetic variety & yield histories.</p>
                  <Link href="/admin/mother-trees" className="btn btn-outline-success btn-sm fw-bold mt-auto">
                    Manage Trees <i className="bi bi-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="col-12 h-100">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                  <h6 className="fw-bold text-dark mb-1"><i className="bi bi-grid-3x3-gap text-success me-2"></i> Batch Sourcing</h6>
                  <p className="text-secondary extra-small mb-2">Create multi-farm batches, coconut quantities & track seeded dates.</p>
                  <Link href="/admin/batches" className="btn btn-outline-success btn-sm fw-bold mt-auto">
                    Manage Batches <i className="bi bi-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="col-12 h-100">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
                  <h6 className="fw-bold text-dark mb-1"><i className="bi bi-diagram-3-fill text-primary me-2"></i> Traceability Reports</h6>
                  <p className="text-secondary extra-small mb-2">Full seed-to-customer traceability audits and 9 performance reports.</p>
                  <Link href="/admin/traceability" className="btn btn-outline-primary btn-sm fw-bold mt-auto">
                    View Reports <i className="bi bi-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Orders Live Counters */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white border-start border-primary border-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-0">
                  <i className="bi bi-bag-check-fill text-primary me-2"></i>
                  Customer Orders Pipeline
                </h5>
                <small className="text-muted">Live order count: {totalOrders} orders across all stages</small>
              </div>
              <Link href="/admin/orders" className="btn btn-primary btn-sm fw-bold rounded-pill px-3">
                Manage Orders <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <span className="badge bg-warning bg-opacity-25 text-dark border border-warning p-2">
                <i className="bi bi-clock-history me-1"></i> Pre-order: <strong>{statusCounts.preOrder}</strong>
              </span>
              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger p-2">
                <i className="bi bi-hourglass-split me-1"></i> Payment Review: <strong>{statusCounts.paymentReview}</strong>
              </span>
              <span className="badge bg-success bg-opacity-10 text-success border border-success p-2">
                <i className="bi bi-check-circle-fill me-1"></i> Confirmed: <strong>{statusCounts.confirmed}</strong>
              </span>
              <span className="badge bg-info bg-opacity-10 text-info border border-info p-2">
                <i className="bi bi-box-seam me-1"></i> Preparing: <strong>{statusCounts.preparing}</strong>
              </span>
              <span className="badge bg-primary bg-opacity-10 text-primary border border-primary p-2">
                <i className="bi bi-truck me-1"></i> Dispatched: <strong>{statusCounts.dispatched}</strong>
              </span>
              <span className="badge bg-success text-white p-2">
                <i className="bi bi-check2-all me-1"></i> Delivered: <strong>{statusCounts.delivered}</strong>
              </span>
            </div>
          </div>

          {/* Farm Data Export & Excel Reports Center */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-success border-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-1">
                  <i className="bi bi-file-earmark-spreadsheet-fill text-success me-2"></i>
                  Farm Data Export &amp; Excel Reports
                </h5>
                <p className="text-secondary small mb-0">
                  Download all verified records (Farms, Mother Trees, Customer Orders, Batch Stock, Audit) directly to Excel (.xlsx).
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
                  <i className="bi bi-bag-check-fill text-primary"></i> Orders (.xlsx)
                </a>
              </div>
              <div className="col-6 col-lg">
                <a href="/api/admin/export?type=batches" download className="btn btn-outline-secondary btn-sm w-100 text-dark fw-semibold d-flex align-items-center justify-content-center gap-1 py-2 rounded-3 hover-lift-subtle">
                  <i className="bi bi-grid-3x3-gap-fill text-success"></i> Batches (.xlsx)
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
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
