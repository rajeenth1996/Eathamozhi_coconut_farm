import { DataStore } from '@/lib/dataStore';
import BatchesClientList from '@/components/BatchesClientList';

export const dynamic = 'force-dynamic';

export default async function BatchesPage() {
  const batches = await DataStore.getBatchesAsync();

  return (
    <>
      {/* Header Banner */}
      <section className="hero-ambient-mesh text-white py-5 text-center position-relative overflow-hidden border-bottom border-success border-opacity-25">
        <div className="container position-relative py-3">
          <span className="badge-gi-pill mb-2 d-inline-block">
            <i className="bi bi-shield-check me-1"></i> TRANSPARENT LIVE INVENTORY
          </span>
          <h1 className="display-4 fw-extrabold text-light mb-2">Available Sapling Batches</h1>
          <p className="lead text-light opacity-90 mx-auto" style={{ maxWidth: '680px' }}>
            Real-time batch stock numbers, exact sapling age, average height, and verified mother tree pedigree origin.
          </p>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <BatchesClientList initialBatches={batches} />
        </div>
      </section>
    </>
  );
}
