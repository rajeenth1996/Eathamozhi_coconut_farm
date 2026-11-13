'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  videoPosition = 1
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupCoords, setPopupCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Open In-Place Popup anchored to this exact card's bounding box
  const openPopup = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const targetWidth = Math.min(window.innerWidth - 24, Math.max(rect.width + 40, 420));
      const targetHeight = Math.min(window.innerHeight - 30, Math.max(rect.height + 150, 420));

      let left = rect.left + (rect.width - targetWidth) / 2;
      let top = rect.top + (rect.height - targetHeight) / 2;

      // Clamp coordinates within visible screen
      left = Math.max(12, Math.min(window.innerWidth - targetWidth - 12, left));
      top = Math.max(12, Math.min(window.innerHeight - targetHeight - 12, top));

      setPopupCoords({ top, left, width: targetWidth, height: targetHeight });
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

  // Close with Escape key or keyboard navigation
  useEffect(() => {
    if (!isPopupOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPopupOpen(false);
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPopupOpen, nextSlide, prevSlide]);

  if (!slides || slides.length === 0) {
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
        @keyframes popIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {/* ─── CARD VIEW CAROUSEL (IN-PLACE) ─────────────────────────────────── */}
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
            title={currentSlide.type === 'video' ? 'YouTube Video Slide' : 'Click to pop up full uncropped photo'}
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

            {/* Slide Type & Counter Badge (e.g. Video 1/3 or Photo 2/3) */}
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

            {/* In-Place Pop-up Trigger Pill (Hover / Resting) */}
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
                title="Pop up full media viewer"
              >
                <i className="bi bi-arrows-angle-expand text-success"></i>
                <span>Pop up</span>
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

        {/* Optional Card Bottom Thumbnails Strip */}
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

      {/* ─── IN-PLACE POP-UP VIEWER (ANCHORED RIGHT WHERE IT IS) ───────────── */}
      {isPopupOpen && popupCoords && (
        <>
          {/* Subtle transparent click-interceptor */}
          <div 
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ 
              zIndex: 1040, 
              backgroundColor: 'rgba(0, 0, 0, 0.45)', 
              backdropFilter: 'blur(3px)' 
            }}
            onClick={closePopup}
          />

          {/* Floating In-Place Pop-up Card */}
          <div 
            className="position-fixed d-flex flex-column rounded-4 overflow-hidden shadow-lg"
            style={{ 
              top: `${popupCoords.top}px`,
              left: `${popupCoords.left}px`,
              width: `${popupCoords.width}px`,
              height: `${popupCoords.height}px`,
              zIndex: 1050,
              backgroundColor: '#0a1219',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.12)',
              animation: 'popIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Popup Header */}
            <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-dark bg-opacity-75 border-bottom border-secondary border-opacity-25 flex-shrink-0">
              <div className="text-truncate me-2">
                {currentSlide.type === 'video' ? (
                  <span className="badge bg-danger text-white border border-danger extra-small me-2">
                    <i className="bi bi-youtube me-1"></i> YouTube Video
                  </span>
                ) : (
                  <span className="badge bg-success bg-opacity-25 text-success border border-success extra-small me-2">
                    Full Photo
                  </span>
                )}
                <strong className="text-light small text-truncate align-middle">{title}</strong>
                {subtitle && <small className="text-muted extra-small ms-2 d-none d-sm-inline">({subtitle})</small>}
              </div>

              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                <span className="badge bg-secondary bg-opacity-50 text-light extra-small">
                  {activeIndex + 1} / {slides.length}
                </span>
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline-light rounded-circle p-0 d-flex align-items-center justify-content-center"
                  style={{ width: '28px', height: '28px' }}
                  onClick={closePopup}
                  title="Close (Esc)"
                >
                  <i className="bi bi-x-lg fw-bold" style={{ fontSize: '0.75rem' }}></i>
                </button>
              </div>
            </div>

            {/* Popup Media Frame (Photo or Video Player) */}
            <div className="position-relative flex-grow-1 w-100 overflow-hidden d-flex align-items-center justify-content-center p-2 bg-black">
              {currentSlide.type === 'video' ? (
                <div className="ratio ratio-16x9 w-100" style={{ maxHeight: '100%' }}>
                  <iframe
                    src={`${currentSlide.url}&autoplay=1`}
                    title={`${title} - Video Player`}
                    className="w-100 h-100 border-0 rounded-3 shadow"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <img 
                  src={currentSlide.url} 
                  alt={`${title} - full view ${activeIndex + 1}`}
                  className="w-100 h-100"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.png'; }}
                  style={{ 
                    objectFit: 'contain',
                    objectPosition: 'center',
                    display: 'block'
                  }}
                />
              )}

              {/* Prev Button */}
              {slides.length > 1 && (
                <button 
                  type="button"
                  className="btn btn-dark btn-sm rounded-circle position-absolute start-0 top-50 translate-middle-y ms-2 z-3 shadow border border-secondary border-opacity-50 d-flex align-items-center justify-content-center p-0"
                  style={{ width: '36px', height: '36px', backgroundColor: 'rgba(15, 23, 42, 0.85)' }}
                  onClick={prevSlide}
                  title="Previous (←)"
                >
                  <i className="bi bi-chevron-left text-white fs-5"></i>
                </button>
              )}

              {/* Next Button */}
              {slides.length > 1 && (
                <button 
                  type="button"
                  className="btn btn-dark btn-sm rounded-circle position-absolute end-0 top-50 translate-middle-y me-2 z-3 shadow border border-secondary border-opacity-50 d-flex align-items-center justify-content-center p-0"
                  style={{ width: '36px', height: '36px', backgroundColor: 'rgba(15, 23, 42, 0.85)' }}
                  onClick={nextSlide}
                  title="Next (→)"
                >
                  <i className="bi bi-chevron-right text-white fs-5"></i>
                </button>
              )}
            </div>

            {/* Popup Footer: Thumbnail Carousel Strip (when >1 slide) */}
            {slides.length > 1 && (
              <div className="p-2 bg-dark bg-opacity-90 border-top border-secondary border-opacity-25 flex-shrink-0 text-center">
                <div className="d-inline-flex gap-2 overflow-x-auto justify-content-center" style={{ maxWidth: '100%' }}>
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
                      style={{ width: '48px', height: '36px', transition: 'all 0.2s ease', backgroundColor: '#000' }}
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
          </div>
        </>
      )}
    </>
  );
}
