'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import AdminLogoutButton from '@/components/AdminLogoutButton';

export default function AdminGerminationPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [farmFilter, setFarmFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Edit Germination Modal
  const [editingSource, setEditingSource] = useState<any | null>(null);
  const [sownQty, setSownQty] = useState(0);
  const [germinatedQty, setGerminatedQty] = useState(0);
  const [rejectedQty, setRejectedQty] = useState(0);
  const [collectionStatus, setCollectionStatus] = useState('Verified');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchGerminationData = async () => {
    try {
      const [germRes, farmsRes, batchesRes] = await Promise.all([
        fetch('/api/germination'),
        fetch('/api/farms'),
        fetch('/api/batches?all=true')
      ]);
      const germData = await germRes.json();
      const farmsData = await farmsRes.json();
      const batchesData = await batchesRes.json();

      setRecords(Array.isArray(germData) ? germData : []);
      setFarms(Array.isArray(farmsData) ? farmsData : []);
      setBatches(Array.isArray(batchesData) ? batchesData : []);
    } catch (err) {
      console.error('Failed to load germination records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGerminationData();
  }, []);

  const openEditModal = (rec: any) => {
    setEditingSource(rec);
    setSownQty(rec.coconutsSown || rec.coconutQuantity || 0);
    setGerminatedQty(rec.germinatedQuantity || 0);
    setRejectedQty(rec.rejectedQuantity || 0);
    setCollectionStatus(rec.collectionStatus || 'Verified');
    setStartDate(rec.germinationStartDate || rec.collectionDate || '');
    setEndDate(rec.germinationEndDate || '');
    setNotes(rec.notes || '');
  };

  const handleSaveGermination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSource) return;

    setSaving(true);
    try {
      const res = await fetch('/api/germination', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: editingSource.id,
          coconutsSown: sownQty,
          germinatedQuantity: germinatedQty,
          rejectedQuantity: rejectedQty,
          collectionStatus,
          germinationStartDate: startDate,
          germinationEndDate: endDate,
          notes
        })
      });

      if (res.ok) {
        alert(`✅ Germination metrics updated for source ${editingSource.motherTreeCode}! Available seedlings inventory recalculated.`);
        setEditingSource(null);
        fetchGerminationData();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update germination');
      }
    } catch (err) {
      alert('Error updating germination data');
    } finally {
      setSaving(false);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchSearch = !search ||
      r.batchCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.farmCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.motherTreeCode?.toLowerCase().includes(search.toLowerCase());

    const matchBatch = batchFilter === 'ALL' || r.batchCode === batchFilter;
    const matchFarm = farmFilter === 'ALL' || r.farmCode === farmFilter;

    return matchSearch && matchBatch && matchFarm;
  });

  const totalCollected = filteredRecords.reduce((sum, r) => sum + (Number(r.coconutQuantity) || 0), 0);
  const totalSown = filteredRecords.reduce((sum, r) => sum + (Number(r.coconutsSown) || 0), 0);
  const totalGerminated = filteredRecords.reduce((sum, r) => sum + (Number(r.germinatedQuantity) || 0), 0);
  const overallRate = totalSown > 0 ? Math.round((totalGerminated / totalSown) * 100) : 0;

  return (
    <>
      <section className="bg-dark text-white py-3 border-bottom border-success border-3">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="badge bg-success mb-1">MODULE 5.1: GERMINATION TRACKING</span>
              <h2 className="fw-bold mb-0 text-light">Germination Tracking &amp; Seed Nut Audit</h2>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Link href="/admin/seedling-inventory" className="btn btn-primary fw-bold btn-sm d-inline-flex align-items-center gap-1 shadow-sm">
                <i className="bi bi-box-seam"></i>
                <span>Seedling Inventory</span>
              </Link>
              <Link href="/admin" className="btn btn-outline-light btn-sm">
                <i className="bi bi-arrow-left me-1"></i> Admin Hub
              </Link>
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </section>

      <AdminNav />

      <section className="py-4 bg-light min-vh-100">
        <div className="container">

          {/* Metric Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-warning border-4">
                <small className="text-muted d-block text-uppercase extra-small fw-bold">Total Coconuts Sourced</small>
                <h3 className="fw-bold text-dark mb-0">{loading ? '...' : totalCollected.toLocaleString()}</h3>
                <small className="text-secondary extra-small">Across Filtered Sources</small>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-info border-4">
                <small className="text-muted d-block text-uppercase extra-small fw-bold">Total Sown in Nursery</small>
                <h3 className="fw-bold text-info mb-0">{loading ? '...' : totalSown.toLocaleString()}</h3>
                <small className="text-secondary extra-small">In Nursery Seedbeds</small>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-success border-4">
                <small className="text-muted d-block text-uppercase extra-small fw-bold">Successfully Germinated</small>
                <h3 className="fw-bold text-success mb-0">{loading ? '...' : totalGerminated.toLocaleString()}</h3>
                <small className="text-secondary extra-small">Healthy Sprouted Seedlings</small>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-primary border-4">
                <small className="text-muted d-block text-uppercase extra-small fw-bold">Overall Germination Rate</small>
                <h3 className="fw-bold text-primary mb-0">{loading ? '...' : `${overallRate}%`}</h3>
                <small className="text-secondary extra-small">Genetic Viability Benchmark</small>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
            <div className="row g-2 align-items-center">
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search Batch ID, Farm ID, Tree ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button className="btn btn-outline-secondary" onClick={() => setSearch('')}><i className="bi bi-x"></i></button>
                  )}
                </div>
              </div>

              <div className="col-md-4">
                <select className="form-select" value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
                  <option value="ALL">All Batches</option>
                  {batches.map(b => (
                    <option key={b.batchCode} value={b.batchCode}>{b.batchCode} - {b.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <select className="form-select" value={farmFilter} onChange={(e) => setFarmFilter(e.target.value)}>
                  <option value="ALL">All Contributing Farms</option>
                  {farms.map(f => (
                    <option key={f.farmCode} value={f.farmCode}>{f.farmCode} - {f.farmName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Germination Records Table */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-5">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-nowrap">
                <thead className="table-dark">
                  <tr>
                    <th>Batch ID</th>
                    <th>Contributing Farm</th>
                    <th>Mother Tree ID</th>
                    <th className="text-center">Collected</th>
                    <th className="text-center">Sown</th>
                    <th className="text-center">Germinated</th>
                    <th className="text-center">Damaged / Rejected</th>
                    <th className="text-center">Pending</th>
                    <th className="text-center">Rate (%)</th>
                    <th>Start / End Date</th>
                    <th className="text-center">Status</th>
                    <th className="text-end">Update</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="text-center py-5">
                        <div className="spinner-border text-success" role="status"></div>
                        <p className="text-muted small mt-2 mb-0">Loading germination records...</p>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-5 text-muted">
                        No batch source records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map(r => {
                      const sown = Number(r.coconutsSown || r.coconutQuantity) || 0;
                      const germ = Number(r.germinatedQuantity) || 0;
                      const rate = sown > 0 ? Math.round((germ / sown) * 100) : 0;
                      const pending = Math.max(0, sown - germ - (Number(r.rejectedQuantity) || 0));

                      return (
                        <tr key={r.id}>
                          <td>
                            <span className="badge bg-secondary-subtle text-secondary font-monospace fw-bold">
                              {r.batchCode}
                            </span>
                          </td>
                          <td>
                            <div className="fw-bold text-dark">{r.farmCode}</div>
                            <small className="text-muted extra-small">{r.farmName}</small>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border font-monospace">
                              {r.motherTreeCode}
                            </span>
                          </td>
                          <td className="text-center fw-semibold text-warning">{r.coconutQuantity}</td>
                          <td className="text-center fw-semibold text-info">{sown}</td>
                          <td className="text-center fw-bold text-success">{germ}</td>
                          <td className="text-center text-danger">{r.rejectedQuantity || 0}</td>
                          <td className="text-center text-secondary">{pending}</td>
                          <td className="text-center">
                            <span className={`badge ${rate >= 90 ? 'bg-success' : rate >= 70 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                              {rate}%
                            </span>
                          </td>
                          <td>
                            <small className="d-block text-muted">Start: {r.germinationStartDate || r.collectionDate || 'N/A'}</small>
                            <small className="d-block text-secondary">End: {r.germinationEndDate || 'Ongoing'}</small>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-success-subtle text-success">{r.collectionStatus || 'Verified'}</span>
                          </td>
                          <td className="text-end">
                            <button
                              onClick={() => openEditModal(r)}
                              className="btn btn-sm btn-outline-primary"
                              title="Update Germination Count"
                            >
                              <i className="bi bi-pencil-square me-1"></i> Update
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* Modal: Update Germination */}
      {editingSource && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-flower1 me-2"></i> Update Germination: {editingSource.motherTreeCode}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingSource(null)}></button>
              </div>
              <form onSubmit={handleSaveGermination}>
                <div className="modal-body p-4">
                  <div className="p-3 bg-light rounded-3 mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small">Batch ID:</span>
                      <strong className="font-monospace text-dark">{editingSource.batchCode}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small">Origin Farm:</span>
                      <span className="badge bg-secondary font-monospace">{editingSource.farmCode}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted small">Total Coconuts Collected:</span>
                      <strong className="text-warning">{editingSource.coconutQuantity} seed nuts</strong>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">Coconuts Sown *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={sownQty}
                        onChange={(e) => setSownQty(parseInt(e.target.value, 10) || 0)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">Germinated Quantity *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={germinatedQty}
                        onChange={(e) => setGerminatedQty(parseInt(e.target.value, 10) || 0)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">Damaged / Rejected</label>
                      <input
                        type="number"
                        className="form-control"
                        value={rejectedQty}
                        onChange={(e) => setRejectedQty(parseInt(e.target.value, 10) || 0)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">Collection Status</label>
                      <select
                        className="form-select"
                        value={collectionStatus}
                        onChange={(e) => setCollectionStatus(e.target.value)}
                      >
                        <option value="Verified">Verified</option>
                        <option value="Collected">Collected</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">Germination Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small text-secondary">Germination End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold small text-secondary">Notes</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      ></textarea>
                    </div>
                  </div>

                  <div className="p-2 bg-success-subtle text-success rounded text-center small fw-semibold">
                    <i className="bi bi-info-circle me-1"></i>
                    Saving will automatically update the seedlings produced and available stock in the inventory ledger.
                  </div>
                </div>

                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingSource(null)}>Cancel</button>
                  <button type="submit" className="btn btn-success fw-bold" disabled={saving}>
                    {saving ? 'Updating...' : 'Save Germination Results'}
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
