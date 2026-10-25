'use client';

import Script from 'next/script';

export default function ExternalAnalytics() {
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
  // GA Measurement ID – safe to publish; visible in every page source anyway
  const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-MY74CYP729';

  return (
    <>
      {/* 1. Google Analytics 4 – gtag.js snippet (loads on every page) */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `,
        }}
      />

      {/* 2. Microsoft Clarity – Heatmaps & Session Replays (optional, env-gated) */}
      {clarityId && (
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
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
