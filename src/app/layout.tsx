import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import ExternalAnalytics from '@/components/ExternalAnalytics';

export const metadata: Metadata = {
  title: 'Eathamozhy Coconut Farm | Buy Coconut Seedlings & Saplings Online',
  description: 'Mainland India’s only GI-Tagged coconut cultivar. Buy authentic, high-yielding coconut seedlings and saplings directly from our ancestral grove in Kanyakumari. 100% farm-grown with mother tree traceability and pan-India express freight delivery.',
  keywords: [
    'coconut',
    'coconut seedlings',
    'coconut saplings',
    'coconut plants',
    'buy coconut seedlings online',
    'buy coconut saplings',
    'eathamozhy tall coconut',
    'GI tagged coconut seedlings',
    'high yield coconut seedlings',
    'kanyakumari coconut farm',
    'coconut nursery',
    'best coconut seedlings in india',
    'tender coconut saplings'
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Eathamozhy Coconut Farm | Buy Certified Coconut Seedlings & Saplings',
    description: 'Direct from our ancestral farm in Kanyakumari. 100% farm-grown GI-Tagged Eathamozhy Tall coconut seedlings with mother tree traceability.',
    url: 'https://eathamozhycoconutfarm.com',
    siteName: 'Eathamozhy Coconut Farm',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eathamozhy Coconut Farm | Certified Coconut Seedlings & Saplings',
    description: 'Mainland India’s only GI-Tagged coconut cultivar. Buy authentic coconut seedlings online directly from the farmer.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const farmPhone = process.env.NEXT_PUBLIC_FARM_PHONE || '+91 94868 80641';
  const farmWhatsApp = process.env.NEXT_PUBLIC_FARM_WHATSAPP || '919486880641';
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://www.facebook.com/share/1Fg7jUCXNM/';
  const youtubeUrl = process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://youtube.com/@eathamozhicoconutfarm?si=DerFz4Uxlf_eW8LD';
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/eathamozhi_coconut_farm?xtok=MTFhaHJwdXk5Nzhleg==';

  return (
    <html lang="en">
      <head>
        {/* Bootstrap 5 CSS & Icons */}
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
        />
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" 
        />
        <ExternalAnalytics />

        {/* Structured Data (JSON-LD) for Search Engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': ['LocalBusiness', 'AgriculturalBusiness'],
              name: 'Eathamozhy Coconut Farm',
              description: 'Authentic GI-Tagged Eathamozhy Tall coconut seedlings and saplings nursery in Kanyakumari, Tamil Nadu.',
              telephone: farmPhone,
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Eathamozhy Village, Agastheeswaram Taluk',
                addressLocality: 'Kanyakumari District',
                addressRegion: 'Tamil Nadu',
                postalCode: '629501',
                addressCountry: 'IN',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: '8.1367',
                longitude: '77.4278',
              },
              url: 'https://eathamozhycoconutfarm.com',
              sameAs: [facebookUrl, youtubeUrl, instagramUrl],
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Coconut Seedlings and Saplings',
                itemListElement: [
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Product',
                      name: 'Authentic GI-Tagged Eathamozhy Tall Coconut Seedlings',
                      description: 'Genetically verified first-generation coconut seedlings raised from registered mother palms.',
                      category: 'Agricultural Produce > Coconut Seedlings',
                    },
                  },
                ],
              },
            }),
          }}
        />
      </head>
      <body className="bg-light">
        <AnalyticsTracker />
        {/* Active Page Aware Navigation */}
        <Navbar />

        {/* Main Content Area */}
        <main className="min-vh-100">
          {children}
        </main>


        {/* Desktop Floating WhatsApp Assistant Button */}
        <a 
          href={`https://wa.me/${farmWhatsApp}?text=Hello%20Eathamozhy%20Farm,%20I%20have%20a%20question%20about%20your%20coconut%20seedlings%20and%20saplings.`}
          target="_blank"
          rel="noreferrer"
          className="d-none d-md-flex position-fixed bottom-0 end-0 m-4 z-3 btn btn-success rounded-pill shadow-lg align-items-center gap-2 px-3 py-2 border border-white border-opacity-25 hover-lift"
          style={{ background: '#25D366' }}
          title="Direct WhatsApp Farmer Helpline"
        >
          <i className="bi bi-whatsapp fs-5 text-white"></i>
          <span className="fw-bold text-white small">Farmer Helpline</span>
        </a>

        {/* Premium Dark Forest Footer */}
        <footer className="text-white pt-5 pb-5 mt-5 border-top border-success border-opacity-25" style={{ background: 'linear-gradient(180deg, #022319 0%, #01140e 100%)' }}>
          <div className="container">
            <div className="row g-4">
              
              {/* Brand Summary & Trust Badges */}
              <div className="col-lg-4 col-md-6">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-success text-white rounded-3 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                    <i className="bi bi-tree-fill fs-5"></i>
                  </div>
                  <div>
                    <h5 className="text-white fw-bold mb-0">Eathamozhy Coconut Farm</h5>
                    <small className="text-secondary extra-small">GI-TAGGED TALL CULTIVAR</small>
                  </div>
                </div>

                <p className="text-light opacity-75 small mb-3">
                  Traditional Eathamozhy coconut seedlings and saplings, nurtured directly on our coastal family farm in Kanyakumari. 
                  Every order includes transparent mother tree origin and protective crate transit.
                </p>

                <div className="d-flex flex-wrap gap-2 mb-3">
                  <span className="badge-gi-pill extra-small"><i className="bi bi-award-fill me-1"></i> GI CERTIFIED</span>
                  <span className="badge-farm-pill extra-small"><i className="bi bi-shield-check me-1"></i> 100% OWN GROVE</span>
                </div>

                <div className="d-flex gap-2">
                  <a href={`https://wa.me/${farmWhatsApp}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success text-success">
                    <i className="bi bi-whatsapp me-1"></i> WhatsApp: {farmPhone}
                  </a>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="col-lg-2 col-6">
                <h6 className="text-uppercase fw-bold text-success extra-small tracking-wider mb-3">Explore Farm</h6>
                <ul className="list-unstyled small text-light opacity-75">
                  <li className="mb-2"><Link href="/" className="text-decoration-none text-light opacity-80 hover-opacity-100">Home</Link></li>
                  <li className="mb-2"><Link href="/batches" className="text-decoration-none text-light opacity-80 hover-opacity-100">Available Batches</Link></li>
                  <li className="mb-2"><Link href="/farm" className="text-decoration-none text-light opacity-80 hover-opacity-100">Mother Trees</Link></li>
                  <li className="mb-2"><Link href="/about" className="text-decoration-none text-light opacity-80 hover-opacity-100">GI Tag Heritage</Link></li>
                  <li className="mb-2"><Link href="/reviews" className="text-decoration-none text-light opacity-80 hover-opacity-100">Farmer Reviews</Link></li>
                </ul>
              </div>

              {/* Customer Care */}
              <div className="col-lg-3 col-6">
                <h6 className="text-uppercase fw-bold text-success extra-small tracking-wider mb-3">Farmer Care & Help</h6>
                <ul className="list-unstyled small text-light opacity-75">
                  <li className="mb-2"><Link href="/tracking" className="text-decoration-none text-light opacity-80 hover-opacity-100">Track Consignment</Link></li>
                  <li className="mb-2"><Link href="/guide" className="text-decoration-none text-light opacity-80 hover-opacity-100">Coconut Planting Guide</Link></li>
                  <li className="mb-2"><Link href="/faq" className="text-decoration-none text-light opacity-80 hover-opacity-100">Frequently Asked Questions</Link></li>
                  <li className="mb-2"><Link href="/contact" className="text-decoration-none text-light opacity-80 hover-opacity-100">Contact Farm Office</Link></li>
                </ul>
              </div>

              {/* Farm Address & Social Links */}
              <div className="col-lg-3 col-md-6">
                <h6 className="text-uppercase fw-bold text-success extra-small tracking-wider mb-3">Farm Location</h6>
                <p className="text-light opacity-75 small mb-2">
                  <i className="bi bi-geo-alt-fill text-danger me-1"></i> Eathamozhy Village, Agastheeswaram Taluk, Kanyakumari District, Tamil Nadu &ndash; 629501
                </p>
                <p className="text-light opacity-75 small mb-3">
                  <i className="bi bi-telephone-fill me-1 text-success"></i> {farmPhone}
                </p>

                {/* Social Links from .env */}
                <div className="mt-3 pt-2 border-top border-secondary border-opacity-25">
                  <span className="text-uppercase fw-bold text-success extra-small tracking-wider d-block mb-2">
                    <i className="bi bi-patch-check-fill text-warning me-1"></i> Connect On Socials
                  </span>
                  <div className="d-flex align-items-center gap-2">
                    <a 
                      href={facebookUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="footer-social-btn facebook"
                      title="Follow Eathamozhy Coconut Farm on Facebook"
                      aria-label="Facebook"
                    >
                      <i className="bi bi-facebook"></i>
                    </a>
                    <a 
                      href={instagramUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="footer-social-btn instagram"
                      title="Follow Eathamozhy Coconut Farm on Instagram"
                      aria-label="Instagram"
                    >
                      <i className="bi bi-instagram"></i>
                    </a>
                    <a 
                      href={youtubeUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="footer-social-btn youtube"
                      title="Watch Eathamozhy Coconut Farm on YouTube"
                      aria-label="YouTube"
                    >
                      <i className="bi bi-youtube"></i>
                    </a>
                  </div>
                </div>
              </div>

            </div>

            <hr className="my-4 border-secondary border-opacity-25" />

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center text-secondary extra-small">
              <p className="mb-2 mb-md-0">&copy; {new Date().getFullYear()} Eathamozhy Coconut Farm. All rights reserved. Mainland India GI Tag Cultivar.</p>
                <span className="badge bg-secondary bg-opacity-25 text-light">Pan-India Freight Delivery</span>
            </div>

          </div>
        </footer>
      </body>
    </html>
  );
}
