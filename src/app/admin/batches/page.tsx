'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import AdminLogoutButton from '@/components/AdminLogoutButton';
import { getSaplingMetrics } from '@/lib/metrics';
import ImageCarousel from '@/components/ImageCarousel';

interface SourceItem {
  farmId: string;
  farmCode: string;
  farmName: string;
  motherTreeId: string;
  motherTreeCode: string;
  motherTreeName: string;
  coconutQuantity: number;
  collectionDate: string;
  collectionStatus: 'Collected' | 'Verified' | 'Pending' | 'Rejected';
  notes: string;
}

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [parentPalms, setParentPalms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'VISIBLE' | 'HIDDEN'>('ALL');
  const [farmFilter, setFarmFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [togglingBatchCode, setTogglingBatchCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewBatch, setPreviewBatch] = useState<any | null>(null);

  // Batch Creation Workflow (Module 4.2)
  const [primaryFarmCode, setPrimaryFarmCode] = useState('ETH-RA-F001');
  const [batchSeededDate, setBatchSeededDate] = useState('2026-11-15');
  const [batchHarvestDate, setBatchHarvestDate] = useState('2026-11-01');
  const [batchPrice, setBatchPrice] = useState(150);
  const [batchAge, setBatchAge] = useState('8–10 months');
  const [batchHeight, setBatchHeight] = useState('Approx. 2–3 ft');
  const [batchDescription, setBatchDescription] = useState('');
  const [batchIsVisible, setBatchIsVisible] = useState(true);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Source selection state
  const [sourceFarmCode, setSourceFarmCode] = useState('ETH-RA-F001');
  const [sourcesList, setSourcesList] = useState<SourceItem[]>([]);
  const [tempTreeQuantities, setTempTreeQuantities] = useState<Record<string, number>>({});
  const [tempTreeDates, setTempTreeDates] = useState<Record<string, string>>({});

  // Edit Modal State
  const [editingBatch, setEditingBatch] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState<number>(150);
  const [editAge, setEditAge] = useState<string>('8–10 months');
  const [editHeight, setEditHeight] = useState<string>('Approx. 2–3 ft');
  const [editTotalQuantity, setEditTotalQuantity] = useState<number>(500);
  const [editDescription, setEditDescription] = useState<string>('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editIsVisible, setEditIsVisible] = useState<boolean>(true);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchInitialData = async () => {
    try {
      const [batchesRes, palmsRes, farmsRes] = await Promise.all([
        fetch('/api/batches?all=true'),
        fetch('/api/parent-palms?all=true'),
        fetch('/api/farms')
      ]);
      const batchesData = await batchesRes.json();
      const palmsData = await palmsRes.json();
      const farmsData = await farmsRes.json();

      setBatches(Array.isArray(batchesData) ? batchesData : []);
      setParentPalms(Array.isArray(palmsData) ? palmsData : []);
      if (Array.isArray(farmsData) && farmsData.length > 0) {
        setFarms(farmsData);
        if (!primaryFarmCode) setPrimaryFarmCode(farmsData[0].farmCode);
        if (!sourceFarmCode) setSourceFarmCode(farmsData[0].farmCode);
      }
    } catch (err) {
      console.error('Failed to fetch batches or farms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Compute Preview Batch ID & Full Display Name (<Farm ID>-<Month>'<YY>-B<Batch Number>)
  const getPreviewBatchIdAndName = () => {
    const d = new Date(batchSeededDate || '2026-11-15');
    const monthNum = d.getMonth() + 1;
    const yearNum = d.getFullYear();
    const twoDigitYear = String(yearNum).slice(-2);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const fullMonth = monthNames[monthNum - 1] || 'November';
    const prefix = `${primaryFarmCode}-${fullMonth}'${twoDigitYear}`;

    let maxSeq = 0;
    for (const b of batches) {
      if (b.batchCode && b.batchCode.startsWith(prefix + '-B')) {
        const parts = b.batchCode.split('-B');
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    }
    const batchId = `${prefix}-B${maxSeq + 1}`;
    const displayName = `${primaryFarmCode} ${batchId} ${fullMonth} ${yearNum}`;

    return { batchId, displayName, monthNum, yearNum };
  };

  const previewInfo = getPreviewBatchIdAndName();

  // Add tree to sources
  const handleAddTreeToSources = (tree: any) => {
    const tCode = tree.motherTreeCode || tree.code;
    const exists = sourcesList.some(s => s.motherTreeCode === tCode);
    if (exists) {
      alert('This mother tree is already added to the batch sources.');
      return;
    }

    const farm = farms.find(f => f.farmCode === (tree.farmCode || sourceFarmCode)) || farms[0];
    const qty = tempTreeQuantities[tCode] || 100;
    const date = tempTreeDates[tCode] || batchHarvestDate;

    const newSource: SourceItem = {
      farmId: farm?.id || 'farm-eth-ra-f001',
      farmCode: farm?.farmCode || sourceFarmCode,
      farmName: farm?.farmName || 'Primary Farm',
      motherTreeId: tree.id,
      motherTreeCode: tCode,
      motherTreeName: tree.name,
      coconutQuantity: qty,
      collectionDate: date,
      collectionStatus: 'Verified',
      notes: `Collected from verified mother tree ${tCode}`
    };

    setSourcesList(prev => [...prev, newSource]);
  };

  const handleRemoveSource = (motherTreeCode: string) => {
    setSourcesList(prev => prev.filter(s => s.motherTreeCode !== motherTreeCode));
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourcesList.length === 0) {
      alert('Please add at least one mother tree source to the batch.');
      return;
    }

    setSubmitting(true);
    let uploadedUrls: string[] = [];

    if (batchFiles.length > 0) {
      setUploading(true);
      const formData = new FormData();
      batchFiles.forEach(f => formData.append('files', f));
      formData.append('category', 'batches');
      formData.append('tag', previewInfo.batchId);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await res.json();
        if (res.ok && uploadData.urls) {
          uploadedUrls = uploadData.urls;
        }
      } catch (err) {
        console.error('File upload error');
      } finally {
        setUploading(false);
      }
    }

    if (uploadedUrls.length === 0) {
      uploadedUrls = ['/images/placeholder.png'];
    }

    const totalCoconuts = sourcesList.reduce((sum, s) => sum + s.coconutQuantity, 0);

    try {
      const payload = {
        batchCode: previewInfo.batchId,
        primaryFarmCode,
        name: previewInfo.displayName,
        harvestDate: batchHarvestDate,
        seededDate: batchSeededDate,
        totalQuantity: totalCoconuts,
        totalCoconuts,
        price: batchPrice,
        age: batchAge.trim() || '8–10 months',
        height: batchHeight.startsWith('Approx.') ? batchHeight : `Approx. ${batchHeight}`,
        description: batchDescription,
        isVisible: batchIsVisible,
        parentPalmCodes: sourcesList.map(s => s.motherTreeCode),
        sources: sourcesList.map(s => ({
          ...s,
          coconutsSown: s.coconutQuantity,
          germinatedQuantity: s.coconutQuantity,
          rejectedQuantity: 0
        })),
        images: uploadedUrls
      };

      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(`✅ Batch ${previewInfo.batchId} created successfully with ${sourcesList.length} sources!`);
        fetchInitialData();
        setSourcesList([]);
        setBatchFiles([]);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to create batch');
      }
    } catch (err) {
      alert('Error creating batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSingleBatchVisibility = async (batch: any) => {
    const nextVal = batch.isVisible === false ? true : false;
    setTogglingBatchCode(batch.batchCode);
    setBatches(prev => prev.map(b => b.batchCode === batch.batchCode ? { ...b, isVisible: nextVal } : b));

    try {
      const res = await fetch('/api/batches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchCode: batch.batchCode, isVisible: nextVal })
      });
      if (res.ok) {
        setToastMessage(`✓ Batch ${batch.batchCode} is now ${nextVal ? 'VISIBLE (ON) to customers' : 'HIDDEN (OFF) from customers'}.`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        throw new Error('Update failed');
      }
    } catch (e: any) {
      alert('Error updating visibility: ' + e.message);
      fetchInitialData();
    } finally {
      setTogglingBatchCode(null);
    }
  };

  const openEditModal = (batch: any) => {
    setEditingBatch({ ...batch });
    setEditPrice(batch.price);
    setEditAge(batch.age || '8–10 months');
    setEditHeight(batch.height || 'Approx. 2–3 ft');
    setEditTotalQuantity(batch.totalQuantity);
    setEditDescription(batch.description || '');
    setEditIsVisible(batch.isVisible !== false);
    setEditImages(batch.images && Array.isArray(batch.images) ? [...batch.images] : []);
    setNewImageUrl('');
  };

  const handleSaveEdit = async () => {
    if (!editingBatch) return;
    setSavingEdit(true);

    try {
      const res = await fetch('/api/batches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchCode: editingBatch.batchCode,
          price: editPrice,
          age: editAge.trim() || '8–10 months',
          height: editHeight.startsWith('Approx.') ? editHeight : `Approx. ${editHeight}`,
          totalQuantity: editTotalQuantity,
          description: editDescription,
          isVisible: editIsVisible,
          images: editImages
        })
      });

      if (res.ok) {
        alert('✅ Batch details updated successfully!');
        setEditingBatch(null);
        fetchInitialData();
      } else {
        throw new Error('Failed to update');
      }
    } catch (e: any) {
      alert('Error saving batch: ' + e.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Trees available for source farm
  const sourceTrees = parentPalms.filter(p => (p.farmCode || 'ETH-RA-F001') === sourceFarmCode);

  // Filtered Batches
  const filteredBatches = batches.filter(b => {
    const matchSearch = !search ||
      b.batchCode?.toLowerCase().includes(search.toLowerCase()) ||
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.primaryFarmCode?.toLowerCase().includes(search.toLowerCase());

    const matchFarm = farmFilter === 'ALL' || b.primaryFarmCode === farmFilter;

    const isVis = b.isVisible !== false;
    const matchVis = visibilityFilter === 'ALL'
      ? true
      : visibilityFilter === 'VISIBLE'
        ? isVis
        : !isVis;

    return matchSearch && matchFarm && matchVis;
  });

  const totalCoconutsSourced = sourcesList.reduce((sum, s) => sum + s.coconutQuantity, 0);
  const contributingFarmsCount = new Set(sourcesList.map(s => s.farmCode)).size;

  return (
    <>
      <section className="bg-dark text-white py-3 border-bottom border-success border-3">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="badge bg-success mb-1">MODULE 4: MULTI-FARM BATCH SOURCING</span>
              <h2 className="fw-bold mb-0 text-light">Batch Management &amp; Sourcing</h2>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Link href="/admin/germination" className="btn btn-outline-light btn-sm fw-bold d-inline-flex align-items-center gap-1">
                <i className="bi bi-flower1 text-success"></i> Germination
              </Link>
              <Link href="/admin/seedling-inventory" className="btn btn-outline-light btn-sm fw-bold d-inline-flex align-items-center gap-1">
                <i className="bi bi-box-seam text-primary"></i> Inventory
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

      {toastMessage && (
        <div className="alert alert-success border-0 rounded-0 py-2 text-center fw-semibold mb-0 shadow-sm">
          <i className="bi bi-check-circle-fill me-2"></i>
          {toastMessage}
        </div>
      )}

      <section className="py-4 bg-light min-vh-100">
        <div className="container">

          {/* Module 4.2: Step-by-Step Multi-Farm Batch Creation Workflow */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-5 bg-white border-start border-success border-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div>
                <span className="badge bg-success-subtle text-success border border-success extra-small mb-1">
                  WORKFLOW ENGINE
                </span>
                <h4 className="fw-bold text-dark mb-0">Create New Multi-Farm Batch</h4>
                <p className="text-secondary small mb-0">
                  Supports coconuts sourced from multiple registered farms and multiple mother trees.
                </p>
              </div>
              <div className="text-end">
                <span className="badge bg-dark font-monospace px-3 py-2 fs-6">
                  ID: {previewInfo.batchId}
                </span>
              </div>
            </div>

            <form onSubmit={handleCreateBatch}>
              {/* Step 1 & 2: Primary Farm & Dates */}
              <div className="row g-3 p-3 bg-light rounded-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label fw-bold small text-secondary">
                    <span className="badge bg-success rounded-circle me-1">1</span> Primary Farm (ID Prefix) *
                  </label>
                  <select
                    className="form-select fw-semibold"
                    value={primaryFarmCode}
                    onChange={(e) => setPrimaryFarmCode(e.target.value)}
                    required
                  >
                    {farms.map(f => (
                      <option key={f.farmCode} value={f.farmCode}>
                        {f.farmCode} - {f.farmName}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted extra-small">
                    Determines the Batch ID prefix (e.g. <code>{primaryFarmCode}-MMYYYY-BNNN</code>).
                  </small>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small text-secondary">
                    <span className="badge bg-success rounded-circle me-1">2</span> Seeded Date (Month &amp; Year) *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={batchSeededDate}
                    onChange={(e) => setBatchSeededDate(e.target.value)}
                    required
                  />
                  <small className="text-muted extra-small">
                    Sequence counter resets per Farm ID + Month/Year.
                  </small>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-bold small text-secondary">
                    Coconut Collection / Harvest Date *
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={batchHarvestDate}
                    onChange={(e) => setBatchHarvestDate(e.target.value)}
                    required
                  />
                </div>

                {/* Batch Name Display Requirement */}
                <div className="col-12 pt-2 border-top">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div className="small">
                      <strong className="text-dark">Customer Batch Display Name:</strong>
                      <span className="badge bg-success-subtle text-success ms-2 font-monospace fs-6">
                        {previewInfo.displayName}
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <div className="input-group input-group-sm" style={{ width: '170px' }}>
                        <span className="input-group-text">Price (₹)</span>
                        <input
                          type="number"
                          className="form-control"
                          value={batchPrice}
                          onChange={(e) => setBatchPrice(parseInt(e.target.value, 10) || 150)}
                          required
                        />
                      </div>
                      <div className="input-group input-group-sm" style={{ width: '180px' }}>
                        <span className="input-group-text">Age</span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. 9 months"
                          value={batchAge}
                          onChange={(e) => setBatchAge(e.target.value)}
                        />
                      </div>
                      <div className="input-group input-group-sm" style={{ width: '210px' }}>
                        <span className="input-group-text">Height</span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Approx. 2–3 ft"
                          value={batchHeight}
                          onChange={(e) => setBatchHeight(e.target.value)}
                        />
                      </div>
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input cursor-pointer"
                          type="checkbox"
                          role="switch"
                          id="batchVisSwitch"
                          checked={batchIsVisible}
                          onChange={(e) => setBatchIsVisible(e.target.checked)}
                        />
                        <label className="form-check-label extra-small fw-semibold" htmlFor="batchVisSwitch">
                          Visible to Customers ({batchIsVisible ? 'ON' : 'OFF'})
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Coconut Sources Selector (Multi-Farm & Multi-Tree) */}
              <div className="p-3 border rounded-3 mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <h6 className="fw-bold text-dark mb-0">
                    <span className="badge bg-success rounded-circle me-1">3</span>
                    Add Contributing Mother Trees (From Multiple Farms)
                  </h6>
                  <div className="d-flex align-items-center gap-2">
                    <label className="small text-muted mb-0 fw-semibold">Choose Farm Source:</label>
                    <select
                      className="form-select form-select-sm"
                      style={{ width: '260px' }}
                      value={sourceFarmCode}
                      onChange={(e) => setSourceFarmCode(e.target.value)}
                    >
                      {farms.map(f => (
                        <option key={f.farmCode} value={f.farmCode}>
                          {f.farmCode} - {f.farmName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Available Mother Trees Under Chosen Farm */}
                <div className="table-responsive border rounded-3 bg-light mb-3">
                  <table className="table table-sm table-hover align-middle mb-0 text-nowrap">
                    <thead className="table-light">
                      <tr>
                        <th>Tree ID</th>
                        <th>Tree Name</th>
                        <th>Variety</th>
                        <th style={{ width: '140px' }}>Coconut Qty</th>
                        <th style={{ width: '150px' }}>Collection Date</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sourceTrees.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-3 text-muted">
                            No mother trees found registered under {sourceFarmCode}.
                          </td>
                        </tr>
                      ) : (
                        sourceTrees.map(tree => {
                          const tCode = tree.motherTreeCode || tree.code;
                          const isAlreadyAdded = sourcesList.some(s => s.motherTreeCode === tCode);
                          return (
                            <tr key={tCode} className={isAlreadyAdded ? 'table-success bg-opacity-25' : ''}>
                              <td>
                                <span className="badge bg-secondary-subtle text-secondary font-monospace fw-bold">
                                  {tCode}
                                </span>
                              </td>
                              <td className="fw-semibold">{tree.name}</td>
                              <td><small>{tree.variety}</small></td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  placeholder="Qty"
                                  min={10}
                                  value={tempTreeQuantities[tCode] || 100}
                                  onChange={(e) => setTempTreeQuantities({
                                    ...tempTreeQuantities,
                                    [tCode]: parseInt(e.target.value, 10) || 100
                                  })}
                                  disabled={isAlreadyAdded}
                                />
                              </td>
                              <td>
                                <input
                                  type="date"
                                  className="form-control form-control-sm"
                                  value={tempTreeDates[tCode] || batchHarvestDate}
                                  onChange={(e) => setTempTreeDates({
                                    ...tempTreeDates,
                                    [tCode]: e.target.value
                                  })}
                                  disabled={isAlreadyAdded}
                                />
                              </td>
                              <td className="text-end">
                                {isAlreadyAdded ? (
                                  <span className="badge bg-success">
                                    <i className="bi bi-check2 me-1"></i> Added
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAddTreeToSources(tree)}
                                    className="btn btn-sm btn-outline-success extra-small fw-bold"
                                  >
                                    <i className="bi bi-plus-lg me-1"></i> Add Source
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Module 4.3: Batch Source Summary Table */}
                <div className="card bg-white border shadow-none p-3 rounded-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold text-dark mb-0">
                      <i className="bi bi-card-checklist text-success me-1"></i>
                      Current Batch Sources Summary ({sourcesList.length} Trees from {contributingFarmsCount} Farms)
                    </h6>
                    <span className="badge bg-primary fs-6">
                      Total Coconuts Sourced: {totalCoconutsSourced}
                    </span>
                  </div>

                  {sourcesList.length === 0 ? (
                    <div className="text-center py-4 text-muted small bg-light rounded">
                      <i className="bi bi-basket display-6 d-block mb-1 text-secondary"></i>
                      No coconut sources added yet. Select mother trees from above and click &quot;Add Source&quot;.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Contributing Farm ID</th>
                            <th>Farm Name</th>
                            <th>Mother Tree ID</th>
                            <th className="text-center">Coconut Qty</th>
                            <th>Collection Date</th>
                            <th className="text-center">Status</th>
                            <th className="text-end">Remove</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sourcesList.map(s => (
                            <tr key={s.motherTreeCode}>
                              <td><span className="badge bg-light text-dark border font-monospace">{s.farmCode}</span></td>
                              <td>{s.farmName}</td>
                              <td><span className="badge bg-secondary-subtle text-secondary font-monospace">{s.motherTreeCode}</span></td>
                              <td className="text-center fw-bold text-success">{s.coconutQuantity}</td>
                              <td>{s.collectionDate}</td>
                              <td className="text-center"><span className="badge bg-success-subtle text-success">{s.collectionStatus}</span></td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSource(s.motherTreeCode)}
                                  className="btn btn-sm btn-outline-danger extra-small p-1"
                                  title="Remove source"
                                >
                                  <i className="bi bi-trash"></i>
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

              {/* Step 4: Photos & Batch Confirmation */}
              <div className="row g-3 align-items-center">
                <div className="col-md-6">
                  <label className="form-label fw-bold small text-secondary">Batch Photographs</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="form-control"
                    onChange={(e) => e.target.files && setBatchFiles(Array.from(e.target.files))}
                  />
                </div>
                <div className="col-md-6 text-md-end pt-md-4">
                  <button
                    type="submit"
                    className="btn btn-success fw-bold px-4 py-2 shadow-sm"
                    disabled={submitting || sourcesList.length === 0}
                  >
                    {submitting ? 'Confirming & Creating...' : 'Confirm & Create Batch'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Batches Table & Visibility Controls */}
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
                    placeholder="Search by Batch ID, Name, or Farm..."
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

              <div className="col-md-3">
                <select
                  className="form-select"
                  value={farmFilter}
                  onChange={(e) => setFarmFilter(e.target.value)}
                >
                  <option value="ALL">All Primary Farms</option>
                  {farms.map(f => (
                    <option key={f.farmCode} value={f.farmCode}>{f.farmCode} - {f.farmName}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <select
                  className="form-select"
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value as any)}
                >
                  <option value="ALL">All Visibility</option>
                  <option value="VISIBLE">Visible (ON) Only</option>
                  <option value="HIDDEN">Hidden (OFF) Only</option>
                </select>
              </div>

              <div className="col-md-2 text-md-end text-muted small">
                Showing <strong>{filteredBatches.length}</strong> batch{filteredBatches.length !== 1 ? 'es' : ''}
              </div>
            </div>
          </div>

          {/* Batches Listing Table */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-5">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-nowrap">
                <thead className="table-dark">
                  <tr>
                    <th>Photo</th>
                    <th>Batch ID</th>
                    <th>Customer Display Name</th>
                    <th>Age &amp; Height</th>
                    <th>Primary Farm</th>
                    <th className="text-center">Sources / Trees</th>
                    <th>Harvest / Sown</th>
                    <th className="text-center">Total Qty</th>
                    <th className="text-center">Available</th>
                    <th className="text-center">Booked</th>
                    <th className="text-center">Farmer Views</th>
                    <th>Price</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Customer Visibility</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={15} className="text-center py-5">
                        <div className="spinner-border text-success" role="status"></div>
                        <p className="text-muted small mt-2 mb-0">Loading batches...</p>
                      </td>
                    </tr>
                  ) : filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="text-center py-5 text-muted">
                        No batches found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map(batch => {
                      const metrics = getSaplingMetrics(batch.seededDate);
                      return (
                        <tr key={batch.batchCode}>
                          <td style={{ width: '70px' }}>
                            <div
                              className="position-relative rounded-3 overflow-hidden shadow-sm cursor-pointer"
                              style={{ width: '56px', height: '56px' }}
                              onClick={() => setPreviewBatch(batch)}
                              title="Click to view full image"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={batch.images?.[0] || '/images/placeholder.png'}
                                alt={batch.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-secondary-subtle text-secondary font-monospace fw-bold">
                              {batch.batchCode}
                            </span>
                          </td>
                          <td>
                            <div className="fw-bold text-dark">{batch.name}</div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border d-block mb-1">
                              Age: {batch.age || metrics.age || '8–10 months'}
                            </span>
                            <span className="badge bg-light text-dark border d-block">
                              Height: {batch.height || metrics.height || 'Approx. 2–3 ft'}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border font-monospace">
                              {batch.primaryFarmCode || 'ETH-RA-F001'}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-info-subtle text-info border border-info">
                              {batch.sources?.length || batch.parentPalmCodes?.length || 1} Tree(s)
                            </span>
                          </td>
                          <td>
                            <small className="d-block text-muted">Cut: {batch.harvestDate}</small>
                            <small className="d-block text-secondary">Sown: {batch.seededDate}</small>
                          </td>
                          <td className="text-center fw-semibold text-primary">{batch.totalQuantity}</td>
                          <td className="text-center">
                            <span className={`badge ${batch.availableQuantity > 0 ? 'bg-success' : 'bg-danger'}`}>
                              {batch.availableQuantity ?? batch.totalQuantity}
                            </span>
                          </td>
                          <td className="text-center fw-semibold text-warning">{batch.bookedQuantity ?? 0}</td>
                          <td className="text-center">
                            <span className="badge bg-secondary-subtle text-dark border font-monospace">
                              <i className="bi bi-people-fill text-primary me-1"></i>
                              {batch.viewsCount ?? 0}
                            </span>
                          </td>
                          <td>
                            <span className="fw-bold text-dark">₹{batch.price}</span>
                          </td>
                          <td className="text-center">
                            <span className={`badge ${
                              batch.status === 'AVAILABLE' ? 'bg-success' :
                              batch.status === 'LIMITED' ? 'bg-warning text-dark' :
                              batch.status === 'COMING_SOON' ? 'bg-info text-dark' : 'bg-secondary'
                            }`}>
                              {batch.status}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="form-check form-switch d-inline-block">
                              <input
                                className="form-check-input cursor-pointer"
                                type="checkbox"
                                role="switch"
                                checked={batch.isVisible !== false}
                                disabled={togglingBatchCode === batch.batchCode}
                                onChange={() => handleToggleSingleBatchVisibility(batch)}
                              />
                              <label className="form-check-label extra-small fw-semibold ms-1">
                                {batch.isVisible !== false ? (
                                  <span className="text-success">ON</span>
                                ) : (
                                  <span className="text-secondary">OFF</span>
                                )}
                              </label>
                            </div>
                          </td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button
                                onClick={() => openEditModal(batch)}
                                className="btn btn-outline-primary"
                                title="Edit Batch"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <Link
                                href={`/admin/traceability?batchCode=${batch.batchCode}`}
                                className="btn btn-outline-secondary"
                                title="View Traceability"
                              >
                                <i className="bi bi-diagram-3"></i>
                              </Link>
                            </div>
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

      {/* Edit Batch Modal */}
      {editingBatch && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square me-2"></i> Edit Batch: {editingBatch.batchCode}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingBatch(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Price per Sapling (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editPrice}
                      onChange={(e) => setEditPrice(parseInt(e.target.value, 10) || 150)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Total Quantity</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editTotalQuantity}
                      onChange={(e) => setEditTotalQuantity(parseInt(e.target.value, 10) || 500)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Seedling Age</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 9 months"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-secondary">Approximate Height</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Approx. 2–3 ft"
                      value={editHeight}
                      onChange={(e) => setEditHeight(e.target.value)}
                    />
                    <small className="text-muted extra-small">Height will explicitly display as approximate</small>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold small text-secondary">Description</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                {/* Photos Gallery Manager */}
                <div className="p-3 bg-light rounded-3 mb-3">
                  <h6 className="fw-bold text-dark mb-2">Photographs ({editImages.length})</h6>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {editImages.map((imgUrl, idx) => (
                      <div key={idx} className="position-relative border rounded overflow-hidden" style={{ width: '80px', height: '80px' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm p-0 position-absolute top-0 end-0 rounded-circle m-1 d-flex align-items-center justify-content-center"
                          style={{ width: '20px', height: '20px', fontSize: '10px' }}
                          onClick={() => setEditImages(prev => prev.filter((_, i) => i !== idx))}
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
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      onClick={() => {
                        if (newImageUrl.trim()) {
                          setEditImages(prev => [...prev, newImageUrl.trim()]);
                          setNewImageUrl('');
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
                    id="editBatchVisSwitch"
                    checked={editIsVisible}
                    onChange={(e) => setEditIsVisible(e.target.checked)}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="editBatchVisSwitch">
                    Visible to Customers on Public Site &amp; Batches Pages ({editIsVisible ? 'ON' : 'OFF'})
                  </label>
                </div>
              </div>

              <div className="modal-footer bg-light border-0">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingBatch(null)}>Cancel</button>
                <button type="button" className="btn btn-primary fw-bold" onClick={handleSaveEdit} disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Popup */}
      {previewBatch && (
        <ImageCarousel
          images={previewBatch.images || ['/images/placeholder.png']}
          title={`${previewBatch.name} (${previewBatch.batchCode})`}
          onClose={() => setPreviewBatch(null)}
        />
      )}
    </>
  );
}
