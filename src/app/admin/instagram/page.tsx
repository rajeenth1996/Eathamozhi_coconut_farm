'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/AdminNav';

interface InstagramPost {
  id: string;
  title: string;
  url: string;
  order: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminInstagramPage() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // Edit modal
  const [editingPost, setEditingPost] = useState<InstagramPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editOrder, setEditOrder] = useState<number>(1);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/instagram?admin=true');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPosts(data);
        setOrder(data.length + 1);
      }
    } catch (err) {
      console.error('Failed to load Instagram posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      alert('Instagram Reel/Video URL is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Eathamozhi Coconut Farm Reel',
          url: url.trim(),
          order: Number(order) || (posts.length + 1),
          isVisible: true,
        }),
      });

      if (res.ok) {
        alert('✅ Instagram video added successfully!');
        setTitle('');
        setUrl('');
        await fetchPosts();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add Instagram content');
      }
    } catch (err) {
      alert('Network error adding Instagram post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVisibility = async (post: InstagramPost) => {
    try {
      const updatedVisibility = !post.isVisible;
      const res = await fetch(`/api/instagram/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: updatedVisibility }),
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isVisible: updatedVisibility } : p));
      }
    } catch (err) {
      alert('Failed to update visibility');
    }
  };

  const openEditModal = (post: InstagramPost) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditUrl(post.url);
    setEditOrder(post.order || 1);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/instagram/${editingPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          url: editUrl.trim(),
          order: Number(editOrder),
        }),
      });

      if (res.ok) {
        alert('✅ Instagram video updated successfully!');
        setEditingPost(null);
        await fetchPosts();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update Instagram video');
      }
    } catch (err) {
      alert('Network error saving changes');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePost = async (post: InstagramPost) => {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) return;

    try {
      const res = await fetch(`/api/instagram/${post.id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Instagram video deleted.');
        await fetchPosts();
      } else {
        alert('Failed to delete Instagram content');
      }
    } catch (err) {
      alert('Network error deleting post');
    }
  };

  // Helper to extract clean embed URL
  const getEmbedUrl = (rawUrl: string) => {
    try {
      const clean = rawUrl.split('?')[0].replace(/\/+$/, '');
      if (clean.includes('/reel/') || clean.includes('/p/')) {
        return `${clean}/embed`;
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  };

  return (
    <>
      <AdminNav />

      {/* Header */}
      <section className="bg-dark text-white py-3 border-bottom">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <span className="badge bg-danger me-2">MODULE 7</span>
            <h3 className="fw-bold mb-0 text-light d-inline align-middle">Instagram Content Management</h3>
          </div>
          <Link href="/" target="_blank" className="btn btn-outline-light btn-sm">
            <i className="bi bi-box-arrow-up-right me-1"></i> View Main Page
          </Link>
        </div>
      </section>

      <section className="py-4 bg-light">
        <div className="container">
          <div className="row g-4">
            {/* Form Column */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '80px' }}>
                <h5 className="fw-bold text-dark mb-3">
                  <i className="bi bi-plus-circle-fill text-danger me-2"></i>
                  Add Instagram Reel / Video
                </h5>
                <form onSubmit={handleAddPost}>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Title / Caption</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Traditional Harvesting from 80-Year Palm"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Instagram URL</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://www.instagram.com/reel/C8xyz123/"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                    <small className="text-muted extra-small">Supports Instagram Reels (`/reel/`) and Posts (`/p/`).</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small text-secondary">Display Sort Order</label>
                    <input
                      type="number"
                      min={1}
                      className="form-control"
                      value={order}
                      onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                    />
                    <small className="text-muted extra-small">Lower numbers appear first on the main page.</small>
                  </div>

                  <button type="submit" className="btn btn-danger w-100 fw-bold py-2 shadow-sm" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Instagram Video'}
                  </button>
                </form>
              </div>
            </div>

            {/* List Column */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-dark mb-0">Active Instagram Videos ({posts.length})</h5>
                  <button onClick={fetchPosts} className="btn btn-outline-secondary btn-sm">
                    <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-danger" role="status"></div>
                    <div className="mt-2 text-muted">Loading Instagram videos...</div>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-instagram display-4 d-block mb-2 text-danger opacity-50"></i>
                    No Instagram videos added yet. Add your first Reel above to feature it on the main page!
                  </div>
                ) : (
                  <div className="row g-3">
                    {posts.map((post) => (
                      <div key={post.id} className="col-md-6">
                        <div className="card h-100 border rounded-4 overflow-hidden shadow-sm">
                          {/* Embed Preview */}
                          <div className="bg-black position-relative" style={{ height: '380px' }}>
                            <iframe
                              src={getEmbedUrl(post.url)}
                              className="w-100 h-100 border-0"
                              title={post.title}
                              allowFullScreen
                            ></iframe>
                          </div>

                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="fw-bold text-dark mb-0 text-truncate" title={post.title}>
                                {post.title}
                              </h6>
                              <span className="badge bg-secondary font-monospace">Order #{post.order}</span>
                            </div>

                            <div className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top">
                              {/* Visibility Toggle */}
                              <div className="form-check form-switch mb-0">
                                <input
                                  className="form-check-input cursor-pointer"
                                  type="checkbox"
                                  checked={post.isVisible}
                                  onChange={() => handleToggleVisibility(post)}
                                  id={`vis-${post.id}`}
                                />
                                <label className="form-check-label extra-small fw-semibold" htmlFor={`vis-${post.id}`}>
                                  {post.isVisible ? 'Visible' : 'Hidden'}
                                </label>
                              </div>

                              <div className="d-flex gap-1">
                                <button
                                  onClick={() => openEditModal(post)}
                                  className="btn btn-sm btn-outline-primary py-0 px-2 rounded-pill extra-small"
                                >
                                  <i className="bi bi-pencil me-1"></i> Edit
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post)}
                                  className="btn btn-sm btn-outline-danger py-0 px-2 rounded-pill extra-small"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Edit Modal */}
      {editingPost && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <form onSubmit={handleSaveEdit}>
                <div className="modal-header bg-dark text-white border-0">
                  <h5 className="modal-title fw-bold">
                    <i className="bi bi-pencil-square me-2 text-danger"></i>
                    Edit Instagram Content
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setEditingPost(null)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Title / Caption</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Instagram URL</label>
                    <input
                      type="url"
                      className="form-control"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Display Sort Order</label>
                    <input
                      type="number"
                      min={1}
                      className="form-control"
                      value={editOrder}
                      onChange={(e) => setEditOrder(parseInt(e.target.value, 10) || 1)}
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setEditingPost(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger fw-bold px-4" disabled={savingEdit}>
                    {savingEdit ? 'Saving...' : 'Save Changes'}
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
