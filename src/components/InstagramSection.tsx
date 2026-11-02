'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface InstagramPost {
  id: string;
  title: string;
  url: string;
  order: number;
  isVisible: boolean;
}

export default function InstagramSection() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/instagram')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data.filter((p) => p.isVisible !== false));
        }
      })
      .catch((err) => console.error('Failed to load Instagram section:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || posts.length === 0) {
    return null;
  }

  // Format clean embed URL
  const getEmbedUrl = (rawUrl: string) => {
    try {
      const clean = rawUrl.split('?')[0].replace(/\/+$/, '');
      if (clean.includes('/reel/') || clean.includes('/p/')) {
        return `${clean}/embed`;
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  };

  return (
    <section className="py-5 bg-white border-top border-bottom">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-5">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-danger-subtle text-danger mb-2 small fw-bold">
            <i className="bi bi-instagram"></i>
            <span>WATCH US ON INSTAGRAM</span>
          </div>
          <h2 className="fw-bold text-dark display-6 mb-2">Live from Our Heritage Coconut Farm</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: '650px' }}>
            Watch harvesting traditions, mother palm climbing, seed nut selection, and nursery germination techniques
            direct from our ancestral groves.
          </p>
        </div>

        {/* Reels Grid */}
        <div className="row g-4 justify-content-center">
          {posts.map((post) => {
            const embedSrc = getEmbedUrl(post.url);
            return (
              <div key={post.id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 border rounded-4 overflow-hidden shadow-sm hover-lift transition-all bg-light">
                  {/* Reel Embed Container */}
                  <div className="position-relative bg-black" style={{ minHeight: '440px' }}>
                    <iframe
                      src={embedSrc}
                      className="w-100 h-100 border-0 position-absolute top-0 start-0"
                      title={post.title}
                      loading="lazy"
                      allowFullScreen
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    ></iframe>
                  </div>

                  {/* Reel Card Footer */}
                  <div className="card-body p-3 bg-white d-flex flex-column justify-content-between">
                    <div>
                      <h6 className="fw-bold text-dark mb-2 text-truncate-2" style={{ lineHeight: '1.4' }}>
                        {post.title}
                      </h6>
                    </div>
                    <div className="pt-2 border-top d-flex justify-content-between align-items-center mt-2">
                      <span className="small text-muted d-flex align-items-center gap-1">
                        <i className="bi bi-camera-reels-fill text-danger"></i>
                        <span>Heritage Reel</span>
                      </span>
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold extra-small d-inline-flex align-items-center gap-1"
                      >
                        <span>Watch on Instagram</span>
                        <i className="bi bi-box-arrow-up-right"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Instagram Follow CTA */}
        <div className="text-center mt-5">
          <a
            href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/eathamozhi_coconut_farm'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-danger btn-lg px-4 py-2 rounded-pill fw-bold shadow-sm d-inline-flex align-items-center gap-2"
          >
            <i className="bi bi-instagram fs-5"></i>
            <span>Follow @eathamozhi_coconut_farm on Instagram</span>
          </a>
        </div>
      </div>
    </section>
  );
}
