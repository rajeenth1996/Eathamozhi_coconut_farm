'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface YouTubeVideoItem {
  id: string;
  title: string;
  url: string;
  videoId?: string;
  order: number;
  isVisible: boolean;
}

export default function YouTubeSection() {
  const { isTamil } = useLanguage();
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/youtube')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setVideos(data.filter((v: any) => v.isVisible !== false));
        }
      })
      .catch(err => console.error('Failed to load YouTube videos:', err))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && videos.length === 0) {
    return null;
  }

  return (
    <section className="py-5 bg-white border-top border-bottom position-relative">
      <div className="container py-3">
        {/* Section Header with Authentic Farm Aesthetic */}
        <div className="text-center mb-5">
          <div className="d-inline-flex align-items-center gap-2 mb-2">
            <span className="badge-farm-pill d-inline-flex align-items-center gap-1 shadow-sm">
              <i className="bi bi-youtube text-danger"></i>{' '}
              {isTamil ? 'நேரடி பண்ணை வீடியோக்கள் & களப்பயணம்' : 'FARM VIDEO TOURS & HARVESTS'}
            </span>
          </div>
          <h2 className="display-6 fw-bold text-dark mb-2">
            {isTamil 
              ? 'எங்கள் தோப்பு, காய் அறுவடை & நாற்றுப்பண்ணை நேரலை காட்சிகள்' 
              : 'See Our Grove, Harvest & Nursery in Action'}
          </h2>
          <p className="lead text-secondary opacity-90 mx-auto" style={{ maxWidth: '720px', fontSize: '1.08rem' }}>
            {isTamil 
              ? 'கன்னியாகுமரி பாரம்பரிய பண்ணை, தாய் மர தேர்வு மற்றும் நாற்று பார்சல் பேக்கிங் முறைகளை நேரடி வீடியோவில் பாருங்கள்.' 
              : 'Watch genuine walkthroughs of our ancestral coconut farm in Kanyakumari — from tree-climbing harvests and mother tree selection to live sapling packaging.'}
          </p>
        </div>

        {/* Video Cards Grid */}
        <div className="row g-4 justify-content-center">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-light p-3 placeholder-glow">
                  <div className="rounded-3 bg-secondary bg-opacity-25 mb-3" style={{ height: '210px' }}></div>
                  <span className="placeholder col-8 mb-2"></span>
                  <span className="placeholder col-5"></span>
                </div>
              </div>
            ))
          ) : (
            videos.map((video) => {
              const videoId = video.videoId || extractId(video.url);
              const isPlaying = activePlayingId === video.id;
              const thumbnailUrl = videoId
                ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                : '/images/placeholder.png';

              return (
                <div key={video.id} className="col-md-6 col-lg-4">
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-lift bg-white d-flex flex-column transition-all">
                    {/* Video Player or Thumbnail Box */}
                    <div
                      className="position-relative overflow-hidden w-100"
                      style={{
                        paddingTop: '56.25%', // 16:9 Aspect Ratio
                        backgroundColor: '#0c1a15'
                      }}
                    >
                      {isPlaying && videoId ? (
                        <iframe
                          className="position-absolute top-0 start-0 w-100 h-100 border-0"
                          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                          title={video.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : (
                        <div
                          className="position-absolute top-0 start-0 w-100 h-100 cursor-pointer group"
                          onClick={() => videoId && setActivePlayingId(video.id)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Play video: ${video.title}`}
                          style={{
                            backgroundImage: `url(${thumbnailUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
                          {/* Ambient Dark Gradient for Legibility */}
                          <div
                            className="position-absolute top-0 start-0 w-100 h-100"
                            style={{
                              background: 'linear-gradient(180deg, rgba(2,25,18,0.2) 0%, rgba(2,19,14,0.65) 100%)'
                            }}
                          />

                          {/* Top Badges */}
                          <div className="position-absolute top-0 start-0 m-3 z-2">
                            <span className="badge bg-dark bg-opacity-75 text-light px-2 py-1 extra-small border border-secondary border-opacity-50">
                              <i className="bi bi-camera-video me-1 text-success"></i> Farm Tour
                            </span>
                          </div>

                          {/* Large Centered Play Button */}
                          <div
                            className="position-absolute top-50 start-50 translate-middle z-2 d-flex align-items-center justify-content-center"
                            style={{
                              width: '68px',
                              height: '68px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(220, 38, 38, 0.95)',
                              boxShadow: '0 8px 24px rgba(220, 38, 38, 0.45)',
                              transition: 'transform 0.2s ease, background-color 0.2s ease'
                            }}
                          >
                            <i className="bi bi-play-fill text-white fs-1 ms-1"></i>
                          </div>

                          {/* Bottom Click-to-Play Indicator */}
                          <div className="position-absolute bottom-0 start-0 w-100 p-2 text-center z-2">
                            <span className="badge bg-black bg-opacity-75 text-white extra-small py-1 px-2 rounded-pill">
                              <i className="bi bi-play-circle me-1 text-danger"></i> Click to play video
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Content Footer */}
                    <div className="card-body p-4 d-flex flex-column justify-content-between flex-grow-1">
                      <div>
                        <h5 className="fw-bold text-dark mb-2 fs-6 line-clamp-2" style={{ minHeight: '44px' }}>
                          {video.title}
                        </h5>
                        <small className="text-muted extra-small d-block mb-3">
                          <i className="bi bi-shield-check text-success me-1"></i> Certified Eathamozhi Coconut Farm Production
                        </small>
                      </div>

                      <div className="d-flex justify-content-between align-items-center pt-3 border-top border-light gap-2">
                        {isPlaying ? (
                          <button
                            type="button"
                            onClick={() => setActivePlayingId(null)}
                            className="btn btn-sm btn-outline-secondary extra-small fw-semibold py-1 px-2"
                          >
                            <i className="bi bi-x-circle me-1"></i> {isTamil ? 'வீடியோவை மூடுக' : 'Close Video'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => videoId && setActivePlayingId(video.id)}
                            className="btn btn-sm btn-success extra-small fw-bold py-1 px-3 rounded-pill shadow-sm"
                          >
                            <i className="bi bi-play-fill me-1"></i> {isTamil ? 'இப்போதே பார்க்க' : 'Watch Now'}
                          </button>
                        )}

                        <a
                          href={video.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-danger extra-small fw-semibold py-1 px-2 rounded-pill d-inline-flex align-items-center gap-1"
                        >
                          <i className="bi bi-youtube"></i> YouTube
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Channel Link Prompt */}
        <div className="text-center mt-5 pt-2">
          <div className="d-inline-flex flex-wrap align-items-center justify-content-center gap-2 p-3 bg-light rounded-4 border">
            <span className="small text-secondary fw-semibold">
              <i className="bi bi-bell-fill text-danger me-1"></i>{' '}
              {isTamil ? 'தென்னை விவசாய குறிப்புகள் & புதிய பதிவுகளை பெற:' : 'Want more coconut farming tips & harvest updates?'}
            </span>
            <a
              href="https://www.youtube.com/@eathamozhicoconutfarm"
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-danger fw-bold px-3 py-1 rounded-pill d-inline-flex align-items-center gap-1 shadow-sm"
            >
              <i className="bi bi-youtube"></i> {isTamil ? 'சேனலை சப்ஸ்கிரைப் செய்க' : 'Subscribe on YouTube'}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function extractId(url?: string): string | null {
  if (!url) return null;
  const str = url.trim();
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/,
    /^([\w-]{11})$/
  ];
  for (const regex of patterns) {
    const match = str.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}
