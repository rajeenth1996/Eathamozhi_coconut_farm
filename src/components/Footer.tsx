'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

interface FooterProps {
  farmPhone?: string;
  farmWhatsApp?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
}

export default function Footer({
  farmPhone = '+91 94868 80641',
  farmWhatsApp = '919486880641',
  facebookUrl = 'https://www.facebook.com/share/1Fg7jUCXNM/',
  youtubeUrl = 'https://youtube.com/@eathamozhicoconutfarm?si=DerFz4Uxlf_eW8LD',
  instagramUrl = 'https://www.instagram.com/eathamozhi_coconut_farm?xtok=MTFhaHJwdXk5Nzhleg==',
}: FooterProps) {
  const { t, isTamil } = useLanguage();

  return (
    <footer 
      className="text-white pt-5 pb-5 mt-5 border-top border-success border-opacity-25" 
      style={{ background: 'linear-gradient(180deg, #022319 0%, #01140e 100%)' }}
    >
      <div className="container">
        <div className="row g-4">
          
          {/* Brand Summary & Trust Badges */}
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div 
                className="bg-success text-white rounded-3 d-flex align-items-center justify-content-center shadow-sm" 
                style={{ width: '38px', height: '38px' }}
              >
                <i className="bi bi-tree-fill fs-5"></i>
              </div>
              <div>
                <h5 className="text-white fw-bold mb-0">Eathamozhi Coconut Farm</h5>
                <small className="text-secondary extra-small">
                  {isTamil ? 'புவிசார் குறியீடு பெற்ற நெட்டை ரகம்' : 'GI-TAGGED TALL CULTIVAR'}
                </small>
              </div>
            </div>

            <p className="text-light opacity-75 small mb-3">
              {t('footer.brand_desc')}
            </p>

            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="badge-gi-pill extra-small">
                <i className="bi bi-award-fill me-1"></i> {t('footer.gi_certified')}
              </span>
              <span className="badge-farm-pill extra-small">
                <i className="bi bi-shield-check me-1"></i> {t('footer.own_grove')}
              </span>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <a 
                href={`https://wa.me/${farmWhatsApp}`} 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-sm btn-outline-success text-success fw-semibold"
              >
                <i className="bi bi-whatsapp me-1"></i> WhatsApp: {farmPhone}
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="col-lg-2 col-6">
            <h6 className="text-uppercase fw-bold text-success extra-small tracking-wider mb-3">
              {t('footer.explore')}
            </h6>
            <ul className="list-unstyled small text-light opacity-75">
              <li className="mb-2">
                <Link href="/" className="text-decoration-none text-light opacity-80 hover-opacity-100">
                  {t('nav.home')}
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/batches" className="text-decoration-none text-light opacity-80 hover-opacity-100">
                  {t('nav.batches')}
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/farm" className="text-decoration-none text-light opacity-80 hover-opacity-100">
                  {t('nav.motherTrees')}
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/about" className="text-decoration-none text-light opacity-80 hover-opacity-100">
                  {t('nav.giHeritage')}
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/reviews" className="text-decoration-none text-light opacity-80 hover-opacity-100">
                  {t('nav.reviews')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="col-lg-3 col-6">
            <h6 className="text-uppercase fw-bold text-success extra-small tracking-wider mb-3">
              {t('footer.farmer_care')}
            </h6>
            <ul className="list-unstyled small text-light opacity-75">
              <li className="mb-2">
                <Link href="/tracking" className="text-decoration-none text-light opacity-80 hover-opacity-100">
                  {isTamil ? 'ஆர்டர் பார்சல் கண்காணிப்பு' : 'Track Consignment'}
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/guide" className="text-decoration-none text-light opacity-80 hover-opacity-100">
                  {isTamil ? 'தென்னை நடவு முறை வழிகாட்டி' : 'Coconut Planting Guide'}
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/faq" className="text-decoration-none text-light opacity-80 hover-opacity-100">
                  {isTamil ? 'அடிக்கடி கேட்கப்படும் கேள்விகள்' : 'Frequently Asked Questions'}
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/contact" className="text-decoration-none text-light opacity-80 hover-opacity-100">
                  {isTamil ? 'பண்ணை அலுவலக தொடர்பு' : 'Contact Farm Office'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Farm Address, Social Links & Language Selector */}
          <div className="col-lg-3 col-md-6">
            <h6 className="text-uppercase fw-bold text-success extra-small tracking-wider mb-3">
              {t('footer.farm_location')}
            </h6>
            <p className="text-light opacity-75 small mb-2">
              <i className="bi bi-geo-alt-fill text-danger me-1"></i>
              {isTamil 
                ? 'ஈத்தாமொழி கிராமம், அகஸ்தீஸ்வரம் வட்டம், கன்னியாகுமரி மாவட்டம், தமிழ்நாடு – 629501' 
                : 'Eathamozhi Village, Agastheeswaram Taluk, Kanyakumari District, Tamil Nadu – 629501'}
            </p>
            <p className="text-light opacity-75 small mb-3">
              <i className="bi bi-telephone-fill me-1 text-success"></i> {farmPhone}
            </p>

            {/* Language Switcher in Footer */}
            <div className="mt-3 pt-2 border-top border-secondary border-opacity-25 mb-3">
              <div className="d-flex align-items-center justify-content-between">
                <span className="text-uppercase fw-bold text-success extra-small tracking-wider">
                  <i className="bi bi-translate text-warning me-1"></i> {t('lang.current_label')}
                </span>
                <LanguageToggle size="sm" />
              </div>
            </div>

            {/* Social Links from .env */}
            <div className="pt-2 border-top border-secondary border-opacity-25">
              <span className="text-uppercase fw-bold text-success extra-small tracking-wider d-block mb-2">
                <i className="bi bi-patch-check-fill text-warning me-1"></i> {t('footer.connect_socials')}
              </span>
              <div className="d-flex align-items-center gap-2">
                <a 
                  href={facebookUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="footer-social-btn facebook"
                  title="Follow Eathamozhi Coconut Farm on Facebook"
                  aria-label="Facebook"
                >
                  <i className="bi bi-facebook"></i>
                </a>
                <a 
                  href={instagramUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="footer-social-btn instagram"
                  title="Follow Eathamozhi Coconut Farm on Instagram"
                  aria-label="Instagram"
                >
                  <i className="bi bi-instagram"></i>
                </a>
                <a 
                  href={youtubeUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="footer-social-btn youtube"
                  title="Watch Eathamozhi Coconut Farm on YouTube"
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
          <p className="mb-2 mb-md-0">
            &copy; {new Date().getFullYear()} Eathamozhi Coconut Farm. {t('footer.rights')}
          </p>
          <span className="badge bg-secondary bg-opacity-25 text-light">
            <i className="bi bi-truck me-1 text-success"></i> {t('footer.freight')}
          </span>
        </div>

      </div>
    </footer>
  );
}
