import Link from 'next/link';
import { DataStore } from '@/lib/dataStore';
import LiveStockTerminal from '@/components/LiveStockTerminal';
import PlantingCalculator from '@/components/PlantingCalculator';

export const dynamic = 'force-dynamic';

export default function Home() {
  const batches = DataStore.getBatches();
  const currentBatch = DataStore.getOldestAvailableBatch();
  const motherPalms = DataStore.getParentPalms();
  const reviews = DataStore.getReviews();

  return (
    <>
      {/* 1. LUXURY HERO SECTION */}
      <section className="position-relative hero-ambient-mesh text-white py-5 overflow-hidden border-bottom border-success border-opacity-25">
        <div className="container position-relative py-5">
          <div className="row align-items-center justify-content-center text-center">
            <div className="col-lg-10">
              
              {/* Trust Badge */}
              <div className="d-inline-flex align-items-center gap-2 mb-3">
                <span className="badge-gi-pill d-inline-flex align-items-center gap-1 shadow-sm">
                  <i className="bi bi-patch-check-fill text-warning"></i> GOVERNMENT GI TAG REGISTERED
                </span>
                <span className="badge-farm-pill d-none d-sm-inline-flex align-items-center gap-1 shadow-sm">
                  <i className="bi bi-shield-lock-fill text-success"></i> 100% FARM-RAISED IN KANYAKUMARI
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="fw-extrabold mb-3 text-light tracking-tight" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.85rem)', lineHeight: 1.18 }}>
                <span className="d-block text-gradient-gold text-uppercase fw-extrabold mb-2" style={{ fontSize: 'clamp(0.95rem, 2.2vw, 1.35rem)', letterSpacing: '0.14em' }}>
                  <i className="bi bi-award-fill text-warning me-2"></i>
                  Mainland India’s Only GI-Tagged Coconut Variety
                </span>
                <span className="text-white">Authentic </span>
                <span className="text-gradient-emerald">Eathamozhi Tall</span>
                <span className="text-white"> Coconut Seedlings & Saplings</span>
              </h1>

              <p className="lead text-light opacity-90 mb-4 mx-auto" style={{ maxWidth: '820px', fontSize: '1.2rem' }}>
                Buy authentic GI-Tagged coconut seedlings and saplings directly from our family farm in Kanyakumari. 
                100% farm-grown with certified mother tree traceability, transparent live nursery batches, and secure pan-India delivery.
              </p>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
                <Link href="/batches" className="btn-emerald text-decoration-none px-4 py-3 fs-6">
                  <i className="bi bi-grid-fill"></i> View Live Batches ({batches.length} Available)
                </Link>
                <Link href="/farm" className="btn-glass text-decoration-none px-4 py-3 fs-6">
                  <i className="bi bi-tree"></i> Trace Our Mother Trees
                </Link>
                <a 
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_FARM_WHATSAPP || '919486880641'}?text=Hello%20Eathamozhi%20Farm,%20I%20want%20to%20inquire%20about%20coconut%20seedlings%20and%20saplings`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-success border-success text-success fw-semibold px-4 py-3 d-inline-flex align-items-center gap-2 rounded-3"
                >
                  <i className="bi bi-whatsapp"></i> Chat on WhatsApp
                </a>
              </div>

              {/* Stats Bar */}
              <div className="row g-3 justify-content-center pt-2">
                <div className="col-6 col-md-3">
                  <div className="glass-card-dark p-3 text-center hover-lift-subtle">
                    <span className="display-6 fw-bold text-gradient-gold d-block">80+</span>
                    <small className="text-light opacity-80 extra-small text-uppercase fw-semibold">Years Ancestral Grove</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="glass-card-dark p-3 text-center hover-lift-subtle">
                    <span className="display-6 fw-bold text-gradient-emerald d-block">100%</span>
                    <small className="text-light opacity-80 extra-small text-uppercase fw-semibold">Farm Grown Seedlings</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="glass-card-dark p-3 text-center hover-lift-subtle">
                    <span className="display-6 fw-bold text-light d-block">{motherPalms.length}+</span>
                    <small className="text-light opacity-80 extra-small text-uppercase fw-semibold">Verified Mother Trees</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="glass-card-dark p-3 text-center hover-lift-subtle">
                    <span className="display-6 fw-bold text-info d-block">100%</span>
                    <small className="text-light opacity-80 extra-small text-uppercase fw-semibold">Transparent Stock</small>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME LIVE STOCK TERMINAL CARD */}
      <LiveStockTerminal initialBatch={currentBatch} initialBatches={batches} />

      {/* 3. INTERACTIVE COCONUT GROVE PLANTING CALCULATOR */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container">
          <div className="text-center mb-4">
            <span className="badge-farm-pill mb-2">
              <i className="bi bi-compass-fill me-1"></i> GROVE PLANNING ENGINE
            </span>
            <h2 className="fw-bold text-dark">Plan Your Coconut Plantation</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '650px' }}>
              Estimate spacing, required sapling count, and total investment for your acreage in seconds.
            </p>
          </div>

          <PlantingCalculator />
        </div>
      </section>

      {/* 4. MOTHER PALM TRACEABILITY SECTION */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge-gi-pill mb-2">
              <i className="bi bi-tree-fill me-1"></i> MOTHER TREE REGISTRY
            </span>
            <h2 className="fw-bold text-dark">Verified Mother Trees (Pedigree Origin)</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '680px' }}>
              Every sapling is harvested directly from verified mother palms monitored for decades in our own grove.
              We never source from untraceable commercial intermediaries.
            </p>
          </div>

          <div className="row g-4">
            {motherPalms.length === 0 ? (
              <div className="col-12 text-center py-5">
                <i className="bi bi-tree text-muted fs-1 mb-2 d-block"></i>
                <p className="text-muted mb-0">Mother Trees are being documented in the farm registry.</p>
              </div>
            ) : (
              motherPalms.slice(0, 4).map(palm => (
                <div key={palm.id} className="col-md-6 col-lg-3">
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-lift bg-white">
                    <div className="position-relative" style={{ height: '200px' }}>
                      <img 
                        src={palm.images && palm.images.length > 0 ? palm.images[0] : '/images/placeholder.png'} 
                        alt={palm.name} 
                        className="w-100 h-100 object-fit-cover"
                      />
                      <div className="position-absolute top-0 start-0 m-2">
                        <span className="badge bg-dark bg-opacity-75">{palm.code}</span>
                      </div>
                      <div className="position-absolute top-0 end-0 m-2">
                        <span className="badge bg-warning text-dark fw-bold">{palm.age} Yrs</span>
                      </div>
                    </div>

                    <div className="card-body p-3 d-flex flex-column justify-content-between">
                      <div>
                        <h6 className="fw-bold text-dark mb-1">{palm.name}</h6>
                        <small className="text-muted d-block mb-2">
                          <i className="bi bi-geo-alt-fill text-danger me-1"></i> {palm.location}
                        </small>
                        <div className="d-flex gap-1 mb-2 flex-wrap">
                          <span className="badge bg-success-subtle text-success border border-success extra-small">{palm.healthStatus.split(' ')[0]}</span>
                        </div>
                        <p className="extra-small text-secondary mb-1" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {palm.yieldHistory}
                        </p>
                        <p className="extra-small text-primary mb-2" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          <i className="bi bi-droplet-half me-1"></i>{palm.nutCharacteristics}
                        </p>
                      </div>

                      <Link 
                        href={`/parent-palm/${palm.code}`} 
                        className="btn btn-outline-success btn-sm w-100 fw-semibold rounded-3"
                      >
                        Inspect Full Profile <i className="bi bi-arrow-right ms-1"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {motherPalms.length > 0 && (
            <div className="text-center mt-4">
              <Link href="/farm" className="btn btn-outline-dark px-4 py-2 rounded-3 fw-semibold">
                Explore All {motherPalms.length} Verified Mother Trees <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 5. WHY EATHAMOZHI TALL? (GI BENEFITS) */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container py-3">
          <div className="text-center mb-5">
            <span className="badge-gi-pill mb-2">PROVEN PERFORMANCE</span>
            <h2 className="fw-bold text-dark">Why Farmers Choose Eathamozhi Tall</h2>
            <p className="text-muted">Unique agronomic traits of mainland India's only GI-Tagged coconut</p>
          </div>

          <div className="row g-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm text-center p-4 h-100 rounded-4 hover-lift">
                <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '64px', height: '64px' }}>
                  <i className="bi bi-shield-shaded fs-2"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">High Drought Resilience</h5>
                <p className="text-secondary small mb-0">Deep vertical taproot system adapted to fluctuating coastal water tables and prolonged dry seasons.</p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm text-center p-4 h-100 rounded-4 hover-lift">
                <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '64px', height: '64px' }}>
                  <i className="bi bi-droplet-half fs-2 text-warning"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Superior Copra & Oil</h5>
                <p className="text-secondary small mb-0">Yields 170g+ copra per nut with an oil content exceeding 68%, commanding premium market prices.</p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm text-center p-4 h-100 rounded-4 hover-lift">
                <div className="bg-info bg-opacity-10 text-info rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '64px', height: '64px' }}>
                  <i className="bi bi-wind fs-2 text-info"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Wind & Storm Stability</h5>
                <p className="text-secondary small mb-0">Thick trunk bole base circumference protects against coastal cyclone winds and root uprooting.</p>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm text-center p-4 h-100 rounded-4 hover-lift">
                <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '64px', height: '64px' }}>
                  <i className="bi bi-award-fill fs-2 text-success"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">GI Authenticity Certificate</h5>
                <p className="text-secondary small mb-0">Every consignment is accompanied by our farm provenance verification seal.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. VERIFIED FARMER REVIEWS */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge-farm-pill mb-2">FARMER TESTIMONIALS</span>
            <h2 className="fw-bold text-dark">Trusted by Farmers Across South India</h2>
            <p className="text-muted">Real feedback from plantation owners who planted our Eathamozhi batches</p>
          </div>

          <div className="row g-4">
            {reviews.length === 0 ? (
              <div className="col-12 text-center py-4 text-muted">
                <i className="bi bi-chat-heart text-muted fs-2 mb-2 d-block"></i>
                <p className="mb-0">Verified farmer reviews will be posted as plantation consignments are harvested.</p>
              </div>
            ) : (
              reviews.map(rev => (
                <div key={rev.id} className="col-md-6">
                  <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white hover-lift">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="fw-bold text-dark mb-0">{rev.customerName}</h5>
                        <small className="text-muted"><i className="bi bi-geo-alt me-1"></i> {rev.location}</small>
                      </div>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                        <i className="bi bi-check-circle-fill me-1"></i> Verified Buyer ({rev.quantity} Saplings)
                      </span>
                    </div>

                    <div className="text-warning mb-3">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <i key={i} className="bi bi-star-fill me-1"></i>
                      ))}
                    </div>

                    <p className="text-secondary small fst-italic mb-3">
                      "{rev.comment}"
                    </p>

                    <div className="d-flex justify-content-between align-items-center border-top pt-2 text-muted extra-small">
                      <span>Batch: <strong className="text-dark">{rev.batchCode}</strong></span>
                      <span>Planted: {rev.date}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 7. CALL TO ACTION BANNER */}
      <section className="py-5 bg-dark text-white text-center position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)' }}>
        <div className="container py-4 position-relative z-1">
          <span className="badge-gi-pill mb-3 d-inline-block">LIMITED SEASONAL HARVEST</span>
          <h2 className="display-5 fw-bold mb-3">Ready to Plant an Authentic Eathamozhi Grove?</h2>
          <p className="lead opacity-90 mx-auto mb-4" style={{ maxWidth: '650px' }}>
            Pre-book your required saplings directly from upcoming verified batches or request custom crate logistics.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <Link href="/batches" className="btn-gold px-4 py-3 fs-6 text-decoration-none">
              <i className="bi bi-bag-check-fill"></i> View Available Batches Now
            </Link>
            <a 
              href={`https://wa.me/${process.env.NEXT_PUBLIC_FARM_WHATSAPP || '919486880641'}?text=Hello,%20I%20want%20to%20place%20an%20order%20for%20Eathamozhi%20coconut%20seedlings%20and%20saplings`}
              target="_blank" 
              rel="noreferrer"
              className="btn btn-outline-light px-4 py-3 fs-6 rounded-3 fw-bold"
            >
              <i className="bi bi-whatsapp me-1 text-success"></i> Speak with Farm Manager
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
