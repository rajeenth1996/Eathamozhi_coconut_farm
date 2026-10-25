import Link from 'next/link';
import { DataStore } from '@/lib/dataStore';
import { notFound } from 'next/navigation';
import ImageCarousel from '@/components/ImageCarousel';

export const dynamic = 'force-dynamic';

export default async function ParentPalmDetailPage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const palm = await DataStore.getParentPalmByCodeAsync(code);
  if (!palm) {
    notFound();
  }

  const allBatches = await DataStore.getBatchesAsync();
  const relatedBatches = allBatches.filter(b => {
    const codes = (b.parentPalmCodes && b.parentPalmCodes.length > 0) ? b.parentPalmCodes : [b.parentPalmCode];
    return codes.some(c => c.toLowerCase() === palm.code.toLowerCase());
  });

  return (
    <>
      <section className="bg-dark text-white py-4">
        <div className="container">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-2">
              <li className="breadcrumb-item"><Link href="/farm" className="text-success text-decoration-none">Our Farm</Link></li>
              <li className="breadcrumb-item active text-light" aria-current="page">Parent Palm {palm.code}</li>
            </ol>
          </nav>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <span className="badge bg-warning text-dark px-3 py-2 me-2">{palm.age} YEARS OLD</span>
              <h1 className="fw-bold mb-0 text-light d-inline-block align-middle">{palm.name}</h1>
            </div>
            <span className="badge bg-success fs-6">{palm.healthStatus}</span>
          </div>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <div className="row g-4 mb-5">
            <div className="col-md-5">
              <ImageCarousel 
                images={palm.images} 
                title={palm.name} 
                carouselId="palmCarousel" 
                height="420px"
                showThumbnails={true}
                objectFit="cover"
              />
            </div>

            <div className="col-md-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                <h4 className="fw-bold text-dark mb-3"><i className="bi bi-shield-check me-2 text-success"></i> Mother Tree Profile</h4>
                
                <p className="text-secondary">{palm.description}</p>

                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3 border">
                      <small className="text-muted d-block text-uppercase">Tree ID</small>
                      <strong className="text-dark fs-5">{palm.code}</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3 border">
                      <small className="text-muted d-block text-uppercase">Farm Location</small>
                      <strong className="text-dark fs-6">{palm.location}</strong>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-2"><i className="bi bi-graph-up-arrow me-2 text-success"></i> Recorded Yield History</h6>
                  <div className="alert alert-success border-success-subtle mb-0">
                    {palm.yieldHistory}
                  </div>
                </div>

                <div>
                  <h6 className="fw-bold text-dark mb-2"><i className="bi bi-droplet-half me-2 text-primary"></i> Nut & Water Characteristics</h6>
                  <p className="text-secondary small mb-0">{palm.nutCharacteristics}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Selection Rationale */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-5 bg-white border-start border-success border-4">
            <h5 className="fw-bold text-dark mb-2"><i className="bi bi-award-fill me-2 text-warning"></i> Why This Palm Was Selected as a Mother Tree</h5>
            <p className="text-secondary mb-0">{palm.whySelected}</p>
          </div>

          {/* Related Batches From This Tree */}
          <div className="mb-4">
            <h3 className="fw-bold text-dark mb-3"><i className="bi bi-box-seam me-2 text-success"></i> Related Batches Raised From This Mother Tree</h3>
            <div className="row g-4">
              {relatedBatches.map(b => (
                <div key={b.id} className="col-md-4">
                  <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-dark">{b.batchCode}</span>
                      <div className="d-flex gap-1 align-items-center">
                        <span className="badge bg-success-subtle text-success border border-success extra-small">
                          {b.availableQuantity} available
                        </span>
                        <span className={`badge ${b.status === 'AVAILABLE' ? 'bg-success' : 'bg-warning text-dark'}`}>{b.status}</span>
                      </div>
                    </div>
                    <h5 className="fw-bold text-dark mb-1">{b.name}</h5>
                    <p className="text-muted small mb-2">Age: {b.age} | Height: {b.height}</p>
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                      <span className="fw-bold text-success fs-5">₹{b.price}</span>
                      <Link href={`/batches/${b.batchCode}`} className="btn btn-sm btn-outline-success fw-bold">
                        View Batch
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
