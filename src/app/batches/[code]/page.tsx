import Link from 'next/link';
import { DataStore } from '@/lib/dataStore';
import { notFound } from 'next/navigation';
import ImageCarousel from '@/components/ImageCarousel';
import BatchViewTracker from '@/components/BatchViewTracker';
import { formatApproximateAge } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function BatchDetailPage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const batch = await DataStore.getBatchByCodeAsync(code);
  if (!batch || batch.isVisible === false) {
    notFound();
  }

  const motherTreeCodes = (batch.parentPalmCodes && batch.parentPalmCodes.length > 0) 
    ? batch.parentPalmCodes 
    : [batch.parentPalmCode];
  const motherPalms = (await Promise.all(
    motherTreeCodes.map(c => DataStore.getParentPalmByCodeAsync(c))
  )).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      <section className="hero-ambient-mesh text-white py-5 position-relative overflow-hidden border-bottom border-success border-opacity-25">
        <div className="container position-relative">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-2">
              <li className="breadcrumb-item"><Link href="/batches" className="text-success text-decoration-none">Batches</Link></li>
              <li className="breadcrumb-item active text-light" aria-current="page">{batch.batchCode}</li>
            </ol>
          </nav>

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <span className="badge bg-success px-3 py-2">{batch.status}</span>
                <span className="badge bg-dark bg-opacity-75 font-monospace border border-secondary px-3 py-2">
                  Batch ID: {batch.batchCode}
                </span>
                {/* Social Proof Views Counter */}
                <BatchViewTracker batchCode={batch.batchCode} initialCount={batch.viewsCount ?? 0} />
              </div>

              <h1 className="fw-bold mb-0 text-light d-inline-block align-middle fs-2 mt-2 mt-md-0">{batch.name}</h1>
            </div>
            <span className="fs-3 fw-bold text-success">₹{batch.price} <small className="fs-6 text-muted font-normal">/ sapling</small></span>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <div className="row g-4">
            
            {/* Left Column: Carousel & Notes */}
            <div className="col-md-7">
              {/* Bootstrap Carousel for Multiple Batch Images */}
              <div className="mb-4">
                <ImageCarousel 
                  images={batch.images} 
                  title={batch.name} 
                  subtitle={`${batch.name} • Batch ID: ${batch.batchCode} • ₹${batch.price} / sapling`}
                  carouselId="batchDetailCarousel" 
                  height="420px"
                  showThumbnails={true}
                  objectFit="cover"
                />
              </div>

              {/* Admin Description & Batch Notes */}
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <h5 className="fw-bold text-dark mb-3"><i className="bi bi-file-text me-2 text-success"></i> Batch Notes</h5>
                <p className="text-secondary">{batch.description}</p>
                <div className="alert alert-success border-success-subtle mb-0 small">
                  <i className="bi bi-truck me-2"></i> <strong>Dispatch Schedule:</strong> Saplings are prepared & packed next working day upon booking confirmation.
                </div>
              </div>

              {/* Traceability Card: Connected Parent Palms */}
              {motherPalms.length > 0 && (
                <div className="card border-0 shadow-sm rounded-4 p-4 border-start border-success border-4 bg-white">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span className="badge bg-success mb-1">
                        <i className="bi bi-shield-check me-1"></i> VERIFIED PARENT PALM TRACEABILITY
                      </span>
                      <h5 className="fw-bold text-dark mb-0">
                        {motherPalms.length > 1 ? `Tagged Mother Trees (${motherPalms.length})` : `Mother Tree: ${motherPalms[0].code}`}
                      </h5>
                    </div>
                  </div>
                  <p className="text-secondary small mb-3">
                    These certified saplings were harvested directly from registered ancestral mother palms with documented high yield &amp; genetic pedigree:
                  </p>
                  <div className="d-flex flex-column gap-3 mb-2">
                    {motherPalms.map(palm => (
                      <div key={palm.code} className="p-3 bg-light rounded-3 border">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong className="text-dark">
                            <i className="bi bi-tree-fill text-success me-1"></i>
                            {palm.code} &mdash; {palm.name}
                          </strong>
                          <span className="badge bg-warning text-dark">{formatApproximateAge(palm.age)}</span>
                        </div>
                        <small className="text-muted d-block mb-1">
                          <span className="text-success fw-semibold">{palm.healthStatus}</span>
                        </small>
                        <p className="text-secondary extra-small mb-2">{palm.yieldHistory}</p>
                        <Link href={`/parent-palm/${palm.code}`} className="btn btn-outline-success btn-sm fw-bold extra-small">
                          View {palm.code} Full Profile <i className="bi bi-arrow-right ms-1"></i>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Key Info & Booking Box */}
            <div className="col-md-5">
              <div className="card border-0 shadow-lg rounded-4 p-4 sticky-top" style={{ top: '90px' }}>
                <h4 className="fw-bold text-dark mb-4">Batch Summary & Dates</h4>

                <table className="table table-borderless mb-4">
                  <tbody>
                    <tr className="border-bottom">
                      <td className="text-muted py-2">Batch Name</td>
                      <td className="fw-bold text-dark text-end py-2">{batch.name}</td>
                    </tr>
                    <tr className="border-bottom">
                      <td className="text-muted py-2">Batch ID</td>
                      <td className="fw-bold text-secondary font-monospace text-end py-2">{batch.batchCode}</td>
                    </tr>
                    <tr className="border-bottom">
                      <td className="text-muted py-2">Age</td>
                      <td className="fw-bold text-dark text-end py-2"><span className="badge bg-success-subtle text-success border border-success">{batch.age || '8–10 months'}</span></td>
                    </tr>
                    <tr className="border-bottom">
                      <td className="text-muted py-2">Height</td>
                      <td className="fw-bold text-dark text-end py-2">{batch.height || 'Approx. 2–3 ft'}</td>
                    </tr>
                    <tr className="border-bottom">
                      <td className="text-muted py-2">Coconut Cut Date</td>
                      <td className="fw-bold text-dark text-end py-2">{batch.harvestDate || '2026-01-05'}</td>
                    </tr>
                    <tr className="border-bottom">
                      <td className="text-muted py-2">Seeded On Date</td>
                      <td className="fw-bold text-success text-end py-2">{batch.seededDate || '2026-01-15'}</td>
                    </tr>
                    <tr className="border-bottom">
                      <td className="text-muted py-2">Total Seednuts Produced</td>
                      <td className="fw-bold text-dark text-end py-2">{batch.totalQuantity}</td>
                    </tr>
                    {batch.inventoryAdjustments !== 0 && (
                      <tr className="border-bottom bg-warning-subtle">
                        <td className="text-muted py-2">Audit Inventory Adjustment</td>
                        <td className="fw-bold text-danger text-end py-2">
                          {batch.inventoryAdjustments > 0 ? `+${batch.inventoryAdjustments}` : batch.inventoryAdjustments} saplings
                        </td>
                      </tr>
                    )}
                    <tr className="border-bottom">
                      <td className="text-muted py-2">Net Seedling Stock</td>
                      <td className="fw-bold text-dark text-end py-2">{batch.totalQuantity + (batch.inventoryAdjustments || 0)}</td>
                    </tr>
                    <tr className="border-bottom">
                      <td className="text-muted py-2">Booked / Sold Quantity</td>
                      <td className="fw-bold text-primary text-end py-2 fs-6">{batch.bookedQuantity}</td>
                    </tr>
                    <tr className="border-bottom">
                      <td className="text-muted py-2">Currently Available</td>
                      <td className="fw-bold text-success text-end py-2 fs-5">{batch.availableQuantity}</td>
                    </tr>
                    <tr>
                      <td className="text-muted py-2">Unit Price</td>
                      <td className="fw-bold text-success text-end py-2 fs-5">₹{batch.price}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Progress Bar Visual */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between small fw-bold mb-1">
                    <span>Stock Status</span>
                    <span className="text-success">{batch.bookedPercentage}% Booked</span>
                  </div>
                  <div className="progress" style={{ height: '10px' }}>
                    <div className="progress-bar bg-success" style={{ width: `${batch.bookedPercentage}%` }}></div>
                  </div>
                  <small className="text-muted d-block text-center mt-2">{batch.availableQuantity} saplings left in stock</small>
                </div>

                <Link href={`/book/${batch.batchCode}`} className="btn btn-success btn-lg fw-bold w-100 shadow py-3">
                  <i className="bi bi-cart-check-fill me-2"></i> Book This Batch Now
                </Link>

                <div className="text-center mt-3">
                  <a href="https://wa.me/919486880641" target="_blank" rel="noreferrer" className="text-success small fw-bold text-decoration-none">
                    <i className="bi bi-whatsapp me-1"></i> Have questions? Chat with our Farm Admin
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Mobile Book Button */}
      <div className="fixed-bottom bg-white p-3 border-top d-md-none shadow-lg z-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <span className="fw-bold text-dark">{batch.batchCode}</span>
            <small className="text-muted d-block">₹{batch.price} / sapling</small>
          </div>
          <span className="badge bg-success">{batch.availableQuantity} Available</span>
        </div>
        <Link href={`/book/${batch.batchCode}`} className="btn btn-success w-100 fw-bold py-2">
          Book This Batch
        </Link>
      </div>
    </>
  );
}
