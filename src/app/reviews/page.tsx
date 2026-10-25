import Link from 'next/link';
import { DataStore } from '@/lib/dataStore';

export const dynamic = 'force-dynamic';

export default function ReviewsPage() {
  const reviews = DataStore.getReviews();

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1)
    : '5.0';
  const verifiedCount = reviews.filter(r => r.verified).length;
  const totalSaplingsPlanted = reviews.reduce((acc, r) => acc + (r.quantity || 0), 0);

  return (
    <>
      {/* Hero Section */}
      <section className="hero-ambient-mesh text-white py-5 position-relative overflow-hidden border-bottom border-success border-opacity-25">
        <div className="container position-relative py-4 text-center">
          <span className="badge-gi-pill mb-3 d-inline-block">
            <i className="bi bi-patch-check-fill text-warning me-1"></i> VERIFIED FARMER TESTIMONIALS
          </span>
          <h1 className="display-4 fw-bold mb-3">
            Real Experiences from <span className="text-gradient-gold">South Indian Farmers</span>
          </h1>
          <p className="lead mx-auto text-light opacity-90 mb-4" style={{ maxWidth: '700px' }}>
            Verified feedback from plantation growers, agro-forestry developers, and family farmers who cultivate authentic Eathamozhi GI-tagged coconut palms.
          </p>

          {/* Social Proof Stats Pills */}
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <div className="glass-card-dark px-4 py-2 d-inline-flex align-items-center gap-2">
              <div className="text-warning fs-3">
                <i className="bi bi-star-fill"></i>
              </div>
              <div className="text-start">
                <span className="fw-bold text-white fs-5 d-block">{avgRating} / 5.0</span>
                <small className="text-light opacity-75">Average Rating</small>
              </div>
            </div>

            <div className="glass-card-dark px-4 py-2 d-inline-flex align-items-center gap-2">
              <div className="text-success fs-3">
                <i className="bi bi-patch-check-fill"></i>
              </div>
              <div className="text-start">
                <span className="fw-bold text-white fs-5 d-block">{verifiedCount} Verified</span>
                <small className="text-light opacity-75">Agricultural Buyers</small>
              </div>
            </div>

            <div className="glass-card-dark px-4 py-2 d-inline-flex align-items-center gap-2">
              <div className="text-info fs-3">
                <i className="bi bi-tree-fill"></i>
              </div>
              <div className="text-start">
                <span className="fw-bold text-white fs-5 d-block">{totalSaplingsPlanted.toLocaleString()}+</span>
                <small className="text-light opacity-75">Saplings Planted</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Grid */}
      <section className="py-5 bg-light min-vh-50">
        <div className="container" style={{ maxWidth: '1000px' }}>
          
          <div className="text-center mb-5">
            <span className="badge-farm-pill mb-2">FIELD EXPERIENCE STORIES</span>
            <h2 className="fw-bold text-dark">What Farmers Say After Planting</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
              Every testimonial is logged with its specific batch code, purchase quantity, and plantation location.
            </p>
          </div>

          <div className="row g-4">
            {reviews.map(r => (
              <div key={r.id} className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white hover-lift d-flex flex-column justify-content-between">
                  <div>
                    {/* Header: Farmer Name & Badge */}
                    <div className="d-flex justify-content-between align-items-start mb-3 gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <div 
                          className="rounded-circle bg-success bg-opacity-10 text-success fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width: '42px', height: '42px', fontSize: '1rem' }}
                        >
                          {r.customerName ? r.customerName.charAt(0).toUpperCase() : 'F'}
                        </div>
                        <div>
                          <h5 className="fw-bold text-dark mb-0">{r.customerName}</h5>
                          <small className="text-muted d-block">
                            <i className="bi bi-geo-alt-fill text-danger me-1"></i> {r.location}
                          </small>
                        </div>
                      </div>
                      {r.verified && (
                        <span className="badge bg-success-subtle text-success border border-success extra-small flex-shrink-0">
                          <i className="bi bi-patch-check-fill me-1"></i> Verified Buyer
                        </span>
                      )}
                    </div>

                    {/* Star Rating */}
                    <div className="mb-3 text-warning d-flex align-items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <i
                          key={i}
                          className={`bi ${i < (r.rating || 5) ? 'bi-star-fill text-warning' : 'bi-star text-muted opacity-50'}`}
                        ></i>
                      ))}
                      <span className="text-dark fw-bold ms-2 small">
                        {r.rating || 5}.0
                      </span>
                    </div>

                    {/* Review Comment */}
                    <p className="card-text text-secondary mb-3 fst-italic" style={{ whiteSpace: 'pre-line' }}>
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  </div>

                  {/* Footer Meta */}
                  <div className="pt-3 border-top d-flex justify-content-between align-items-center text-muted extra-small">
                    <div>
                      <span>Batch: </span>
                      <Link 
                        href={`/batches/${r.batchCode}`} 
                        className="text-success fw-bold text-decoration-none hover-underline"
                        title="View Batch Details"
                      >
                        {r.batchCode} <i className="bi bi-arrow-up-right-square"></i>
                      </Link>
                    </div>
                    <div>
                      <span>Planted: <strong>{r.quantity} Saplings</strong></span>
                      {r.date && (
                        <span className="ms-2 text-secondary opacity-75">({r.date})</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Box */}
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center mt-5 bg-white border-top border-success border-4">
            <h4 className="fw-bold text-dark mb-2">Want to Experience Authentic Eathamozhi Genetics?</h4>
            <p className="text-secondary small mx-auto mb-4" style={{ maxWidth: '600px' }}>
              Select a batch directly from our coastal grove in Kanyakumari. Every seedling is 100% farm-raised with verified ancestral lineage.
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <Link href="/batches" className="btn-emerald text-decoration-none px-4 py-3 fw-bold">
                <i className="bi bi-grid-fill me-2"></i> Inspect Available Batches
              </Link>
              <a
                href="https://wa.me/919486880641?text=Hello%20Eathamozhi%20Farm,%20I%20read%20farmer%20reviews%20and%20want%20to%20order%20saplings"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-success px-4 py-3 fw-bold rounded-3"
              >
                <i className="bi bi-whatsapp me-2 text-success"></i> WhatsApp Helpline
              </a>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
