'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

export default function ExternalAnalytics() {
  const pathname = usePathname();
  // GA Measurement ID – safe to publish; visible in every page source anyway
  const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-MY74CYP729';
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID || 'zk6400exkb';

  // Never load analytics on admin pages to keep customer tracking clean
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* Google Analytics 4 – gtag.js snippet */}
      {gaId && (
        <>
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
      )}

      {/* Microsoft Clarity – Heatmaps & Session Replays */}
      {clarityId && (
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  if(c[a]) return;
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityId}");
            `,
          }}
        />
      )}
    </>
  );
}
