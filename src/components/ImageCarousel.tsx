'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { extractYouTubeVideoId } from '@/lib/types';

export interface ImageCarouselProps {
  images: string[];
  title: string;
  subtitle?: string;
  carouselId?: string;
  height?: string;
  showThumbnails?: boolean;
  objectFit?: 'contain' | 'cover';
  className?: string;
  onClose?: () => void;
  videoUrl?: string;
  videoId?: string;
  videoPosition?: number; // 1-based position in carousel
  initialModalOpen?: boolean;
}

interface CarouselSlide {
  type: 'image' | 'video';
  url: string;
  thumbUrl: string;
  videoId?: string;
}

export default function ImageCarousel({ 
  images, 
  title, 
  subtitle,
  carouselId = 'imageCarousel',
  height = '240px',
  showThumbnails = true,
  objectFit = 'cover',
  className = '',
  onClose,
  videoUrl,
  videoId,
  videoPosition = 1,
  initialModalOpen
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  // If onClose is provided (e.g. from admin table preview), automatically open the full size viewer
  const isDirectModalMode = Boolean(onClose || initialModalOpen);
  const [isPopupOpen, setIsPopupOpen] = useState(isDirectModalMode);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Normalize images array and filter empty items
  const validImages = Array.isArray(images) && images.length > 0 
    ? images.filter(Boolean) 
    : ['/images/placeholder.png'];

  const resolvedVideoId = videoId || extractYouTubeVideoId(videoUrl);

  // Construct combined slides (Photos + Video at specified position)
  const slides: CarouselSlide[] = [];
  const imageSlides: CarouselSlide[] = validImages.map(img => ({
    type: 'image',
    url: img,
    thumbUrl: img
  }));

  if (resolvedVideoId) {
    const videoSlide: CarouselSlide = {
      type: 'video',
      url: `https://www.youtube-nocookie.com/embed/${resolvedVideoId}?rel=0&modestbranding=1`,
      thumbUrl: `https://img.youtube.com/vi/${resolvedVideoId}/hqdefault.jpg`,
      videoId: resolvedVideoId
    };
    const targetPos = Math.max(1, Math.min(Number(videoPosition) || 1, imageSlides.length + 1));
    imageSlides.splice(targetPos - 1, 0, videoSlide);
  }
  slides.push(...imageSlides);

  const nextSlide = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const openPopup = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsPopupOpen(true);
  };

  const closePopup = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsPopupOpen(false);
    onClose?.();
  };

  // Lock body scroll and listen for keyboard navigation when modal is open
  useEffect(() => {
    if (!isPopupOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePopup();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPopupOpen, nextSlide, prevSlide]);

  if (!slides || slides.length === 0) {
    if (isDirectModalMode) return null;
    return (
      <div 
        className={`bg-dark text-center rounded-4 text-muted d-flex flex-column align-items-center justify-content-center w-100 ${className}`}
        style={{ height }}
      >
        <i className="bi bi-image fs-1 d-block mb-1 text-secondary opacity-50"></i>
        <small className="fw-semibold">No media available</small>
      </div>
    );
  }

  const currentSlide = slides[activeIndex] || slides[0];

  return (
    <>
      <style jsx>{`
        .carousel-card-wrap {
          position: relative;
          background: #0f172a;
          overflow: hidden;
          transition: box-shadow 0.2s ease;
        }
        .carousel-card-wrap:hover .hover-btn-fade {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .carousel-card-wrap:hover .arrow-nav-fade {
          opacity: 1 !important;
        }
        .carousel-thumb-btn:hover {
          opacity: 1 !important;
        }
        @keyframes fadeInLight {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .lightbox-dialog {
          animation: fadeInLight 0.15s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* ─── CARD VIEW CAROUSEL (IN-PAGE EMBEDDED) ───────────────────────── */}
      {!isDirectModalMode && (
        <div className="w-100">
          <div 
            ref={containerRef}
            className={`carousel-card-wrap rounded-4 w-100 shadow-sm ${className}`}
            style={{ height, minHeight: height, maxHeight: height }}
          >
            {/* Main Slide Clickable Frame */}
            <div 
              className="position-relative w-100 h-100 d-flex align-items-center justify-content-center"
              style={{ cursor: currentSlide.type === 'video' ? 'default' : 'pointer' }}
              onClick={currentSlide.type === 'video' ? undefined : openPopup}
              title={currentSlide.type === 'video' ? 'YouTube Video Slide' : 'Click to view full uncropped photo'}
            >
              {currentSlide.type === 'video' ? (
                <div className="w-100 h-100 position-relative bg-black d-flex align-items-center justify-content-center">
                  <iframe
                    src={`${currentSlide.url}&enablejsapi=1`}
                    title={`${title} - Video Tour`}
                    className="w-100 h-100 border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <img 
                  src={currentSlide.url} 
                  alt={`${title} - slide ${activeIndex + 1}`} 
                  className="w-100 h-100"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.png'; }}
                  style={{ 
                    objectFit: objectFit,
                    objectPosition: 'center',
                    display: 'block',
                    transition: 'opacity 0.2s ease'
                  }}
                />
              )}

              {/* Slide Type & Counter Badge */}
              <div className="position-absolute top-0 start-0 m-2 z-2" style={{ pointerEvents: 'none' }}>
                {currentSlide.type === 'video' ? (
                  <span className="badge bg-danger text-white px-2 py-1 rounded-pill extra-small border border-danger shadow-sm">
                    <i className="bi bi-youtube me-1"></i> Video {activeIndex + 1}/{slides.length}
                  </span>
                ) : (
                  <span className="badge bg-dark bg-opacity-80 text-white px-2 py-1 rounded-pill extra-small border border-secondary border-opacity-50">
                    <i className="bi bi-camera-fill me-1 text-warning"></i> {activeIndex + 1}/{slides.length}
                  </span>
                )}
              </div>

              {/* Full Size Pop-up Trigger Button */}
              <div 
                className="position-absolute top-0 end-0 m-2 z-2 hover-btn-fade"
                style={{ 
                  opacity: 0.85, 
                  transform: 'translateY(-2px)', 
                  transition: 'all 0.2s ease', 
                  pointerEvents: 'auto' 
                }}
              >
                <button 
                  type="button"
                  className="btn btn-sm btn-dark bg-opacity-85 text-white rounded-pill px-2 py-1 extra-small shadow-sm border border-light border-opacity-25 d-flex align-items-center gap-1"
                  onClick={openPopup}
                  title="Open full size viewer"
                >
                  <i className="bi bi-arrows-angle-expand text-success"></i>
                  <span>Full Size</span>
                </button>
              </div>

              {/* Previous Slide Arrow Button */}
              {slides.length > 1 && (
                <button 
                  type="button"
                  className="btn btn-dark btn-sm rounded-circle position-absolute start-0 top-50 translate-middle-y ms-2 z-3 shadow bg-opacity-75 border-0 d-flex align-items-center justify-content-center p-0 arrow-nav-fade"
                  style={{ width: '32px', height: '32px', opacity: 0.8, transition: 'opacity 0.2s ease' }}
                  onClick={prevSlide}
                  title="Previous slide"
                >
                  <i className="bi bi-chevron-left text-white fs-6"></i>
                </button>
              )}

              {/* Next Slide Arrow Button */}
              {slides.length > 1 && (
                <button 
                  type="button"
                  className="btn btn-dark btn-sm rounded-circle position-absolute end-0 top-50 translate-middle-y me-2 z-3 shadow bg-opacity-75 border-0 d-flex align-items-center justify-content-center p-0 arrow-nav-fade"
                  style={{ width: '32px', height: '32px', opacity: 0.8, transition: 'opacity 0.2s ease' }}
                  onClick={nextSlide}
                  title="Next slide"
                >
                  <i className="bi bi-chevron-right text-white fs-6"></i>
                </button>
              )}

              {/* In-Card Indicator Dots */}
              {slides.length > 1 && (
                <div 
                  className="position-absolute bottom-0 start-50 translate-middle-x mb-2 z-2 d-flex align-items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {slides.map((slide, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`btn p-0 rounded-circle border-0 ${
                        i === activeIndex 
                          ? (slide.type === 'video' ? 'bg-danger' : 'bg-success') 
                          : (slide.type === 'video' ? 'bg-danger bg-opacity-50' : 'bg-white bg-opacity-50')
                      }`}
                      style={{ 
                        width: slide.type === 'video' ? '8px' : '6px', 
                        height: slide.type === 'video' ? '8px' : '6px', 
                        transition: 'all 0.2s ease' 
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveIndex(i);
                      }}
                      title={slide.type === 'video' ? `Video (Slide ${i + 1})` : `Photo ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card Bottom Thumbnails Strip */}
          {showThumbnails && slides.length > 1 && (
            <div className="mt-2 d-flex gap-2 overflow-x-auto py-1 justify-content-center" style={{ maxWidth: '100%' }}>
              {slides.map((slide, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`btn p-0 rounded-2 overflow-hidden flex-shrink-0 position-relative carousel-thumb-btn ${
                    idx === activeIndex
                      ? (slide.type === 'video' ? 'border border-2 border-danger shadow' : 'border border-2 border-success shadow')
                      : 'border border-secondary border-opacity-50 opacity-60'
                  }`}
                  onClick={() => setActiveIndex(idx)}
                  style={{ width: '56px', height: '40px', transition: 'all 0.2s ease', backgroundColor: '#000' }}
                  title={slide.type === 'video' ? `Play Video (Slide ${idx + 1})` : `Photo ${idx + 1}`}
                >
                  <img
                    src={slide.thumbUrl}
                    alt={`Thumb ${idx + 1}`}
                    className="w-100 h-100"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.png'; }}
                    style={{ objectFit: 'cover' }}
                  />
                  {slide.type === 'video' && (
                    <span
                      className="badge bg-danger position-absolute top-50 start-50 translate-middle py-0 px-1 extra-small shadow"
                      style={{ fontSize: '9px', lineHeight: '1.2' }}
                    >
                      <i className="bi bi-play-fill"></i> Video
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── FLICKER-FREE FULL-SIZE LIGHTBOX VIEWER VIA REACT PORTAL ─────── */}
      {mounted && isPopupOpen && createPortal(
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column"
          style={{ 
            zIndex: 100000, 
            backgroundColor: 'rgba(5, 10, 16, 0.94)', 
            overflow: 'hidden' 
          }}
          onClick={closePopup}
        >
          {/* Lightbox Header */}
          <div 
            className="d-flex justify-content-between align-items-center px-4 py-3 bg-dark bg-opacity-75 border-bottom border-secondary border-opacity-25 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-truncate me-3">
              {currentSlide.type === 'video' ? (
                <span className="badge bg-danger text-white border border-danger extra-small me-2">
                  <i className="bi bi-youtube me-1"></i> YouTube Video Tour
                </span>
              ) : (
                <span className="badge bg-success bg-opacity-25 text-success border border-success extra-small me-2">
                  <i className="bi bi-camera-fill me-1"></i> Full Size Photo
                </span>
              )}
              <strong className="text-light fs-6 text-truncate align-middle">{title}</strong>
              {subtitle && <span className="text-muted small ms-2 d-none d-sm-inline">({subtitle})</span>}
            </div>

            <div className="d-flex align-items-center gap-3 flex-shrink-0">
              <span className="badge bg-secondary bg-opacity-50 text-light px-3 py-2 small fw-semibold">
                {activeIndex + 1} / {slides.length}
              </span>
              <button 
                type="button" 
                className="btn btn-outline-light rounded-circle p-0 d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px' }}
                onClick={closePopup}
                title="Close Viewer (Esc)"
              >
                <i className="bi bi-x-lg fw-bold fs-6"></i>
              </button>
            </div>
          </div>

          {/* Lightbox Stage */}
          <div 
            className="position-relative flex-grow-1 w-100 d-flex align-items-center justify-content-center p-2 p-md-4"
            onClick={closePopup}
          >
            {/* Prev Button */}
            {slides.length > 1 && (
              <button 
                type="button"
                className="btn btn-dark rounded-circle position-absolute start-0 top-50 translate-middle-y ms-3 z-3 shadow-lg border border-secondary border-opacity-50 d-flex align-items-center justify-content-center p-0"
                style={{ width: '46px', height: '46px', backgroundColor: 'rgba(15, 23, 42, 0.85)' }}
                onClick={(e) => { e.stopPropagation(); prevSlide(e); }}
                title="Previous (←)"
              >
                <i className="bi bi-chevron-left text-white fs-4"></i>
              </button>
            )}

            {/* Next Button */}
            {slides.length > 1 && (
              <button 
                type="button"
                className="btn btn-dark rounded-circle position-absolute end-0 top-50 translate-middle-y me-3 z-3 shadow-lg border border-secondary border-opacity-50 d-flex align-items-center justify-content-center p-0"
                style={{ width: '46px', height: '46px', backgroundColor: 'rgba(15, 23, 42, 0.85)' }}
                onClick={(e) => { e.stopPropagation(); nextSlide(e); }}
                title="Next (→)"
              >
                <i className="bi bi-chevron-right text-white fs-4"></i>
              </button>
            )}

            {/* Content Frame */}
            <div 
              className="lightbox-dialog d-flex align-items-center justify-content-center w-100 h-100"
              onClick={(e) => e.stopPropagation()}
            >
              {currentSlide.type === 'video' ? (
                <div className="w-100" style={{ maxWidth: '980px', maxHeight: '82vh' }}>
                  <div className="ratio ratio-16x9 shadow-lg rounded-3 overflow-hidden border border-secondary border-opacity-50">
                    <iframe
                      src={`${currentSlide.url}&autoplay=1`}
                      title={`${title} - Video Player`}
                      className="w-100 h-100 border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              ) : (
                <img 
                  src={currentSlide.url} 
                  alt={`${title} - full view ${activeIndex + 1}`}
                  className="shadow-lg rounded-3"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.png'; }}
                  style={{ 
                    maxWidth: '92vw',
                    maxHeight: '82vh',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              )}
            </div>
          </div>

          {/* Lightbox Footer Thumbnails Strip */}
          {slides.length > 1 && (
            <div 
              className="p-3 bg-dark bg-opacity-90 border-top border-secondary border-opacity-25 flex-shrink-0 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="d-inline-flex gap-2 overflow-x-auto justify-content-center pb-1" style={{ maxWidth: '100%' }}>
                {slides.map((slide, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    className={`btn p-0 rounded-2 overflow-hidden flex-shrink-0 position-relative carousel-thumb-btn ${
                      idx === activeIndex 
                        ? (slide.type === 'video' ? 'border border-2 border-danger shadow-lg' : 'border border-2 border-success shadow-lg') 
                        : 'border border-secondary border-opacity-50 opacity-60'
                    }`}
                    onClick={() => setActiveIndex(idx)}
                    style={{ width: '56px', height: '40px', transition: 'all 0.2s ease', backgroundColor: '#000' }}
                    title={slide.type === 'video' ? `Video (Slide ${idx + 1})` : `Photo ${idx + 1}`}
                  >
                    <img 
                      src={slide.thumbUrl} 
                      alt={`Thumb ${idx + 1}`} 
                      className="w-100 h-100"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.png'; }}
                      style={{ objectFit: 'cover' }} 
                    />
                    {slide.type === 'video' && (
                      <span 
                        className="badge bg-danger position-absolute top-50 start-50 translate-middle py-0 px-1 extra-small shadow"
                        style={{ fontSize: '8px', lineHeight: '1' }}
                      >
                        ▶
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
