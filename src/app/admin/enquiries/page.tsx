'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminPagination from '@/components/AdminPagination';
import WhatsAppBroadcastModal, { BroadcastRecipient } from '@/components/WhatsAppBroadcastModal';

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Multi-select & WhatsApp Broadcast State
  const [selectedEnquiryIds, setSelectedEnquiryIds] = useState<string[]>([]);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  const fetchEnquiries = async () => {
    try {
      const res = await fetch('/api/enquiries');
      const data = await res.json();
      setEnquiries(data);
    } catch (err) {
      console.error('Failed to fetch enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/enquiries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        fetchEnquiries();
      }
    } catch (err) {
      alert('Failed to update enquiry status');
    }
  };

  const filteredEnquiries = enquiries.filter(e => {
    if (filterStatus === 'ALL') return true;
    return e.status === filterStatus;
  });

  const paginatedEnquiries = filteredEnquiries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSelectEnquiry = (id: string) => {
    setSelectedEnquiryIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredEnquiries.map(e => e.id);
    const allSelected = ids.length > 0 && ids.every(id => selectedEnquiryIds.includes(id));
    if (allSelected) {
      setSelectedEnquiryIds([]);
    } else {
      setSelectedEnquiryIds(ids);
    }
  };

  const selectAllOnPage = () => {
    const pageIds = paginatedEnquiries.map(e => e.id);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedEnquiryIds.includes(id));
    if (allSelected) {
      setSelectedEnquiryIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedEnquiryIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const broadcastRecipients: BroadcastRecipient[] = enquiries
    .filter(e => selectedEnquiryIds.includes(e.id))
    .map(e => ({
      id: e.id,
      name: e.name || 'Valued Farmer',
      phone: e.mobile || '',
      location: e.location || 'N/A',
      status: e.status || 'NEW',
    }));

  return (
    <>
      <section className="bg-dark text-white py-3 border-bottom">
        <div className="container d-flex justify-content-between align-items-center">
          <div>
            <span className="badge bg-warning text-dark me-2">CUSTOMER ENQUIRIES</span>
            <h3 className="fw-bold mb-0 text-light d-inline align-middle">Customer Messages & Leads</h3>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <a 
              href="/api/admin/export?type=enquiries" 
              download 
              className="btn btn-outline-success btn-sm text-light border-success"
              title="Download Customer Enquiries in Excel"
            >
              <i className="bi bi-file-earmark-excel-fill text-success me-1"></i> Export Enquiries (.xlsx)
            </a>
            <Link href="/admin" className="btn btn-outline-light btn-sm">
              <i className="bi bi-arrow-left me-1"></i> Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold text-dark mb-0">Submitted Enquiries ({filteredEnquiries.length})</h4>
            <div className="d-flex gap-2">
              <button 
                className={`btn btn-sm ${filterStatus === 'ALL' ? 'btn-dark' : 'btn-outline-dark'}`}
                onClick={() => setFilterStatus('ALL')}
              >
                All
              </button>
              <button 
                className={`btn btn-sm ${filterStatus === 'NEW' ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => setFilterStatus('NEW')}
              >
                New ({enquiries.filter(x => x.status === 'NEW').length})
              </button>
              <button 
                className={`btn btn-sm ${filterStatus === 'CONTACTED' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setFilterStatus('CONTACTED')}
              >
                Contacted
              </button>
              <button 
                className={`btn btn-sm ${filterStatus === 'RESOLVED' ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => setFilterStatus('RESOLVED')}
              >
                Resolved
              </button>
            </div>
          </div>

          {/* WhatsApp Broadcast & Multi-Select Toolbar */}
          <div className={`p-3 rounded-4 mb-4 border transition-all ${selectedEnquiryIds.length > 0 ? 'bg-success-subtle border-success shadow-sm' : 'bg-white'}`}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <div className="form-check mb-0">
                  <input
                    type="checkbox"
                    id="selectAllEnqCheckbox"
                    className="form-check-input cursor-pointer"
                    checked={filteredEnquiries.length > 0 && selectedEnquiryIds.length === filteredEnquiries.length}
                    onChange={selectAllFiltered}
                  />
                  <label htmlFor="selectAllEnqCheckbox" className="form-check-label fw-bold small text-dark cursor-pointer">
                    Select All Filtered ({filteredEnquiries.length})
                  </label>
                </div>
                <button
                  type="button"
                  onClick={selectAllOnPage}
                  className="btn btn-outline-secondary btn-sm py-0 px-2 extra-small rounded-pill bg-white"
                >
                  Select Current Page ({paginatedEnquiries.length})
                </button>
                {selectedEnquiryIds.length > 0 && (
                  <>
                    <span className="badge bg-success fs-6 px-3 py-1">
                      <i className="bi bi-check-circle-fill me-1"></i> {selectedEnquiryIds.length} lead{selectedEnquiryIds.length !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedEnquiryIds([])}
                      className="btn btn-link text-danger btn-sm p-0 extra-small text-decoration-none fw-semibold"
                    >
                      Clear Selection
                    </button>
                  </>
                )}
              </div>

              <div>
                <button
                  type="button"
                  disabled={selectedEnquiryIds.length === 0}
                  onClick={() => setShowBroadcastModal(true)}
                  className="btn btn-success fw-bold px-3 py-2 shadow-sm d-inline-flex align-items-center gap-2"
                  title={selectedEnquiryIds.length === 0 ? 'Select leads with checkboxes to broadcast' : 'Open WhatsApp broadcast queue dispatcher'}
                >
                  <i className="bi bi-whatsapp fs-5"></i>
                  <span>Broadcast WhatsApp Message {selectedEnquiryIds.length > 0 ? `(${selectedEnquiryIds.length})` : ''}</span>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">Loading enquiries...</div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white text-muted">
              <i className="bi bi-inbox fs-1 text-secondary d-block mb-2"></i>
              No customer enquiries found matching the selected filter.
            </div>
          ) : (
            <>
              <div className="d-flex flex-column gap-3 mb-4">
                {paginatedEnquiries.map((enq) => {
                  const waUrl = `https://wa.me/91${enq.mobile}?text=${encodeURIComponent(`Hello ${enq.name}, thank you for contacting Eathamozhi Coconut Farm! Regarding your enquiry: "${enq.message.slice(0, 50)}..."`)}`;
                  const isSelected = selectedEnquiryIds.includes(enq.id);

                  return (
                    <div key={enq.id} className={`card border-0 shadow-sm rounded-4 p-4 transition-all ${isSelected ? 'bg-success-subtle border border-success' : 'bg-white'}`}>
                      <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <input
                            type="checkbox"
                            className="form-check-input cursor-pointer mt-0"
                            checked={isSelected}
                            onChange={() => toggleSelectEnquiry(enq.id)}
                            title={isSelected ? 'Deselect lead' : 'Select lead for WhatsApp broadcast'}
                          />
                          <div>
                            <h5 className="fw-bold text-dark mb-0">{enq.name}</h5>
                            <small className="text-muted"><i className="bi bi-phone me-1"></i>{enq.mobile} {enq.location ? `| ${enq.location}` : ''}</small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <small className="text-muted">{new Date(enq.createdAt).toLocaleDateString()}</small>
                          <select 
                            className={`form-select form-select-sm fw-bold ${enq.status === 'NEW' ? 'border-danger text-danger bg-danger-subtle' : enq.status === 'CONTACTED' ? 'border-primary text-primary' : 'border-success text-success'}`}
                            value={enq.status}
                            onChange={(e) => handleStatusUpdate(enq.id, e.target.value)}
                          >
                            <option value="NEW">NEW LEAD</option>
                            <option value="CONTACTED">CONTACTED</option>
                            <option value="RESOLVED">RESOLVED</option>
                          </select>
                        </div>
                      </div>

                      <p className="text-dark bg-light p-3 rounded-3 border mb-3">{enq.message}</p>

                      <div className="d-flex justify-content-end gap-2 align-items-center">
                        <button
                          type="button"
                          className={`btn btn-sm ${isSelected ? 'btn-success text-white' : 'btn-outline-success'} fw-semibold d-inline-flex align-items-center gap-1 shadow-sm`}
                          onClick={() => {
                            setSelectedEnquiryIds([enq.id]);
                            setShowBroadcastModal(true);
                          }}
                        >
                          <i className="bi bi-megaphone-fill"></i> Msg
                        </button>
                        <a href={`tel:+91${enq.mobile}`} className="btn btn-sm btn-outline-dark fw-bold">
                          <i className="bi bi-telephone me-1"></i> Call Customer
                        </a>
                        <a href={waUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-success fw-bold">
                          <i className="bi bi-whatsapp me-1"></i> Reply via WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                <AdminPagination
                  currentPage={currentPage}
                  totalItems={filteredEnquiries.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </>
          )}

          {/* WhatsApp Broadcast Dispatcher Modal */}
          {showBroadcastModal && broadcastRecipients.length > 0 && (
            <WhatsAppBroadcastModal
              recipients={broadcastRecipients}
              onClose={() => setShowBroadcastModal(false)}
            />
          )}

        </div>
      </section>
    </>
  );
}
