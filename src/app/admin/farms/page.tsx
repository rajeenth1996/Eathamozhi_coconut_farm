'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import AdminLogoutButton from '@/components/AdminLogoutButton';

export default function AdminFarmRegistryPage() {
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');

  // New Farm Modal / State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newLocation, setNewLocation] = useState('Eathamozhi');
  const [newStatus, setNewStatus] = useState<'Active' | 'Inactive'>('Active');
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Farm Modal State
  const [editingFarm, setEditingFarm] = useState<any | null>(null);
  const [editFarmName, setEditFarmName] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editNotes, setEditNotes] = useState('');

  // View Farm Detail State
  const [viewingFarm, setViewingFarm] = useState<any | null>(null);
  const [farmDetailsData, setFarmDetailsData] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchFarms = async () => {
    try {
      const res = await fetch('/api/farms');
      const data = await res.json();
      setFarms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch farms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const openViewDetails = async (farm: any) => {
    setViewingFarm(farm);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/farms/${farm.farmCode}`);
      const data = await res.json();
      setFarmDetailsData(data);
    } catch (err) {
      console.error('Failed to load farm details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmName.trim() || !newOwnerName.trim() || !newLocation.trim()) {
      alert('Please fill in Farm Name, Owner Name, and Location');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmName: newFarmName.trim(),
          ownerName: newOwnerName.trim(),
          location: newLocation.trim(),
          status: newStatus,
          notes: newNotes.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create farm');
      }

      alert('✅ Farm registered successfully with automatically generated Farm ID!');
      setShowAddModal(false);
      setNewFarmName('');
      setNewOwnerName('');
      setNewLocation('Eathamozhi');
      setNewNotes('');
      fetchFarms();
    } catch (err: any) {
      alert(`⚠️ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (farm: any) => {
    setEditingFarm(farm);
    setEditFarmName(farm.farmName);
    setEditOwnerName(farm.ownerName);
    setEditLocation(farm.location);
    setEditStatus(farm.status);
    setEditNotes(farm.notes || '');
  };

  const handleUpdateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarm) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/farms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmCode: editingFarm.farmCode,
          farmName: editFarmName.trim(),
          ownerName: editOwnerName.trim(),
          location: editLocation.trim(),
          status: editStatus,
          notes: editNotes.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update farm');
      }

      alert('✅ Farm details updated successfully!');
      setEditingFarm(null);
      fetchFarms();
    } catch (err: any) {
      alert(`⚠️ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (farm: any) => {
    const nextStatus = farm.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await fetch('/api/farms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmCode: farm.farmCode,
          status: nextStatus
        })
      });
      if (res.ok) {
        fetchFarms();
      }
    } catch (err) {
      console.error('Failed to toggle farm status');
    }
  };

  // Unique locations for filter
  const locations = Array.from(new Set(farms.map(f => f.location).filter(Boolean)));

  // Filtered farms
  const filteredFarms = farms.filter(f => {
    const matchSearch = !search ||
      f.farmCode.toLowerCase().includes(search.toLowerCase()) ||
      f.farmName.toLowerCase().includes(search.toLowerCase()) ||
      f.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      f.location.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || f.status === statusFilter;
    const matchLoc = locationFilter === 'ALL' || f.location === locationFilter;

    return matchSearch && matchStatus && matchLoc;
  });

  const totalPages = Math.ceil(filteredFarms.length / pageSize) || 1;
  const paginatedFarms = filteredFarms.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <section className="bg-dark text-white py-3 border-bottom border-success border-3">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="badge bg-success mb-1">MODULE 1: FARM REGISTRY</span>
              <h2 className="fw-bold mb-0 text-light">Farm Registry & Provenance</h2>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-success fw-bold btn-sm d-inline-flex align-items-center gap-1 shadow-sm"
              >
                <i className="bi bi-plus-circle-fill"></i>
                <span>Register New Farm</span>
              </button>
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

          {/* Quick Filter & Search Bar */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
            <div className="row g-2 align-items-center">
              <div className="col-md-5">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search by Farm ID, Farm Name, or Owner..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  />
                  {search && (
                    <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="col-md-3">
                <select
                  className="form-select"
                  value={locationFilter}
                  onChange={(e) => { setLocationFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="ALL">All Farm Locations</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>

              <div className="col-md-2 text-md-end text-muted small">
                Showing <strong>{filteredFarms.length}</strong> farm{filteredFarms.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Farm Registry Table */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-nowrap">
                <thead className="table-dark">
                  <tr>
                    <th>Farm Name</th>
                    <th>Farm ID</th>
                    <th>Owner</th>
                    <th>Location</th>
                    <th className="text-center">Mother Trees</th>
                    <th className="text-center">Selected</th>
                    <th className="text-center">Active Batches</th>
                    <th className="text-center">Produced</th>
                    <th className="text-center">Available</th>
                    <th className="text-center">Booked</th>
                    <th className="text-center">Dispatched</th>
                    <th className="text-center">Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={13} className="text-center py-5">
                        <div className="spinner-border text-success" role="status"></div>
                        <p className="text-muted small mt-2 mb-0">Loading farm records...</p>
                      </td>
                    </tr>
                  ) : paginatedFarms.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center py-5 text-muted">
                        <i className="bi bi-geo-alt display-6 text-secondary d-block mb-2"></i>
                        No farms matched your filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedFarms.map((farm) => (
                      <tr key={farm.farmCode}>
                        <td>
                          <button
                            onClick={() => openViewDetails(farm)}
                            className="btn btn-link text-decoration-none fw-bold text-dark p-0 text-start"
                            title="Click to view farm details & mother tree breakdown"
                          >
                            {farm.farmName}
                            <i className="bi bi-box-arrow-up-right ms-1 small text-success"></i>
                          </button>
                        </td>
                        <td>
                          <span className="badge bg-secondary-subtle text-secondary border border-secondary font-monospace fw-bold">
                            {farm.farmCode}
                          </span>
                        </td>
                        <td>{farm.ownerName}</td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                            {farm.location}
                          </span>
                        </td>
                        <td className="text-center fw-semibold">{farm.totalMotherTrees ?? 0}</td>
                        <td className="text-center">
                          <span className="badge bg-success-subtle text-success">
                            {farm.selectedMotherTrees ?? 0}
                          </span>
                        </td>
                        <td className="text-center fw-semibold">{farm.activeBatches ?? 0}</td>
                        <td className="text-center text-primary fw-semibold">{farm.totalSeedlingsProduced ?? 0}</td>
                        <td className="text-center">
                          <span className="badge bg-success">
                            {farm.availableSeedlings ?? 0}
                          </span>
                        </td>
                        <td className="text-center text-warning fw-semibold">{farm.bookedSeedlings ?? 0}</td>
                        <td className="text-center text-secondary fw-semibold">{farm.dispatchedSeedlings ?? 0}</td>
                        <td className="text-center">
                          <button
                            onClick={() => handleToggleStatus(farm)}
                            className={`badge border-0 cursor-pointer ${
                              farm.status === 'Active'
                                ? 'bg-success text-white'
                                : 'bg-secondary text-white'
                            }`}
                            title="Click to toggle status"
                          >
                            <i className={`bi ${farm.status === 'Active' ? 'bi-check-circle' : 'bi-pause-circle'} me-1`}></i>
                            {farm.status}
                          </button>
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              onClick={() => openViewDetails(farm)}
                              className="btn btn-outline-success"
                              title="View Farm Details"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              onClick={() => openEditModal(farm)}
                              className="btn btn-outline-primary"
                              title="Edit Farm"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center p-3 border-top">
                <small className="text-muted">
                  Page {currentPage} of {totalPages}
                </small>
                <div className="btn-group btn-group-sm">
                  <button
                    className="btn btn-outline-secondary"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      className={`btn ${currentPage === i + 1 ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="btn btn-outline-secondary"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Modal: Register New Farm */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-plus-circle me-2"></i> Register New Farm
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleCreateFarm}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Farm Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Suresh Coastal Coconut Grove"
                      value={newFarmName}
                      onChange={(e) => setNewFarmName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Farm Owner Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Suresh"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      required
                    />
                    <small className="text-muted extra-small">
                      Owner code (e.g. SU) will be extracted automatically from the first 2 distinct letters.
                    </small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Farm Location (Village / Area) *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Eathamozhi, Kanyakumari"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      required
                    />
                    <small className="text-muted extra-small">
                      Location code (e.g. ETH) will be auto-generated according to Eathamozhi cultivar rules.
                    </small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Farm Status</label>
                    <select
                      className="form-select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Notes (Optional)</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Additional notes about the farm, soil, or historical background..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="p-3 bg-light rounded-3 text-secondary extra-small">
                    <i className="bi bi-info-circle-fill text-success me-1"></i>
                    <strong>Automated Farm ID:</strong> Follows standard <code>LOCATIONCODE-OWNERCODE-FARMNUMBER</code> (e.g. <code>ETH-SU-F001</code>). Unique, sequence-incremented, and immutable once saved.
                  </div>
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success fw-bold" disabled={submitting}>
                    {submitting ? 'Registering...' : 'Register Farm & Generate ID'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Farm */}
      {editingFarm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square me-2"></i> Edit Farm Details
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingFarm(null)}></button>
              </div>
              <form onSubmit={handleUpdateFarm}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Farm ID (Immutable)</label>
                    <input
                      type="text"
                      className="form-control bg-light font-monospace fw-bold"
                      value={editingFarm.farmCode}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Farm Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFarmName}
                      onChange={(e) => setEditFarmName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Farm Owner Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editOwnerName}
                      onChange={(e) => setEditOwnerName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Farm Location *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Farm Status</label>
                    <select
                      className="form-select"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Notes</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingFarm(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary fw-bold" disabled={submitting}>
                    {submitting ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Farm Details (Module 2.3) */}
      {viewingFarm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <div>
                  <span className="badge bg-success font-monospace me-2">{viewingFarm.farmCode}</span>
                  <h5 className="modal-title fw-bold d-inline">{viewingFarm.farmName}</h5>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => { setViewingFarm(null); setFarmDetailsData(null); }}></button>
              </div>
              <div className="modal-body p-4">
                {loadingDetails || !farmDetailsData ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-success" role="status"></div>
                    <p className="text-muted small mt-2">Loading detailed farm provenance & inventory...</p>
                  </div>
                ) : (
                  <>
                    {/* Header Summary */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-3">
                        <div className="card bg-light border-0 p-3 rounded-3">
                          <small className="text-muted">Owner</small>
                          <h6 className="fw-bold mb-0 text-dark">{farmDetailsData.farm?.ownerName}</h6>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card bg-light border-0 p-3 rounded-3">
                          <small className="text-muted">Location</small>
                          <h6 className="fw-bold mb-0 text-dark">{farmDetailsData.farm?.location}</h6>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card bg-light border-0 p-3 rounded-3">
                          <small className="text-muted">Total Seedlings Produced</small>
                          <h6 className="fw-bold mb-0 text-primary">{farmDetailsData.totalSeedlingsProduced || 0}</h6>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="card bg-light border-0 p-3 rounded-3">
                          <small className="text-muted">Available Stock</small>
                          <h6 className="fw-bold mb-0 text-success">{farmDetailsData.availableSeedlings || 0}</h6>
                        </div>
                      </div>
                    </div>

                    {/* Associated Mother Trees */}
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold text-dark mb-0">
                          <i className="bi bi-tree-fill text-success me-1"></i>
                          Registered Mother Trees ({farmDetailsData.motherTrees?.length || 0})
                        </h6>
                        <Link href="/admin/mother-trees" className="btn btn-sm btn-outline-success extra-small">
                          Open Registry <i className="bi bi-arrow-right"></i>
                        </Link>
                      </div>
                      <div className="table-responsive border rounded-3">
                        <table className="table table-sm table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Tree ID</th>
                              <th>Name</th>
                              <th>Variety</th>
                              <th>Age</th>
                              <th>Status</th>
                              <th>Seedlings Produced</th>
                            </tr>
                          </thead>
                          <tbody>
                            {farmDetailsData.motherTrees?.length === 0 ? (
                              <tr><td colSpan={6} className="text-center py-3 text-muted">No mother trees registered under this farm yet.</td></tr>
                            ) : (
                              farmDetailsData.motherTrees?.map((t: any) => (
                                <tr key={t.motherTreeCode || t.code}>
                                  <td><span className="badge bg-secondary-subtle text-secondary font-monospace">{t.motherTreeCode || t.code}</span></td>
                                  <td className="fw-semibold">{t.name}</td>
                                  <td>{t.variety}</td>
                                  <td>{t.age} yrs</td>
                                  <td><span className="badge bg-success-subtle text-success">{t.selectionStatus}</span></td>
                                  <td className="fw-semibold text-primary">{t.totalSeedlingsProduced || 0}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Associated Batches */}
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold text-dark mb-0">
                          <i className="bi bi-grid-3x3-gap-fill text-primary me-1"></i>
                          Associated Batches ({farmDetailsData.batches?.length || 0})
                        </h6>
                        <Link href="/admin/batches" className="btn btn-sm btn-outline-primary extra-small">
                          Manage Batches <i className="bi bi-arrow-right"></i>
                        </Link>
                      </div>
                      <div className="table-responsive border rounded-3">
                        <table className="table table-sm table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Batch Code</th>
                              <th>Batch Name</th>
                              <th>Harvest Date</th>
                              <th>Total Quantity</th>
                              <th>Available</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {farmDetailsData.batches?.length === 0 ? (
                              <tr><td colSpan={6} className="text-center py-3 text-muted">No batches associated with this farm yet.</td></tr>
                            ) : (
                              farmDetailsData.batches?.map((b: any) => (
                                <tr key={b.batchCode}>
                                  <td><span className="badge bg-secondary-subtle text-secondary font-monospace">{b.batchCode}</span></td>
                                  <td className="fw-semibold">{b.name}</td>
                                  <td>{b.harvestDate}</td>
                                  <td>{b.totalQuantity}</td>
                                  <td><span className="badge bg-success">{b.availableQuantity ?? b.totalQuantity}</span></td>
                                  <td><span className="badge bg-light text-dark border">{b.status}</span></td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer bg-light border-0">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setViewingFarm(null); setFarmDetailsData(null); }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
