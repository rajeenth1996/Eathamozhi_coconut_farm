'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import * as XLSX from 'xlsx';

export default function AdminTraceabilityAndReportsPage() {
  const [activeTab, setActiveTab] = useState<'trace' | 'reports'>('trace');

  // Trace Explorer State
  const [searchQuery, setSearchQuery] = useState('');
  const [traceType, setTraceType] = useState<'batch' | 'order'>('batch');
  const [traceResult, setTraceResult] = useState<any>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [batchOptions, setBatchOptions] = useState<any[]>([]);

  // Reports State
  const [reportType, setReportType] = useState('farm-mother-trees');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Load available batches for quick selector
  useEffect(() => {
    fetch('/api/batches')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBatchOptions(data);
          if (data.length > 0 && !searchQuery) {
            handleTrace(data[0].batchCode, 'batch');
          }
        }
      })
      .catch((err) => console.error('Failed to load batches:', err));
  }, []);

  const handleTrace = async (query: string, type: 'batch' | 'order') => {
    if (!query.trim()) return;
    setTraceLoading(true);
    setSearchQuery(query);
    setTraceType(type);

    try {
      const param = type === 'batch' ? `batchCode=${encodeURIComponent(query)}` : `bookingId=${encodeURIComponent(query)}`;
      const res = await fetch(`/api/traceability?${param}`);
      if (res.ok) {
        const data = await res.json();
        setTraceResult(data);
      } else {
        const err = await res.json();
        alert(err.error || 'Traceability record not found');
        setTraceResult(null);
      }
    } catch (err) {
      alert('Error fetching traceability chain');
    } finally {
      setTraceLoading(false);
    }
  };

  // Fetch Report
  const fetchReport = async () => {
    setReportLoading(true);
    try {
      const params = new URLSearchParams({ type: reportType });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setReportData(Array.isArray(result.data) ? result.data : []);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReport();
    }
  }, [activeTab, reportType, startDate, endDate]);

  const reportNames: Record<string, string> = {
    'farm-mother-trees': '1. Farm Mother Trees Report',
    'farm-coconut-collection': '2. Coconut Collection by Farm Report',
    'farm-batch-contribution': '3. Batch Contribution by Farm Report',
    'farm-seedling-production': '4. Seedling Production by Farm Report',
    'farm-available-inventory': '5. Available Seedling Inventory Report',
    'batch-germination': '6. Batch Germination Rate Report',
    'mother-tree-history': '7. Mother Tree Historical Performance Report',
    'batch-dispatch': '8. Batch Customer Dispatch Report',
    'farm-customer-allocation': '9. Farm Customer Allocation Report',
  };

  // Export current report to Excel
  const exportReportExcel = () => {
    if (reportData.length === 0) {
      alert('No data to export.');
      return;
    }

    let flatRows: any[] = [];

    switch (reportType) {
      case 'farm-mother-trees':
        flatRows = reportData.flatMap((f) =>
          (f.trees || []).map((t: any) => ({
            'Farm Code': f.farmCode,
            'Farm Name': f.farmName,
            'Farm Location': f.location,
            'Mother Tree Code': t.motherTreeCode,
            'Tree Name': t.name,
            'Variety': t.variety,
            'Age (Years)': t.age,
            'Selection Status': t.selectionStatus,
            'Verification Status': t.verificationStatus,
          }))
        );
        break;

      case 'farm-coconut-collection':
        flatRows = reportData.flatMap((f) =>
          (f.collections || []).map((c: any) => ({
            'Farm Code': f.farmCode,
            'Farm Name': f.farmName,
            'Batch Code': c.batchCode,
            'Mother Tree Code': c.motherTreeCode,
            'Coconuts Collected': c.coconutQuantity,
            'Collection Date': c.collectionDate,
            'Status': c.collectionStatus,
          }))
        );
        break;

      case 'farm-available-inventory':
        flatRows = reportData.map((f) => ({
          'Farm Code': f.farmCode,
          'Farm Name': f.farmName,
          'Produced': f.produced,
          'Available': f.available,
          'Booked': f.booked,
          'Dispatched': f.dispatched,
          'Damaged': f.damaged,
          'Rejected': f.rejected,
        }));
        break;

      case 'batch-germination':
        flatRows = reportData.map((b) => ({
          'Batch Code': b.batchCode,
          'Batch Name': b.batchName,
          'Seeded Date': b.seededDate,
          'Total Coconuts': b.totalCoconuts,
          'Total Sown': b.totalSown,
          'Total Germinated': b.totalGerminated,
          'Germination Rate': b.germinationRate,
        }));
        break;

      case 'mother-tree-history':
        flatRows = reportData.map((m) => ({
          'Mother Tree Code': m.motherTreeCode,
          'Tree Name': m.name,
          'Farm Code': m.farmCode,
          'Age (Years)': m.age,
          'Batches Contributed': m.batchesCount,
          'Total Nuts Collected': m.totalCoconutsCollected,
        }));
        break;

      case 'batch-dispatch':
        flatRows = reportData.flatMap((b) =>
          (b.orders || []).map((o: any) => ({
            'Batch Code': b.batchCode,
            'Batch Name': b.batchName,
            'Booking ID': o.bookingId,
            'Customer Name': o.customerName,
            'Quantity Dispatched': o.quantity,
            'Courier': o.courierName,
            'Tracking ID': o.trackingId,
            'Dispatch Date': o.dispatchDate,
          }))
        );
        break;

      default:
        flatRows = reportData;
        break;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(flatRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <>
      <AdminNav />

      {/* Header */}
      <section className="bg-dark text-white py-3 border-bottom">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <span className="badge bg-success me-2">MODULES 8 &amp; 9</span>
            <h3 className="fw-bold mb-0 text-light d-inline align-middle">Traceability &amp; Farm Reports</h3>
          </div>
          <div className="d-flex gap-2">
            <button
              onClick={() => setActiveTab('trace')}
              className={`btn btn-sm fw-bold px-3 ${activeTab === 'trace' ? 'btn-success text-white' : 'btn-outline-light'}`}
            >
              <i className="bi bi-diagram-3-fill me-1"></i> Traceability Explorer
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`btn btn-sm fw-bold px-3 ${activeTab === 'reports' ? 'btn-success text-white' : 'btn-outline-light'}`}
            >
              <i className="bi bi-file-earmark-bar-graph-fill me-1"></i> 9 Audit Reports
            </button>
          </div>
        </div>
      </section>

      <section className="py-4 bg-light">
        <div className="container">
          {/* TAB 1: TRACEABILITY EXPLORER */}
          {activeTab === 'trace' && (
            <div>
              {/* Search Card */}
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <h5 className="fw-bold text-dark mb-3">
                  <i className="bi bi-search text-success me-2"></i>
                  Complete Seedling Provenance Chain
                </h5>
                <div className="row g-2 align-items-center">
                  <div className="col-md-7">
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Enter Batch Code (e.g. ETH-RA-F001-112026-B001) or Booking ID (e.g. BK-202611-001)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const type = searchQuery.startsWith('BK-') ? 'order' : 'batch';
                          handleTrace(searchQuery, type);
                        }
                      }}
                    />
                  </div>
                  <div className="col-md-5 d-flex gap-2">
                    <button
                      onClick={() => handleTrace(searchQuery, 'batch')}
                      className="btn btn-success fw-bold px-3 py-2 flex-grow-1"
                      disabled={traceLoading}
                    >
                      <i className="bi bi-grid-3x3 me-1"></i> Trace Batch
                    </button>
                    <button
                      onClick={() => handleTrace(searchQuery, 'order')}
                      className="btn btn-outline-primary fw-bold px-3 py-2 flex-grow-1"
                      disabled={traceLoading}
                    >
                      <i className="bi bi-bag-check me-1"></i> Trace Order
                    </button>
                  </div>
                </div>

                {/* Quick Selection Pills */}
                {batchOptions.length > 0 && (
                  <div className="mt-3 pt-3 border-top">
                    <small className="text-muted fw-bold d-block mb-2">QUICK SELECT BATCH TO TRACE:</small>
                    <div className="d-flex flex-wrap gap-2">
                      {batchOptions.slice(0, 8).map((b) => (
                        <button
                          key={b.batchCode || b.id}
                          onClick={() => handleTrace(b.batchCode, 'batch')}
                          className={`btn btn-sm rounded-pill font-monospace ${
                            searchQuery === b.batchCode ? 'btn-success text-white' : 'btn-outline-secondary'
                          }`}
                        >
                          {b.batchCode}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Trace Results */}
              {traceLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success" role="status"></div>
                  <div className="mt-2 text-muted">Building provenance graph...</div>
                </div>
              ) : !traceResult ? (
                <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                  <i className="bi bi-diagram-3 text-secondary display-3 mb-3"></i>
                  <h5 className="text-dark fw-bold">No Traceability Record Selected</h5>
                  <p className="text-muted mb-0">
                    Search by Batch Code or Customer Booking ID above to visualize the end-to-end coconut lifecycle.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Banner / Overview */}
                  <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white border-start border-success border-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-dark font-monospace fs-6">
                            {traceType === 'order' ? `ORDER: ${traceResult.bookingId}` : `BATCH: ${traceResult.batchCode}`}
                          </span>
                          {traceResult.isMixedSource ? (
                            <span className="badge bg-warning text-dark">
                              <i className="bi bi-layers-fill me-1"></i> Multi-Farm / Multi-Tree Sourced Batch
                            </span>
                          ) : (
                            <span className="badge bg-success">
                              <i className="bi bi-patch-check-fill me-1"></i> 100% Single Mother Tree Provenance
                            </span>
                          )}
                        </div>
                        <h4 className="fw-bold text-dark mb-0">
                          {traceType === 'order'
                            ? `Customer: ${traceResult.customerName} (${traceResult.quantity} Seedlings)`
                            : traceResult.batchName}
                        </h4>
                      </div>

                      {traceType === 'order' && (
                        <div className="text-end">
                          <span className="badge bg-primary px-3 py-2 fs-6 mb-1 d-block">
                            Status: {traceResult.bookingStatus}
                          </span>
                          {traceResult.dispatchDate && (
                            <small className="text-muted d-block">
                              Dispatched: {traceResult.dispatchDate} via {traceResult.courierName || 'Courier'}
                            </small>
                          )}
                          {traceResult.trackingId && (
                            <small className="font-monospace text-primary fw-bold">
                              Track ID: {traceResult.trackingId}
                            </small>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visual Provenance Pipeline Cards */}
                  <div className="row g-4 mb-4">
                    {/* Stage 1: Origin Farm(s) */}
                    <div className="col-lg-3 col-md-6">
                      <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                        <div className="d-flex align-items-center gap-2 text-success mb-3">
                          <i className="bi bi-geo-alt-fill fs-4"></i>
                          <h6 className="fw-bold mb-0 text-dark">1. Farm Origin</h6>
                        </div>
                        {((traceType === 'order' ? traceResult.batch?.contributingFarms : traceResult.contributingFarms) || []).map(
                          (f: any, idx: number) => (
                            <div key={idx} className="bg-light p-3 rounded-3 mb-2 border">
                              <span className="badge bg-secondary font-monospace mb-1">{f.farmCode}</span>
                              <strong className="d-block text-dark">{f.farmName}</strong>
                              <small className="text-muted d-block">{f.location || 'Kanyakumari Dist'}</small>
                              <small className="text-success fw-bold d-block mt-1">
                                <i className="bi bi-check-circle me-1"></i> Registered &amp; Verified
                              </small>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Stage 2: Mother Tree Palm */}
                    <div className="col-lg-3 col-md-6">
                      <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                        <div className="d-flex align-items-center gap-2 text-success mb-3">
                          <i className="bi bi-tree-fill fs-4"></i>
                          <h6 className="fw-bold mb-0 text-dark">2. Mother Tree(s)</h6>
                        </div>
                        {((traceType === 'order' ? traceResult.batch?.sources : traceResult.sources) || []).map(
                          (s: any, idx: number) => (
                            <div key={idx} className="bg-light p-3 rounded-3 mb-2 border">
                              <span className="badge bg-success font-monospace mb-1">{s.motherTreeCode}</span>
                              <strong className="d-block text-dark">{s.motherTreeName || s.motherTreeCode}</strong>
                              <small className="text-muted d-block">{s.variety || 'Eathamozhi Tall'}</small>
                              <small className="text-muted d-block">Age: {s.age || '40+'} yrs</small>
                              <div className="mt-2 pt-2 border-top extra-small d-flex justify-content-between">
                                <span className="text-muted">Nuts Harvested:</span>
                                <strong>{s.coconutQuantity || 0}</strong>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Stage 3: Batch Sowing & Nursery */}
                    <div className="col-lg-3 col-md-6">
                      <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                        <div className="d-flex align-items-center gap-2 text-warning mb-3">
                          <i className="bi bi-flower1 fs-4"></i>
                          <h6 className="fw-bold mb-0 text-dark">3. Nursery &amp; Germination</h6>
                        </div>
                        <div className="bg-light p-3 rounded-3 border">
                          <span className="badge bg-dark font-monospace mb-2">
                            {traceType === 'order' ? traceResult.batch?.batchCode : traceResult.batchCode}
                          </span>
                          <div className="d-flex justify-content-between small mb-1">
                            <span className="text-muted">Harvest Date:</span>
                            <strong>
                              {traceType === 'order' ? traceResult.batch?.harvestDate : traceResult.harvestDate || 'N/A'}
                            </strong>
                          </div>
                          <div className="d-flex justify-content-between small mb-1">
                            <span className="text-muted">Seeded Date:</span>
                            <strong>
                              {traceType === 'order' ? traceResult.batch?.seededDate : traceResult.seededDate || 'N/A'}
                            </strong>
                          </div>
                          <div className="d-flex justify-content-between small mb-1">
                            <span className="text-muted">Total Seedlings:</span>
                            <strong className="text-success">
                              {traceType === 'order' ? traceResult.batch?.totalQuantity : traceResult.totalQuantity}
                            </strong>
                          </div>
                          <div className="d-flex justify-content-between small">
                            <span className="text-muted">Available Stock:</span>
                            <strong className="text-primary">
                              {traceType === 'order' ? traceResult.batch?.availableQuantity : traceResult.availableQuantity}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stage 4: Customer Allocation / Dispatch */}
                    <div className="col-lg-3 col-md-6">
                      <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                        <div className="d-flex align-items-center gap-2 text-primary mb-3">
                          <i className="bi bi-truck fs-4"></i>
                          <h6 className="fw-bold mb-0 text-dark">4. Customer Fulfillment</h6>
                        </div>
                        {traceType === 'order' ? (
                          <div className="bg-light p-3 rounded-3 border">
                            <strong className="d-block text-dark">{traceResult.customerName}</strong>
                            <small className="text-muted d-block">Booking: {traceResult.bookingId}</small>
                            <small className="text-muted d-block">Quantity: {traceResult.quantity} saplings</small>
                            <div className="mt-2 pt-2 border-top">
                              <span className="badge bg-success-subtle text-success border border-success extra-small">
                                Payment: {traceResult.paymentStatus || 'Verified'}
                              </span>
                            </div>
                            {traceResult.courierName && (
                              <div className="mt-2 small">
                                <span className="text-muted">Courier: </span>
                                <strong>{traceResult.courierName}</strong>
                              </div>
                            )}
                            {traceResult.trackingId && (
                              <div className="small">
                                <span className="text-muted">Tracking: </span>
                                <strong className="font-monospace text-primary">{traceResult.trackingId}</strong>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-light p-3 rounded-3 border text-center py-4">
                            <i className="bi bi-box-arrow-right fs-2 text-primary d-block mb-2"></i>
                            <strong className="d-block text-dark">
                              {traceResult.bookedQuantity || 0} Booked
                            </strong>
                            <small className="text-muted d-block mb-3">
                              Seedlings allocated to confirmed customer pre-orders
                            </small>
                            <Link href="/admin/orders" className="btn btn-outline-primary btn-sm rounded-pill px-3">
                              View Orders
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Source Breakdown Table */}
                  <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                    <h5 className="fw-bold text-dark mb-3">
                      Mother Tree &amp; Farm Contribution Breakdown
                    </h5>
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th>Farm ID</th>
                            <th>Farm Name</th>
                            <th>Mother Tree Code</th>
                            <th>Tree Name &amp; Variety</th>
                            <th className="text-center">Nuts Sown</th>
                            <th className="text-center">Seedlings Produced</th>
                            <th className="text-center">Available Stock</th>
                            <th className="text-center">Booked</th>
                            <th className="text-center">Dispatched</th>
                          </tr>
                        </thead>
                        <tbody>
                          {((traceType === 'order' ? traceResult.batch?.sources : traceResult.sources) || []).map(
                            (s: any, idx: number) => (
                              <tr key={idx}>
                                <td>
                                  <span className="badge bg-secondary font-monospace">{s.farmCode}</span>
                                </td>
                                <td>
                                  <strong className="text-dark">{s.farmName}</strong>
                                </td>
                                <td>
                                  <span className="badge bg-success font-monospace">{s.motherTreeCode}</span>
                                </td>
                                <td>
                                  <strong className="d-block">{s.motherTreeName || s.motherTreeCode}</strong>
                                  <small className="text-muted">{s.variety || 'Eathamozhi Tall'}</small>
                                </td>
                                <td className="text-center">{s.coconutsSown || s.coconutQuantity || 0}</td>
                                <td className="text-center fw-bold">{s.seedlingsProduced || 0}</td>
                                <td className="text-center text-success fw-bold">{s.availableQuantity || 0}</td>
                                <td className="text-center text-warning fw-bold">{s.bookedQuantity || 0}</td>
                                <td className="text-center text-primary fw-bold">{s.dispatchedQuantity || 0}</td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 9 AUDIT & TRACEABILITY REPORTS */}
          {activeTab === 'reports' && (
            <div>
              {/* Report Control Bar */}
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <div className="row g-3 align-items-end">
                  <div className="col-md-5">
                    <label className="form-label fw-bold text-dark mb-1">
                      <i className="bi bi-file-earmark-bar-graph me-1 text-success"></i>
                      Select Audit Report
                    </label>
                    <select
                      className="form-select"
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      {Object.entries(reportNames).map(([key, name]) => (
                        <option key={key} value={key}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-2">
                    <label className="form-label small text-muted mb-1">Start Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label small text-muted mb-1">End Date</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>

                  <div className="col-md-3 d-flex gap-2">
                    <button
                      onClick={fetchReport}
                      className="btn btn-primary btn-sm fw-bold flex-grow-1"
                      disabled={reportLoading}
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                    </button>
                    <button
                      onClick={exportReportExcel}
                      className="btn btn-success btn-sm fw-bold flex-grow-1"
                      disabled={reportLoading || reportData.length === 0}
                    >
                      <i className="bi bi-file-earmark-excel-fill me-1"></i> Export Excel
                    </button>
                  </div>
                </div>
              </div>

              {/* Report Display Table */}
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-dark mb-0">{reportNames[reportType]}</h5>
                  <span className="badge bg-light text-dark border">
                    {reportData.length} records generated
                  </span>
                </div>

                {reportLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-success" role="status"></div>
                    <div className="mt-2 text-muted">Generating report data...</div>
                  </div>
                ) : reportData.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-inbox display-4 d-block mb-2 text-secondary"></i>
                    No data recorded for this report within the selected period.
                  </div>
                ) : (
                  <div className="table-responsive">
                    {/* Render specialized tables based on report type */}
                    {reportType === 'farm-mother-trees' && (
                      <table className="table table-hover align-middle">
                        <thead className="table-dark">
                          <tr>
                            <th>Farm Code</th>
                            <th>Farm Name</th>
                            <th>Location</th>
                            <th className="text-center">Total Mother Trees</th>
                            <th className="text-center">Selected</th>
                            <th className="text-center">Verified</th>
                            <th className="text-center">Active Production</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((f, idx) => (
                            <tr key={idx}>
                              <td><span className="badge bg-secondary font-monospace">{f.farmCode}</span></td>
                              <td><strong>{f.farmName}</strong></td>
                              <td>{f.location}</td>
                              <td className="text-center fw-bold">{f.totalTrees}</td>
                              <td className="text-center"><span className="badge bg-success">{f.selectedTrees}</span></td>
                              <td className="text-center"><span className="badge bg-info">{f.verifiedTrees}</span></td>
                              <td className="text-center"><span className="badge bg-primary">{f.activeProductionTrees}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {reportType === 'farm-coconut-collection' && (
                      <table className="table table-hover align-middle">
                        <thead className="table-dark">
                          <tr>
                            <th>Farm Code</th>
                            <th>Farm Name</th>
                            <th className="text-center">Total Coconuts Collected</th>
                            <th className="text-center">Batches Created</th>
                            <th>Collections Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((f, idx) => (
                            <tr key={idx}>
                              <td><span className="badge bg-secondary font-monospace">{f.farmCode}</span></td>
                              <td><strong>{f.farmName}</strong></td>
                              <td className="text-center fw-bold fs-6">{f.totalCoconutsCollected}</td>
                              <td className="text-center">{f.batchesCount}</td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {(f.collections || []).map((c: any, cIdx: number) => (
                                    <span key={cIdx} className="badge bg-light text-dark border">
                                      {c.batchCode}: {c.coconutQuantity} nuts (MT: {c.motherTreeCode})
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {reportType === 'farm-available-inventory' && (
                      <table className="table table-hover align-middle">
                        <thead className="table-dark">
                          <tr>
                            <th>Farm Code</th>
                            <th>Farm Name</th>
                            <th className="text-center">Produced</th>
                            <th className="text-center text-success">Available</th>
                            <th className="text-center text-warning">Booked</th>
                            <th className="text-center text-primary">Dispatched</th>
                            <th className="text-center text-danger">Damaged</th>
                            <th className="text-center text-secondary">Rejected</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((f, idx) => (
                            <tr key={idx}>
                              <td><span className="badge bg-secondary font-monospace">{f.farmCode}</span></td>
                              <td><strong>{f.farmName}</strong></td>
                              <td className="text-center fw-bold">{f.produced}</td>
                              <td className="text-center"><span className="badge bg-success fs-6">{f.available}</span></td>
                              <td className="text-center"><span className="badge bg-warning text-dark">{f.booked}</span></td>
                              <td className="text-center"><span className="badge bg-primary">{f.dispatched}</span></td>
                              <td className="text-center text-danger">{f.damaged}</td>
                              <td className="text-center text-secondary">{f.rejected}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {reportType === 'batch-germination' && (
                      <table className="table table-hover align-middle">
                        <thead className="table-dark">
                          <tr>
                            <th>Batch Code</th>
                            <th>Batch Name</th>
                            <th>Sowing Date</th>
                            <th className="text-center">Nuts Sown</th>
                            <th className="text-center">Germinated</th>
                            <th className="text-center">Germination Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((b, idx) => (
                            <tr key={idx}>
                              <td><span className="badge bg-secondary font-monospace">{b.batchCode}</span></td>
                              <td><strong>{b.batchName}</strong></td>
                              <td>{b.seededDate || 'N/A'}</td>
                              <td className="text-center">{b.totalSown}</td>
                              <td className="text-center fw-bold">{b.totalGerminated}</td>
                              <td className="text-center">
                                <span className="badge bg-success fs-6">{b.germinationRate}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {reportType === 'mother-tree-history' && (
                      <table className="table table-hover align-middle">
                        <thead className="table-dark">
                          <tr>
                            <th>Mother Tree Code</th>
                            <th>Name</th>
                            <th>Farm Code</th>
                            <th>Age</th>
                            <th className="text-center">Batches Contributed</th>
                            <th className="text-center">Total Coconuts Harvested</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((m, idx) => (
                            <tr key={idx}>
                              <td><span className="badge bg-success font-monospace">{m.motherTreeCode}</span></td>
                              <td><strong>{m.name}</strong></td>
                              <td><span className="badge bg-secondary font-monospace">{m.farmCode}</span></td>
                              <td>{m.age} yrs</td>
                              <td className="text-center">{m.batchesCount}</td>
                              <td className="text-center fw-bold fs-6">{m.totalCoconutsCollected}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {reportType === 'batch-dispatch' && (
                      <table className="table table-hover align-middle">
                        <thead className="table-dark">
                          <tr>
                            <th>Batch Code</th>
                            <th>Batch Name</th>
                            <th className="text-center">Dispatched Orders</th>
                            <th className="text-center">Total Seedlings</th>
                            <th>Dispatched Orders Summary</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((b, idx) => (
                            <tr key={idx}>
                              <td><span className="badge bg-secondary font-monospace">{b.batchCode}</span></td>
                              <td><strong>{b.batchName}</strong></td>
                              <td className="text-center">{b.ordersDispatchedCount}</td>
                              <td className="text-center fw-bold fs-6 text-primary">{b.seedlingsDispatched}</td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {(b.orders || []).map((o: any, oIdx: number) => (
                                    <span key={oIdx} className="badge bg-light text-dark border">
                                      {o.bookingId} ({o.customerName}: {o.quantity} saplings via {o.courierName || 'Courier'})
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {reportType === 'farm-batch-contribution' && (
                      <table className="table table-hover align-middle">
                        <thead className="table-dark">
                          <tr>
                            <th>Batch Code</th>
                            <th>Batch Name</th>
                            <th>Harvest Date</th>
                            <th className="text-center">Total Seedlings</th>
                            <th>Contributing Farms</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((b, idx) => (
                            <tr key={idx}>
                              <td><span className="badge bg-secondary font-monospace">{b.batchCode}</span></td>
                              <td><strong>{b.batchName}</strong></td>
                              <td>{b.harvestDate || 'N/A'}</td>
                              <td className="text-center fw-bold">{b.totalSeedlings}</td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {(b.contributingFarms || []).map((cf: any, cfIdx: number) => (
                                    <span key={cfIdx} className="badge bg-success-subtle text-success border">
                                      {cf.farmCode}: {cf.coconutsContributed} nuts ({cf.motherTreesCount} trees)
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {reportType === 'farm-seedling-production' && (
                      <table className="table table-hover align-middle">
                        <thead className="table-dark">
                          <tr>
                            <th>Farm Code</th>
                            <th>Farm Name</th>
                            <th className="text-center">Active Batches</th>
                            <th className="text-center">Total Germinated</th>
                            <th className="text-center">Total Seedlings Produced</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((f, idx) => (
                            <tr key={idx}>
                              <td><span className="badge bg-secondary font-monospace">{f.farmCode}</span></td>
                              <td><strong>{f.farmName}</strong></td>
                              <td className="text-center">{f.activeBatches}</td>
                              <td className="text-center">{f.totalGerminated}</td>
                              <td className="text-center fw-bold fs-6 text-success">{f.totalSeedlingsProduced}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {reportType === 'farm-customer-allocation' && (
                      <table className="table table-hover align-middle">
                        <thead className="table-dark">
                          <tr>
                            <th>Farm Code</th>
                            <th>Farm Name</th>
                            <th className="text-center">Allocated Orders</th>
                            <th className="text-center">Total Allocated Seedlings</th>
                            <th>Allocated Customer Bookings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((f, idx) => (
                            <tr key={idx}>
                              <td><span className="badge bg-secondary font-monospace">{f.farmCode}</span></td>
                              <td><strong>{f.farmName}</strong></td>
                              <td className="text-center">{f.totalAllocatedOrders}</td>
                              <td className="text-center fw-bold fs-6 text-primary">{f.totalAllocatedSeedlings}</td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {(f.orders || []).map((o: any, oIdx: number) => (
                                    <span key={oIdx} className="badge bg-light text-dark border">
                                      {o.bookingId} ({o.customerName}: {o.quantity} saplings)
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
