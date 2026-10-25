'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ImageCarousel from '@/components/ImageCarousel';

interface BatchesClientListProps {
  initialBatches: any[];
}

export default function BatchesClientList({ initialBatches }: BatchesClientListProps) {
  const [batches, setBatches] = useState<any[]>(initialBatches);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/batches')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBatches(data);
      })
      .catch(() => {});
  }, []);

  const filteredBatches = batches.filter(b => {
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  const getStatusCount = (status: string) => {
    if (status === 'ALL') return batches.length;
    return batches.filter(b => b.status === status).length;
  };

  return (
    <>
      {/* Status Filter Bar */}
      <div className="d-flex flex-wrap justify-content-center gap-2 mb-5">
        {[
          { id: 'ALL', label: 'All Batches', cls: 'btn-dark' },
          { id: 'AVAILABLE', label: 'Available Now', cls: 'btn-success' },
          { id: 'LIMITED', label: 'Limited Stock', cls: 'btn-warning text-dark' },
          { id: 'COMING_SOON', label: 'Upcoming Batches', cls: 'btn-info text-dark' },
          { id: 'SOLD_OUT', label: 'Sold Out', cls: 'btn-danger' }
        ].map(tab => (
          <button 
            key={tab.id}
            type="button"
            className={`btn btn-sm px-3 py-2 rounded-pill fw-semibold transition-all d-inline-flex align-items-center gap-2 ${
              filter === tab.id 
                ? `${tab.cls} shadow-sm border` 
                : 'btn-outline-secondary bg-white'
            }`}
            onClick={() => setFilter(tab.id)}
          >
            <span>{tab.label}</span>
            <span className={`badge rounded-pill extra-small ${filter === tab.id ? 'bg-light text-dark' : 'bg-secondary bg-opacity-25 text-secondary'}`}>
              {getStatusCount(tab.id)}
            </span>
          </button>
        ))}
      </div>

      <div className="row g-4">
        {filteredBatches.length === 0 ? (
          <div className="col-12 text-center py-5">
            <i className="bi bi-box-seam text-muted fs-1 mb-2 d-block"></i>
            <h5 className="text-muted fw-bold">No Sapling Batches Found</h5>
            <p className="text-secondary small mb-0">No sapling batches are currently listed under this filter. Check back soon or contact farm admin.</p>
          </div>
        ) : (
          filteredBatches.map(b => (
            <div key={b.id} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative hover-lift bg-white">
                
                {/* Status Badge Ribbon */}
                <div className="position-absolute top-0 end-0 m-3 z-1">
                  {b.status === 'AVAILABLE' && <span className="badge bg-success shadow-sm px-3 py-2"><i className="bi bi-check-circle-fill me-1"></i> AVAILABLE</span>}
                  {b.status === 'LIMITED' && <span className="badge bg-warning text-dark shadow-sm px-3 py-2"><i className="bi bi-exclamation-triangle-fill me-1"></i> LIMITED</span>}
                  {b.status === 'COMING_SOON' && <span className="badge bg-info text-dark shadow-sm px-3 py-2"><i className="bi bi-clock-history me-1"></i> UPCOMING</span>}
                  {b.status === 'SOLD_OUT' && <span className="badge bg-danger shadow-sm px-3 py-2">SOLD OUT</span>}
                </div>

                <div className="overflow-hidden bg-dark position-relative w-100" style={{ height: '240px' }}>
                  <ImageCarousel 
                    images={b.images} 
                    title={b.name} 
                    carouselId={`batch-card-${b.batchCode}`} 
                    height="240px"
                    showThumbnails={false}
                    objectFit="cover"
                  />
                </div>

                <div className="card-body p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-dark bg-opacity-75">{b.batchCode}</span>
                      <span className="text-muted extra-small">
                        {(() => {
                          const treeCodes = (b.parentPalmCodes && b.parentPalmCodes.length > 0) ? b.parentPalmCodes : [b.parentPalmCode];
                          return (
                            <>
                              Mother {treeCodes.length > 1 ? 'Trees' : 'Tree'}: {(treeCodes as string[]).map((c: string, i: number) => (
                                <span key={c}>
                                  <Link href={`/parent-palm/${c}`} className="text-success fw-bold text-decoration-none">{c}</Link>
                                  {i < treeCodes.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </>
                          );
                        })()}
                      </span>
                    </div>

                    <h5 className="fw-bold text-dark mb-2">{b.name}</h5>

                    <div className="bg-light p-2 rounded-3 mb-3 small text-secondary d-flex justify-content-between">
                      <div><i className="bi bi-calendar3 me-1 text-success"></i> Age: <strong className="text-dark">{b.age}</strong></div>
                      <div><i className="bi bi-rulers me-1 text-success"></i> Height: <strong className="text-dark">{b.height}</strong></div>
                    </div>

                    {/* Stock Stats */}
                    {(() => {
                      const netStock = Math.max(0, b.totalQuantity + (b.inventoryAdjustments || 0));
                      const adj = b.inventoryAdjustments || 0;
                      return (
                        <>
                          <div className="row text-center border-top border-bottom py-2 mb-3 g-0 bg-light rounded-2">
                            <div className="col-4 border-end">
                              <small className="text-muted d-block extra-small text-uppercase fw-bold">Net Stock</small>
                              <span className="fw-bold text-dark">{netStock}</span>
                              {adj !== 0 && (
                                <small className="text-muted extra-small d-block text-nowrap">({adj > 0 ? `+${adj}` : adj} audit)</small>
                              )}
                            </div>
                            <div className="col-4 border-end">
                              <small className="text-muted d-block extra-small text-uppercase fw-bold">Booked</small>
                              <span className="fw-bold text-primary">{b.bookedQuantity}</span>
                            </div>
                            <div className="col-4">
                              <small className="text-muted d-block extra-small text-uppercase fw-bold">Available</small>
                              <span className="fw-bold text-success">{b.availableQuantity}</span>
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="progress" style={{ height: '8px', borderRadius: '9999px', backgroundColor: '#e2e8f0' }}>
                              <div 
                                className="progress-bar bg-success" 
                                role="progressbar"
                                style={{ width: `${b.bookedPercentage}%` }}
                              ></div>
                            </div>
                            <div className="d-flex justify-content-between text-muted extra-small mt-1">
                              <span>{b.bookedPercentage}% booked</span>
                              <span className="fw-bold text-success">{b.availableQuantity} saplings available</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                    <div>
                      <span className="fs-4 fw-bold text-success">₹{b.price}</span>
                      <small className="text-muted"> / sapling</small>
                    </div>
                    <div className="d-flex gap-2">
                      <Link href={`/batches/${b.batchCode}`} className="btn btn-sm btn-outline-secondary rounded-3">
                        Details
                      </Link>
                      {b.status !== 'SOLD_OUT' && (
                        <Link href={`/book/${b.batchCode}`} className="btn btn-sm btn-emerald text-decoration-none rounded-3 px-3">
                          Book Now
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
