'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Available Batches', href: '/batches', badge: 'Live Stock' },
    { name: 'Mother Trees', href: '/farm' },
    { name: 'GI Heritage', href: '/about' },
    { name: 'Planting Guide', href: '/guide' },
    { name: 'Farmer Reviews', href: '/reviews' },
    { name: 'Track Order', href: '/tracking' },
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
                <span className="fw-bold fs-5 text-light d-block lh-1">Eathamozhy</span>
                <span className="text-secondary extra-small text-uppercase tracking-wider">Coconut Farm &bull; GI Tagged</span>
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

            {/* Action Buttons: WhatsApp & Book Now */}
            <div className="d-flex align-items-center gap-2">
              <a 
                href={`https://wa.me/${process.env.NEXT_PUBLIC_FARM_WHATSAPP || '919486880641'}?text=Hello%20Eathamozhy%20Farm,%20I%20am%20interested%20in%20coconut%20seedlings%20and%20saplings`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline-success border-success text-success fw-semibold d-none d-sm-inline-flex align-items-center gap-1 px-3 py-2 rounded-3"
                title="Direct WhatsApp Help"
              >
                <i className="bi bi-whatsapp"></i>
                <span>Chat</span>
              </a>

              <Link 
                href="/batches" 
                className="btn-emerald text-decoration-none text-white small fw-bold px-3 py-2 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
              >
                <i className="bi bi-bag-check-fill"></i>
                <span className="d-none d-sm-inline">Book Saplings</span>
                <span className="d-sm-none">Book</span>
              </Link>

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
            <span className="extra-small mt-1">Home</span>
          </Link>

          <Link 
            href="/batches" 
            className={`text-decoration-none mobile-nav-link d-flex flex-column align-items-center ${pathname.startsWith('/batches') ? 'active' : 'text-light opacity-75'}`}
          >
            <i className="bi bi-grid-fill fs-5"></i>
            <span className="extra-small mt-1">Batches</span>
          </Link>

          <Link 
            href="/farm" 
            className={`text-decoration-none mobile-nav-link d-flex flex-column align-items-center ${pathname.startsWith('/farm') ? 'active' : 'text-light opacity-75'}`}
          >
            <i className="bi bi-tree fs-5"></i>
            <span className="extra-small mt-1">Mother Trees</span>
          </Link>

          <Link 
            href="/tracking" 
            className={`text-decoration-none mobile-nav-link d-flex flex-column align-items-center ${pathname.startsWith('/tracking') ? 'active' : 'text-light opacity-75'}`}
          >
            <i className="bi bi-truck fs-5"></i>
            <span className="extra-small mt-1">Track</span>
          </Link>

          <a 
            href="https://wa.me/919486880641" 
            target="_blank" 
            rel="noreferrer"
            className="text-decoration-none mobile-nav-link d-flex flex-column align-items-center text-success"
          >
            <i className="bi bi-whatsapp fs-5"></i>
            <span className="extra-small mt-1">Chat</span>
          </a>
        </div>
      </nav>
    </>
  );
}
