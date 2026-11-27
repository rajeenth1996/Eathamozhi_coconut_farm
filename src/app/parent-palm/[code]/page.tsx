import Link from 'next/link';
import { DataStore } from '@/lib/dataStore';
import { notFound } from 'next/navigation';
import ImageCarousel from '@/components/ImageCarousel';
import { formatApproximateAge, extractYouTubeVideoId } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ParentPalmDetailPage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const allPalms = await DataStore.getParentPalmsAsync();
  const visiblePalms = allPalms.filter(p => p.isVisible !== false);
  const currentIndex = visiblePalms.findIndex(
    p => p.code.toLowerCase() === code.toLowerCase() || (p.motherTreeCode && p.motherTreeCode.toLowerCase() === code.toLowerCase())
  );
  const palm = currentIndex !== -1 ? visiblePalms[currentIndex] : await DataStore.getParentPalmByCodeAsync(code);
  if (!palm || palm.isVisible === false) {
    notFound();
  }

  const prevPalm = visiblePalms.length > 1 && currentIndex > 0
    ? visiblePalms[currentIndex - 1]
    : null;
  const nextPalm = visiblePalms.length > 1 && currentIndex !== -1 && currentIndex < visiblePalms.length - 1
    ? visiblePalms[currentIndex + 1]
    : null;

  const allBatches = await DataStore.getBatchesAsync();
  const relatedBatches = allBatches.filter(b => {
    if (b.isVisible === false) return false;
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
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <span className="badge bg-warning text-dark px-3 py-2 me-2">{formatApproximateAge(palm.age).toUpperCase()}</span>
              <h1 className="fw-bold mb-0 text-light d-inline-block align-middle">{palm.name}</h1>
            </div>
            <span className="badge bg-success fs-6">{palm.healthStatus}</span>
          </div>

          {/* In-Page Mother Tree Navigation Bar */}
          {visiblePalms.length > 1 && (
            <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div>
                {prevPalm ? (
                  <Link
                    href={`/parent-palm/${prevPalm.code}`}
                    prefetch={false}
                    className="btn btn-outline-light btn-sm d-inline-flex align-items-center gap-2 rounded-pill px-3"
                  >
                    <i className="bi bi-arrow-left"></i>
                    <span>Prev: <strong className="font-monospace">{prevPalm.motherTreeCode || prevPalm.code}</strong></span>
                  </Link>
                ) : (
                  <span className="btn btn-outline-secondary btn-sm disabled rounded-pill px-3 opacity-50">
                    <i className="bi bi-arrow-left me-1"></i> First Tree
                  </span>
                )}
              </div>

              <div className="d-flex flex-wrap justify-content-center gap-1">
                {visiblePalms.map((p) => {
                  const isCurrent = p.code.toLowerCase() === palm.code.toLowerCase();
                  return (
                    <Link
                      key={p.code}
                      href={`/parent-palm/${p.code}`}
                      prefetch={false}
                      className={`btn btn-sm rounded-pill font-monospace extra-small px-2 py-1 ${
                        isCurrent
                          ? 'btn-success fw-bold shadow-sm'
                          : 'btn-outline-light opacity-75'
                      }`}
                      title={`${p.motherTreeCode || p.code} - ${p.name}`}
                    >
                      {p.motherTreeCode || p.code}
                    </Link>
                  );
                })}
              </div>

              <div>
                {nextPalm ? (
                  <Link
                    href={`/parent-palm/${nextPalm.code}`}
                    prefetch={false}
                    className="btn btn-success btn-sm d-inline-flex align-items-center gap-2 rounded-pill px-3 fw-semibold shadow-sm"
                  >
                    <span>Next: <strong className="font-monospace">{nextPalm.motherTreeCode || nextPalm.code}</strong></span>
                    <i className="bi bi-arrow-right"></i>
                  </Link>
                ) : (
                  <span className="btn btn-outline-secondary btn-sm disabled rounded-pill px-3 opacity-50">
                    Last Tree <i className="bi bi-arrow-right ms-1"></i>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <div className="row g-4 mb-5">
            <div className="col-md-5">
              <ImageCarousel 
                images={palm.images} 
                title={palm.name} 
                subtitle={`${palm.code} • Age: ${formatApproximateAge(palm.age)}`}
                carouselId="palmCarousel" 
                height="420px"
                showThumbnails={true}
                objectFit="cover"
                videoUrl={palm.youtubeVideoUrl}
                videoId={palm.youtubeVideoId}
                videoPosition={palm.youtubeVideoPosition || 1}
              />
            </div>

            <div className="col-md-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white">
                <h4 className="fw-bold text-dark mb-3"><i className="bi bi-shield-check me-2 text-success"></i> Mother Tree Profile</h4>
                
                <p className="text-secondary">{palm.description}</p>

                <div className="row g-3 mb-4">
                  <div className={palm.treeCount && palm.treeCount > 1 ? "col-6 col-md-3" : "col-4"}>
                    <div className="p-3 bg-light rounded-3 border h-100">
                      <small className="text-muted d-block text-uppercase">Tree / Group ID</small>
                      <strong className="text-dark fs-6 font-monospace">{palm.motherTreeCode || palm.code}</strong>
                    </div>
                  </div>
                  <div className={palm.treeCount && palm.treeCount > 1 ? "col-6 col-md-3" : "col-4"}>
                    <div className="p-3 bg-light rounded-3 border h-100">
                      <small className="text-muted d-block text-uppercase">Farm ID</small>
                      <strong className="text-success fs-6 font-monospace">{palm.farmCode}</strong>
                    </div>
                  </div>
                  <div className={palm.treeCount && palm.treeCount > 1 ? "col-6 col-md-3" : "col-4"}>
                    <div className="p-3 bg-light rounded-3 border h-100">
                      <small className="text-muted d-block text-uppercase">Approximate Age</small>
                      <strong className="text-dark fs-6">{formatApproximateAge(palm.age)}</strong>
                    </div>
                  </div>
                  {palm.treeCount && palm.treeCount > 1 && (
                    <div className="col-6 col-md-3">
                      <div className="p-3 bg-light rounded-3 border h-100">
                        <small className="text-muted d-block text-uppercase">Grove Size</small>
                        <strong className="text-success fs-6"><i className="bi bi-tree-fill me-1"></i>{palm.treeCount} Trees</strong>
                      </div>
                    </div>
                  )}
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

          {/* Mother Tree YouTube Video Showcase & Player */}
          {(() => {
            const videoId = palm.youtubeVideoId || extractYouTubeVideoId(palm.youtubeVideoUrl);
            if (!videoId) return null;
            return (
              <div className="card border-0 shadow-sm rounded-4 p-4 mb-5 bg-white border-top border-danger border-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                  <div>
                    <span className="badge bg-danger mb-1">
                      <i className="bi bi-youtube me-1"></i> MOTHER TREE VIDEO TOUR
                    </span>
                    <h4 className="fw-bold text-dark mb-0">Watch Mother Tree Video Showcase</h4>
                    <small className="text-secondary">Watch complete video footage of Mother Palm {palm.motherTreeCode || palm.code} (Farm ID: {palm.farmCode}).</small>
                  </div>
                  <a 
                    href={`https://www.youtube.com/watch?v=${videoId}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-outline-danger btn-sm fw-bold d-inline-flex align-items-center gap-1 shadow-sm"
                  >
                    <i className="bi bi-box-arrow-up-right"></i> Open on YouTube
                  </a>
                </div>

                <div className="ratio ratio-16x9 rounded-4 overflow-hidden shadow border" style={{ maxHeight: '520px' }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
                    title={`Video of Mother Tree ${palm.name}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            );
          })()}

          {/* Related Batches From This Tree */}
          <div className="mb-4">
            <h3 className="fw-bold text-dark mb-3"><i className="bi bi-box-seam me-2 text-success"></i> Related Batches Raised From This Mother Tree</h3>
            <div className="row g-4">
              {relatedBatches.map(b => (
                <div key={b.id} className="col-md-4">
                  <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-dark text-white font-monospace fw-bold px-2 py-1 shadow-sm border border-secondary">
                        Batch ID: {b.batchCode}
                      </span>
                      <div className="d-flex gap-1 align-items-center">
                        <span className="badge bg-success-subtle text-success border border-success extra-small">
                          {b.availableQuantity} available
                        </span>
                        <span className={`badge ${b.status === 'AVAILABLE' ? 'bg-success' : 'bg-warning text-dark'}`}>{b.status}</span>
                      </div>
                    </div>
                    <h5 className="fw-bold text-dark mb-1">{b.name}</h5>
                    <p className="text-muted small mb-2">Age: {b.age || '8–10 months'} | Height: {b.height || 'Approx. 2–3 ft'}</p>
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

          {/* Bottom Previous / Next Mother Tree Navigation */}
          {visiblePalms.length > 1 && (
            <div className="row g-3 mt-4 pt-3 border-top">
              <div className="col-6">
                {prevPalm ? (
                  <Link
                    href={`/parent-palm/${prevPalm.code}`}
                    className="card border-0 shadow-sm rounded-4 p-3 text-decoration-none hover-lift bg-white h-100 d-flex flex-row align-items-center gap-3"
                  >
                    <span className="btn btn-outline-success rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-arrow-left fs-5"></i>
                    </span>
                    <div className="overflow-hidden">
                      <small className="text-muted text-uppercase extra-small fw-bold d-block">Previous Mother Tree</small>
                      <div className="fw-bold text-dark text-truncate">{prevPalm.name}</div>
                      <span className="badge bg-dark font-monospace extra-small mt-1">{prevPalm.motherTreeCode || prevPalm.code}</span>
                    </div>
                  </Link>
                ) : (
                  <Link
                    href="/farm"
                    className="card border-0 shadow-sm rounded-4 p-3 text-decoration-none hover-lift bg-white h-100 d-flex flex-row align-items-center gap-3"
                  >
                    <span className="btn btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-grid fs-5"></i>
                    </span>
                    <div>
                      <small className="text-muted text-uppercase extra-small fw-bold d-block">Back to Registry</small>
                      <div className="fw-bold text-dark">View All Mother Trees</div>
                    </div>
                  </Link>
                )}
              </div>

              <div className="col-6">
                {nextPalm ? (
                  <Link
                    href={`/parent-palm/${nextPalm.code}`}
                    className="card border-0 shadow-sm rounded-4 p-3 text-decoration-none hover-lift bg-white h-100 d-flex flex-row-reverse align-items-center justify-content-start text-end gap-3"
                  >
                    <span className="btn btn-success rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-arrow-right fs-5"></i>
                    </span>
                    <div className="overflow-hidden">
                      <small className="text-success text-uppercase extra-small fw-bold d-block">Next Mother Tree</small>
                      <div className="fw-bold text-dark text-truncate">{nextPalm.name}</div>
                      <span className="badge bg-dark font-monospace extra-small mt-1">{nextPalm.motherTreeCode || nextPalm.code}</span>
                    </div>
                  </Link>
                ) : (
                  <Link
                    href="/farm"
                    className="card border-0 shadow-sm rounded-4 p-3 text-decoration-none hover-lift bg-white h-100 d-flex flex-row-reverse align-items-center justify-content-start text-end gap-3"
                  >
                    <span className="btn btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-grid fs-5"></i>
                    </span>
                    <div>
                      <small className="text-muted text-uppercase extra-small fw-bold d-block">All Mother Trees</small>
                      <div className="fw-bold text-dark">Browse Full Registry</div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
