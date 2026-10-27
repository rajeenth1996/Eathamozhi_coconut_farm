'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ImageCarousel from '@/components/ImageCarousel';

export default function AdminMotherTreesPage() {
  const [palms, setPalms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTree, setPreviewTree] = useState<any | null>(null);

  // New Mother Tree Form State
  const [newTree, setNewTree] = useState({
    code: 'EM-MP-020',
    name: 'Plot C Selected Mother Tree #20',
    age: 45,
    location: 'Coastal Plot C, Eathamozhi Farm',
    healthStatus: 'Excellent (100% Disease Resistant)',
    yieldHistory: 'Consistently high year-round seed nut yield',
    description: 'Selected for heavy canopy, disease immunity, and large copra content.',
    nutCharacteristics: 'Large spherical nuts with high coconut water volume and thick kernel.',
    whySelected: 'Consistently high yield for over 40 years without dropping premature buttons.',
    images: [] as string[]
  });

  const [treeFiles, setTreeFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Edit Modal State (mirrors batches architecture with dedicated images array)
  const [editingTree, setEditingTree] = useState<any | null>(null);
  const [editTreeImages, setEditTreeImages] = useState<string[]>([]);
  const [newTreeImageUrl, setNewTreeImageUrl] = useState('');
  const [savingImages, setSavingImages] = useState(false);
  const [makePrimaryOnUpload, setMakePrimaryOnUpload] = useState(true);

  const fetchPalms = async () => {
    try {
      const res = await fetch(`/api/parent-palms?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setPalms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch parent palms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPalms();
  }, []);

  // Open Edit Modal with dedicated image state copy
  const openEditModal = (tree: any) => {
    setEditingTree({ ...tree });
    setEditTreeImages(tree.images && Array.isArray(tree.images) ? [...tree.images] : []);
    setNewTreeImageUrl('');
    setMakePrimaryOnUpload(true);
  };

  const handleTreeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setTreeFiles(Array.from(e.target.files));
    }
  };

  // Create Tree Handler
  const handleCreateTree = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalImages: string[] = [];

    // Auto upload selected files to dedicated folder public/images/parent-palms/${newTree.code}/
    if (treeFiles.length > 0) {
      setUploading(true);
      const formData = new FormData();
      treeFiles.forEach(f => formData.append('files', f));
      formData.append('category', 'parent-palms');
      formData.append('tag', newTree.code);

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
        console.error('Auto upload error during mother tree creation');
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
          images: finalImages
        })
      });
      if (res.ok) {
        alert(`Mother Tree ${newTree.code} added successfully!`);
        fetchPalms();
        setTreeFiles([]);
        const nextNum = Math.floor(25 + Math.random() * 50);
        setNewTree({
          code: `EM-MP-0${nextNum}`,
          name: `Plot C Selected Mother Tree #${nextNum}`,
          age: 40,
          location: 'Eathamozhi Main Grove',
          healthStatus: 'Excellent (Vigorous Nut Producer)',
          yieldHistory: 'Consistently high year-round seed nut yield',
          description: 'High-yielding mother tree selected for mother seed nut production.',
          nutCharacteristics: 'Large spherical nuts with high coconut water volume and thick kernel.',
          whySelected: 'Consistently high yield with exceptional seedling germination rate.',
          images: []
        });
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to add mother tree');
      }
    } catch (err) {
      alert('Error adding mother tree');
    }
  };

  // Upload Photos inside Edit Modal
  const handleUploadTreeFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingTree) return;
    const files = Array.from(e.target.files);
    setUploading(true);
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('category', 'parent-palms');
    formData.append('tag', editingTree.code);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      const uploadedUrls: string[] = data.urls || (data.url ? [data.url] : []);

      if (res.ok && uploadedUrls.length > 0) {
        const newImages = makePrimaryOnUpload
          ? [...uploadedUrls, ...editTreeImages]
          : [...editTreeImages, ...uploadedUrls];
        setEditTreeImages(newImages);

        // Auto-save updated photos immediately to DB so they persist across all pages
        try {
          await fetch(`/api/parent-palms/${editingTree.code}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: newImages })
          });
          setPalms(prev => prev.map(p => 
            (p.id === editingTree.id || p.code === editingTree.code) 
              ? { ...p, images: newImages } 
              : p
          ));
          fetchPalms();
        } catch (saveErr) {
          console.error('Error auto-persisting uploaded images:', saveErr);
        }

        alert(`Successfully uploaded ${uploadedUrls.length} photo(s) to Cloudinary! ${makePrimaryOnUpload ? 'Set as new primary cover photo.' : 'Added to gallery.'}\nAll pages now reflect the updated image.`);
      } else {
        alert(data.error || 'Failed to upload images to cloud storage');
      }
    } catch (err) {
      alert('Network error while uploading images to cloud storage');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Add custom URL
  const addTreeImageUrl = () => {
    const url = newTreeImageUrl.trim();
    if (!url) return;
    if (editTreeImages.includes(url)) {
      alert('This URL is already in the photo list.');
      return;
    }
    setEditTreeImages(prev => [...prev, url]);
    setNewTreeImageUrl('');
  };

  // Update specific URL
  const updateTreeImageUrl = (idx: number, val: string) => {
    setEditTreeImages(prev => prev.map((u, i) => i === idx ? val : u));
  };

  // Set any photo as the primary cover photo (index 0)
  const setAsPrimaryImage = async (idx: number) => {
    if (idx === 0 || !editingTree) return;
    const selected = editTreeImages[idx];
    const remaining = editTreeImages.filter((_, i) => i !== idx);
    const newImages = [selected, ...remaining];
    setEditTreeImages(newImages);

    // Auto-save new primary cover
    try {
      await fetch(`/api/parent-palms/${editingTree.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: newImages })
      });
      setPalms(prev => prev.map(p => 
        (p.id === editingTree.id || p.code === editingTree.code) 
          ? { ...p, images: newImages } 
          : p
      ));
      fetchPalms();
    } catch {}
  };

  // Remove photo
  const removeTreeImage = async (idxToRemove: number) => {
    if (!editingTree) return;
    const targetUrl = editTreeImages[idxToRemove];
    const newImages = editTreeImages.filter((_, idx) => idx !== idxToRemove);
    setEditTreeImages(newImages);

    if (targetUrl && targetUrl.startsWith('/images/')) {
      try {
        await fetch(`/api/upload?path=${encodeURIComponent(targetUrl)}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to unlink deleted tree image:', e);
      }
    }

    // Auto-save removal to DB
    try {
      await fetch(`/api/parent-palms/${editingTree.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: newImages })
      });
      setPalms(prev => prev.map(p => 
        (p.id === editingTree.id || p.code === editingTree.code) 
          ? { ...p, images: newImages } 
          : p
      ));
      fetchPalms();
    } catch {}
  };

  // Clear all photos
  const removeAllTreeImages = async () => {
    if (!confirm('Are you sure you want to clear all photos for this mother tree?') || !editingTree) return;
    const toDelete = [...editTreeImages];
    setEditTreeImages([]);

    for (const imgUrl of toDelete) {
      if (imgUrl && imgUrl.startsWith('/images/')) {
        try {
          await fetch(`/api/upload?path=${encodeURIComponent(imgUrl)}`, { method: 'DELETE' });
        } catch (e) {}
      }
    }

    // Auto-save empty images array
    try {
      await fetch(`/api/parent-palms/${editingTree.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [] })
      });
      setPalms(prev => prev.map(p => 
        (p.id === editingTree.id || p.code === editingTree.code) 
          ? { ...p, images: [] } 
          : p
      ));
      fetchPalms();
    } catch {}
  };

  // Save changes (both metadata and photos)
  const handleUpdateTree = async () => {
    if (!editingTree) return;
    setSavingImages(true);

    const payload = {
      ...editingTree,
      images: editTreeImages
    };

    try {
      const res = await fetch('/api/parent-palms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Immediately update local state so table updates visually without waiting
        setPalms(prev => prev.map(p => 
          (p.id === editingTree.id || p.code === editingTree.code) 
            ? { ...p, ...payload, images: editTreeImages } 
            : p
        ));
        alert(`✅ Mother Tree ${editingTree.code} photos & details updated successfully!`);
        setEditingTree(null);
        fetchPalms();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to update mother tree');
      }
    } catch (err) {
      alert('Error updating mother tree');
    } finally {
      setSavingImages(false);
    }
  };

  // Quick-save images only
  const handleSaveTreeImageUrls = async () => {
    if (!editingTree) return;
    setSavingImages(true);
    try {
      const res = await fetch(`/api/parent-palms/${editingTree.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: editTreeImages })
      });
      if (res.ok) {
        setPalms(prev => prev.map(p => 
          (p.id === editingTree.id || p.code === editingTree.code) 
            ? { ...p, images: editTreeImages } 
            : p
        ));
        alert(`✅ Image URLs saved for Mother Tree ${editingTree.code}! All pages now show the updated photos.`);
        fetchPalms();
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

  // Delete Tree
  const handleDeleteTree = async (code: string) => {
    if (!confirm(`Are you sure you want to delete Mother Tree ${code}?`)) return;
    try {
      const res = await fetch(`/api/parent-palms?code=${encodeURIComponent(code)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert(`Mother Tree ${code} deleted.`);
        fetchPalms();
      } else {
        alert('Failed to delete mother tree');
      }
    } catch (err) {
      alert('Error deleting mother tree');
    }
  };

  return (
    <>
      <section className="bg-dark text-white py-3 border-bottom border-success border-3">
        <div className="container d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <span className="badge bg-success me-2">MOTHER TREE GENETICS</span>
            <h3 className="fw-bold mb-0 text-light d-inline align-middle">Mother Tree &amp; Ancestral Palm Registry</h3>
          </div>
          <div className="d-flex gap-2">
            <a 
              href="/api/admin/export?type=trees" 
              download 
              className="btn btn-outline-success btn-sm text-light border-success"
              title="Download Mother Trees in Excel"
            >
              <i className="bi bi-file-earmark-excel me-1"></i> Export (.xlsx)
            </a>
            <Link href="/farm" target="_blank" className="btn btn-outline-warning btn-sm text-warning">
              <i className="bi bi-box-arrow-up-right me-1"></i> Public Farm Page
            </Link>
            <Link href="/admin" className="btn btn-outline-secondary btn-sm text-light">
              <i className="bi bi-arrow-left me-1"></i> Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light min-vh-100">
        <div className="container">
          
          {/* Add New Tree Form */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <h4 className="fw-bold text-dark mb-3"><i className="bi bi-plus-circle text-success me-2"></i> Add New Mother Tree (Parent Palm)</h4>
            
            <form onSubmit={handleCreateTree}>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Mother Palm Code *</label>
                  <input 
                    type="text" 
                    className="form-control fw-bold border-success" 
                    required 
                    placeholder="e.g. EM-MP-020" 
                    value={newTree.code}
                    onChange={e => setNewTree({ ...newTree, code: e.target.value })}
                  />
                  <small className="text-muted extra-small">Auto-links to dedicated images folder</small>
                </div>

                <div className="col-md-5">
                  <label className="form-label small fw-bold">Mother Palm Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="e.g. Plot C Selected Mother Tree #20" 
                    value={newTree.name}
                    onChange={e => setNewTree({ ...newTree, name: e.target.value })}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label small fw-bold">Tree Age (Years) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    value={newTree.age}
                    onChange={e => setNewTree({ ...newTree, age: Number(e.target.value) })}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label small fw-bold">Grove Location *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={newTree.location}
                    onChange={e => setNewTree({ ...newTree, location: e.target.value })}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold">Health &amp; Pest Status *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={newTree.healthStatus}
                    onChange={e => setNewTree({ ...newTree, healthStatus: e.target.value })}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold">Yield History *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={newTree.yieldHistory}
                    onChange={e => setNewTree({ ...newTree, yieldHistory: e.target.value })}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold">Why Selected *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={newTree.whySelected}
                    onChange={e => setNewTree({ ...newTree, whySelected: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">Nut Characteristics *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={newTree.nutCharacteristics}
                    onChange={e => setNewTree({ ...newTree, nutCharacteristics: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">Description / Genetics Notes</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newTree.description}
                    onChange={e => setNewTree({ ...newTree, description: e.target.value })}
                  />
                </div>

                {/* DEDICATED FOLDER PHOTO UPLOAD */}
                <div className="col-12 bg-light p-3 rounded-3 border">
                  <label className="form-label small fw-bold text-dark d-block mb-1">
                    <i className="bi bi-cloud-arrow-up-fill text-success me-1"></i> Upload Mother Tree Photographs
                  </label>
                  <span className="d-block extra-small text-muted mb-2 font-monospace">
                    <i className="bi bi-cloud-check-fill text-success me-1"></i> Uploads directly to Cloudinary Cloud Storage (CDN optimized)
                  </span>
                  <input 
                    type="file" 
                    className="form-control form-control-sm" 
                    multiple 
                    accept="image/*"
                    onChange={handleTreeFileChange}
                  />
                  {treeFiles.length > 0 && (
                    <span className="badge bg-success mt-2">
                      <i className="bi bi-check-circle-fill me-1"></i> {treeFiles.length} file(s) selected for upload
                    </span>
                  )}
                </div>

                <div className="col-12">
                  <button type="submit" className="btn btn-success fw-bold px-4" disabled={uploading}>
                    <i className="bi bi-plus-circle me-1"></i> {uploading ? 'Uploading to Cloudinary & Saving...' : 'Save Mother Tree Record'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Mother Trees List Table */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h4 className="fw-bold text-dark mb-0">Registered Mother Trees ({palms.length})</h4>
              <small className="text-muted extra-small">
                Click <strong>Edit</strong> to upload new tree photos, change cover picture, or modify genetics records.
              </small>
            </div>

            {loading ? (
              <div className="text-center py-4">Loading mother tree data...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th style={{ width: '80px' }}>Photo</th>
                      <th>Tree Code</th>
                      <th>Tree Name</th>
                      <th>Age</th>
                      <th>Location</th>
                      <th>Yield Record</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {palms.map(p => {
                      const primaryPhoto = (p.images && p.images.length > 0) ? p.images[0] : '/images/placeholder.png';
                      const photoCount = p.images ? p.images.length : 0;

                      return (
                        <tr key={p.id}>
                          {/* Visual Photo Thumbnail Column */}
                          <td>
                            <div 
                              className="position-relative cursor-pointer hover-lift rounded-3 overflow-hidden" 
                              style={{ width: '52px', height: '52px', cursor: 'pointer' }}
                              onClick={() => setPreviewTree(p)}
                              title="Click to view full photo gallery"
                            >
                              <img 
                                src={primaryPhoto} 
                                alt={p.name} 
                                className="rounded-3 border object-fit-cover w-100 h-100 shadow-sm"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.png'; }}
                              />
                              {photoCount > 1 && (
                                <span 
                                  className="position-absolute bottom-0 end-0 badge bg-dark bg-opacity-75 rounded-pill"
                                  style={{ fontSize: '0.65rem', padding: '2px 4px' }}
                                  title={`${photoCount} photos available`}
                                >
                                  {photoCount}
                                </span>
                              )}
                            </div>
                          </td>
                          <td><strong className="text-success font-monospace">{p.code}</strong></td>
                          <td><strong>{p.name}</strong></td>
                          <td><span className="badge bg-dark">{p.age} Years</span></td>
                          <td><small className="text-muted">{p.location}</small></td>
                          <td><small className="text-success fw-bold">{p.yieldHistory}</small></td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-1">
                              <Link href={`/parent-palm/${p.code}`} target="_blank" className="btn btn-sm btn-outline-info" title="View Public Profile">
                                <i className="bi bi-eye"></i> View
                              </Link>
                              <button 
                                className="btn btn-sm btn-outline-primary fw-semibold" 
                                onClick={() => openEditModal(p)}
                                title="Edit tree details and photos"
                              >
                                <i className="bi bi-pencil"></i> Edit Photos
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => handleDeleteTree(p.code)}
                                title="Delete this mother tree"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Full Container Photo Preview Modal */}
          {previewTree && (
            <div 
              className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
              style={{ zIndex: 10500, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(6px)' }}
              onClick={() => setPreviewTree(null)}
            >
              <div 
                className="card bg-dark text-white border-secondary rounded-4 shadow-lg overflow-hidden w-100" 
                style={{ maxWidth: '780px' }} 
                onClick={e => e.stopPropagation()}
              >
                <div className="card-header bg-dark border-secondary d-flex justify-content-between align-items-center p-3">
                  <div>
                    <h5 className="fw-bold mb-0 text-white">{previewTree.name}</h5>
                    <small className="text-muted">{previewTree.code} &bull; {previewTree.location}</small>
                  </div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setPreviewTree(null)}></button>
                </div>
                <div className="card-body p-3 bg-black">
                  <ImageCarousel 
                    images={previewTree.images || []} 
                    title={previewTree.name} 
                    subtitle={`${previewTree.code} • ${previewTree.location}`}
                    carouselId={`admin-tree-preview-${previewTree.code}`}
                    height="450px"
                    showThumbnails={true}
                    objectFit="contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* EDIT MOTHER TREE MODAL */}
          {editingTree && (
            <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center z-3">
              <div className="card border-0 shadow-lg rounded-4 p-4 bg-white" style={{ maxWidth: '750px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h4 className="fw-bold text-dark mb-0">
                    <i className="bi bi-pencil-square text-success me-2"></i> 
                    Edit Mother Tree: <span className="text-success">{editingTree.code}</span>
                  </h4>
                  <button className="btn-close" onClick={() => setEditingTree(null)}></button>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Mother Tree Code</label>
                    <input 
                      type="text" 
                      className="form-control fw-bold border-success font-monospace" 
                      value={editingTree.code}
                      onChange={e => setEditingTree({ ...editingTree, code: e.target.value })}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Tree Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingTree.name}
                      onChange={e => setEditingTree({ ...editingTree, name: e.target.value })}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Age (Years)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={editingTree.age}
                      onChange={e => setEditingTree({ ...editingTree, age: Number(e.target.value) })}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Health Status</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingTree.healthStatus || ''}
                      onChange={e => setEditingTree({ ...editingTree, healthStatus: e.target.value })}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Grove Location</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingTree.location}
                      onChange={e => setEditingTree({ ...editingTree, location: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold">Recorded Yield History</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingTree.yieldHistory}
                      onChange={e => setEditingTree({ ...editingTree, yieldHistory: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold">Why Selected as Mother Tree</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editingTree.whySelected || ''}
                      onChange={e => setEditingTree({ ...editingTree, whySelected: e.target.value })}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold">Nut &amp; Water Characteristics &amp; Description</label>
                    <textarea 
                      className="form-control" 
                      rows={2} 
                      value={editingTree.description}
                      onChange={e => setEditingTree({ ...editingTree, description: e.target.value })}
                    ></textarea>
                  </div>

                  {/* Mother Tree Images — Gallery, URL Manager & Device Uploader */}
                  <div className="col-12 bg-light p-3 rounded-4 border">
                    <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                      <div>
                        <label className="form-label small fw-bold text-dark mb-0">
                          <i className="bi bi-images me-1 text-success"></i> Mother Tree Photo Gallery
                          <span className="badge bg-success ms-2">{editTreeImages.length} Photo(s)</span>
                        </label>
                        <small className="d-block extra-small text-muted">
                          The first image is the <strong>Primary Cover Photo</strong> shown on customer pages.
                        </small>
                      </div>
                      {editTreeImages.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger py-0 px-2 extra-small"
                          onClick={removeAllTreeImages}
                        >
                          <i className="bi bi-trash me-1"></i> Clear All
                        </button>
                      )}
                    </div>

                    {/* Image Cards & Reorder/Primary Selector */}
                    {editTreeImages.length > 0 ? (
                      <div className="mb-3 d-flex flex-column gap-2">
                        {editTreeImages.map((imgUrl: string, idx: number) => {
                          const isPrimary = idx === 0;

                          return (
                            <div 
                              key={idx} 
                              className={`d-flex align-items-center gap-2 p-2 rounded-3 border bg-white ${isPrimary ? 'border-success border-2 shadow-sm' : ''}`}
                            >
                              <div className="position-relative flex-shrink-0" style={{ width: '56px', height: '56px' }}>
                                <img
                                  src={imgUrl}
                                  alt={`Tree Photo ${idx + 1}`}
                                  className="rounded border object-fit-cover w-100 h-100"
                                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.png'; }}
                                />
                                {isPrimary && (
                                  <span 
                                    className="position-absolute top-0 start-0 badge bg-success extra-small"
                                    style={{ fontSize: '0.6rem', padding: '1px 3px' }}
                                  >
                                    COVER
                                  </span>
                                )}
                              </div>

                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                  <span className="extra-small fw-bold text-secondary">
                                    {isPrimary ? '★ Primary Cover Picture (Shown on Farm & Home Page)' : `Photo #${idx + 1}`}
                                  </span>
                                  {!isPrimary && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-success py-0 px-2 extra-small fw-bold"
                                      onClick={() => setAsPrimaryImage(idx)}
                                      title="Make this photo the primary cover image"
                                    >
                                      <i className="bi bi-star-fill me-1"></i> Make Primary Cover
                                    </button>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  className="form-control form-control-sm font-monospace extra-small"
                                  value={imgUrl}
                                  onChange={e => updateTreeImageUrl(idx, e.target.value)}
                                  placeholder="/images/parent-palms/… or https://…"
                                />
                              </div>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger px-2 flex-shrink-0"
                                onClick={() => removeTreeImage(idx)}
                                title="Remove this photo"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-3 bg-white rounded-3 border mb-3">
                        <i className="bi bi-image text-muted fs-3 d-block mb-1"></i>
                        <small className="text-muted d-block">No photos stored for this tree yet. Upload a photo below.</small>
                      </div>
                    )}

                    {/* Add new URL */}
                    <div className="d-flex gap-2 mb-3">
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace"
                        placeholder="Paste Cloudinary URL: https://res.cloudinary.com/... or web image URL"
                        value={newTreeImageUrl}
                        onChange={e => setNewTreeImageUrl(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTreeImageUrl(); } }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success fw-bold text-nowrap"
                        onClick={addTreeImageUrl}
                      >
                        <i className="bi bi-plus-lg me-1"></i> Add URL
                      </button>
                    </div>

                    {/* Device Upload Section */}
                    <div className="p-3 bg-white rounded-3 border mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold text-dark mb-0">
                          <i className="bi bi-upload text-primary me-1"></i> Upload Photos From Device:
                        </label>
                        <div className="form-check form-switch mb-0">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            role="switch" 
                            id="primaryUploadCheck" 
                            checked={makePrimaryOnUpload}
                            onChange={e => setMakePrimaryOnUpload(e.target.checked)}
                          />
                          <label className="form-check-label extra-small fw-bold text-secondary" htmlFor="primaryUploadCheck">
                            Set uploaded photo as Primary Cover
                          </label>
                        </div>
                      </div>
                      <input
                        type="file"
                        className="form-control form-control-sm"
                        multiple
                        accept="image/*"
                        disabled={uploading}
                        onChange={handleUploadTreeFiles}
                      />
                      <small className="text-muted extra-small d-block mt-1">
                        {uploading ? '⏳ Uploading photo to Cloudinary CDN...' : 'Select JPEG/PNG/WebP. Image will be uploaded directly to Cloudinary cloud storage.'}
                      </small>
                    </div>

                    {/* Quick-save button */}
                    <button
                      type="button"
                      className="btn btn-primary btn-sm fw-bold w-100"
                      onClick={handleSaveTreeImageUrls}
                      disabled={savingImages}
                    >
                      {savingImages
                        ? <><i className="bi bi-hourglass-split me-1"></i> Saving Photos to DB…</>
                        : <><i className="bi bi-cloud-check-fill me-1"></i> Quick Save Photo Gallery to DB</>}
                    </button>
                  </div>
                </div>

                <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                  <button className="btn btn-outline-secondary" onClick={() => setEditingTree(null)}>
                    Cancel
                  </button>
                  <button 
                    className="btn btn-success fw-bold px-4 shadow-sm" 
                    onClick={handleUpdateTree}
                    disabled={savingImages}
                  >
                    {savingImages ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving All Changes...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill me-1"></i> Save Changes &amp; Photos
                      </>
                    )}
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
