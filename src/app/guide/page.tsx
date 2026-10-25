'use client';

import { useState } from 'react';
import PatternVisualizer from '@/components/PatternVisualizer';

const articles = [
  {
    title: 'How to Plant a Coconut Sapling',
    category: 'Planting',
    summary: 'Recommended spacing (25ft × 25ft), pit preparation (3ft × 3ft × 3ft), organic manure mixture, and correct planting depth to prevent trunk rot.',
    date: 'Sep 2026',
    readTime: '4 min read',
    icon: 'bi-flower1',
    content: [
      {
        heading: '📍 Step 1 – Choosing the Right Location',
        body: 'Select a well-drained, open plot with full sunlight (minimum 8 hours/day). Avoid low-lying waterlogged areas. Eathamozhi coconuts grow best in coastal sandy loam or laterite soils. Ensure no large trees or structures block the eastern morning sun.'
      },
      {
        heading: '📐 Step 2 – Spacing & Layout',
        body: 'The recommended spacing is 25 ft × 25 ft in a square pattern, fitting approximately 70 palms per acre. For triangular (quincunx) layout, use 25 ft between plants in staggered rows — this increases density by ~8% and improves canopy light distribution. Mark all pits using rope and pegs before digging.'
      },
      {
        heading: '🕳️ Step 3 – Pit Preparation',
        body: 'Dig pits of 3 ft × 3 ft × 3 ft. Leave dug soil exposed to sunlight for 10–15 days to kill soil-borne pathogens. Fill pit with: ½ topsoil + ½ mix of farmyard manure (10 kg), cocopeat (5 kg), neem cake (1 kg), and a pinch of borax and zinc sulphate. The pit should be slightly elevated after filling to account for settling.'
      },
      {
        heading: '🌱 Step 4 – Planting the Sapling',
        body: 'Plant the sapling such that the collar (the base bulge just above roots) is exactly at ground level — never buried below soil. Bury the root ball in the centre, press firmly, and water immediately. Avoid tilting the sapling. Install a bamboo stake for support in windy coastal regions. Place a layer of dry coir pith mulch around the base (6-inch radius) to retain soil moisture.'
      },
      {
        heading: '⚠️ Common Mistakes to Avoid',
        body: '• Planting too deep (collar buried) → causes stem rot\n• Planting in waterlogged pits → root suffocation\n• Skipping mulching → rapid moisture loss in summer\n• Not staking in high-wind areas → frond damage and root loosening'
      },
      {
        heading: '✅ Post-Planting Checklist',
        body: '• Water immediately after planting (10–15 litres)\n• Re-water every 3 days for the first month\n• Check sapling is upright after 7 days\n• Apply antifungal drench (Trichoderma viride) at 15 days\n• Mark the planting date on a post for tracking'
      }
    ]
  },
  {
    title: 'First Year Care & Irrigation Management',
    category: 'Early Growth',
    summary: 'Essential watering schedule for young saplings, coir-pith mulching for soil moisture retention, and protecting fronds from intense summer sun.',
    date: 'Aug 2026',
    readTime: '5 min read',
    icon: 'bi-droplet-half',
    content: [
      {
        heading: '💧 Irrigation Schedule – Month by Month',
        body: '• Month 1–3: Water every 3 days (15 litres per sapling)\n• Month 4–6: Water every 5 days (20 litres)\n• Month 7–12: Water once a week (25–30 litres)\n\nDrip irrigation is highly recommended — set emitters at 2 litres/hour placed 30 cm from the collar. Avoid direct water spray on the crown.'
      },
      {
        heading: '🌿 Mulching for Moisture Retention',
        body: 'Apply a 4–6 inch thick ring of dry coir pith, paddy husk, or dry leaves around each sapling (not touching the stem). This reduces evaporation by 40%, suppresses weeds, and adds organic matter as it decomposes. Replenish mulch every 3 months.'
      },
      {
        heading: '☀️ Sun Protection in Summer',
        body: 'During peak summer (March–June), fronds of young saplings can scorch. Use palm leaf mats or dried coconut fronds to create a partial shade canopy (50% shade) on the south and west sides for the first 6 months. Remove shade once the frond spread exceeds 3 ft.'
      },
      {
        heading: '🪴 Crown Inspection & Frond Health',
        body: 'Healthy saplings in year 1 should produce 2–3 new fronds per month. Check monthly:\n• Young fronds should be upright and light green\n• Yellow tips = nitrogen or water stress\n• Brown tip edges = potassium deficiency\n• Twisted fronds = root binding or transplant shock (usually self-corrects in 6 weeks)'
      },
      {
        heading: '🔄 Weed Management',
        body: 'Keep a 3-ft weed-free zone around each sapling. Manual weeding is preferred in year 1 to avoid herbicide damage to shallow roots. After 6 months, light mechanical cultivation with a hand hoe is sufficient.'
      }
    ]
  },
  {
    title: 'Organic Fertilizer & Micronutrient Schedule',
    category: 'Nutrition',
    summary: 'Application of farmyard manure, neem cake, wood ash, and borax micronutrient sprays to boost crown growth and early flowering vigor.',
    date: 'Jul 2026',
    readTime: '6 min read',
    icon: 'bi-bag-heart',
    content: [
      {
        heading: '📅 Annual Fertilizer Calendar',
        body: 'Apply fertilizers in two split doses:\n\n🌧️ Pre-monsoon (May–June):\n• Farmyard manure: 25 kg\n• Neem cake: 2 kg\n• Wood ash: 1 kg\n• Bone meal: 500 g\n\n🌦️ Post-monsoon (Oct–Nov):\n• Farmyard manure: 25 kg\n• Vermicompost: 5 kg\n• Neem cake: 2 kg\n• Rock phosphate: 500 g'
      },
      {
        heading: '🧪 Micronutrient Sprays',
        body: 'Micronutrient deficiencies are common in sandy coastal soils. Apply foliar sprays:\n\n• Borax (0.2%): Once a year to prevent button shedding\n• Ferrous sulphate (0.5%): If fronds show pale green interveinal chlorosis\n• Zinc sulphate (0.5%): For small nut size and stunted growth\n• Magnesium sulphate (2%): For orange-yellow leaf tips\n\nSpray early morning or evening. Avoid spraying in direct afternoon sun.'
      },
      {
        heading: '🪱 Beneficial Bio-Inputs',
        body: '• Trichoderma viride: Mix 50 g/palm in irrigation water — controls root diseases\n• Pseudomonas fluorescens: Spray on collar region to prevent stem rot\n• VAM (Vesicular Arbuscular Mycorrhizae): Apply at pit stage to boost phosphorus uptake by 30–40%'
      },
      {
        heading: '🌾 Intercropping Benefits',
        body: 'In year 1–3, use the inter-row space for nitrogen-fixing intercrops:\n• Cowpea or groundnut (fixes atmospheric nitrogen)\n• Banana (provides shade for young saplings)\n• Avoid tapioca and sugarcane (highly competitive for water)\n\nIntercrops also suppress weeds and improve soil organic matter.'
      },
      {
        heading: '⚠️ What to Avoid',
        body: '• Chemical NPK in year 1 — roots are sensitive; excess nitrogen burns tips\n• Urea directly on soil without dilution — kills beneficial microbes\n• Over-application of phosphorus — blocks micronutrient uptake\n• Fertilizing during drought or waterlogging — ineffective and harmful'
      }
    ]
  },
  {
    title: 'Managing Salinity & Coastal Soil Environment',
    category: 'Environment',
    summary: 'Why Eathamozhi coconut palms thrive in coastal sandy loam and how to manage irrigation water salinity in coastal regions.',
    date: 'Jun 2026',
    readTime: '4 min read',
    icon: 'bi-geo-alt',
    content: [
      {
        heading: '🌊 Why Coastal Soils Suit Eathamozhi Cultivar',
        body: 'Eathamozhi tall coconuts evolved in the Kanyakumari coastal belt — they carry a natural genetic tolerance to moderate soil salinity (up to 4 dS/m ECe). Their deep taproot system efficiently extracts freshwater pockets even in saline soil profiles. This makes them uniquely suited for coastal Karnataka, Kerala, and coastal Andhra Pradesh farms.'
      },
      {
        heading: '🧂 Testing & Understanding Salinity',
        body: 'Test irrigation water EC (Electrical Conductivity) before use:\n\n• Safe: EC < 1.5 dS/m → No concern\n• Moderate: EC 1.5–3 dS/m → Leach soil periodically\n• High: EC 3–5 dS/m → Add gypsum, reduce irrigation frequency\n• Very High: EC > 5 dS/m → Not recommended; use only rainwater\n\nSoil EC testing: Use a portable EC meter. Test from 30 cm depth.'
      },
      {
        heading: '🔧 Managing High Salinity Situations',
        body: '• Apply gypsum (calcium sulphate) at 5 kg/palm/year to displace sodium ions\n• Leach salts by flood-irrigating once before monsoon to push salts below root zone\n• Add organic matter (compost 25–30 kg/palm) to improve soil buffering capacity\n• Raised planting mounds (15–20 cm above surrounding grade) improve drainage in saline soils'
      },
      {
        heading: '🌬️ Wind Management in Coastal Farms',
        body: 'High coastal winds (especially during monsoon) can cause:\n• Frond breakage in young saplings\n• Increased water evaporation\n• Root destabilisation\n\nInstall windbreaks: Plant Casuarina trees (10 ft spacing) on western and southern farm borders. They also add nitrogen to soil via leaf litter. Stake young saplings with bamboo up to 2 years.'
      },
      {
        heading: '🌧️ Rainwater Harvesting',
        body: 'In coastal farms receiving 100–150 cm annual rainfall, store rainwater in farm ponds. Use gravity-fed drip from elevated tanks. This eliminates salinity risk from well water and provides natural soft water ideal for young saplings.'
      }
    ]
  },
  {
    title: 'Preventing Rhinoceros Beetle & Yellowing Leaves',
    category: 'Troubleshooting',
    summary: 'Natural organic traps for beetles, treating crown rot, and identifying magnesium vs nitrogen deficiency symptoms early.',
    date: 'May 2026',
    readTime: '5 min read',
    icon: 'bi-shield-check',
    content: [
      {
        heading: '🪲 Rhinoceros Beetle (Oryctes rhinoceros) – Identification',
        body: 'The Rhinoceros beetle is the most destructive pest of young coconut palms. Signs of attack:\n• V-shaped or fan-shaped cuts in emerging spear leaves (central frond)\n• Small circular holes in the trunk base\n• Crown looks tattered with cut frond stubs\n• Severe attack: Spear leaf fails to open → "dead heart" condition'
      },
      {
        heading: '🪤 Organic Trapping Methods',
        body: '• Pheromone trap: Hang aggregation pheromone lures at 1.5 m height near compost heaps (1 trap per 5 acres). Replace lure every 45 days.\n• Sugarcane bagasse + yeast fermentation pits: Beetles breed in rotting matter — maintain these compost pits away from farm to act as "decoy breeding sites" and collect/destroy beetles weekly.\n• Light trap: Use a 40W bulb above a water basin at night — beetles are attracted and drown.'
      },
      {
        heading: '💊 Organic Treatment for Infected Palms',
        body: '• Remove beetle manually from crown hole using a hooked wire\n• Pack hole with sand + neem oil mixture (100 ml neem oil + 1 L water)\n• Apply Beauveria bassiana (entomopathogenic fungus) paste inside the hole (50 g in 500 ml water)\n• Spray crown with 0.5% neem seed kernel extract\n• Repeat treatment every 2 weeks until new fronds emerge cleanly'
      },
      {
        heading: '🍂 Diagnosing Yellowing Leaves',
        body: 'Not all yellow fronds mean the same problem:\n\n🟡 Lower fronds yellowing (bottom-up): Normal senescence — prune and mulch\n🟡 ALL fronds pale green → Nitrogen deficiency: Apply 2 kg neem cake\n🟡 Bright yellow fronds, tips turn orange → Magnesium deficiency: Spray 2% magnesium sulphate\n🟡 Yellow fronds with green veins → Iron or zinc deficiency: Soil drench with ferrous sulphate 0.5%\n🟡 Yellowing at crown + drooping → Root rot or overwatering — improve drainage immediately'
      },
      {
        heading: '🔄 Preventive Best Practices',
        body: '• Remove and burn fallen/cut coconut trunks within farm — major beetle breeding ground\n• Keep compost heaps ≥ 100 m away from palms\n• Apply Trichoderma viride near root zone every 6 months to prevent fungal root rot\n• Bimonthly crown inspection for all palms in first 3 years\n• Install 1 pheromone trap per 3 acres permanently'
      }
    ]
  }
];

