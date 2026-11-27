'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ExternalAnalytics() {
  const pathname = usePathname();
  const [shouldLoad, setShouldLoad] = useState(false);
  // GA Measurement ID – safe to publish; visible in every page source anyway
  const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-MY74CYP729';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = window.location.hostname;
    const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
    const isAdmin = pathname?.startsWith('/admin');
    setShouldLoad(!isLocalhost && !isAdmin && process.env.NODE_ENV === 'production');
  }, [pathname]);

  if (!shouldLoad) {
    return null;
  }

  return (
    <>
      {/* Google Analytics 4 – gtag.js snippet (production public pages only) */}
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `,
        }}
      />
    </>
  );
}
