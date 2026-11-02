'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';
import AdminLogoutButton from '@/components/AdminLogoutButton';
import { extractYouTubeVideoId } from '@/lib/types';

interface YouTubeVideoItem {
  id: string;
  title: string;
  url: string;
  videoId?: string;
  order: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminYouTubePage() {
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Form State for New Video
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newOrder, setNewOrder] = useState<number>(1);
  const [newIsVisible, setNewIsVisible] = useState(true);

  // Edit Modal State
  const [editingVideo, setEditingVideo] = useState<YouTubeVideoItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editOrder, setEditOrder] = useState<number>(1);
  const [editIsVisible, setEditIsVisible] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Preview Modal
  const [previewVideo, setPreviewVideo] = useState<YouTubeVideoItem | null>(null);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/youtube?admin=true', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setVideos(data);
        if (data.length > 0) {
          setNewOrder(data.length + 1);
        }
      }
    } catch (err) {
      console.error('Failed to fetch YouTube videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !newTitle.trim()) {
      alert('Please enter a valid title and YouTube URL');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          url: newUrl.trim(),
          order: Number(newOrder) || 1,
          isVisible: newIsVisible
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add video');
      }

      alert('✅ YouTube video added successfully!');
      setNewTitle('');
      setNewUrl('');
      setNewOrder(videos.length + 2);
      fetchVideos();
    } catch (err: any) {
      alert(`⚠️ ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVisibility = async (video: YouTubeVideoItem) => {
    const nextVal = !video.isVisible;
    setVideos(prev => prev.map(v => v.id === video.id ? { ...v, isVisible: nextVal } : v));

    try {
      const res = await fetch(`/api/youtube/${video.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: nextVal })
      });
      if (!res.ok) throw new Error('Update failed');
    } catch (err: any) {
      alert(`Failed to update visibility: ${err.message}`);
      fetchVideos();
    }
  };

  const openEditModal = (video: YouTubeVideoItem) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditUrl(video.url);
    setEditOrder(video.order || 1);
    setEditIsVisible(video.isVisible !== false);
  };

  const handleSaveEdit = async () => {
    if (!editingVideo) return;
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/youtube/${editingVideo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          url: editUrl.trim(),
          order: Number(editOrder),
          isVisible: editIsVisible
        })
      });

      if (!res.ok) throw new Error('Failed to update');
      alert('✅ YouTube video updated successfully!');
      setEditingVideo(null);
      fetchVideos();
    } catch (err: any) {
      alert(`Error saving edits: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteVideo = async (video: YouTubeVideoItem) => {
    const ok = window.confirm(`Are you sure you want to remove YouTube video "${video.title}"?`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/youtube/${video.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      alert('✅ Video removed.');
      fetchVideos();
    } catch (err: any) {
      alert(`Error deleting video: ${err.message}`);
    }
  };

  const filteredVideos = videos.filter(v =>
    !search ||
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <section className="bg-dark text-white py-3 border-bottom border-danger border-3">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="badge bg-danger mb-1">
                <i className="bi bi-youtube me-1"></i> VIDEO CONTENT MANAGEMENT
              </span>
              <h2 className="fw-bold mb-0 text-light">YouTube Farm Videos &amp; Tours</h2>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Link href="/admin" className="btn btn-outline-light btn-sm">
                <i className="bi bi-arrow-left me-1"></i> Admin Hub
              </Link>
              <Link href="/" target="_blank" className="btn btn-outline-light btn-sm">
                <i className="bi bi-eye me-1"></i> Public Site
              </Link>
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </section>

      <AdminNav />

      <section className="py-4 bg-light min-vh-100">
        <div className="container">
          {/* Form: Add New YouTube Video */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold text-dark mb-3">
              <i className="bi bi-plus-circle-fill text-danger me-2"></i>
              Add New YouTube Video / Farm Walkthrough
            </h5>
            <form onSubmit={handleCreateVideo}>
              <div className="row g-3">
                <div className="col-md-5">
                  <label className="form-label fw-bold small text-secondary">Video Title / Caption *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Eathamozhi Ancestral Coconut Grove & Mother Tree Tour"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-5">
                  <label className="form-label fw-bold small text-secondary">YouTube Video URL *</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="e.g. https://www.youtube.com/watch?v=ScMzIvxBSi4 or youtu.be/..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    required
                  />
                  <small className="text-muted extra-small">
                    Supports standard YouTube watch links, youtu.be short links, and YouTube Shorts.
                  </small>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-bold small text-secondary">Display Order</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    value={newOrder}
                    onChange={(e) => setNewOrder(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div className="col-12 d-flex justify-content-between align-items-center pt-2">
                  <div className="form-check form-switch mb-0">
                    <input
                      className="form-check-input cursor-pointer"
                      type="checkbox"
                      role="switch"
                      id="newVidVis"
                      checked={newIsVisible}
                      onChange={(e) => setNewIsVisible(e.target.checked)}
                    />
                    <label className="form-check-label small fw-semibold" htmlFor="newVidVis">
                      Visible on Website Homepage ({newIsVisible ? 'ON' : 'OFF'})
                    </label>
                  </div>
                  <button type="submit" className="btn btn-danger fw-bold px-4 shadow-sm" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Add Video to Website'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Quick Search */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
            <div className="row g-2 align-items-center">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search video titles or URLs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6 text-md-end text-muted small">
                Showing <strong>{filteredVideos.length}</strong> video{filteredVideos.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Video List Table */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-5">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-nowrap">
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: '80px' }}>Thumbnail</th>
                    <th>Video Title</th>
                    <th>Video ID / URL</th>
                    <th className="text-center" style={{ width: '90px' }}>Order</th>
                    <th className="text-center" style={{ width: '130px' }}>Homepage Visibility</th>
                    <th className="text-end" style={{ width: '140px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5">
                        <div className="spinner-border text-danger" role="status"></div>
                        <p className="text-muted small mt-2 mb-0">Loading YouTube videos...</p>
                      </td>
                    </tr>
                  ) : filteredVideos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted">
                        <i className="bi bi-youtube display-6 text-danger d-block mb-2"></i>
                        No YouTube videos added yet. Use the form above to add your first farm walkthrough.
                      </td>
                    </tr>
                  ) : (
                    filteredVideos.map((video) => {
                      const vId = video.videoId || extractYouTubeVideoId(video.url);
                      const thumb = vId
                        ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg`
                        : '/images/placeholder.png';

                      return (
                        <tr key={video.id}>
                          <td>
                            <div
                              className="position-relative rounded-3 overflow-hidden shadow-sm cursor-pointer"
                              style={{ width: '80px', height: '48px', backgroundColor: '#000' }}
                              onClick={() => setPreviewVideo(video)}
                              title="Click to preview video"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={thumb}
                                alt={video.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <div className="position-absolute top-50 start-50 translate-middle">
                                <i className="bi bi-play-circle-fill text-white fs-5" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}></i>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="fw-bold text-dark">{video.title}</div>
                            <small className="text-muted extra-small">
                              Added: {new Date(video.createdAt).toLocaleDateString()}
                            </small>
                          </td>
                          <td>
                            <span className="badge bg-danger-subtle text-danger font-monospace extra-small me-2">
                              {vId || 'Custom'}
                            </span>
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-decoration-none small text-truncate d-inline-block"
                              style={{ maxWidth: '280px' }}
                            >
                              {video.url} <i className="bi bi-box-arrow-up-right extra-small"></i>
                            </a>
                          </td>
                          <td className="text-center font-monospace fw-bold">{video.order}</td>
                          <td className="text-center">
                            <div className="form-check form-switch d-inline-block">
                              <input
                                className="form-check-input cursor-pointer"
                                type="checkbox"
                                role="switch"
                                checked={video.isVisible}
                                onChange={() => handleToggleVisibility(video)}
                              />
                              <label className="form-check-label extra-small fw-semibold ms-1">
                                {video.isVisible ? (
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
                                onClick={() => setPreviewVideo(video)}
                                className="btn btn-outline-secondary"
                                title="Watch Video"
                              >
                                <i className="bi bi-play-fill"></i>
                              </button>
                              <button
                                onClick={() => openEditModal(video)}
                                className="btn btn-outline-primary"
                                title="Edit Video"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                onClick={() => handleDeleteVideo(video)}
                                className="btn btn-outline-danger"
                                title="Delete Video"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
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

      {/* Edit Video Modal */}
      {editingVideo && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square me-2"></i> Edit YouTube Video
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setEditingVideo(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-bold small text-secondary">Video Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold small text-secondary">YouTube URL</label>
                  <input
                    type="url"
                    className="form-control"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold small text-secondary">Display Order</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editOrder}
                    onChange={(e) => setEditOrder(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div className="form-check form-switch p-2 bg-light rounded">
                  <input
                    className="form-check-input ms-0 me-2"
                    type="checkbox"
                    role="switch"
                    id="editVisSwitch"
                    checked={editIsVisible}
                    onChange={(e) => setEditIsVisible(e.target.checked)}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="editVisSwitch">
                    Visible on Website Homepage ({editIsVisible ? 'ON' : 'OFF'})
                  </label>
                </div>
              </div>
              <div className="modal-footer bg-light border-0">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingVideo(null)}>Cancel</button>
                <button type="button" className="btn btn-danger fw-bold" onClick={handleSaveEdit} disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} onClick={() => setPreviewVideo(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content rounded-4 border-0 shadow overflow-hidden bg-black text-white">
              <div className="modal-header border-0 pb-0">
                <h6 className="modal-title fw-bold text-white text-truncate">{previewVideo.title}</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setPreviewVideo(null)}></button>
              </div>
              <div className="modal-body p-3">
                <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                  <iframe
                    className="position-absolute top-0 start-0 w-100 h-100 border-0 rounded-3"
                    src={`https://www.youtube-nocookie.com/embed/${previewVideo.videoId || extractYouTubeVideoId(previewVideo.url)}?autoplay=1&rel=0`}
                    title={previewVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
