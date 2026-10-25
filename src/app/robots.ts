import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eathamozhycoconutfarm.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/farmops-8x9k2'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
