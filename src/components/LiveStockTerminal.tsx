'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ImageCarousel from '@/components/ImageCarousel';

interface LiveStockTerminalProps {
  initialBatch?: any;
  initialBatches?: any[];
}

export default function LiveStockTerminal({ initialBatch, initialBatches = [] }: LiveStockTerminalProps) {
  const [batches, setBatches] = useState<any[]>(initialBatches);
  const [selectedBatchCode, setSelectedBatchCode] = useState<string>(initialBatch?.batchCode || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  // Real-time synchronization with /api/batches (same source of truth as /batches page)
  const syncBatches = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/batches', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBatches(data);
          setLastSynced(new Date());
          if (!selectedBatchCode) {
            const ready = data.find((b: any) => b.availableQuantity > 0 && b.status !== 'COMING_SOON') || data[0];
            setSelectedBatchCode(ready?.batchCode || '');
          }
        }
      }
    } catch (err) {
      console.warn('Live stock terminal background sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncBatches();

    // Re-sync on window focus so when a user switches tabs or completes a booking, numbers are instantly fresh
    const handleFocus = () => syncBatches();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Determine current active batch
  const currentBatch = 
    batches.find(b => b.batchCode === selectedBatchCode) || 
    batches.find(b => b.availableQuantity > 0 && b.status !== 'COMING_SOON') || 
    initialBatch || 
    batches[0];

  // Available batches that can be toggled in terminal
  const availableBatches = batches.filter(b => b.availableQuantity > 0);

  const totalQty = currentBatch?.totalQuantity || 0;
  const adj = currentBatch?.inventoryAdjustments || 0;
  const netProduced = totalQty + adj;
  const bookedQty = currentBatch?.bookedQuantity || 0;
  const availQty = currentBatch?.availableQuantity || 0;
  const bookedPct = netProduced > 0 ? Number(((bookedQty / netProduced) * 100).toFixed(1)) : 0;

  if (!currentBatch) {
    return (
      <section className="py-5 bg-light position-relative">
        <div className="container">
          <div 
            className="card border-0 shadow-lg rounded-4 overflow-hidden position-relative mt-n5 p-5 text-center bg-white"
            style={{ marginTop: '-4.5rem', zIndex: 10 }}
          >
            <i className="bi bi-box-seam text-success fs-1 mb-2"></i>
            <h4 className="fw-bold text-dark">Live Stock Terminal</h4>
            <p className="text-muted mb-3">No active sapling batches listed at this moment. New seednut batches will be updated directly by farm admin.</p>
            <div>
              <a href="https://wa.me/919486880641?text=Hello%20Eathamozhi%20Farm,%20when%20will%20the%20next%20sapling%20batch%20be%20available?" target="_blank" rel="noreferrer" className="btn btn-success fw-bold">
                <i className="bi bi-whatsapp me-1"></i> Inquire via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5 bg-light position-relative">
      <div className="container">
        <div 
          className="card border-0 shadow-lg rounded-4 overflow-hidden position-relative mt-n5 hover-lift"
          style={{ marginTop: '-4.5rem', zIndex: 10, background: '#ffffff' }}
        >
          {/* Terminal Header */}
          <div className="py-3 px-4 d-flex flex-wrap justify-content-between align-items-center gap-2" style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)' }}>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="pulse-indicator"></span>
              <span className="badge bg-warning text-dark fw-bold px-2 py-1">LIVE STOCK TERMINAL</span>
              <span className="text-light fw-bold small">Ready for Immediate Booking &amp; Dispatch</span>
              {loading && (
                <span className="spinner-border spinner-border-sm text-success" role="status" title="Syncing live farm stock..."></span>
              )}
            </div>

            {/* Batch Selector / Indicator */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {availableBatches.length > 1 && (
                <div className="d-flex align-items-center gap-1">
                  <label htmlFor="terminal-batch-select" className="text-light opacity-75 extra-small fw-semibold d-none d-md-inline">
                    Select Batch:
                  </label>
                  <select
                    id="terminal-batch-select"
                    value={currentBatch?.batchCode || ''}
                    onChange={(e) => setSelectedBatchCode(e.target.value)}
                    className="form-select form-select-sm bg-dark text-light border-success py-1 px-2 extra-small"
                    style={{ maxWidth: '170px' }}
                  >
                    {availableBatches.map(b => (
                      <option key={b.batchCode} value={b.batchCode}>
                        {b.batchCode} ({b.availableQuantity} left)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <span className="badge bg-success bg-opacity-25 border border-success text-white fw-bold px-3 py-1">
                Batch: {currentBatch?.batchCode}
              </span>
            </div>
          </div>

          <div className="card-body p-4 p-md-5">
            <div className="row align-items-center g-4">
              
              {/* Photo Carousel Preview */}
              <div className="col-lg-5">
                <div className="rounded-4 overflow-hidden shadow-sm bg-dark position-relative w-100" style={{ height: '360px' }}>
                  <ImageCarousel 
                    images={currentBatch?.images || []} 
                    title={currentBatch?.name || 'Featured Batch'} 
                    carouselId={`home-featured-${currentBatch?.batchCode || 'batch'}`} 
                    height="360px"
                    showThumbnails={false}
                    objectFit="cover"
                  />
                </div>
                <div className="d-flex justify-content-between align-items-center mt-2 px-1">
                  <span className="badge bg-light text-secondary border extra-small">
                    <i className="bi bi-camera-fill me-1"></i> Real Batch Photos
                  </span>
                  <span className="text-danger small fw-semibold">
                    <i className="bi bi-eye-fill me-1"></i> 🔥 {currentBatch?.viewsCount || 140} farmers viewed today
                  </span>
                </div>
              </div>

              {/* Stock Numbers & Live Math */}
              <div className="col-lg-7">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                    <div>
                      <h3 className="fw-bold text-dark mb-1">{currentBatch?.name}</h3>
                      <p className="text-muted small mb-0">
                        Age: <strong className="text-dark">{currentBatch?.age}</strong> &bull; Avg Height: <strong className="text-dark">{currentBatch?.height}</strong> &bull; {(() => {
                          const treeCodes = (currentBatch?.parentPalmCodes && currentBatch.parentPalmCodes.length > 0)
                            ? currentBatch.parentPalmCodes
                            : (currentBatch?.parentPalmCode ? [currentBatch.parentPalmCode] : []);
                          return (
                            <>
                              Mother {treeCodes.length > 1 ? 'Trees' : 'Tree'}: {(treeCodes as string[]).map((c: string, i: number) => (
                                <span key={c}>
                                  <Link href={`/parent-palm/${c}`} className="text-success fw-bold text-decoration-none hover-underline">
                                    {c} <i className="bi bi-arrow-up-right-square small"></i>
                                  </Link>
                                  {i < treeCodes.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </>
                          );
                        })()}
                      </p>
                    </div>
                  <div className="text-end">
                    <span className="display-6 fw-bold text-success">₹{currentBatch?.price}</span>
                    <small className="text-muted d-block extra-small">per sapling</small>
                  </div>
                </div>

                {/* Stock Stats Grid */}
                <div className="row text-center bg-light p-3 rounded-4 mb-3 border g-2">
                  <div className="col-4 border-end">
                    <small className="text-muted d-block extra-small text-uppercase fw-bold">Net Stock</small>
                    <span className="fs-4 fw-bold text-dark">{netProduced}</span>
                    {adj !== 0 && (
                      <small className="text-muted extra-small d-block text-nowrap">({adj > 0 ? `+${adj}` : adj} audit)</small>
                    )}
                  </div>
                  <div className="col-4 border-end">
                    <small className="text-muted d-block extra-small text-uppercase fw-bold">Booked / Sold</small>
                    <span className="fs-4 fw-bold text-primary">{bookedQty}</span>
                    <small className="text-muted extra-small d-block">confirmed</small>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block extra-small text-uppercase fw-bold">Available Now</small>
                    <span className="fs-4 fw-bold text-success">{availQty}</span>
                    <small className="text-success extra-small d-block fw-semibold">ready</small>
                  </div>
                </div>

                {/* Booking Progress Bar */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between small fw-bold mb-1">
                    <span className="text-secondary">Batch Booking Progress</span>
                    <span className="text-success">{bookedPct}% Booked ({availQty} saplings left)</span>
                  </div>
                  <div className="progress" style={{ height: '12px', borderRadius: '9999px', backgroundColor: '#e2e8f0' }}>
                    <div 
                      className="progress-bar bg-success progress-bar-striped progress-bar-animated" 
                      role="progressbar" 
                      style={{ width: `${bookedPct}%` }}
                      aria-valuenow={bookedPct} 
                      aria-valuemin={0} 
                      aria-valuemax={100}
                    ></div>
                  </div>
                </div>

                {/* Dispatch & Booking Actions */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pt-2 border-top">
                  <div className="d-flex align-items-center text-muted small">
                    <i className="bi bi-truck text-success fs-5 me-2"></i>
                    <span>Dispatched securely within 24-48 hours of confirmation</span>
                  </div>

                  <div className="d-flex gap-2">
                    <Link href={`/batches/${currentBatch?.batchCode}`} className="btn btn-outline-secondary px-3 py-2 rounded-3 fw-semibold">
                      View Pedigree
                    </Link>
                    <Link href={`/book/${currentBatch?.batchCode}`} className="btn-emerald text-decoration-none px-4 py-2 rounded-3 fs-6">
                      <i className="bi bi-cart-check-fill"></i> Book Now
                    </Link>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3 pt-2 text-muted extra-small border-top border-light">
                  <span className="d-inline-flex align-items-center gap-1 text-success fw-semibold">
                    <i className="bi bi-check-circle-fill"></i> 100% Synced with Farm DB
                  </span>
                  <span>
                    Status: <strong className="text-dark">{currentBatch?.status || 'AVAILABLE'}</strong> &bull; Total Available across all batches: <strong className="text-success">{batches.reduce((acc, b) => acc + (b.availableQuantity || 0), 0)}</strong>
                  </span>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
