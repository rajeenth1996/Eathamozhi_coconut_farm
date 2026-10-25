import Link from 'next/link';
import { DataStore } from '@/lib/dataStore';
import ImageCarousel from '@/components/ImageCarousel';

export const dynamic = 'force-dynamic';

export default async function MotherTreesPage() {
  const palms = await DataStore.getParentPalmsAsync();
  const batches = await DataStore.getBatchesAsync();

  const getActiveBatchesForPalm = (palmCode: string) => {
    return batches.filter(b => {
      const codes = (b.parentPalmCodes && b.parentPalmCodes.length > 0) ? b.parentPalmCodes : [b.parentPalmCode];
      return codes.includes(palmCode) && (b.availableQuantity || 0) > 0;
    });
  };

  const getHealthBadgeColor = (status: string) => {
    if (!status) return 'info';
    const s = status.toLowerCase();
    if (s.includes('excellent') || s.includes('vigorous') || s.includes('prime') || s.includes('robust') || s.includes('resilient')) return 'success';
    if (s.includes('peak')) return 'warning';
    return 'info';
  };

  return (
    <>
      {/* Hero */}
      <section className="hero-ambient-mesh text-white py-5 position-relative overflow-hidden border-bottom border-success border-opacity-25">
        <div className="container position-relative py-4">
          <div className="text-center">
            <span className="badge-gi-pill mb-3 d-inline-block">
              <i className="bi bi-shield-check me-1"></i> VERIFIED GENETIC LINEAGE
            </span>
            <h1 className="display-4 fw-bold mb-3">
              <span className="text-gradient-gold">Mother Trees</span> &mdash; Origin of Every Sapling
            </h1>
            <p className="lead text-light opacity-90 mx-auto mb-4" style={{ maxWidth: '700px' }}>
              Every sapling we sell is directly traceable to one of our{' '}
              <strong className="text-white">{palms.length > 0 ? palms.length : '30+'} verified ancestral mother trees</strong>.{' '}
              Inspect each tree&apos;s pedigree, yield history, nut characteristics, and available sapling batches.
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <div className="glass-card-dark px-4 py-2 d-inline-flex align-items-center gap-2">
                <i className="bi bi-tree-fill text-success fs-4"></i>
                <div>
                  <span className="fw-bold text-white d-block">{palms.length} Registered Trees</span>
                  <small className="text-light opacity-75">In Our Heritage Grove</small>
                </div>
              </div>
              <div className="glass-card-dark px-4 py-2 d-inline-flex align-items-center gap-2">
                <i className="bi bi-calendar-check-fill text-warning fs-4"></i>
                <div>
                  <span className="fw-bold text-white d-block">40+ Years</span>
                  <small className="text-light opacity-75">Of Yield Records</small>
                </div>
              </div>
              <div className="glass-card-dark px-4 py-2 d-inline-flex align-items-center gap-2">
                <i className="bi bi-patch-check-fill text-info fs-4"></i>
                <div>
                  <span className="fw-bold text-white d-block">100%</span>
                  <small className="text-light opacity-75">Farm Grown Seedlings</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Is a Mother Tree — Explainer */}
      <section className="py-4 bg-white border-bottom">
        <div className="container">
          <div className="row g-3 align-items-center justify-content-center">
            <div className="col-md-1 text-center">
              <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                <i className="bi bi-diagram-3-fill fs-3"></i>
              </div>
            </div>
            <div className="col-md-8">
              <h5 className="fw-bold text-dark mb-1">What Makes a Tree a &ldquo;Mother Tree&rdquo;?</h5>
              <p className="text-secondary mb-0 small">
                A Mother Tree is a decades-old coconut palm selected and registered based on exceptional yield history,
                superior nut quality (high copra content, sweet water), pest resistance, and genetic stability. Only seednuts from these registered trees are used
                to raise our certified sapling batches &mdash; ensuring every sapling you receive carries proven, traceable genetics.
              </p>
            </div>
            <div className="col-md-2 text-center">
              <Link href="/batches" className="btn-emerald text-decoration-none px-3 py-2 small">
                <i className="bi bi-bag-check-fill me-1"></i> Book Saplings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* All Mother Trees Grid */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge-farm-pill mb-2">ALL REGISTERED MOTHER PALMS</span>
            <h2 className="fw-bold text-dark">Complete Mother Tree Registry</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '650px' }}>
              Click on any tree to view its full pedigree profile, nut characteristics, yield data, and available sapling batches.
            </p>
          </div>

          <div className="row g-4">
            {palms.length === 0 ? (
              <div className="col-12 text-center py-5">
                <i className="bi bi-tree text-muted fs-1 mb-2 d-block"></i>
                <h5 className="text-muted fw-bold">No Mother Trees Registered Yet</h5>
                <p className="text-secondary small mb-0">Ancestral mother palms will appear here once added by the farm administrator.</p>
              </div>
            ) : (
              palms.map((palm) => {
                const activeBatches = getActiveBatchesForPalm(palm.code);
                const totalAvailable = activeBatches.reduce((s, b) => s + (b.availableQuantity || 0), 0);
                const healthColor = getHealthBadgeColor(palm.healthStatus);

                return (
                  <div key={palm.id} className="col-md-6 col-lg-4">
                    <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-lift bg-white">

                      {/* Image */}
                      <div className="position-relative" style={{ height: '220px' }}>
                        {palm.images && palm.images.length > 1 ? (
                          <ImageCarousel
                            images={palm.images}
                            title={palm.name}
                            carouselId={`palm-card-${palm.code}`}
                            height="220px"
                            showThumbnails={false}
                            objectFit="cover"
                          />
                        ) : (
                          <img
                            src={palm.images && palm.images.length > 0 ? palm.images[0] : '/images/placeholder.png'}
                            alt={palm.name}
                            className="w-100 h-100 object-fit-cover"
                          />
                        )}

                        {/* Overlays */}
                        <div className="position-absolute top-0 start-0 m-2 d-flex gap-1 flex-wrap">
                          <span className="badge bg-dark bg-opacity-80 fw-bold">{palm.code}</span>
                          <span className="badge bg-warning text-dark fw-bold">{palm.age} Yrs Old</span>
                        </div>
                        <div className="position-absolute top-0 end-0 m-2">
                          <span className={`badge bg-${healthColor}`}>
                            <i className="bi bi-heart-pulse-fill me-1"></i>{palm.healthStatus.split(' ')[0]}
                          </span>
                        </div>
                        {totalAvailable > 0 && (
                          <div className="position-absolute bottom-0 start-0 m-2">
                            <span className="badge bg-success bg-opacity-90 fw-bold">
                              <i className="bi bi-check-circle-fill me-1"></i>{totalAvailable} Saplings Available
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Body */}
                      <div className="card-body p-4 d-flex flex-column">
                        <h6 className="fw-bold text-dark mb-1 fs-5">{palm.name}</h6>
                        <small className="text-muted d-flex align-items-center gap-1 mb-3">
                          <i className="bi bi-geo-alt-fill text-danger"></i> {palm.location}
                        </small>

                        {/* Key Stats Row */}
                        <div className="row g-2 mb-3">
                          <div className="col-6">
                            <div className="bg-light rounded-3 p-2 text-center">
                              <small className="text-muted d-block extra-small text-uppercase fw-bold">Age</small>
                              <span className="fw-bold text-dark">{palm.age} Years</span>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="bg-light rounded-3 p-2 text-center">
                              <small className="text-muted d-block extra-small text-uppercase fw-bold">Active Batches</small>
                              <span className={`fw-bold ${activeBatches.length > 0 ? 'text-success' : 'text-muted'}`}>
                                {activeBatches.length > 0 ? activeBatches.length : 'None'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Yield History */}
                        <div className="mb-3">
                          <small className="fw-bold text-success d-block mb-1">
                            <i className="bi bi-graph-up-arrow me-1"></i>Yield History
                          </small>
                          <p className="text-secondary extra-small mb-0" style={{ lineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{palm.yieldHistory}</p>
                        </div>

                        {/* Nut Characteristics */}
                        <div className="mb-3">
                          <small className="fw-bold text-primary d-block mb-1">
                            <i className="bi bi-droplet-half me-1"></i>Nut Profile
                          </small>
                          <p className="text-secondary extra-small mb-0" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{palm.nutCharacteristics}</p>
                        </div>

                        {/* Why Selected */}
                        <div className="mb-3">
                          <small className="fw-bold text-warning d-block mb-1">
                            <i className="bi bi-award-fill me-1"></i>Why Selected
                          </small>
                          <p className="text-secondary extra-small mb-0" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{palm.whySelected}</p>
                        </div>

                        <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                          {totalAvailable > 0 ? (
                            <span className="badge bg-success-subtle text-success border border-success extra-small">
                              <i className="bi bi-check2-circle me-1"></i>{totalAvailable} available
                            </span>
                          ) : (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary extra-small">No stock now</span>
                          )}
                          <Link
                            href={`/parent-palm/${palm.code}`}
                            className="btn btn-outline-success btn-sm fw-semibold rounded-3"
                          >
                            Full Profile <i className="bi bi-arrow-right ms-1"></i>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Heritage Story (condensed) */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container" style={{ maxWidth: '900px' }}>
          <div className="text-center mb-5">
            <span className="badge-gi-pill mb-2">OUR HERITAGE</span>
            <h2 className="fw-bold text-dark">The Eathamozhi Farm Journey</h2>
            <p className="text-muted">Over 80 years of generational coconut cultivation on Kanyakumari&apos;s coastal soil</p>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="text-center p-4 rounded-4 border bg-light hover-lift">
                <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '56px', height: '56px' }}>
                  <i className="bi bi-calendar3 fs-3"></i>
                </div>
                <h5 className="fw-bold text-dark">Est. 1940s</h5>
                <p className="text-secondary small mb-0">Our ancestral grove was planted in Eathamozhi village &mdash; a coastal microclimate naturally suited to tall coconut cultivars.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center p-4 rounded-4 border bg-light hover-lift">
                <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '56px', height: '56px' }}>
                  <i className="bi bi-eye fs-3"></i>
                </div>
                <h5 className="fw-bold text-dark">40+ Yrs Monitoring</h5>
                <p className="text-secondary small mb-0">Our elders systematically recorded and marked the highest-yielding palms. Only the best were registered as mother trees.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center p-4 rounded-4 border bg-light hover-lift">
                <div className="bg-info bg-opacity-10 text-info rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '56px', height: '56px' }}>
                  <i className="bi bi-shield-check fs-3"></i>
                </div>
                <h5 className="fw-bold text-dark">100% Traceable</h5>
                <p className="text-secondary small mb-0">Unlike commercial middlemen, every sapling we raise is directly from our registered mother trees &mdash; visible to every buyer.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-5 text-white text-center" style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)' }}>
        <div className="container py-3">
          <span className="badge-farm-pill mb-3 d-inline-block">BOOK TRACEABLE SAPLINGS</span>
          <h2 className="display-5 fw-bold mb-3">Every Sapling Has a Story. Read Yours.</h2>
          <p className="lead opacity-90 mx-auto mb-4" style={{ maxWidth: '600px' }}>
            Select a batch from any of our registered mother trees. Inspect the pedigree, then book with complete confidence.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <Link href="/batches" className="btn-gold px-4 py-3 fs-6 text-decoration-none">
              <i className="bi bi-grid-fill me-1"></i> View All Available Batches
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_FARM_WHATSAPP || '919486880641'}?text=Hello%20Eathamozhi%20Farm,%20I%20want%20to%20know%20more%20about%20your%20Mother%20Trees`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline-light px-4 py-3 fs-6 rounded-3 fw-bold"
            >
              <i className="bi bi-whatsapp me-1 text-success"></i> Ask About Trees
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