export default function FarmingGuidePage() {
  const [selectedArticle, setSelectedArticle] = useState<typeof articles[0] | null>(null);

  return (
    <>
      <section className="hero-ambient-mesh text-white py-5 position-relative overflow-hidden border-bottom border-success border-opacity-25">
        <div className="container position-relative py-3">
          <span className="badge bg-warning text-dark px-3 py-2 rounded-pill mb-2 fw-bold">FARM KNOWLEDGE</span>
          <h1 className="display-4 fw-bold">Coconut Farming Guide</h1>
          <p className="lead mx-auto" style={{ maxWidth: '700px' }}>
            Practical, field-tested guidance from our farm team to help your saplings achieve maximum health and early yield.
          </p>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <div className="row g-4">
            {articles.map((art, idx) => (
              <div key={idx} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 p-4 bg-white d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-success-subtle text-success border border-success">{art.category}</span>
                      <small className="text-muted">{art.readTime}</small>
                    </div>
                    <div className="mb-2">
                      <i className={`bi ${art.icon} fs-3 text-success opacity-75`}></i>
                    </div>
                    <h5 className="fw-bold text-dark mb-2">{art.title}</h5>
                    <p className="text-secondary small mb-3">{art.summary}</p>
                  </div>
                  <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                    <span className="text-muted extra-small">By Eathamozhi Farm Team</span>
                    <button
                      className="btn btn-sm btn-success fw-bold"
                      onClick={() => setSelectedArticle(art)}
                    >
                      <i className="bi bi-book-open me-1"></i> Read Guide
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Plantation Layout Visualizer Card */}
          <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 mt-5 bg-white">
            <div className="text-center mb-4">
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1 rounded-pill fw-bold">
                <i className="bi bi-diagram-3-fill me-1"></i> FIELD GEOMETRY &amp; SPACING GUIDE
              </span>
              <h3 className="fw-bold text-dark mt-2 mb-2">Planting Pattern Visual Guide: Triangular vs Square</h3>
              <p className="text-secondary small mx-auto" style={{ maxWidth: '650px' }}>
                Compare the field geometry, spacing dimensions, and palm population per acre between the two standard coconut planting systems.
              </p>
            </div>

            <PatternVisualizer showComparison={true} />
          </div>

          <div className="card border-0 shadow-sm rounded-4 p-4 mt-4 bg-white text-center">
            <h4 className="fw-bold text-dark mb-2">Have a specific soil, layout, or planting question?</h4>
            <p className="text-secondary mb-3">Our farm experts are available to guide you on pit digging, manure mixing, and grove orientation.</p>
            <a href="https://wa.me/919486880641?text=Hello%20Eathamozhi%20Farm,%20I%20have%20a%20question%20regarding%20plantation%20spacing%20patterns" target="_blank" rel="noreferrer" className="btn btn-success fw-bold d-inline-flex align-items-center gap-2 mx-auto">
              <i className="bi bi-whatsapp fs-5"></i> Ask Farm Expert on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Full-Screen Article Reader Modal */}
      {selectedArticle && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-start justify-content-center"
          style={{ background: 'rgba(0,0,0,0.7)', zIndex: 1055, overflowY: 'auto', paddingTop: '3rem', paddingBottom: '3rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedArticle(null); }}
        >
          <div className="card border-0 shadow-lg rounded-4 bg-white" style={{ maxWidth: '780px', width: '95%' }}>
            {/* Modal Header */}
            <div className="card-header bg-success text-white rounded-top-4 p-4 border-0">
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div>
                  <span className="badge bg-white text-success fw-bold mb-2">{selectedArticle.category}</span>
                  <h3 className="fw-bold mb-1">{selectedArticle.title}</h3>
                  <small className="opacity-75">
                    <i className="bi bi-clock me-1"></i>{selectedArticle.readTime} &nbsp;|&nbsp;
                    <i className="bi bi-calendar3 me-1"></i>{selectedArticle.date} &nbsp;|&nbsp;
                    By Eathamozhi Farm Team
                  </small>
                </div>
                <button
                  className="btn btn-sm btn-outline-light rounded-circle fw-bold flex-shrink-0"
                  style={{ width: '32px', height: '32px', padding: 0 }}
                  onClick={() => setSelectedArticle(null)}
                >✕</button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="card-body p-4 p-md-5">
              <p className="text-secondary mb-4 fst-italic border-start border-success ps-3">
                {selectedArticle.summary}
              </p>

              {selectedArticle.content.map((section, i) => (
                <div key={i} className="mb-4">
                  <h5 className="fw-bold text-dark mb-2">{section.heading}</h5>
                  <p className="text-secondary" style={{ whiteSpace: 'pre-line', lineHeight: '1.75' }}>
                    {section.body}
                  </p>
                  {i < selectedArticle.content.length - 1 && (
                    <hr className="border-success border-opacity-25" />
                  )}
                </div>
              ))}

              <div className="mt-4 p-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 text-center">
                <p className="mb-2 text-dark fw-semibold">
                  <i className="bi bi-patch-question-fill text-success me-2"></i>
                  Have a question about this topic?
                </p>
                <a
                  href={`https://wa.me/919486880641?text=Hello%20Eathamozhi%20Farm%20Team,%20I%20have%20a%20question%20about%20%22${encodeURIComponent(selectedArticle.title)}%22`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-success fw-bold"
                >
                  <i className="bi bi-whatsapp me-2"></i> Ask on WhatsApp
                </a>
              </div>
            </div>

            <div className="card-footer bg-light rounded-bottom-4 border-0 p-3 d-flex justify-content-between align-items-center">
              <small className="text-muted">
                <i className="bi bi-shield-check text-success me-1"></i>
                Field-verified by Eathamozhi Farm, Kanyakumari
              </small>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedArticle(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
