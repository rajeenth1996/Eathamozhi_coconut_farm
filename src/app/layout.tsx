import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import ExternalAnalytics from '@/components/ExternalAnalytics';
import { LanguageProvider } from '@/context/LanguageContext';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://eathamozhi-coconut-farm.vercel.app');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Eathamozhi Coconut Farm | Buy Coconut Seedlings & Saplings Online',
  description: 'Mainland India’s only GI-Tagged coconut cultivar. Buy authentic, high-yielding coconut seedlings and saplings directly from our ancestral grove in Kanyakumari. 100% farm-grown with mother tree traceability and pan-India express freight delivery.',
  keywords: [
    'coconut',
    'coconut seedlings',
    'coconut saplings',
    'coconut plants',
    'buy coconut seedlings online',
    'buy coconut saplings',
    'eathamozhi tall coconut',
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
    title: 'Eathamozhi Coconut Farm | Buy Certified Coconut Seedlings & Saplings',
    description: 'Direct from our ancestral farm in Kanyakumari. 100% farm-grown GI-Tagged Eathamozhi Tall coconut seedlings with mother tree traceability.',
    url: siteUrl,
    siteName: 'Eathamozhi Coconut Farm',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eathamozhi Coconut Farm | Certified Coconut Seedlings & Saplings',
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
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
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
              name: 'Eathamozhi Coconut Farm',
              description: 'Authentic GI-Tagged Eathamozhi Tall coconut seedlings and saplings nursery in Kanyakumari, Tamil Nadu.',
              telephone: farmPhone,
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Eathamozhi Village, Agastheeswaram Taluk',
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
              url: siteUrl,
              sameAs: [facebookUrl, youtubeUrl, instagramUrl],
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Coconut Seedlings and Saplings',
                itemListElement: [
                  {
                    '@type': 'Offer',
                    itemOffered: {
                      '@type': 'Product',
                      name: 'Authentic GI-Tagged Eathamozhi Tall Coconut Seedlings',
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
        <LanguageProvider>
          <AnalyticsTracker />
          {/* Active Page Aware Navigation */}
          <Navbar />

          {/* Main Content Area */}
          <main className="min-vh-100">
            {children}
          </main>

          {/* Desktop Floating WhatsApp Assistant Button */}
          <a 
            href={`https://wa.me/${farmWhatsApp}?text=Hello%20Eathamozhi%20Farm,%20I%20have%20a%20question%20about%20your%20coconut%20seedlings%20and%20saplings.`}
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
          <Footer 
            farmPhone={farmPhone}
            farmWhatsApp={farmWhatsApp}
            facebookUrl={facebookUrl}
            youtubeUrl={youtubeUrl}
            instagramUrl={instagramUrl}
          />
        </LanguageProvider>
      </body>
    </html>
  );
}
