import { DataStore } from '@/lib/dataStore';
import BatchesClientList from '@/components/BatchesClientList';
import { Trans } from '@/context/LanguageContext';

export const dynamic = 'force-dynamic';

export default async function BatchesPage() {
  const allBatches = await DataStore.getBatchesAsync();
  const batches = allBatches.filter(b => b.isVisible !== false);

  return (
    <>
      {/* Header Banner */}
      <section className="hero-ambient-mesh text-white py-5 text-center position-relative overflow-hidden border-bottom border-success border-opacity-25">
        <div className="container position-relative py-3">
          <span className="badge-gi-pill mb-2 d-inline-block">
            <i className="bi bi-shield-check me-1"></i> <Trans en="TRANSPARENT LIVE INVENTORY" ta="வெளிப்படையான நேரடி இருப்பு" />
          </span>
          <h1 className="display-4 fw-extrabold text-light mb-2">
            <Trans en="Available Sapling Batches" ta="கிடைக்கும் தென்னங்கன்றுகள் தொகுப்பு" />
          </h1>
          <p className="lead text-light opacity-90 mx-auto" style={{ maxWidth: '680px' }}>
            <Trans 
              en="Real-time batch stock numbers, exact sapling age, average height, and verified mother tree pedigree origin." 
              ta="நேரடி பண்ணை இருப்பு நிலவரம், துல்லியமான கன்றின் வயது, சராசரி உயரம் மற்றும் சான்றளிக்கப்பட்ட தாய் மர பாரம்பரிய விவரங்கள்." 
            />
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
