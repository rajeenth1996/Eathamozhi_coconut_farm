import Link from 'next/link';

export default function AboutEathamozhyPage() {
  return (
    <>
      <section className="hero-ambient-mesh text-white py-5 position-relative overflow-hidden border-bottom border-success border-opacity-25">
        <div className="container position-relative py-4">
          <span className="badge bg-warning text-dark px-3 py-2 rounded-pill mb-2 fw-bold">CULTIVAR HERITAGE</span>
          <h1 className="display-4 fw-bold">What is Eathamozhy Coconut?</h1>
          <p className="lead mx-auto" style={{ maxWidth: '750px' }}>
            A comprehensive educational overview of the traditional Eathamozhy coconut cultivar, its nut characteristics, and cultivation practices.
          </p>
        </div>
      </section>

      <section className="py-5 bg-white">
        <div className="container" style={{ maxWidth: '960px' }}>
          
          {/* Important UX Rule Notice */}
          <div className="alert alert-info border-info-subtle shadow-sm rounded-4 p-4 mb-5">
            <h5 className="fw-bold alert-heading"><i className="bi bi-info-circle-fill me-2"></i> Our Transparency Commitment</h5>
            <p className="mb-0 small text-secondary">
              We carefully distinguish between <strong>officially documented agricultural data</strong> and our <strong>own 40+ years of farm observation experience</strong> on our land in Kanyakumari.
            </p>
          </div>

          <div className="row g-4 mb-5">
            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm p-4 rounded-4 bg-light">
                <h4 className="fw-bold text-success mb-3"><i className="bi bi-journal-text me-2"></i> Documented Characteristics</h4>
                <ul className="list-unstyled text-secondary">
                  <li className="mb-3">
                    <strong>Growth Habit:</strong> Tall cultivar with heavy canopy, broad trunk collar, and high wind resistance.
                  </li>
                  <li className="mb-3">
                    <strong>Bearing Time:</strong> Begins initial flowering within 5 to 6 years of field planting.
                  </li>
                  <li className="mb-3">
                    <strong>Copra & Oil:</strong> High copra weight with superior oil content around 66–68%.
                  </li>
                  <li className="mb-3">
                    <strong>Nut Color:</strong> Distinct green to yellowish-brown husk with thick fibrous outer layer protecting seednuts during storage.
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm p-4 rounded-4 bg-light border-start border-success border-4">
                <h4 className="fw-bold text-dark mb-3"><i className="bi bi-eye-fill me-2 text-warning"></i> Based On Our Farm Experience</h4>
                <ul className="list-unstyled text-secondary">
                  <li className="mb-3">
                    <em>"In our farm soil, mother palms given organic neem-cake & wood-ash compost consistently deliver exceptional year-round yields."</em>
                  </li>
                  <li className="mb-3">
                    <em>"We observe seednuts harvested between December and March achieve over 92% farm germination rate within 120 days."</em>
                  </li>
                  <li className="mb-3">
                    <em>"Coastal salt breezes enhance tender water sweetness (averaging 350ml sweet water per nut)."</em>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Seedling Selection Guide */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-5 bg-success text-white">
            <h3 className="fw-bold mb-3"><i className="bi bi-check2-circle me-2"></i> How We Select Seednuts & Saplings</h3>
            <p className="mb-4">
              Not every nut becomes a sapling. Our strict 4-point farm inspection filter:
            </p>
            <div className="row g-3">
              <div className="col-md-3 col-6">
                <div className="bg-white text-dark p-3 rounded-3 text-center h-100">
                  <h6 className="fw-bold text-success">1. Age Filter</h6>
                  <small className="text-muted">Mother palm must be 50+ years old with recorded high yield history.</small>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="bg-white text-dark p-3 rounded-3 text-center h-100">
                  <h6 className="fw-bold text-success">2. Harvest Season</h6>
                  <small className="text-muted">Harvested only when fully mature (12-month old nuts) during peak season.</small>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="bg-white text-dark p-3 rounded-3 text-center h-100">
                  <h6 className="fw-bold text-success">3. Vigor Testing</h6>
                  <small className="text-muted">Early germinating sprouts rejected if collars show thin trunk girth.</small>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="bg-white text-dark p-3 rounded-3 text-center h-100">
                  <h6 className="fw-bold text-success">4. Health Check</h6>
                  <small className="text-muted">Roots & fronds inspected for pest resistance before batch delivery.</small>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/batches" className="btn btn-success btn-lg fw-bold px-4">
              Explore Live Eathamozhy Batches <i className="bi bi-arrow-right me-1"></i>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
