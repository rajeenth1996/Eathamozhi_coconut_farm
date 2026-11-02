'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import * as XLSX from 'xlsx';

export default function AdminSeedlingInventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFarm, setSelectedFarm] = useState('ALL');
  const [selectedBatch, setSelectedBatch] = useState('ALL');

  // Adjustment modal state
  const [activeItem, setActiveItem] = useState<any>(null);
  const [damagedQty, setDamagedQty] = useState<number>(0);
  const [rejectedQty, setRejectedQty] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, farmsRes, batchesRes] = await Promise.all([
        fetch('/api/seedling-inventory'),
        fetch('/api/farms'),
        fetch('/api/batches'),
      ]);
      const invData = await invRes.json();
      const farmsData = await farmsRes.json();
      const batchesData = await batchesRes.json();

      setInventory(Array.isArray(invData) ? invData : []);
      setFarms(Array.isArray(farmsData) ? farmsData : []);
      setBatches(Array.isArray(batchesData) ? batchesData : []);
    } catch (err) {
      console.error('Error fetching seedling inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdjustModal = (item: any) => {
    setActiveItem(item);
    setDamagedQty(item.damagedQuantity || 0);
    setRejectedQty(item.rejectedQuantity || 0);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    setSaving(true);
    try {
      const res = await fetch('/api/seedling-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: activeItem.batchSourceId || activeItem.id,
          damagedQuantity: Number(damagedQty),
          rejectedQuantity: Number(rejectedQty),
        }),
      });

      if (res.ok) {
        alert(`Inventory successfully updated for ${activeItem.farmCode} - MT ${activeItem.motherTreeCode}!`);
        setActiveItem(null);
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update inventory record');
      }
    } catch (err) {
      alert('Network error adjusting inventory');
    } finally {
      setSaving(false);
    }
  };

  // Filter inventory
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      !search ||
      item.batchCode?.toLowerCase().includes(search.toLowerCase()) ||
      item.farmCode?.toLowerCase().includes(search.toLowerCase()) ||
      item.motherTreeCode?.toLowerCase().includes(search.toLowerCase()) ||
      item.farmName?.toLowerCase().includes(search.toLowerCase()) ||
      item.variety?.toLowerCase().includes(search.toLowerCase());

    const matchesFarm = selectedFarm === 'ALL' || item.farmCode === selectedFarm;
    const matchesBatch = selectedBatch === 'ALL' || item.batchCode === selectedBatch;

    return matchesSearch && matchesFarm && matchesBatch;
  });

  // Calculate totals
  const totals = filteredInventory.reduce(
    (acc, curr) => {
      acc.produced += curr.seedlingsProduced || 0;
      acc.available += curr.availableQuantity || 0;
      acc.booked += curr.bookedQuantity || 0;
      acc.dispatched += curr.dispatchedQuantity || 0;
      acc.damaged += curr.damagedQuantity || 0;
      acc.rejected += curr.rejectedQuantity || 0;
      return acc;
    },
    { produced: 0, available: 0, booked: 0, dispatched: 0, damaged: 0, rejected: 0 }
  );

  const downloadExcel = () => {
    if (filteredInventory.length === 0) {
      alert('No data to export.');
      return;
    }

    const rows = filteredInventory.map((i) => ({
      'Batch Code': i.batchCode,
      'Farm ID': i.farmCode,
      'Farm Name': i.farmName || 'N/A',
      'Mother Tree Code': i.motherTreeCode,
      'Variety': i.variety || 'West Coast Tall',
      'Seedlings Produced': i.seedlingsProduced || 0,
      'Available Quantity': i.availableQuantity || 0,
      'Booked Quantity': i.bookedQuantity || 0,
      'Dispatched Quantity': i.dispatchedQuantity || 0,
      'Damaged Quantity': i.damagedQuantity || 0,
      'Rejected Quantity': i.rejectedQuantity || 0,
      'Last Updated': i.updatedAt ? new Date(i.updatedAt).toLocaleString('en-IN') : 'N/A',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Seedling Inventory');
    XLSX.writeFile(wb, `Seedling_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <>
      <AdminNav />

      <section className="bg-dark text-white py-3 border-bottom">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <span className="badge bg-success me-2">MODULE 5.2</span>
            <h3 className="fw-bold mb-0 text-light d-inline align-middle">Seedling Inventory by Source</h3>
          </div>
          <div className="d-flex gap-2">
            <button
              onClick={downloadExcel}
              className="btn btn-outline-success btn-sm text-light fw-bold shadow-sm d-flex align-items-center gap-1"
            >
              <i className="bi bi-file-earmark-excel-fill text-success"></i>
              <span>Export Excel ({filteredInventory.length})</span>
            </button>
            <Link href="/admin/germination" className="btn btn-outline-light btn-sm">
              <i className="bi bi-flower1 me-1"></i> Germination
            </Link>
          </div>
        </div>
      </section>

      <section className="py-4 bg-light">
        <div className="container">
          {/* Summary Metric Cards */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-4 col-lg-2">
              <div className="card border-0 shadow-sm rounded-3 p-3 bg-white text-center h-100">
                <small className="text-muted text-uppercase fw-semibold extra-small">Total Produced</small>
                <div className="fs-3 fw-bold text-dark mt-1">{loading ? '...' : totals.produced.toLocaleString()}</div>
                <small className="text-secondary extra-small">Seedlings</small>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-2">
              <div className="card border-0 shadow-sm rounded-3 p-3 bg-success text-white text-center h-100">
                <small className="text-white-50 text-uppercase fw-semibold extra-small">Available</small>
                <div className="fs-3 fw-bold mt-1">{loading ? '...' : totals.available.toLocaleString()}</div>
                <small className="text-white-50 extra-small">Ready for Sale</small>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-2">
              <div className="card border-0 shadow-sm rounded-3 p-3 bg-warning text-dark text-center h-100">
                <small className="text-dark-50 text-uppercase fw-semibold extra-small">Booked</small>
                <div className="fs-3 fw-bold mt-1">{loading ? '...' : totals.booked.toLocaleString()}</div>
                <small className="text-dark-50 extra-small">Customer Orders</small>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-2">
              <div className="card border-0 shadow-sm rounded-3 p-3 bg-primary text-white text-center h-100">
                <small className="text-white-50 text-uppercase fw-semibold extra-small">Dispatched</small>
                <div className="fs-3 fw-bold mt-1">{loading ? '...' : totals.dispatched.toLocaleString()}</div>
                <small className="text-white-50 extra-small">Fulfilled</small>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-2">
              <div className="card border-0 shadow-sm rounded-3 p-3 bg-danger-subtle text-danger text-center h-100">
                <small className="text-danger-emphasis text-uppercase fw-semibold extra-small">Damaged</small>
                <div className="fs-3 fw-bold mt-1">{loading ? '...' : totals.damaged.toLocaleString()}</div>
                <small className="text-danger-emphasis extra-small">In Nursery</small>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-2">
              <div className="card border-0 shadow-sm rounded-3 p-3 bg-secondary-subtle text-secondary text-center h-100">
                <small className="text-secondary-emphasis text-uppercase fw-semibold extra-small">Rejected</small>
                <div className="fs-3 fw-bold mt-1">{loading ? '...' : totals.rejected.toLocaleString()}</div>
                <small className="text-secondary-emphasis extra-small">Quality Rejects</small>
              </div>
            </div>
          </div>

          {/* Formula Context Banner */}
          <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white border-start border-success border-4">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-info-circle-fill text-success fs-5"></i>
              <div className="small text-muted">
                <strong>Inventory Accounting Formula:</strong>{' '}
                <code>Available Quantity = Produced - Booked - Dispatched - Damaged - Rejected</code>. Every seedling
                is strictly tied back to its specific Farm ID and Mother Tree Palm.
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
            <div className="row g-2">
              <div className="col-md-5">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by Batch, Farm ID, MT Code, Variety..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={selectedFarm}
                  onChange={(e) => setSelectedFarm(e.target.value)}
                >
                  <option value="ALL">All Registered Farms</option>
                  {farms.map((f) => (
                    <option key={f.farmCode} value={f.farmCode}>
                      {f.farmCode} ({f.farmName})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                >
                  <option value="ALL">All Batches</option>
                  {batches.map((b) => (
                    <option key={b.code || b.batchId} value={b.code || b.batchId}>
                      {b.code || b.batchId}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-1 d-flex align-items-center">
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedFarm('ALL');
                    setSelectedBatch('ALL');
                  }}
                  className="btn btn-outline-secondary w-100"
                  title="Reset Filters"
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Source Inventory Table */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="fw-bold text-dark mb-3">
              Source-Level Seedling Stock ({filteredInventory.length} records)
            </h5>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status"></div>
                <div className="mt-2 text-muted">Loading inventory data...</div>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-box-seam display-4 d-block mb-2 text-secondary"></i>
                No source inventory records match your criteria.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Batch Code</th>
                      <th>Farm ID &amp; Location</th>
                      <th>Mother Tree &amp; Variety</th>
                      <th className="text-center">Produced</th>
                      <th className="text-center text-success">Available</th>
                      <th className="text-center text-warning">Booked</th>
                      <th className="text-center text-primary">Dispatched</th>
                      <th className="text-center text-danger">Damaged</th>
                      <th className="text-center text-secondary">Rejected</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item.id || `${item.batchCode}-${item.motherTreeCode}`}>
                        <td>
                          <span className="badge bg-secondary font-monospace">{item.batchCode}</span>
                        </td>
                        <td>
                          <strong className="text-dark d-block font-monospace">{item.farmCode}</strong>
                          <small className="text-muted">{item.farmName}</small>
                        </td>
                        <td>
                          <strong className="text-success d-block font-monospace">{item.motherTreeCode}</strong>
                          <small className="text-muted">{item.treeName} • {item.variety}</small>
                        </td>
                        <td className="text-center fw-bold">{item.seedlingsProduced || 0}</td>
                        <td className="text-center">
                          <span className="badge bg-success fs-6 px-2 py-1">
                            {item.availableQuantity || 0}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-warning text-dark px-2 py-1">
                            {item.bookedQuantity || 0}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-primary px-2 py-1">
                            {item.dispatchedQuantity || 0}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-danger-subtle text-danger px-2 py-1 border border-danger">
                            {item.damagedQuantity || 0}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-secondary-subtle text-secondary px-2 py-1 border">
                            {item.rejectedQuantity || 0}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => openAdjustModal(item)}
                            className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold d-inline-flex align-items-center gap-1"
                          >
                            <i className="bi bi-pencil-square"></i>
                            <span>Adjust</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Damage / Rejection Adjustment Modal */}
      {activeItem && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <form onSubmit={handleSaveAdjustment}>
                <div className="modal-header bg-dark text-white border-0">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-sliders me-2 text-warning"></i>
                    Adjust Damage &amp; Rejection
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setActiveItem(null)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <div className="bg-light p-3 rounded-3 mb-3 border">
                    <div className="row g-2 small">
                      <div className="col-6">
                        <span className="text-muted d-block">Batch:</span>
                        <strong className="font-monospace">{activeItem.batchCode}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block">Farm:</span>
                        <strong className="font-monospace">{activeItem.farmCode}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block">Mother Tree:</span>
                        <strong className="font-monospace text-success">{activeItem.motherTreeCode}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block">Produced:</span>
                        <strong>{activeItem.seedlingsProduced || 0}</strong>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block">Booked:</span>
                        <span className="text-warning fw-bold">{activeItem.bookedQuantity || 0}</span>
                      </div>
                      <div className="col-6">
                        <span className="text-muted d-block">Dispatched:</span>
                        <span className="text-primary fw-bold">{activeItem.dispatchedQuantity || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Damaged Seedlings (In Nursery)</label>
                    <input
                      type="number"
                      min={0}
                      className="form-control form-control-lg"
                      value={damagedQty}
                      onChange={(e) => setDamagedQty(Math.max(0, parseInt(e.target.value) || 0))}
                      required
                    />
                    <small className="text-muted">Seedlings damaged due to pests, weather, or nursery handling.</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Rejected Seedlings (Quality Check)</label>
                    <input
                      type="number"
                      min={0}
                      className="form-control form-control-lg"
                      value={rejectedQty}
                      onChange={(e) => setRejectedQty(Math.max(0, parseInt(e.target.value) || 0))}
                      required
                    />
                    <small className="text-muted">Seedlings rejected due to poor vigor or deformities.</small>
                  </div>

                  {/* Realtime Projected Available */}
                  <div className="alert alert-info border-0 rounded-3 p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold">Resulting Available Stock:</span>
                      <strong className="fs-5 text-success">
                        {Math.max(
                          0,
                          (activeItem.seedlingsProduced || 0) -
                            (activeItem.bookedQuantity || 0) -
                            (activeItem.dispatchedQuantity || 0) -
                            damagedQty -
                            rejectedQty
                        )}{' '}
                        Seedlings
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 p-3 bg-light rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setActiveItem(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success fw-bold px-4" disabled={saving}>
                    {saving ? 'Updating...' : 'Save Adjustment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
