'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSaplingMetrics } from '@/lib/metrics';

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [parentPalms, setParentPalms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // File Upload State
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  // Edit Batch Modal State
  const [editingBatch, setEditingBatch] = useState<any | null>(null);
  const [editPrice, setEditPrice] = useState<number>(150);
  const [editTotalQuantity, setEditTotalQuantity] = useState<number>(500);
  const [editDescription, setEditDescription] = useState<string>('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [savingImages, setSavingImages] = useState(false);

  // Auto-generate Batch Code (e.g. EM-1226-D)
  const generateAutoBatchCode = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 6));
    return `EM-${month}${year}-${letter}`;
  };

  // New Batch Form State
  const [newBatch, setNewBatch] = useState({
    batchCode: '',
    parentPalmCodes: ['EM-MP-014'] as string[],
    parentPalmCode: 'EM-MP-014',
    name: 'December 2026 Batch',
    harvestDate: '2026-01-05',
    seededDate: '2026-01-15',
    totalQuantity: 500,
    price: 150,
    status: 'AVAILABLE',
    description: ''
  });
  const [treeSearchTerm, setTreeSearchTerm] = useState('');

  // Edit Batch State
  const [editParentPalmCodes, setEditParentPalmCodes] = useState<string[]>([]);
  const [editTreeSearchTerm, setEditTreeSearchTerm] = useState('');

  const toggleNewBatchTree = (code: string) => {
    setNewBatch(prev => {
      const exists = prev.parentPalmCodes.includes(code);
      let nextCodes: string[];
      if (exists) {
        if (prev.parentPalmCodes.length <= 1) {
          alert('A batch must have at least one mother tree assigned.');
          return prev;
        }
        nextCodes = prev.parentPalmCodes.filter(c => c !== code);
      } else {
        nextCodes = [...prev.parentPalmCodes, code];
      }
      return {
        ...prev,
        parentPalmCodes: nextCodes,
        parentPalmCode: nextCodes[0] || 'EM-MP-001'
      };
    });
  };

  const toggleEditBatchTree = (code: string) => {
    setEditParentPalmCodes(prev => {
      const exists = prev.includes(code);
      if (exists) {
        if (prev.length <= 1) {
          alert('A batch must have at least one mother tree assigned.');
          return prev;
        }
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const calculatedMetrics = getSaplingMetrics(newBatch.seededDate);

  const fetchBatchesData = async () => {
    const [batchesData, palmsData] = await Promise.all([
      fetch('/api/batches').then(res => res.json()),
      fetch('/api/parent-palms').then(res => res.json())
    ]);
    setBatches(batchesData);
    setParentPalms(palmsData);
    setLoading(false);
  };

  useEffect(() => {
    setNewBatch(prev => ({ ...prev, batchCode: generateAutoBatchCode() }));
    fetchBatchesData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setBatchFiles(Array.from(e.target.files));
    }
  };

  const handleUploadFiles = async () => {
    if (!newBatch.batchCode) {
      alert('Please enter a Batch Code first');
      return;
    }

    if (batchFiles.length === 0) {
      alert('Please select image files to upload.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    batchFiles.forEach(f => formData.append('files', f));
    formData.append('category', 'batches');
    formData.append('tag', newBatch.batchCode);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setUploadedUrls(data.urls);
        alert(`Uploaded ${data.urls.length} image(s) to folder /public/uploads/batches/${newBatch.batchCode}/!`);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err) {
      alert('File upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalImages: string[] = uploadedUrls;

    // If files are selected in input but not uploaded yet, upload them automatically
    if (batchFiles.length > 0 && uploadedUrls.length === 0) {
      setUploading(true);
      const formData = new FormData();
      batchFiles.forEach(f => formData.append('files', f));
      formData.append('category', 'batches');
      formData.append('tag', newBatch.batchCode);

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
        console.error('Auto upload error during batch creation');
      } finally {
        setUploading(false);
      }
    }

    if (finalImages.length === 0) {
      finalImages = [`/images/batches/${newBatch.batchCode}/batch_1.jpg`];
    }

    if (!newBatch.parentPalmCodes || newBatch.parentPalmCodes.length === 0) {
      alert('Please select at least one mother tree for this batch.');
      return;
    }

    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBatch,
          parentPalmCode: newBatch.parentPalmCodes[0],
          images: finalImages
        })
      });

      if (res.ok) {
        alert(`Batch ${newBatch.batchCode} added successfully!`);
        fetchBatchesData();
        setUploadedUrls([]);
        setBatchFiles([]);
        setNewBatch({
          batchCode: generateAutoBatchCode(),
          parentPalmCodes: ['EM-MP-014'],
          parentPalmCode: 'EM-MP-014',
          name: 'December 2026 Batch',
          harvestDate: '2026-01-05',
          seededDate: '2026-01-15',
          totalQuantity: 500,
          price: 150,
          status: 'AVAILABLE',
          description: ''
        });
        setTreeSearchTerm('');
      } else {
        alert('Failed to save batch');
      }
    } catch (err) {
      alert('Error saving batch');
    }
  };

  const openEditModal = (batch: any) => {
    setEditingBatch(batch);
    setEditPrice(batch.price);
    setEditTotalQuantity(batch.totalQuantity);
    setEditDescription(batch.description || '');
    setEditImages(batch.images && batch.images.length > 0 ? [...batch.images] : []);
    setNewImageUrl('');
    const codes = (batch.parentPalmCodes && batch.parentPalmCodes.length > 0)
      ? [...batch.parentPalmCodes]
      : (batch.parentPalmCode ? [batch.parentPalmCode] : ['EM-MP-001']);
    setEditParentPalmCodes(codes);
    setEditTreeSearchTerm('');
  };

  const handleAddEditFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingBatch) return;

    const files = Array.from(e.target.files);
    setUploading(true);
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('category', 'batches');
    formData.append('tag', editingBatch.batchCode);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && (data.urls || data.url)) {
        const newUrls = data.urls || [data.url];
        setEditImages(prev => [...prev, ...newUrls]);
        alert(`Successfully uploaded ${newUrls.length} photo(s) to Cloudinary!`);
      } else {
        alert(data.error || 'Failed to upload images to cloud storage');
      }
    } catch (err) {
      alert('Network error while uploading images to cloud storage');
    } finally {
      setUploading(false);
    }
  };

  const removeEditImage = async (indexToRemove: number) => {
    const targetUrl = editImages[indexToRemove];
    setEditImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (targetUrl && targetUrl.startsWith('/images/')) {
      try {
        await fetch(`/api/upload?path=${encodeURIComponent(targetUrl)}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to unlink deleted image file:', e);
      }
    }
  };

  const removeAllEditImages = async () => {
    if (confirm('Are you sure you want to remove ALL current images for this batch?')) {
      const toDelete = [...editImages];
      setEditImages([]);
      for (const imgUrl of toDelete) {
        if (imgUrl && imgUrl.startsWith('/images/')) {
          try {
            await fetch(`/api/upload?path=${encodeURIComponent(imgUrl)}`, { method: 'DELETE' });
          } catch (e) {}
        }
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingBatch) return;

    if (editParentPalmCodes.length === 0) {
      alert('Please select at least one mother tree for this batch.');
      return;
    }

    try {
      const res = await fetch('/api/batches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchCode: editingBatch.batchCode,
          price: editPrice,
          totalQuantity: editTotalQuantity,
          description: editDescription,
          images: editImages,
          parentPalmCodes: editParentPalmCodes,
          parentPalmCode: editParentPalmCodes[0]
        })
      });

      if (res.ok) {
        alert(`Batch ${editingBatch.batchCode} updated! ${editImages.length} photo(s) saved for customer viewing.`);
        setEditingBatch(null);
        fetchBatchesData();
      } else {
        alert('Failed to update batch');
      }
    } catch (err) {
      alert('Error updating batch');
    }
  };

  // Save ONLY images array via PATCH (used by URL manager)
  const handleSaveImageUrls = async () => {
    if (!editingBatch) return;
    setSavingImages(true);
    try {
      const res = await fetch(`/api/batches/${editingBatch.batchCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: editImages })
      });
      if (res.ok) {
        alert(`✅ Image URLs saved for batch ${editingBatch.batchCode}. All pages now show updated photos.`);
        fetchBatchesData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save image URLs');
      }
    } catch (e) {
      alert('Network error saving image URLs');
    } finally {
      setSavingImages(false);
    }
  };

  const addImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    if (editImages.includes(url)) { alert('This URL is already in the list.'); return; }
    setEditImages(prev => [...prev, url]);
    setNewImageUrl('');
  };

  const updateImageUrl = (idx: number, val: string) => {
    setEditImages(prev => prev.map((u, i) => i === idx ? val : u));
  };

  const handleDeleteBatch = async (batchCode: string) => {
    if (!confirm(`Are you sure you want to remove batch ${batchCode}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/batches?code=${encodeURIComponent(batchCode)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert(`Batch ${batchCode} removed.`);
        fetchBatchesData();
      } else {
        alert('Failed to delete batch');
      }
    } catch (err) {
      alert('Error deleting batch');
    }
  };

  return (
    <>
      <section className="bg-dark text-white py-3 border-bottom">
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <span className="badge bg-success me-2">ADMIN PORTAL</span>
            <h3 className="fw-bold mb-0 text-light d-inline align-middle">Batch & Image Management</h3>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <a 
              href="/api/admin/export?type=batches" 
              download 
              className="btn btn-outline-success btn-sm text-light border-success"
              title="Download Batches in Excel"
            >
              <i className="bi bi-file-earmark-excel-fill text-success me-1"></i> Export Batches (.xlsx)
            </a>
            <Link href="/admin" className="btn btn-outline-light btn-sm">
              <i className="bi bi-arrow-left me-1"></i> Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          
          {/* Create New Batch Form Card */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-5 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold text-dark mb-0">
                <i className="bi bi-plus-circle-fill text-success me-2"></i> Create New Sapling Batch
              </h4>
              <button 
                type="button" 
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setNewBatch({ ...newBatch, batchCode: generateAutoBatchCode() })}
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Regenerate Batch Code
              </button>
            </div>
            
            <form onSubmit={handleCreateBatch}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small fw-bold text-success">Batch Code (Auto-populated) *</label>
                  <input 
                    type="text" 
                    className="form-control fw-bold border-success" 
                    required 
                    value={newBatch.batchCode}
                    onChange={e => setNewBatch({ ...newBatch, batchCode: e.target.value })}
                  />
                </div>

                <div className="col-md-5">
                  <label className="form-label small fw-bold">Base Batch Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="e.g. December 2026 Batch"
                    value={newBatch.name}
                    onChange={e => setNewBatch({ ...newBatch, name: e.target.value })}
                  />
                  <small className="text-muted extra-small">Combined Full Name: <strong>{newBatch.name} ({newBatch.batchCode})</strong></small>
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-bold">Price (₹/sapling) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    value={newBatch.price}
                    onChange={e => setNewBatch({ ...newBatch, price: Number(e.target.value) })}
                  />
                </div>

                {/* Multiple Mother Trees Selection Section */}
                <div className="col-12">
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
                      <div>
                        <label className="form-label small fw-bold text-dark mb-0">
                          <i className="bi bi-tree-fill text-success me-1"></i>
                          Mother Trees / Parent Palms Tagging * (Multiple Allowed)
                        </label>
                        <small className="text-muted d-block extra-small">
                          A batch can be raised from nuts harvested across multiple mother trees. Select all contributing mother trees below.
                        </small>
                      </div>
                      <div className="d-flex gap-2">
                        <button 
                          type="button" 
                          className="btn btn-outline-success btn-sm py-0 px-2 extra-small"
                          onClick={() => setNewBatch(prev => ({ 
                            ...prev, 
                            parentPalmCodes: parentPalms.map(p => p.code),
                            parentPalmCode: parentPalms[0]?.code || 'EM-MP-001'
                          }))}
                        >
                          <i className="bi bi-check-all me-1"></i> Select All ({parentPalms.length})
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary btn-sm py-0 px-2 extra-small"
                          onClick={() => setNewBatch(prev => ({ 
                            ...prev, 
                            parentPalmCodes: [parentPalms[0]?.code || 'EM-MP-001'],
                            parentPalmCode: parentPalms[0]?.code || 'EM-MP-001'
                          }))}
                        >
                          Reset to Primary
                        </button>
                      </div>
                    </div>

                    {/* Currently Tagged Badges Bar */}
                    <div className="d-flex flex-wrap align-items-center gap-1 mb-2 p-2 bg-white rounded border">
                      <small className="text-secondary fw-bold extra-small me-2">
                        Tagged Trees ({newBatch.parentPalmCodes.length}):
                      </small>
                      {newBatch.parentPalmCodes.length === 0 ? (
                        <span className="text-danger extra-small fw-semibold">
                          <i className="bi bi-exclamation-triangle-fill me-1"></i> No mother trees selected. Please choose at least one option below.
                        </span>
                      ) : (
                        newBatch.parentPalmCodes.map(code => {
                          const palm = parentPalms.find(p => p.code === code);
                          return (
                            <span key={code} className="badge bg-success-subtle text-success border border-success d-inline-flex align-items-center gap-1 py-1 px-2">
                              <i className="bi bi-patch-check-fill text-success"></i>
                              <strong>{code}</strong> {palm ? `(${palm.name.split('#')[0].trim()})` : ''}
                              <button 
                                type="button"
                                className="btn-close btn-close-sm ms-1"
                                style={{ fontSize: '0.6rem' }}
                                onClick={() => toggleNewBatchTree(code)}
                                title={`Remove ${code}`}
                              ></button>
                            </span>
                          );
                        })
                      )}
                    </div>

                    {/* Filter search within mother trees */}
                    <div className="mb-2">
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        placeholder="Filter mother trees by code, name, or location..."
                        value={treeSearchTerm}
                        onChange={e => setTreeSearchTerm(e.target.value)}
                      />
                    </div>

                    {/* Scrollable Mother Trees Choice Grid */}
                    <div className="border rounded p-2 bg-white overflow-y-auto" style={{ maxHeight: '180px' }}>
                      <div className="row g-2">
                        {parentPalms
                          .filter(p => !treeSearchTerm || p.code.toLowerCase().includes(treeSearchTerm.toLowerCase()) || p.name.toLowerCase().includes(treeSearchTerm.toLowerCase()) || p.location.toLowerCase().includes(treeSearchTerm.toLowerCase()))
                          .map(p => {
                            const isSelected = newBatch.parentPalmCodes.includes(p.code);
                            return (
                              <div key={p.code} className="col-md-6 col-lg-4">
                                <div 
                                  className={`p-2 rounded border h-100 d-flex align-items-center justify-content-between transition-all ${isSelected ? 'border-success bg-success-subtle' : 'border-light-subtle bg-light'}`}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => toggleNewBatchTree(p.code)}
                                >
                                  <div className="form-check m-0 d-flex align-items-center gap-2">
                                    <input 
                                      type="checkbox"
                                      className="form-check-input"
                                      id={`create-tree-${p.code}`}
                                      checked={isSelected}
                                      onChange={() => toggleNewBatchTree(p.code)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <label className="form-check-label extra-small" htmlFor={`create-tree-${p.code}`} style={{ cursor: 'pointer' }}>
                                      <strong className="text-dark d-block">{p.code}</strong>
                                      <span className="text-muted text-truncate d-inline-block" style={{ maxWidth: '180px' }}>{p.name}</span>
                                    </label>
                                  </div>
                                  <span className="badge bg-light text-dark border extra-small">{p.age} Yrs</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* DATES SECTION */}
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-dark">
                    <i className="bi bi-calendar-event me-1 text-success"></i> Coconut Cut From Tree Date (Harvest Date) *
                  </label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required 
                    value={newBatch.harvestDate}
                    onChange={e => setNewBatch({ ...newBatch, harvestDate: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold text-dark">
                    <i className="bi bi-calendar-check-fill me-1 text-success"></i> Seeded On Date (Farm Seedbed Sowing) *
                  </label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required 
                    value={newBatch.seededDate}
                    onChange={e => setNewBatch({ ...newBatch, seededDate: e.target.value })}
                  />
                </div>

                {/* AUTOMATIC CALCULATION DISPLAY */}
                <div className="col-12">
                  <div className="alert alert-success border-success-subtle rounded-3 p-3 d-flex flex-wrap justify-content-between align-items-center">
                    <div>
                      <span className="badge bg-success me-2">AUTOMATICALLY CALCULATED METRICS</span>
                      <span className="fw-bold text-dark me-3">
                        Sapling Age: <strong className="text-success fs-6">{calculatedMetrics.age}</strong>
                      </span>
                      <span className="fw-bold text-dark">
                        Estimated Average Height: <strong className="text-success fs-6">{calculatedMetrics.height}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* FILE UPLOAD BOX */}
                <div className="col-12 bg-light p-3 rounded-3 border">
                  <label className="form-label small fw-bold text-dark d-block">
                    <i className="bi bi-cloud-arrow-up-fill text-success me-1"></i> Upload Seedling / Batch Photographs
                  </label>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <input 
                      type="file" 
                      className="form-control form-control-sm w-auto" 
                      multiple 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <button 
                      type="button" 
                      className="btn btn-sm btn-outline-success fw-bold"
                      onClick={handleUploadFiles}
                      disabled={uploading || batchFiles.length === 0}
                    >
                      {uploading ? 'Uploading to server...' : 'Upload Selected Images'}
                    </button>
                    {uploadedUrls.length > 0 && (
                      <span className="badge bg-success">
                        <i className="bi bi-check-circle-fill me-1"></i> {uploadedUrls.length} image(s) uploaded!
                      </span>
                    )}
                  </div>
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold">Total Quantity *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    value={newBatch.totalQuantity}
                    onChange={e => setNewBatch({ ...newBatch, totalQuantity: Number(e.target.value) })}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold">Initial Status</label>
                  <input type="text" className="form-control" readOnly value={newBatch.status} />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold">Tagged Mother Tree(s) ({newBatch.parentPalmCodes.length})</label>
                  <div className="form-control bg-light text-truncate" title={newBatch.parentPalmCodes.join(', ')}>
                    <i className="bi bi-tree-fill text-success me-1"></i>
                    {newBatch.parentPalmCodes.join(', ')}
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold">Batch Notes / Description</label>
                  <textarea 
                    className="form-control" 
                    rows={2} 
                    placeholder="Enter farm observations or notes for this batch"
                    value={newBatch.description}
                    onChange={e => setNewBatch({ ...newBatch, description: e.target.value })}
                  ></textarea>
                </div>

                <div className="col-12 text-end">
                  <button type="submit" className="btn btn-success fw-bold px-4">
                    <i className="bi bi-check-circle me-1"></i> Save & Add to Live Batches
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Batches Inventory Table with Edit Feature */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h4 className="fw-bold text-dark mb-3">All Active & Past Batches ({batches.length})</h4>

            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Batch Code</th>
                      <th>Batch Name</th>
                      <th>Mother Tree(s)</th>
                      <th>Dates (Cut / Seeded)</th>
                      <th>Age / Height</th>
                      <th>Total</th>
                      <th>Booked</th>
                      <th>Available</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map(b => (
                      <tr key={b.id}>
                        <td><strong className="text-success">{b.batchCode}</strong></td>
                        <td><small className="fw-bold">{b.name}</small></td>
                        <td>
                          <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '180px' }}>
                            {(((b.parentPalmCodes && b.parentPalmCodes.length > 0) ? b.parentPalmCodes : [b.parentPalmCode]) as string[]).map((c: string) => (
                              <Link 
                                key={c}
                                href={`/parent-palm/${c}`}
                                className="badge bg-success-subtle text-success border border-success text-decoration-none extra-small"
                                title="View Mother Tree Profile"
                              >
                                <i className="bi bi-tree-fill me-1"></i>{c}
                              </Link>
                            ))}
                          </div>
                        </td>
                        <td className="small text-muted">
                          <div>Cut: {b.harvestDate || 'N/A'}</div>
                          <div>Seeded: {b.seededDate || 'N/A'}</div>
                        </td>
                        <td className="small"><span className="badge bg-success-subtle text-success border me-1">{b.age}</span> ({b.height})</td>
                        <td><strong>{b.totalQuantity}</strong></td>
                        <td className="text-primary"><strong>{b.bookedQuantity}</strong></td>
                        <td className="text-success fs-6"><strong>{b.availableQuantity}</strong></td>
                        <td><strong className="text-success fs-6">₹{b.price}</strong></td>
                        <td>
                          <span className={`badge ${b.status === 'AVAILABLE' ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openEditModal(b)}
                              title="Edit Price & Details"
                            >
                              <i className="bi bi-pencil-square me-1"></i> Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger" 
                              onClick={() => handleDeleteBatch(b.batchCode)}
                              title="Remove Batch"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* EDIT BATCH MODAL */}
          {editingBatch && (
            <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center z-3">
              <div className="card border-0 shadow-lg rounded-4 p-4 bg-white" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h4 className="fw-bold text-dark mb-0"><i className="bi bi-pencil-square text-primary me-2"></i> Edit Batch {editingBatch.batchCode}</h4>
                  <button className="btn-close" onClick={() => setEditingBatch(null)}></button>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Price per Sapling (₹) *</label>
                  <input 
                    type="number" 
                    className="form-control fw-bold border-success fs-5 text-success" 
                    value={editPrice}
                    onChange={e => setEditPrice(Number(e.target.value))}
                  />
                  <small className="text-muted extra-small">Update selling price per sapling for batch {editingBatch.batchCode}.</small>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Total Batch Quantity *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={editTotalQuantity}
                    onChange={e => setEditTotalQuantity(Number(e.target.value))}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Batch Notes / Description</label>
                  <textarea 
                    className="form-control" 
                    rows={2} 
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                  ></textarea>
                </div>

                {/* Edit Mother Trees Selection */}
                <div className="mb-3 p-3 bg-light rounded-3 border">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-bold text-dark mb-0">
                      <i className="bi bi-tree-fill text-success me-1"></i> Tagged Mother Trees ({editParentPalmCodes.length}) *
                    </label>
                    <button 
                      type="button" 
                      className="btn btn-outline-success btn-sm py-0 px-2 extra-small"
                      onClick={() => setEditParentPalmCodes(parentPalms.map(p => p.code))}
                    >
                      Select All
                    </button>
                  </div>
                  <small className="text-muted d-block extra-small mb-2">Check or uncheck mother trees contributing to this batch.</small>

                  {/* Selected badges */}
                  <div className="d-flex flex-wrap gap-1 mb-2">
                    {editParentPalmCodes.map(code => (
                      <span key={code} className="badge bg-success-subtle text-success border border-success d-inline-flex align-items-center gap-1">
                        <strong>{code}</strong>
                        <button 
                          type="button" 
                          className="btn-close btn-close-sm" 
                          style={{ fontSize: '0.6rem' }}
                          onClick={() => toggleEditBatchTree(code)}
                        ></button>
                      </span>
                    ))}
                  </div>

                  {/* Filter input */}
                  <input 
                    type="text" 
                    className="form-control form-control-sm mb-2" 
                    placeholder="Search trees..."
                    value={editTreeSearchTerm}
                    onChange={e => setEditTreeSearchTerm(e.target.value)}
                  />

                  {/* Options List */}
                  <div className="border rounded p-2 bg-white overflow-y-auto" style={{ maxHeight: '140px' }}>
                    <div className="d-flex flex-column gap-1">
                      {parentPalms
                        .filter(p => !editTreeSearchTerm || p.code.toLowerCase().includes(editTreeSearchTerm.toLowerCase()) || p.name.toLowerCase().includes(editTreeSearchTerm.toLowerCase()))
                        .map(p => {
                          const isSel = editParentPalmCodes.includes(p.code);
                          return (
                            <div 
                              key={p.code} 
                              className={`p-1 px-2 rounded border d-flex align-items-center justify-content-between ${isSel ? 'border-success bg-success-subtle' : 'bg-light'}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => toggleEditBatchTree(p.code)}
                            >
                              <div className="form-check m-0 d-flex align-items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  className="form-check-input" 
                                  id={`edit-tree-${p.code}`}
                                  checked={isSel} 
                                  onChange={() => toggleEditBatchTree(p.code)}
                                  onClick={e => e.stopPropagation()}
                                />
                                <label className="form-check-label extra-small" htmlFor={`edit-tree-${p.code}`} style={{ cursor: 'pointer' }}>
                                  <strong>{p.code}</strong> - {p.name}
                                </label>
                              </div>
                              <span className="badge bg-light text-dark border extra-small">{p.age} Yrs</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Batch Images — Gallery, URL Manager & Uploader */}
                <div className="mb-3 p-3 bg-light rounded-3 border">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label small fw-bold text-dark mb-0">
                      <i className="bi bi-images me-1 text-success"></i> Batch Photo Gallery
                      <span className="badge bg-success ms-2">{editImages.length} URLs in DB</span>
                    </label>
                    {editImages.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger py-0 px-2 extra-small"
                        onClick={removeAllEditImages}
                      >
                        <i className="bi bi-trash me-1"></i> Clear All
                      </button>
                    )}
                  </div>

                  {/* URL list — editable inline */}
                  {editImages.length > 0 ? (
                    <div className="mb-2">
                      {editImages.map((imgUrl, idx) => (
                        <div key={idx} className="d-flex align-items-center gap-2 mb-1">
                          <img
                            src={imgUrl}
                            alt={`Photo ${idx + 1}`}
                            className="rounded border flex-shrink-0"
                            style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.png'; }}
                          />
                          <input
                            type="text"
                            className="form-control form-control-sm font-monospace"
                            value={imgUrl}
                            onChange={e => updateImageUrl(idx, e.target.value)}
                            placeholder="/images/batches/… or https://…"
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger px-2"
                            onClick={() => removeEditImage(idx)}
                            title="Remove"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <small className="text-muted d-block mb-2">No photo URLs stored for this batch yet.</small>
                  )}

                  {/* Add new URL */}
                  <div className="d-flex gap-2 mb-3">
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      placeholder="Paste image URL: /images/batches/EM-0126-A/batch_1.jpg or https://…"
                      value={newImageUrl}
                      onChange={e => setNewImageUrl(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl(); } }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success fw-bold text-nowrap"
                      onClick={addImageUrl}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Add URL
                    </button>
                  </div>

                  {/* Save image URLs immediately to DB */}
                  <button
                    type="button"
                    className="btn btn-primary btn-sm fw-bold w-100 mb-3"
                    onClick={handleSaveImageUrls}
                    disabled={savingImages}
                  >
                    {savingImages
                      ? <><i className="bi bi-hourglass-split me-1"></i> Saving to DB…</>
                      : <><i className="bi bi-cloud-check-fill me-1"></i> Save Image URLs to DB (All Pages Update Instantly)</>}
                  </button>

                  {/* File upload */}
                  <div>
                    <label className="form-label extra-small text-muted mb-1">
                      {uploading ? 'Uploading…' : 'Or upload photos from device (auto-adds URL to list above):'}
                    </label>
                    <input
                      type="file"
                      className="form-control form-control-sm"
                      multiple
                      accept="image/*"
                      disabled={uploading}
                      onChange={handleAddEditFiles}
                    />
                  </div>
                </div>

                <div className="d-flex gap-2 justify-content-end mt-4">
                  <button className="btn btn-outline-secondary" onClick={() => setEditingBatch(null)}>Cancel</button>
                  <button 
                    className="btn btn-success fw-bold"
                    onClick={handleSaveEdit}
                  >
                    <i className="bi bi-check-circle me-1"></i> Save Changes
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
