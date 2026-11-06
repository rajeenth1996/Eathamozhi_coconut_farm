'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { t, isTamil } = useLanguage();

  const navLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.batches'), href: '/batches', badge: t('nav.liveStock') },
    { name: t('nav.motherTrees'), href: '/farm' },
    { name: t('nav.giHeritage'), href: '/about' },
    { name: t('nav.guide'), href: '/guide' },
    { name: t('nav.reviews'), href: '/reviews' },
    { name: t('nav.tracking'), href: '/tracking' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Premium Desktop & Tablet Navigation */}
      <header className="sticky-top z-3 glass-nav py-2 transition-all">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between">
            
            {/* Brand Logo & Heritage Tag */}
            <Link 
              href="/" 
              className="d-flex align-items-center text-decoration-none text-light py-1"
              onClick={() => setIsOpen(false)}
            >
              <div className="bg-success bg-gradient text-white rounded-3 d-flex align-items-center justify-content-center me-2 shadow-sm" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-tree-fill fs-5"></i>
              </div>
              <div>
                <span className="fw-bold fs-5 text-light d-block lh-1">Eathamozhi</span>
                <span className="text-secondary extra-small text-uppercase tracking-wider">
                  {t('nav.brandSubtitle')}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="d-none d-lg-flex align-items-center gap-1">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link 
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-3 text-decoration-none small fw-semibold transition-all position-relative ${
                      active 
                        ? 'text-white bg-success bg-opacity-25 border border-success border-opacity-50' 
                        : 'text-light opacity-80 hover-opacity-100 hover-lift-subtle'
                    }`}
                  >
                    {link.name}
                    {link.badge && !active && (
                      <span className="badge bg-success bg-opacity-75 ms-1 extra-small px-1 py-0 rounded-pill">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Action Buttons: Language Toggle, WhatsApp & Book Now */}
            <div className="d-flex align-items-center gap-2">
              {/* Desktop Language Toggle */}
              <div className="d-none d-sm-block">
                <LanguageToggle size="sm" />
              </div>

              <a 
                href={`https://wa.me/${process.env.NEXT_PUBLIC_FARM_WHATSAPP || '919486880641'}?text=Hello%20Eathamozhi%20Farm,%20I%20am%20interested%20in%20coconut%20seedlings%20and%20saplings`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline-success border-success text-success fw-semibold d-none d-md-inline-flex align-items-center gap-1 px-3 py-2 rounded-3"
                title="Direct WhatsApp Help"
              >
                <i className="bi bi-whatsapp"></i>
                <span>{t('nav.chat')}</span>
              </a>

              <Link 
                href="/batches" 
                className="btn-emerald text-decoration-none text-white small fw-bold px-3 py-2 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
              >
                <i className="bi bi-bag-check-fill"></i>
                <span className="d-none d-sm-inline">{t('nav.bookSaplings')}</span>
                <span className="d-sm-none">{t('nav.book')}</span>
              </Link>

              {/* Mobile Language Toggle */}
              <div className="d-sm-none">
                <LanguageToggle size="sm" showIcon={false} />
              </div>

              {/* Mobile Menu Toggler */}
              <button 
                className="btn btn-dark border-secondary d-lg-none p-2 rounded-3 text-light ms-1"
                type="button" 
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-label="Toggle Navigation Menu"
              >
                <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-list'} fs-5`}></i>
              </button>
            </div>

          </div>

          {/* Mobile Dropdown Drawer */}
          {isOpen && (
            <div className="d-lg-none mt-3 pt-3 border-top border-secondary border-opacity-50 pb-2">
              {/* Language Switch Banner in Mobile Menu */}
              <div className="d-flex align-items-center justify-content-between p-2 mb-3 rounded-3 bg-dark bg-opacity-75 border border-secondary border-opacity-50">
                <span className="small text-light opacity-90 fw-semibold d-flex align-items-center gap-2">
                  <i className="bi bi-translate text-warning fs-6"></i>
                  <span>{isTamil ? 'மொழி தேர்வு / Language:' : 'Language / மொழி:'}</span>
                </span>
                <LanguageToggle size="sm" />
              </div>

              <div className="d-flex flex-column gap-1">
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`px-3 py-2 rounded-3 text-decoration-none fw-semibold d-flex justify-content-between align-items-center ${
                        active 
                          ? 'text-white bg-success bg-opacity-25 border border-success' 
                          : 'text-light opacity-80'
                      }`}
                    >
                      <span>{link.name}</span>
                      {link.badge && (
                        <span className="badge bg-success extra-small">{link.badge}</span>
                      )}
                    </Link>
                  );
                })}

                <div className="pt-2 mt-2 border-top border-secondary border-opacity-25">
                  <a 
                    href={`https://wa.me/${process.env.NEXT_PUBLIC_FARM_WHATSAPP || '919486880641'}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-sm btn-success w-100 py-2 fw-semibold mb-2"
                  >
                    <i className="bi bi-whatsapp me-1"></i> WhatsApp Helpline
                  </a>
                  
                  {/* Social Media Links */}
                  <div className="d-flex justify-content-center gap-2 pt-1">
                    <a 
                      href={process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/share/1Fg7jUCXNM/"}
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-sm btn-outline-light rounded-pill px-3 py-1 extra-small"
                      title="Facebook"
                    >
                      <i className="bi bi-facebook text-primary me-1"></i> Facebook
                    </a>
                    <a 
                      href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/eathamozhi_coconut_farm?xtok=MTFhaHJwdXk5Nzhleg=="}
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-sm btn-outline-light rounded-pill px-3 py-1 extra-small"
                      title="Instagram"
                    >
                      <i className="bi bi-instagram text-danger me-1"></i> Instagram
                    </a>
                    <a 
                      href={process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://youtube.com/@eathamozhicoconutfarm?si=DerFz4Uxlf_eW8LD"}
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-sm btn-outline-light rounded-pill px-3 py-1 extra-small"
                      title="YouTube"
                    >
                      <i className="bi bi-youtube text-danger me-1"></i> YouTube
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </header>

      {/* Modern Fixed Bottom Mobile App Bar */}
      <nav className="fixed-bottom d-md-none glass-nav border-top border-secondary border-opacity-25 py-2 z-3">
        <div className="container-fluid d-flex justify-content-around text-center">
          <Link 
            href="/" 
            className={`text-decoration-none mobile-nav-link d-flex flex-column align-items-center ${pathname === '/' ? 'active' : 'text-light opacity-75'}`}
          >
            <i className="bi bi-house-door-fill fs-5"></i>
            <span className="extra-small mt-1">{t('nav.home')}</span>
          </Link>

          <Link 
            href="/batches" 
            className={`text-decoration-none mobile-nav-link d-flex flex-column align-items-center ${pathname.startsWith('/batches') ? 'active' : 'text-light opacity-75'}`}
          >
            <i className="bi bi-grid-fill fs-5"></i>
            <span className="extra-small mt-1">{isTamil ? 'நாற்றுகள்' : 'Batches'}</span>
          </Link>

          <Link 
            href="/farm" 
            className={`text-decoration-none mobile-nav-link d-flex flex-column align-items-center ${pathname.startsWith('/farm') ? 'active' : 'text-light opacity-75'}`}
          >
            <i className="bi bi-tree fs-5"></i>
            <span className="extra-small mt-1">{isTamil ? 'தாய் மரம்' : 'Mother Trees'}</span>
          </Link>

          <Link 
            href="/tracking" 
            className={`text-decoration-none mobile-nav-link d-flex flex-column align-items-center ${pathname.startsWith('/tracking') ? 'active' : 'text-light opacity-75'}`}
          >
            <i className="bi bi-truck fs-5"></i>
            <span className="extra-small mt-1">{isTamil ? 'ஆர்டர்' : 'Track'}</span>
          </Link>

          <a 
            href={`https://wa.me/${process.env.NEXT_PUBLIC_FARM_WHATSAPP || '919486880641'}`} 
            target="_blank" 
            rel="noreferrer"
            className="text-decoration-none mobile-nav-link d-flex flex-column align-items-center text-success"
          >
            <i className="bi bi-whatsapp fs-5"></i>
            <span className="extra-small mt-1">{t('nav.chat')}</span>
          </a>
        </div>
      </nav>
    </>
  );
}
