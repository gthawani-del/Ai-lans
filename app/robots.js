const SITE_URL = 'https://weareailabs.com';

export default function robots() {
  return {
    // Public application pages must remain crawlable so crawlers can observe
    // their noindex metadata. Robots.txt is not an access-control mechanism.
    rules: [{ userAgent: '*', allow: '/', disallow: ['/backoffice/', '/api/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
