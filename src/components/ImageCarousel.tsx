'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ImageCarouselProps {
  images: string[];
  title: string;
  subtitle?: string;
  carouselId?: string;
  height?: string;
  showThumbnails?: boolean;
  objectFit?: 'cover' | 'contain';
  className?: string;
}

export default function ImageCarousel({ 
  images, 
  title, 
  subtitle,
  carouselId = 'imageCarousel',
  height = '320px',
  showThumbnails = true,
  objectFit = 'cover',
  className = ''
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Normalize images array and filter empty items
  const validImages = Array.isArray(images) && images.length > 0 
    ? images.filter(Boolean) 
    : ['/images/placeholder.png'];

  const nextSlide = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const prevSlide = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  // Keyboard navigation when full container modal is open
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Lock background scroll when viewing full image container
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isModalOpen, nextSlide, prevSlide]);

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 40) {
      if (diff < 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
  };

  if (!validImages || validImages.length === 0) {
    return (
      <div 
        className={`bg-light text-center rounded-4 text-muted d-flex flex-column align-items-center justify-content-center w-100 ${className}`}
        style={{ height }}
      >
        <i className="bi bi-image fs-1 d-block mb-1 text-secondary opacity-50"></i>
        <small className="fw-semibold">No images available</small>
      </div>
    );
  }

  const currentImage = validImages[activeIndex] || validImages[0];

  return (
    <>
      {/* ─── CARD VIEW CAROUSEL ──────────────────────────────────────────────── */}
      <div 
        className={`carousel-container position-relative rounded-4 overflow-hidden shadow-sm bg-dark w-100 ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main Slide Display */}
        <div 
          className="position-relative w-100 overflow-hidden bg-dark"
          style={{ 
            height, 
            minHeight: height, 
            maxHeight: height,
            cursor: 'pointer' 
          }}
          onClick={() => setIsModalOpen(true)}
          title="Click to view full uncropped image"
        >
          <img 
            src={currentImage} 
            alt={`${title} - photo ${activeIndex + 1}`} 
            className="w-100 h-100"
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.png'; }}
            style={{ 
              height: '100%', 
              width: '100%', 
              objectFit: objectFit,
              objectPosition: 'center',
              display: 'block',
              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.35s ease, opacity 0.2s ease-in-out'
            }}
          />

          {/* Photo Counter Overlay Badge */}
          <div className="position-absolute top-0 start-0 m-3 z-2">
            <span className="badge bg-dark bg-opacity-75 text-white px-2 py-1 rounded-pill extra-small shadow-sm border border-light border-opacity-25">
              <i className="bi bi-camera-fill me-1 text-warning"></i> {activeIndex + 1} / {validImages.length}
            </span>
          </div>

          {/* Hover Hint Overlay: "Click for Full Image" */}
          <div 
            className="position-absolute bottom-0 end-0 m-3 z-2 d-none d-sm-block"
            style={{
              opacity: isHovered ? 1 : 0.85,
              transition: 'all 0.25s ease'
            }}
          >
            <span className="badge bg-dark bg-opacity-80 text-white px-3 py-2 rounded-pill shadow-lg border border-light border-opacity-25 extra-small">
              <i className="bi bi-arrows-fullscreen me-1 text-success"></i> Full Image
            </span>
          </div>

          {/* Center Hover Action Pill */}
          {isHovered && (
            <div 
              className="position-absolute top-50 start-50 translate-middle z-2 pointer-events-none"
              style={{ pointerEvents: 'none' }}
            >
              <span className="badge bg-dark bg-opacity-85 text-white px-3 py-2 rounded-pill shadow-lg border border-success extra-small d-inline-flex align-items-center gap-1">
                <i className="bi bi-zoom-in text-success fs-6"></i>
                <span className="fw-semibold">Click to View Full Photo</span>
              </span>
            </div>
          )}

          {/* In-Card Carousel Navigation Arrows (when >1 image) */}
          {validImages.length > 1 && (
            <>
              <button 
                type="button"
                className="btn btn-dark btn-sm rounded-circle position-absolute top-50 start-0 translate-middle-y ms-2 z-2 shadow bg-opacity-75 hover-opacity-100 border-0 d-flex align-items-center justify-content-center p-0"
                onClick={prevSlide}
                aria-label="Previous photo"
                style={{ width: '34px', height: '34px' }}
                title="Previous photo"
              >
                <i className="bi bi-chevron-left fs-6 text-white"></i>
              </button>
              <button 
                type="button"
                className="btn btn-dark btn-sm rounded-circle position-absolute top-50 end-0 translate-middle-y me-2 z-2 shadow bg-opacity-75 hover-opacity-100 border-0 d-flex align-items-center justify-content-center p-0"
                onClick={nextSlide}
                aria-label="Next photo"
                style={{ width: '34px', height: '34px' }}
                title="Next photo"
              >
                <i className="bi bi-chevron-right fs-6 text-white"></i>
              </button>
            </>
          )}
        </div>

        {/* Thumbnails Navigation Row on Card */}
        {showThumbnails && validImages.length > 1 && (
          <div className="bg-dark p-2 border-top border-secondary border-opacity-50">
            <div className="d-flex gap-2 overflow-x-auto justify-content-center">
              {validImages.map((img, idx) => (
                <button 
                  key={idx}
                  type="button"
                  className={`btn p-0 border-2 rounded-2 overflow-hidden flex-shrink-0 ${
                    idx === activeIndex ? 'border-success' : 'border-transparent opacity-60'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(idx);
                  }}
                  style={{ width: '64px', height: '48px', transition: 'all 0.2s ease' }}
                  title={`View photo ${idx + 1}`}
                >
                  <img 
                    src={img} 
                    alt={`Thumbnail ${idx + 1}`} 
                    className="w-100 h-100"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.png'; }}
                    style={{ objectFit: 'cover', display: 'block' }} 
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── FULL IMAGE CONTAINER & LIGHTBOX CAROUSEL MODAL ────────────────── */}
      {isModalOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-between p-2 p-md-4"
          style={{ 
            zIndex: 99999,
            backgroundColor: 'rgba(8, 12, 16, 0.96)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          onClick={() => setIsModalOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Bar: Title, Counter & Controls */}
          <div 
            className="d-flex justify-content-between align-items-center w-100 px-3 py-2 rounded-4 bg-dark bg-opacity-75 border border-secondary border-opacity-25"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '1200px', margin: '0 auto' }}
          >
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              <span className="badge bg-success px-2 py-1 rounded-pill">
                <i className="bi bi-camera-fill me-1"></i> Full View
              </span>
              <div className="text-truncate">
                <h6 className="fw-bold text-white mb-0 text-truncate">{title}</h6>
                {subtitle && <small className="text-muted extra-small d-block text-truncate">{subtitle}</small>}
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-secondary bg-opacity-50 text-light px-3 py-2 rounded-pill font-monospace small">
                {activeIndex + 1} / {validImages.length}
              </span>
              <a 
                href={currentImage} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-sm btn-outline-light rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px' }}
                title="Open high-resolution photo in new tab"
                onClick={(e) => e.stopPropagation()}
              >
                <i className="bi bi-box-arrow-up-right"></i>
              </a>
              <button 
                type="button" 
                className="btn btn-sm btn-danger rounded-circle d-flex align-items-center justify-content-center shadow"
                style={{ width: '36px', height: '36px' }}
                onClick={() => setIsModalOpen(false)}
                title="Close (Esc)"
              >
                <i className="bi bi-x-lg fw-bold"></i>
              </button>
            </div>
          </div>

          {/* Center Image Container: 100% UNVROPPED FULL IMAGE WITH OBJECT-FIT: CONTAIN */}
          <div 
            className="position-relative flex-grow-1 d-flex align-items-center justify-content-center my-2 my-md-3 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Slide Button */}
            {validImages.length > 1 && (
              <button 
                type="button"
                className="btn btn-dark btn-lg rounded-circle position-absolute start-0 top-50 translate-middle-y ms-2 ms-md-4 z-3 shadow-lg border border-secondary border-opacity-50 d-flex align-items-center justify-content-center"
                style={{ width: '50px', height: '50px', backgroundColor: 'rgba(20, 25, 30, 0.85)' }}
                onClick={prevSlide}
                title="Previous photo (Left Arrow)"
              >
                <i className="bi bi-chevron-left text-white fs-4"></i>
              </button>
            )}

            {/* The Full Uncropped Image */}
            <div 
              className="d-flex align-items-center justify-content-center w-100 h-100 p-2"
              style={{ maxHeight: '78vh' }}
            >
              <img 
                src={currentImage} 
                alt={`${title} - full view ${activeIndex + 1}`}
                className="img-fluid rounded-4 shadow-lg"
                onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.png'; }}
                style={{ 
                  maxHeight: '76vh',
                  maxWidth: '92vw',
                  objectFit: 'contain',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  transition: 'transform 0.2s ease'
                }}
              />
            </div>

            {/* Next Slide Button */}
            {validImages.length > 1 && (
              <button 
                type="button"
                className="btn btn-dark btn-lg rounded-circle position-absolute end-0 top-50 translate-middle-y me-2 me-md-4 z-3 shadow-lg border border-secondary border-opacity-50 d-flex align-items-center justify-content-center"
                style={{ width: '50px', height: '50px', backgroundColor: 'rgba(20, 25, 30, 0.85)' }}
                onClick={nextSlide}
                title="Next photo (Right Arrow)"
              >
                <i className="bi bi-chevron-right text-white fs-4"></i>
              </button>
            )}
          </div>

          {/* Bottom Bar: Thumbnails Strip Carousel & Navigation Hint */}
          <div 
            className="w-100 text-center"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '1200px', margin: '0 auto' }}
          >
            {validImages.length > 1 && (
              <div 
                className="d-inline-flex gap-2 p-2 rounded-4 bg-dark bg-opacity-75 border border-secondary border-opacity-25 overflow-x-auto shadow"
                style={{ maxWidth: '95vw' }}
              >
                {validImages.map((img, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    className={`btn p-0 rounded-3 overflow-hidden flex-shrink-0 transition-all ${
                      idx === activeIndex 
                        ? 'border-2 border-success shadow' 
                        : 'border border-secondary border-opacity-50 opacity-60'
                    }`}
                    onClick={() => setActiveIndex(idx)}
                    style={{ 
                      width: '70px', 
                      height: '52px', 
                      transform: idx === activeIndex ? 'scale(1.08)' : 'scale(1)',
                      boxShadow: idx === activeIndex ? '0 0 12px rgba(16, 185, 129, 0.6)' : 'none'
                    }}
                    title={`Go to photo ${idx + 1}`}
                  >
                    <img 
                      src={img} 
                      alt={`Thumbnail ${idx + 1}`} 
                      className="w-100 h-100"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.png'; }}
                      style={{ objectFit: 'cover', display: 'block' }} 
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2 text-muted extra-small">
              <i className="bi bi-keyboard me-1"></i> Use <kbd className="bg-secondary text-white px-1 rounded">←</kbd> <kbd className="bg-secondary text-white px-1 rounded">→</kbd> to browse • Press <kbd className="bg-secondary text-white px-1 rounded">Esc</kbd> to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}
