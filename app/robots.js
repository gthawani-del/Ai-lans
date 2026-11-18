const SITE_URL = 'https://weareailabs.com';

export default function robots(){
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/backoffice', '/api/', '/register', '/register-rhf-test', '/volunteer/apply'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
