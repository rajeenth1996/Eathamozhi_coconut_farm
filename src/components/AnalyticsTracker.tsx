'use client';

import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('eathamozhy_session_id');
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('eathamozhy_session_id', sid);
  }
  return sid;
}

function detectReferrerSource(rawReferrer: string): string {
  if (!rawReferrer) return 'Direct / Bookmark';
  const ref = rawReferrer.toLowerCase();
  if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'WhatsApp';
  if (ref.includes('google')) return 'Google Search';
  if (ref.includes('instagram')) return 'Instagram';
  if (ref.includes('facebook') || ref.includes('fb.com')) return 'Facebook';
  if (ref.includes('youtube')) return 'YouTube';
  if (ref.includes('t.co') || ref.includes('twitter') || ref.includes('x.com')) return 'X (Twitter)';
  try {
    const url = new URL(rawReferrer);
    return url.hostname.replace('www.', '');
  } catch {
    return 'Other Referral';
  }
}

function detectDevice(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function TrackerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string>('');

  useEffect(() => {
    // Avoid tracking admin or API routes to keep customer numbers pure
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api/')) {
      return;
    }

    const fullPath = searchParams && searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // Prevent duplicate ping for exact same path within component lifecycle
    if (lastTrackedPath.current === fullPath) {
      return;
    }
    lastTrackedPath.current = fullPath;

    const sessionId = getOrCreateSessionId();

    // Cache initial referrer across the session
    let initialReferrer = sessionStorage.getItem('eathamozhy_initial_referrer');
    if (!initialReferrer && document.referrer) {
      initialReferrer = document.referrer;
      sessionStorage.setItem('eathamozhy_initial_referrer', initialReferrer);
    }

    const rawRef = document.referrer || initialReferrer || '';
    const referrerSource = detectReferrerSource(rawRef);
    const device = detectDevice();
    const screenSize = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined;

    // Fire non-blocking beacon or fetch
    const payload = JSON.stringify({
      sessionId,
      path: pathname,
      title: typeof document !== 'undefined' ? document.title : '',
      referrer: rawRef,
      referrerSource,
      device,
      screenSize,
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics', blob);
    } else {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Silent failure for analytics
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerContent />
    </Suspense>
  );
}
