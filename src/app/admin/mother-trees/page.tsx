'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import AdminLogoutButton from '@/components/AdminLogoutButton';
import ImageCarousel from '@/components/ImageCarousel';
import { formatApproximateAge } from '@/lib/types';

export default function AdminMotherTreesPage() {
  const [palms, setPalms] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [farmFilter, setFarmFilter] = useState('ALL');
  const [selectionFilter, setSelectionFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'VISIBLE' | 'HIDDEN'>('ALL');

  // Selected mother trees for batch creation
  const [selectedTreeCodes, setSelectedTreeCodes] = useState<string[]>([]);

  // Toggling & Toast
  const [togglingPalmCode, setTogglingPalmCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewTree, setPreviewTree] = useState<any | null>(null);

  // New Mother Tree Form State
  const [selectedFarmCode, setSelectedFarmCode] = useState('ETH-RA-F001');
  const [newTree, setNewTree] = useState({
    code: '',
    motherTreeCode: '',
    name: '',
    variety: 'West Coast Tall (Eathamozhi Tall)',
    age: '40+ years' as any,
    location: 'Heritage Grove',
    healthStatus: 'Excellent (100% Disease Resistant)',
    yieldHistory: 'Consistently 160–180 high-weight seed nuts per year over 25 monitored years.',
    description: 'Selected for heavy canopy, disease immunity, and large copra content.',
    nutCharacteristics: 'Large spherical nuts with high coconut water volume and thick kernel.',
    whySelected: 'Consistently high yield with exceptional seedling germination rate (>94%).',
    selectionStatus: 'Selected' as 'Selected' | 'Registered',
    verificationStatus: 'Verified' as 'Verified' | 'Pending',
    productionStatus: 'Active for Production' as 'Active for Production' | 'Inactive' | 'Retired',
    notes: '',
    images: [] as string[],
    isVisible: true
  });

  const [treeFiles, setTreeFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Edit Modal State
  const [editingTree, setEditingTree] = useState<any | null>(null);
  const [editTreeImages, setEditTreeImages] = useState<string[]>([]);
  const [newTreeImageUrl, setNewTreeImageUrl] = useState('');
  const [savingImages, setSavingImages] = useState(false);

  const fetchInitialData = async () => {
    try {
      const [palmsRes, farmsRes] = await Promise.all([
        fetch(`/api/parent-palms?all=true&_t=${Date.now()}`, { cache: 'no-store' }),
        fetch('/api/farms')
      ]);
      const palmsData = await palmsRes.json();
      const farmsData = await farmsRes.json();

      setPalms(Array.isArray(palmsData) ? palmsData : []);
      if (Array.isArray(farmsData) && farmsData.length > 0) {
        setFarms(farmsData);
        if (!selectedFarmCode && farmsData[0]) {
          setSelectedFarmCode(farmsData[0].farmCode);
        }
      }
    } catch (err) {
      console.error('Failed to fetch mother trees or farms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleToggleSinglePalmVisibility = async (palm: any) => {
    const targetCode = palm.code || palm.motherTreeCode;
    const nextVal = palm.isVisible === false ? true : false;
    setTogglingPalmCode(targetCode);
    setPalms(prev => prev.map(p => (p.code === targetCode || p.motherTreeCode === targetCode) ? { ...p, isVisible: nextVal } : p));
    try {
      const res = await fetch('/api/parent-palms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: targetCode, isVisible: nextVal })
      });
      if (res.ok) {
        setToastMessage(`✓ Mother Tree ${targetCode} is now ${nextVal ? 'VISIBLE (ON) to customers' : 'HIDDEN (OFF) from customers'}.`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        throw new Error('Update failed');
      }
    } catch (e: any) {
      alert('Error updating visibility: ' + e.message);
      fetchInitialData();
    } finally {
      setTogglingPalmCode(null);
    }
  };

  const handleTreeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setTreeFiles(Array.from(e.target.files));
    }
  };

  const handleCreateTree = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalImages: string[] = [];

    const activeFarm = farms.find(f => f.farmCode === selectedFarmCode) || farms[0];
    const treeLabel = newTree.name.trim() || `Mother Palm (${selectedFarmCode})`;

    if (treeFiles.length > 0) {
      setUploading(true);
      const formData = new FormData();
      treeFiles.forEach(f => formData.append('files', f));
      formData.append('category', 'parent-palms');
      formData.append('tag', selectedFarmCode);

      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.urls) {
          finalImages = uploadData.urls;
        }
      } catch (err) {
        console.error('Upload error during tree creation');
      } finally {
        setUploading(false);
      }
    }

    if (finalImages.length === 0) {
      finalImages = ['/images/placeholder.png'];
    }

    try {
      const res = await fetch('/api/parent-palms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTree,
          farmId: activeFarm?.id,
          farmCode: activeFarm?.farmCode || selectedFarmCode,
          farmName: activeFarm?.farmName,
          name: treeLabel,
          images: finalImages
        })
      });

      if (res.ok) {
        const createdTree = await res.json();
        alert(`✅ Mother Tree ${createdTree.motherTreeCode || createdTree.code} registered under ${selectedFarmCode}!`);
        fetchInitialData();
        setTreeFiles([]);
        setNewTree({
          code: '',
          motherTreeCode: '',
          name: '',
          variety: 'West Coast Tall (Eathamozhi Tall)',
          age: '40+ years',
          location: activeFarm?.location || 'Heritage Grove',
          healthStatus: 'Excellent (100% Disease Resistant)',
          yieldHistory: 'Consistently 160–180 high-weight seed nuts per year over 25 monitored years.',
          description: 'Selected for heavy canopy, disease immunity, and large copra content.',
          nutCharacteristics: 'Large spherical nuts with high coconut water volume and thick kernel.',
          whySelected: 'Consistently high yield with exceptional seedling germination rate (>94%).',
          selectionStatus: 'Selected',
          verificationStatus: 'Verified',
          productionStatus: 'Active for Production',
          notes: '',
          images: [],
          isVisible: true
        });
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to add mother tree');
      }
    } catch (err) {
      alert('Error adding mother tree');
    }
  };

  const openEditModal = (tree: any) => {
    setEditingTree({ ...tree });
    setEditTreeImages(tree.images && Array.isArray(tree.images) ? [...tree.images] : []);
    setNewTreeImageUrl('');
  };

  const handleSaveTreeEdits = async () => {
    if (!editingTree) return;
    setSavingImages(true);

    try {
      const payload = {
        code: editingTree.code,
        motherTreeCode: editingTree.motherTreeCode,
        farmCode: editingTree.farmCode,
        name: editingTree.name,
        variety: editingTree.variety,
        age: formatApproximateAge(editingTree.age),
        location: editingTree.location,
        healthStatus: editingTree.healthStatus,
        yieldHistory: editingTree.yieldHistory,
        description: editingTree.description,
        nutCharacteristics: editingTree.nutCharacteristics,
        whySelected: editingTree.whySelected,
        selectionStatus: editingTree.selectionStatus,
        verificationStatus: editingTree.verificationStatus,
        productionStatus: editingTree.productionStatus,
        notes: editingTree.notes,
        images: editTreeImages,
        isVisible: editingTree.isVisible
      };

      const res = await fetch('/api/parent-palms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('✅ Mother Tree details and photos updated successfully!');
        setEditingTree(null);
        fetchInitialData();
      } else {
        throw new Error('Update failed');
      }
    } catch (e: any) {
      alert('Failed to save changes: ' + e.message);
    } finally {
      setSavingImages(false);
    }
  };

  const toggleSelectTree = (code: string) => {
    setSelectedTreeCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const selectAllFiltered = () => {
    const codes = filteredPalms.map(p => p.motherTreeCode || p.code);
    setSelectedTreeCodes(codes);
  };

  const clearSelection = () => {
    setSelectedTreeCodes([]);
  };

  // Filtered Mother Trees
  const filteredPalms = palms.filter(p => {
    const pCode = p.motherTreeCode || p.code || '';
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      pCode.toLowerCase().includes(search.toLowerCase()) ||
      p.variety?.toLowerCase().includes(search.toLowerCase()) ||
      p.farmCode?.toLowerCase().includes(search.toLowerCase());

    const matchFarm = farmFilter === 'ALL' || p.farmCode === farmFilter;
    const matchSelection = selectionFilter === 'ALL' || p.selectionStatus === selectionFilter;
    const matchVerification = verificationFilter === 'ALL' || p.verificationStatus === verificationFilter;

    const isVis = p.isVisible !== false;
    const matchVis = visibilityFilter === 'ALL'
      ? true
      : visibilityFilter === 'VISIBLE'
        ? isVis
        : !isVis;

    return matchSearch && matchFarm && matchSelection && matchVerification && matchVis;
  });

  return (
    <>
      <section className="bg-dark text-white py-3 border-bottom border-success border-3">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="badge bg-success mb-1">MODULE 3: MOTHER TREE REGISTRY</span>
              <h2 className="fw-bold mb-0 text-light">Mother Tree &amp; Ancestral Palm Registry</h2>
            </div>
            <div className="d-flex align-items-center gap-2">
              {selectedTreeCodes.length > 0 && (
                <Link
                  href={`/admin/batches?selectedTrees=${encodeURIComponent(selectedTreeCodes.join(','))}`}
                  className="btn btn-warning fw-bold btn-sm text-dark d-inline-flex align-items-center gap-1 shadow-sm"
                >
                  <i className="bi bi-plus-square-fill"></i>
                  <span>Create Batch ({selectedTreeCodes.length} Trees)</span>
                </Link>
              )}
              <Link href="/admin" className="btn btn-outline-light btn-sm">
                <i className="bi bi-arrow-left me-1"></i> Admin Hub
              </Link>
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </section>

      <AdminNav />

      {toastMessage && (
        <div className="alert alert-success border-0 rounded-0 py-2 text-center fw-semibold mb-0 shadow-sm">
          <i className="bi bi-check-circle-fill me-2"></i>
          {toastMessage}
        </div>
      )}

      <section className="py-4 bg-light min-vh-100">
        <div className="container">

          {/* Module 3.3 Filters */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
            <div className="row g-2 align-items-center">
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search by Tree ID, Name, Variety..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="col-md-2">
                <select
                  className="form-select"
                  value={farmFilter}
                  onChange={(e) => setFarmFilter(e.target.value)}
                >
                  <option value="ALL">All Farms</option>
                  {farms.map(f => (
                    <option key={f.farmCode} value={f.farmCode}>{f.farmCode} - {f.farmName}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <select
                  className="form-select"
                  value={selectionFilter}
                  onChange={(e) => setSelectionFilter(e.target.value)}
                >
                  <option value="ALL">All Selection Statuses</option>
                  <option value="Selected">Selected Only</option>
                  <option value="Registered">Registered Only</option>
                </select>
              </div>

              <div className="col-md-2">
                <select
                  className="form-select"
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                >
                  <option value="ALL">All Verifications</option>
                  <option value="Verified">Verified Only</option>
                  <option value="Pending">Pending Verification</option>
                </select>
              </div>

              <div className="col-md-2">
                <select
                  className="form-select"
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value as any)}
                >
                  <option value="ALL">All Customer Visibility</option>
                  <option value="VISIBLE">Visible (ON) Only</option>
                  <option value="HIDDEN">Hidden (OFF) Only</option>
                </select>
              </div>
            </div>

            {/* Selection action bar */}
            <div className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top flex-wrap gap-2">
              <div className="small text-muted">
                Showing <strong>{filteredPalms.length}</strong> mother tree{filteredPalms.length !== 1 ? 's' : ''}
                {selectedTreeCodes.length > 0 && (
                  <span className="ms-2 badge bg-primary">
                    {selectedTreeCodes.length} selected for batch
                  </span>
                )}
              </div>
              <div className="d-flex gap-2">
                <button onClick={selectAllFiltered} className="btn btn-sm btn-outline-secondary extra-small">
                  Select All Filtered
                </button>
                {selectedTreeCodes.length > 0 && (
                  <button onClick={clearSelection} className="btn btn-sm btn-outline-danger extra-small">
                    Clear Selection
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mother Tree Table */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-5">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-nowrap">
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedTreeCodes.length > 0 && selectedTreeCodes.length === filteredPalms.length}
                        onChange={(e) => e.target.checked ? selectAllFiltered() : clearSelection()}
                      />
                    </th>
                    <th>Photo</th>
                    <th>Mother Tree ID</th>
                    <th>Farm ID</th>
                    <th>Tree Name</th>
                    <th>Variety</th>
                    <th className="text-center">Age</th>
                    <th className="text-center">Selection Status</th>
                    <th className="text-center">Batches Used</th>
                    <th className="text-center">Coconuts Collected</th>
                    <th className="text-center">Seedlings Produced</th>
                    <th className="text-center">Customer Visibility</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={13} className="text-center py-5">
                        <div className="spinner-border text-success" role="status"></div>
                        <p className="text-muted small mt-2 mb-0">Loading mother trees...</p>
                      </td>
                    </tr>
                  ) : filteredPalms.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center py-5 text-muted">
                        No mother trees found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredPalms.map((palm) => {
                      const tCode = palm.motherTreeCode || palm.code;
                      const isSelected = selectedTreeCodes.includes(tCode);
                      return (
                        <tr key={tCode} className={isSelected ? 'table-warning' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={isSelected}
                              onChange={() => toggleSelectTree(tCode)}
                            />
                          </td>
                          <td style={{ width: '70px' }}>
                            <div
                              className="position-relative rounded-3 overflow-hidden shadow-sm cursor-pointer"
                              style={{ width: '56px', height: '56px' }}
                              onClick={() => setPreviewTree(palm)}
                              title="Click to view full image"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={palm.images?.[0] || '/images/placeholder.png'}
                                alt={palm.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-secondary-subtle text-secondary font-monospace fw-bold">
                              {tCode}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border font-monospace">
                              {palm.farmCode || 'ETH-RA-F001'}
                            </span>
                          </td>
                          <td>
                            <div className="fw-bold text-dark">{palm.name}</div>
                            <small className="text-muted extra-small">{palm.location || 'Heritage Grove'}</small>
                          </td>
                          <td>
                            <small className="text-dark fw-semibold">{palm.variety || 'West Coast Tall'}</small>
                          </td>
                          <td className="text-center fw-semibold">{formatApproximateAge(palm.age)}</td>
                          <td className="text-center">
                            <span className={`badge ${palm.selectionStatus === 'Selected' ? 'bg-success' : 'bg-secondary'}`}>
                              {palm.selectionStatus || 'Selected'}
                            </span>
                          </td>
                          <td className="text-center fw-semibold text-primary">{palm.batchesUsedCount ?? 0}</td>
                          <td className="text-center fw-semibold text-warning">{(palm.totalCoconutsCollected ?? 0).toLocaleString()}</td>
                          <td className="text-center fw-semibold text-success">{(palm.totalSeedlingsProduced ?? 0).toLocaleString()}</td>
                          <td className="text-center">
                            <div className="form-check form-switch d-inline-block">
                              <input
                                className="form-check-input cursor-pointer"
                                type="checkbox"
                                role="switch"
                                checked={palm.isVisible !== false}
                                disabled={togglingPalmCode === tCode}
                                onChange={() => handleToggleSinglePalmVisibility(palm)}
                              />
                              <label className="form-check-label extra-small fw-semibold ms-1">
                                {palm.isVisible !== false ? (
                                  <span className="text-success">ON</span>
                                ) : (
                                  <span className="text-secondary">OFF</span>
                                )}
                              </label>
                            </div>
                          </td>
                          <td className="text-end">
                            <button
                              onClick={() => openEditModal(palm)}
                              className="btn btn-sm btn-outline-primary"
                              title="Edit Tree Details & Photos"
                            >
                              <i className="bi bi-pencil me-1"></i> Edit
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

          {/* Form: Register New Mother Tree Under Farm */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-5">
            <h5 className="fw-bold text-dark mb-3">
              <i className="bi bi-plus-circle-fill text-success me-2"></i>
              Register New Mother Tree Under Farm
            </h5>
            <form onSubmit={handleCreateTree}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold small text-secondary">Assign To Farm *</label>
                  <select
                    className="form-select"
                    value={selectedFarmCode}
                    onChange={(e) => setSelectedFarmCode(e.target.value)}
                    required
                  >
                    {farms.map(f => (
                      <option key={f.farmCode} value={f.farmCode}>
                        {f.farmCode} - {f.farmName} ({f.location})
                      </option>
                    ))}
                  </select>
                  <small className="text-muted extra-small">
                    Mother Tree ID (e.g. <code>{selectedFarmCode}-MT001</code>) will be generated automatically.
                  </small>
                </div>

                <div className="col-md-5">
                  <label className="form-label fw-bold small text-secondary">Mother Tree Name / Label *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. High Yield Heritage Palm #21"
                    value={newTree.name}
                    onChange={(e) => setNewTree({ ...newTree, name: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold small text-secondary">Approximate Age *</label>
                  <select
                    className="form-select"
                    value={typeof newTree.age === 'string' ? newTree.age : formatApproximateAge(newTree.age)}
                    onChange={(e) => setNewTree({ ...newTree, age: e.target.value })}
                    required
                  >
                    <option value="30+ years">30+ years</option>
                    <option value="40+ years">40+ years</option>
                    <option value="50+ years">50+ years</option>
                    <option value="60+ years">60+ years</option>
                    <option value="70+ years">70+ years</option>
                    <option value="80+ years">80+ years</option>
                    <option value="100+ years">100+ years</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small text-secondary">Coconut Cultivar / Variety</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newTree.variety}
                    onChange={(e) => setNewTree({ ...newTree, variety: e.target.value })}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small text-secondary">Selection Status</label>
                  <select
                    className="form-select"
                    value={newTree.selectionStatus}
                    onChange={(e) => setNewTree({ ...newTree, selectionStatus: e.target.value as any })}
                  >
                    <option value="Selected">Selected</option>
                    <option value="Registered">Registered</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small text-secondary">Production Status</label>
                  <select
                    className="form-select"
                    value={newTree.productionStatus}
                    onChange={(e) => setNewTree({ ...newTree, productionStatus: e.target.value as any })}
                  >
                    <option value="Active for Production">Active for Production</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small text-secondary">Yield History</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newTree.yieldHistory}
                    onChange={(e) => setNewTree({ ...newTree, yieldHistory: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small text-secondary">Upload Photographs</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="form-control"
                    onChange={handleTreeFileChange}
                  />
                </div>

                <div className="col-12 text-end">
                  <button type="submit" className="btn btn-success fw-bold px-4 shadow-sm" disabled={uploading}>
                    {uploading ? 'Uploading Photographs...' : 'Register Mother Tree'}
                  </button>
                </div>
              </div>
            </form>
          </div>

        </div>
      </section>

      {/* Edit Tree Modal */}
      {editingTree && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square me-2"></i> Edit Mother Tree: {editingTree.motherTreeCode || editingTree.code}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingTree(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Associated Farm *</label>
                    <select
                      className="form-select"
                      value={editingTree.farmCode || ''}
                      onChange={(e) => setEditingTree({ ...editingTree, farmCode: e.target.value })}
                      required
                    >
                      {farms.map(f => (
                        <option key={f.farmCode} value={f.farmCode}>
                          {f.farmCode} - {f.farmName} ({f.location || ''})
                        </option>
                      ))}
                    </select>
                    <small className="text-muted extra-small">Change the farm this mother tree belongs to</small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Tree Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingTree.name}
                      onChange={(e) => setEditingTree({ ...editingTree, name: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Approximate Age *</label>
                    <select
                      className="form-select"
                      value={formatApproximateAge(editingTree.age)}
                      onChange={(e) => setEditingTree({ ...editingTree, age: e.target.value })}
                    >
                      <option value="30+ years">30+ years</option>
                      <option value="40+ years">40+ years</option>
                      <option value="50+ years">50+ years</option>
                      <option value="60+ years">60+ years</option>
                      <option value="70+ years">70+ years</option>
                      <option value="80+ years">80+ years</option>
                      <option value="100+ years">100+ years</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Variety</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingTree.variety}
                      onChange={(e) => setEditingTree({ ...editingTree, variety: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-secondary">Selection Status</label>
                    <select
                      className="form-select"
                      value={editingTree.selectionStatus}
                      onChange={(e) => setEditingTree({ ...editingTree, selectionStatus: e.target.value })}
                    >
                      <option value="Selected">Selected</option>
                      <option value="Registered">Registered</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-secondary">Verification Status</label>
                    <select
                      className="form-select"
                      value={editingTree.verificationStatus}
                      onChange={(e) => setEditingTree({ ...editingTree, verificationStatus: e.target.value })}
                    >
                      <option value="Verified">Verified</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small text-secondary">Production Status</label>
                    <select
                      className="form-select"
                      value={editingTree.productionStatus}
                      onChange={(e) => setEditingTree({ ...editingTree, productionStatus: e.target.value })}
                    >
                      <option value="Active for Production">Active for Production</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">Yield History</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={editingTree.yieldHistory}
                      onChange={(e) => setEditingTree({ ...editingTree, yieldHistory: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                {/* Photos Gallery Manager */}
                <div className="p-3 bg-light rounded-3 mb-3">
                  <h6 className="fw-bold text-dark mb-2">Photographs ({editTreeImages.length})</h6>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {editTreeImages.map((imgUrl, idx) => (
                      <div key={idx} className="position-relative border rounded overflow-hidden" style={{ width: '80px', height: '80px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm p-0 position-absolute top-0 end-0 rounded-circle m-1 d-flex align-items-center justify-content-center"
                          style={{ width: '20px', height: '20px', fontSize: '10px' }}
                          onClick={() => setEditTreeImages(prev => prev.filter((_, i) => i !== idx))}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Add image URL or Cloudinary URL..."
                      value={newTreeImageUrl}
                      onChange={(e) => setNewTreeImageUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      onClick={() => {
                        if (newTreeImageUrl.trim()) {
                          setEditTreeImages(prev => [...prev, newTreeImageUrl.trim()]);
                          setNewTreeImageUrl('');
                        }
                      }}
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {/* Customer Visibility Toggle */}
                <div className="form-check form-switch p-2 bg-light rounded">
                  <input
                    className="form-check-input ms-0 me-2"
                    type="checkbox"
                    role="switch"
                    id="editTreeVisSwitch"
                    checked={editingTree.isVisible !== false}
                    onChange={(e) => setEditingTree({ ...editingTree, isVisible: e.target.checked })}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="editTreeVisSwitch">
                    Visible to Customers on Public Site &amp; Farm Pages ({editingTree.isVisible !== false ? 'ON' : 'OFF'})
                  </label>
                </div>
              </div>

              <div className="modal-footer bg-light border-0">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingTree(null)}>Cancel</button>
                <button type="button" className="btn btn-primary fw-bold" onClick={handleSaveTreeEdits} disabled={savingImages}>
                  {savingImages ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Popup */}
      {previewTree && (
        <ImageCarousel
          images={previewTree.images || ['/images/placeholder.png']}
          title={`${previewTree.name} (${previewTree.motherTreeCode || previewTree.code})`}
          onClose={() => setPreviewTree(null)}
        />
      )}
    </>
  );
}
