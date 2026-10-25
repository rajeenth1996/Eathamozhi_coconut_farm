'use client';

import { useEffect, useRef } from 'react';

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.defaultMuted = true;
      video.muted = true;
      // Guarantee autoplay across all desktop & mobile browsers
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback if low power mode or battery saver restricts autoplay
        });
      }
    }
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      poster="/images/placeholder.png"
      className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
      style={{
        zIndex: 0,
        filter: 'brightness(0.58) saturate(1.2) contrast(1.05)',
        pointerEvents: 'none',
      }}
    >
      <source src="/images/placeholder_video.mp4" type="video/mp4" />
    </video>
  );
}
