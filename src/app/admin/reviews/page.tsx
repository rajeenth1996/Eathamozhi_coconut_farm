'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminPagination from '@/components/AdminPagination';

interface Review {
  id: string;
  customerName: string;
  location: string;
  batchCode: string;
  quantity: number;
  rating: number;
  comment: string;
  verified: boolean;
  date: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterRating, setFilterRating] = useState('ALL');
  const [filterVerified, setFilterVerified] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  // Form Accordion State
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Review Form State
  const [newReview, setNewReview] = useState({
    customerName: '',
    location: '',
    batchCode: '',
    quantity: 25,
    rating: 5,
    comment: '',
    verified: true,
    date: new Date().toISOString().split('T')[0]
  });

  // Edit Modal State
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Hover rating state for interactive stars
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [editHoverRating, setEditHoverRating] = useState<number | null>(null);

  const fetchReviewsAndBatches = async () => {
    try {
      const [revRes, batchRes] = await Promise.all([
        fetch('/api/reviews'),
        fetch('/api/batches')
      ]);
      const revData = await revRes.json();
      const batchData = await batchRes.json();

      if (Array.isArray(revData)) {
        setReviews(revData);
      }
      if (Array.isArray(batchData)) {
        setBatches(batchData);
        if (!newReview.batchCode && batchData.length > 0) {
          setNewReview(prev => ({ ...prev, batchCode: batchData[0].batchCode }));
        }
      }
    } catch (err) {
      console.error('Failed to load reviews data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsAndBatches();
  }, []);

  // Create Review Handler
  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.customerName.trim() || !newReview.comment.trim()) {
      alert('Please enter both the farmer name and review comment.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      });
      const data = await res.json();

      if (res.ok) {
        alert(`Farmer review from "${data.customerName}" successfully published!`);
        setNewReview({
          customerName: '',
          location: '',
          batchCode: batches[0]?.batchCode || 'EM-0126-A',
          quantity: 25,
          rating: 5,
          comment: '',
          verified: true,
          date: new Date().toISOString().split('T')[0]
        });
        setShowCreateCard(false);
        fetchReviewsAndBatches();
      } else {
        alert(data.error || 'Failed to create review');
      }
    } catch (err) {
      alert('Network error while saving review');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Review Handler
  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    if (!editingReview.customerName.trim() || !editingReview.comment.trim()) {
      alert('Farmer name and comment are required.');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingReview)
      });
      const data = await res.json();

      if (res.ok) {
        alert(`Review for "${editingReview.customerName}" successfully updated!`);
        setEditingReview(null);
        fetchReviewsAndBatches();
      } else {
        alert(data.error || 'Failed to update review');
      }
    } catch (err) {
      alert('Error updating review');
    } finally {
      setSavingEdit(false);
    }
  };

  // Quick Toggle Verified Status
  const handleToggleVerified = async (review: Review) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: review.id,
          verified: !review.verified
        })
      });
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === review.id ? { ...r, verified: !r.verified } : r));
      } else {
        alert('Failed to update verification status');
      }
    } catch (err) {
      alert('Error updating verification status');
    }
  };

  // Delete Review Handler
  const handleDeleteReview = async (id: string, name: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete the review from "${name}"?\n\nThis will remove it from both the admin portal and the customer Farmer Reviews page.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/reviews?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert(`Review from "${name}" deleted.`);
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        alert('Failed to delete review');
      }
    } catch (err) {
      alert('Error deleting review');
    }
  };

  // Filter & Sort Logic
  const filteredReviews = reviews.filter(r => {
    const matchSearch = !search ||
      r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.toLowerCase().includes(search.toLowerCase()) ||
      r.batchCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase());

    const matchRating = filterRating === 'ALL' || r.rating === Number(filterRating);
    const matchVerified = filterVerified === 'ALL' || 
      (filterVerified === 'VERIFIED' ? r.verified : !r.verified);

    return matchSearch && matchRating && matchVerified;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'highest') return b.rating - a.rating;
    if (sortBy === 'lowest') return a.rating - b.rating;
    return 0;
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterRating, filterVerified, sortBy]);

  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Calculate Metrics
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';
  const verifiedCount = reviews.filter(r => r.verified).length;
  const totalSaplingsInReviews = reviews.reduce((acc, r) => acc + (r.quantity || 0), 0);

  const getRatingLabel = (stars: number) => {
    if (stars === 5) return '5 Stars - Exceptional Quality & Vigour';
    if (stars === 4) return '4 Stars - Very Good Growth & Service';
    if (stars === 3) return '3 Stars - Satisfactory';
    if (stars === 2) return '2 Stars - Below Average';
    return '1 Star - Poor';
  };

  return (
    <>
      {/* Top Header */}
      <section className="bg-dark text-white py-3 border-bottom border-success border-3">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <span className="badge bg-warning text-dark me-2 fw-bold">FARMER REVIEWS ADMIN</span>
            <h3 className="fw-bold mb-0 text-light d-inline align-middle">Customer Testimonials &amp; Reviews</h3>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <button
              onClick={() => setShowCreateCard(!showCreateCard)}
              className="btn btn-success btn-sm fw-bold shadow-sm d-flex align-items-center gap-1"
            >
              <i className={`bi ${showCreateCard ? 'bi-dash-circle' : 'bi-plus-circle-fill'} fs-6`}></i>
              <span>{showCreateCard ? 'Hide Form' : 'Add Farmer Review'}</span>
            </button>
            <a
              href="/api/admin/export?type=reviews"
              download
              className="btn btn-outline-success btn-sm text-light border-success"
              title="Download all reviews to Excel"
            >
              <i className="bi bi-file-earmark-excel me-1"></i> Export (.xlsx)
            </a>
            <Link
              href="/reviews"
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline-warning btn-sm text-warning"
              title="Open public reviews page in new tab"
            >
              <i className="bi bi-box-arrow-up-right me-1"></i> Public Page
            </Link>
            <Link href="/admin" className="btn btn-outline-secondary btn-sm text-light">
              <i className="bi bi-arrow-left me-1"></i> Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light min-vh-100">
        <div className="container">

          {/* Key Metrics Row */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-warning border-4">
                <small className="text-muted d-block text-uppercase fw-bold extra-small">Average Rating</small>
                <div className="d-flex align-items-baseline gap-1">
                  <h3 className="fw-bold text-dark mb-0">{loading ? '...' : avgRating}</h3>
                  <div className="text-warning small">
                    <i className="bi bi-star-fill"></i>
                  </div>
                </div>
                <small className="text-secondary extra-small">Across {totalReviews} reviews</small>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-success border-4">
                <small className="text-muted d-block text-uppercase fw-bold extra-small">Verified Buyers</small>
                <h3 className="fw-bold text-success mb-0">{loading ? '...' : verifiedCount}</h3>
                <small className="text-secondary extra-small">
                  {totalReviews > 0 ? `${Math.round((verifiedCount / totalReviews) * 100)}% verified buyers` : 'No reviews'}
                </small>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-primary border-4">
                <small className="text-muted d-block text-uppercase fw-bold extra-small">Saplings Reviewed</small>
                <h3 className="fw-bold text-primary mb-0">{loading ? '...' : totalSaplingsInReviews.toLocaleString()}</h3>
                <small className="text-secondary extra-small">Total planted saplings</small>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-dark border-4">
                <small className="text-muted d-block text-uppercase fw-bold extra-small">Total Reviews</small>
                <h3 className="fw-bold text-dark mb-0">{loading ? '...' : totalReviews}</h3>
                <small className="text-secondary extra-small">Active in database</small>
              </div>
            </div>
          </div>

          {/* Collapsible Create New Review Card */}
          {showCreateCard && (
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white border-top border-success border-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark mb-0">
                  <i className="bi bi-patch-plus-fill text-success me-2"></i> Add New Farmer Review
                </h5>
                <button
                  type="button"
                  onClick={() => setShowCreateCard(false)}
                  className="btn-close"
                  aria-label="Close"
                ></button>
              </div>
              <p className="text-secondary small mb-3">
                Create a verified farmer experience testimonial. Once saved, it will immediately show in both the customer-facing <Link href="/reviews" className="text-success fw-semibold">Farmer Reviews</Link> page and home page.
              </p>

              <form onSubmit={handleCreateReview}>
                <div className="row g-3">
                  {/* Farmer Name */}
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-dark">
                      Farmer / Customer Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. S. Karuppasamy"
                      className="form-control"
                      value={newReview.customerName}
                      onChange={e => setNewReview({ ...newReview, customerName: e.target.value })}
                    />
                  </div>

                  {/* Location */}
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-dark">
                      Farm Location / District <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tenkasi, Tamil Nadu"
                      className="form-control"
                      value={newReview.location}
                      onChange={e => setNewReview({ ...newReview, location: e.target.value })}
                    />
                  </div>

                  {/* Batch Selection */}
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-dark">
                      Associated Batch Code
                    </label>
                    <div className="input-group">
                      <select
                        className="form-select"
                        value={newReview.batchCode}
                        onChange={e => setNewReview({ ...newReview, batchCode: e.target.value })}
                      >
                        {batches.map(b => (
                          <option key={b.id || b.batchCode} value={b.batchCode}>
                            {b.batchCode} — {b.name}
                          </option>
                        ))}
                        <option value="CUSTOM">Custom / Other Batch</option>
                      </select>
                    </div>
                  </div>

                  {/* Quantity of saplings */}
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-dark">
                      Saplings Planted / Ordered
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="form-control"
                      value={newReview.quantity}
                      onChange={e => setNewReview({ ...newReview, quantity: Number(e.target.value) || 1 })}
                    />
                  </div>

                  {/* Review Date */}
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-dark">
                      Review / Planted Date
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={newReview.date}
                      onChange={e => setNewReview({ ...newReview, date: e.target.value })}
                    />
                  </div>

                  {/* Star Rating Picker */}
                  <div className="col-md-4">
                    <label className="form-label small fw-bold text-dark d-block">
                      Star Rating: <strong className="text-warning">{(hoverRating ?? newReview.rating)} / 5</strong>
                    </label>
                    <div className="d-flex align-items-center gap-1 fs-4 text-warning py-1" style={{ cursor: 'pointer' }}>
                      {[1, 2, 3, 4, 5].map(star => {
                        const activeStars = hoverRating ?? newReview.rating;
                        return (
                          <i
                            key={star}
                            className={`bi ${star <= activeStars ? 'bi-star-fill' : 'bi-star'} hover-scale`}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            title={`${star} Star${star > 1 ? 's' : ''}`}
                          ></i>
                        );
                      })}
                      <small className="text-muted extra-small ms-2 fw-normal">
                        ({getRatingLabel(hoverRating ?? newReview.rating)})
                      </small>
                    </div>
                  </div>

                  {/* Verified Buyer Switch */}
                  <div className="col-md-2 d-flex align-items-center">
                    <div className="form-check form-switch mt-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="verifiedCheck"
                        checked={newReview.verified}
                        onChange={e => setNewReview({ ...newReview, verified: e.target.checked })}
                      />
                      <label className="form-check-label small fw-bold text-dark" htmlFor="verifiedCheck">
                        Verified Buyer
                      </label>
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="col-12">
                    <label className="form-label small fw-bold text-dark">
                      Farmer Review &amp; Experience Comment <span className="text-danger">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Share details about the seedling health, germination speed, trunk thickness, packaging quality, or plantation success..."
                      className="form-control"
                      value={newReview.comment}
                      onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                    ></textarea>
                    <small className="text-muted extra-small">
                      Tip: Authentic remarks mentioning soil adaptation, root growth, or dispatch packaging create high buyer trust.
                    </small>
                  </div>

                  {/* Submit Button */}
                  <div className="col-12 d-flex justify-content-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateCard(false)}
                      className="btn btn-outline-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-success fw-bold px-4 shadow-sm"
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Publishing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle-fill me-1"></i> Publish Farmer Review
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <div className="row g-3 align-items-center">
              {/* Search Box */}
              <div className="col-md-5">
                <label className="form-label extra-small fw-bold text-secondary mb-1">
                  <i className="bi bi-search me-1"></i> Search Reviews
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by farmer name, location, batch, comment..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Filter by Rating */}
              <div className="col-md-2">
                <label className="form-label extra-small fw-bold text-secondary mb-1">
                  <i className="bi bi-star-fill text-warning me-1"></i> Rating Filter
                </label>
                <select
                  className="form-select"
                  value={filterRating}
                  onChange={e => setFilterRating(e.target.value)}
                >
                  <option value="ALL">All Ratings (1–5 ★)</option>
                  <option value="5">5 Stars only</option>
                  <option value="4">4 Stars only</option>
                  <option value="3">3 Stars only</option>
                  <option value="2">2 Stars only</option>
                  <option value="1">1 Star only</option>
                </select>
              </div>

              {/* Filter by Verification */}
              <div className="col-md-2">
                <label className="form-label extra-small fw-bold text-secondary mb-1">
                  <i className="bi bi-patch-check-fill text-success me-1"></i> Status
                </label>
                <select
                  className="form-select"
                  value={filterVerified}
                  onChange={e => setFilterVerified(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="VERIFIED">Verified Buyers Only</option>
                  <option value="UNVERIFIED">Unverified Only</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="col-md-3">
                <label className="form-label extra-small fw-bold text-secondary mb-1">
                  <i className="bi bi-arrow-down-up me-1"></i> Sort By
                </label>
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                >
                  <option value="newest">Newest Date First</option>
                  <option value="oldest">Oldest Date First</option>
                  <option value="highest">Highest Rating (5 to 1)</option>
                  <option value="lowest">Lowest Rating (1 to 5)</option>
                </select>
              </div>
            </div>

            {/* Active search tag & clear */}
            {(search || filterRating !== 'ALL' || filterVerified !== 'ALL') && (
              <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                <small className="text-secondary extra-small">
                  Showing <strong>{filteredReviews.length}</strong> of {reviews.length} total reviews
                </small>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setFilterRating('ALL');
                    setFilterVerified('ALL');
                  }}
                  className="btn btn-outline-danger btn-sm extra-small py-1 px-2"
                >
                  <i className="bi bi-x-circle me-1"></i> Reset Filters
                </button>
              </div>
            )}
          </div>

          {/* Reviews List / Table */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="fw-bold text-dark mb-0">
                <i className="bi bi-chat-square-quote-fill text-success me-2"></i>
                Farmer Testimonials Directory ({filteredReviews.length})
              </h5>
              <div className="text-muted extra-small">
                Changes persist instantly to live farm database
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status"></div>
                <p className="mt-2 text-muted small">Loading farmer reviews...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-5">
                <div className="bg-light rounded-circle d-inline-flex p-3 mb-2">
                  <i className="bi bi-chat-left-dots fs-1 text-secondary"></i>
                </div>
                <h6 className="fw-bold text-dark">No farmer reviews match your search</h6>
                <p className="text-muted small">Try adjusting your keyword or star filter, or add a new review.</p>
                <button
                  type="button"
                  onClick={() => setShowCreateCard(true)}
                  className="btn btn-success btn-sm fw-bold px-3"
                >
                  <i className="bi bi-plus-lg me-1"></i> Add Review
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light extra-small text-uppercase">
                    <tr>
                      <th style={{ width: '18%' }}>Farmer &amp; Location</th>
                      <th style={{ width: '14%' }}>Rating &amp; Status</th>
                      <th style={{ width: '14%' }}>Batch &amp; Saplings</th>
                      <th style={{ width: '38%' }}>Farmer Review Comment</th>
                      <th style={{ width: '10%' }}>Date</th>
                      <th style={{ width: '6%' }} className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReviews.map(rev => (
                      <tr key={rev.id}>
                        {/* Farmer & Location */}
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded-circle bg-success bg-opacity-10 text-success fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ width: '38px', height: '38px', fontSize: '0.85rem' }}
                            >
                              {rev.customerName ? rev.customerName.charAt(0).toUpperCase() : 'F'}
                            </div>
                            <div>
                              <strong className="text-dark d-block">{rev.customerName}</strong>
                              <small className="text-muted extra-small">
                                <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                                {rev.location || 'Tamil Nadu'}
                              </small>
                            </div>
                          </div>
                        </td>

                        {/* Rating & Verified */}
                        <td>
                          <div className="text-warning extra-small mb-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <i
                                key={i}
                                className={`bi ${i < rev.rating ? 'bi-star-fill' : 'bi-star text-muted opacity-50'} me-1`}
                              ></i>
                            ))}
                            <span className="text-dark fw-bold ms-1">{rev.rating}.0</span>
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => handleToggleVerified(rev)}
                              className={`badge border-0 ${rev.verified ? 'bg-success-subtle text-success border border-success' : 'bg-secondary bg-opacity-10 text-secondary'} extra-small`}
                              title="Click to toggle verified status"
                              style={{ cursor: 'pointer' }}
                            >
                              <i className={`bi ${rev.verified ? 'bi-patch-check-fill' : 'bi-dash-circle'} me-1`}></i>
                              {rev.verified ? 'Verified Buyer' : 'Unverified'}
                            </button>
                          </div>
                        </td>

                        {/* Batch & Quantity */}
                        <td>
                          <div>
                            <Link
                              href={`/batches/${rev.batchCode}`}
                              target="_blank"
                              className="badge bg-dark bg-opacity-75 text-decoration-none extra-small"
                              title="Inspect this batch"
                            >
                              {rev.batchCode} <i className="bi bi-arrow-up-right-square small"></i>
                            </Link>
                          </div>
                          <small className="text-secondary extra-small d-block mt-1">
                            <strong>{rev.quantity}</strong> Saplings
                          </small>
                        </td>

                        {/* Comment */}
                        <td>
                          <p className="mb-0 text-dark small" style={{ whiteSpace: 'pre-line' }}>
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                        </td>

                        {/* Date */}
                        <td>
                          <span className="text-secondary extra-small text-nowrap">
                            <i className="bi bi-calendar3 me-1"></i>
                            {rev.date}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="text-end text-nowrap">
                          <button
                            type="button"
                            onClick={() => setEditingReview({ ...rev })}
                            className="btn btn-outline-primary btn-sm me-1"
                            title="Edit this review"
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id, rev.customerName)}
                            className="btn btn-outline-danger btn-sm"
                            title="Delete this review"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && filteredReviews.length > 0 && (
              <div className="p-3 border-top bg-light">
                <AdminPagination
                  currentPage={currentPage}
                  totalItems={filteredReviews.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Edit Review Modal */}
      {editingReview && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white border-bottom border-success border-2">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square text-success me-2"></i> Edit Farmer Review: {editingReview.customerName}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditingReview(null)}
                ></button>
              </div>

              <form onSubmit={handleUpdateReview}>
                <div className="modal-body p-4 bg-light">
                  <div className="row g-3">
                    {/* Farmer Name */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">
                        Farmer / Customer Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        value={editingReview.customerName}
                        onChange={e => setEditingReview({ ...editingReview, customerName: e.target.value })}
                      />
                    </div>

                    {/* Location */}
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">
                        Location / District <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        value={editingReview.location}
                        onChange={e => setEditingReview({ ...editingReview, location: e.target.value })}
                      />
                    </div>

                    {/* Batch Selection */}
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-dark">
                        Batch Code
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingReview.batchCode}
                        onChange={e => setEditingReview({ ...editingReview, batchCode: e.target.value })}
                      />
                    </div>

                    {/* Sapling Quantity */}
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-dark">
                        Quantity of Saplings
                      </label>
                      <input
                        type="number"
                        min={1}
                        className="form-control"
                        value={editingReview.quantity}
                        onChange={e => setEditingReview({ ...editingReview, quantity: Number(e.target.value) || 1 })}
                      />
                    </div>

                    {/* Date */}
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-dark">
                        Review Date
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={editingReview.date}
                        onChange={e => setEditingReview({ ...editingReview, date: e.target.value })}
                      />
                    </div>

                    {/* Interactive Star Rating */}
                    <div className="col-md-7">
                      <label className="form-label small fw-bold text-dark d-block">
                        Rating: <strong className="text-warning">{(editHoverRating ?? editingReview.rating)} / 5 Stars</strong>
                      </label>
                      <div className="d-flex align-items-center gap-1 fs-4 text-warning py-1" style={{ cursor: 'pointer' }}>
                        {[1, 2, 3, 4, 5].map(star => {
                          const active = editHoverRating ?? editingReview.rating;
                          return (
                            <i
                              key={star}
                              className={`bi ${star <= active ? 'bi-star-fill' : 'bi-star'} hover-scale`}
                              onMouseEnter={() => setEditHoverRating(star)}
                              onMouseLeave={() => setEditHoverRating(null)}
                              onClick={() => setEditingReview({ ...editingReview, rating: star })}
                            ></i>
                          );
                        })}
                        <small className="text-muted extra-small ms-2 fw-normal">
                          ({getRatingLabel(editHoverRating ?? editingReview.rating)})
                        </small>
                      </div>
                    </div>

                    {/* Verified Toggle */}
                    <div className="col-md-5 d-flex align-items-center">
                      <div className="form-check form-switch mt-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="editVerifiedCheck"
                          checked={editingReview.verified}
                          onChange={e => setEditingReview({ ...editingReview, verified: e.target.checked })}
                        />
                        <label className="form-check-label small fw-bold text-dark" htmlFor="editVerifiedCheck">
                          Verified Buyer Badge
                        </label>
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="col-12">
                      <label className="form-label small fw-bold text-dark">
                        Farmer Review Comment <span className="text-danger">*</span>
                      </label>
                      <textarea
                        required
                        rows={4}
                        className="form-control"
                        value={editingReview.comment}
                        onChange={e => setEditingReview({ ...editingReview, comment: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-white">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setEditingReview(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="btn btn-success fw-bold px-4"
                  >
                    {savingEdit ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save-fill me-1"></i> Save Changes
                      </>
                    )}
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
