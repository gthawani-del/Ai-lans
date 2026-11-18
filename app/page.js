import HomePage from './HomePage';

const socialProfiles = [
  'https://www.facebook.com/weareailabs',
  'https://www.youtube.com/@weare_ailabs',
];

export const metadata = {
  metadataBase: new URL('https://weareailabs.com'),
  alternates: { canonical: '/' },
  title: 'weareailabs | Hands-on AI Business Workshop',
  description: 'Turn real business problems into working AI solutions. A hands-on Mumbai workshop for founders, CXOs and business leaders. Dates to be announced.',
  openGraph: {
    title: 'weareailabs | Hands-on AI Business Workshop',
    description: 'Stop learning about AI. Start building with it. Mumbai — dates to be announced.',
    type: 'website',
    locale: 'en_IN',
    images: [{ url: '/brand/weareailabs-home.webp', width: 1983, height: 793, alt: 'weareailabs — Explore Learn Create Together' }]
  },
  twitter: { card: 'summary_large_image', title: 'weareailabs | Hands-on AI Business Workshop', description: 'Stop learning about AI. Start building with it. Mumbai — dates to be announced.', images: ['/brand/weareailabs-home.webp'] }
};

export default function Page() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://weareailabs.com/#organization',
        name: 'weareailabs',
        url: 'https://weareailabs.com/',
        logo: { '@type': 'ImageObject', url: 'https://weareailabs.com/brand/weareailabs-home.webp' },
        sameAs: socialProfiles,
      },
      {
        '@type': 'WebSite',
        '@id': 'https://weareailabs.com/#website',
        url: 'https://weareailabs.com/',
        name: 'weareailabs',
        inLanguage: 'en-IN',
        publisher: { '@id': 'https://weareailabs.com/#organization' },
      },
      {
        '@type': 'WebPage',
        '@id': 'https://weareailabs.com/#webpage',
        url: 'https://weareailabs.com/',
        name: 'weareailabs | Hands-on AI Business Workshop',
        isPartOf: { '@id': 'https://weareailabs.com/#website' },
        about: { '@id': 'https://weareailabs.com/#organization' },
        inLanguage: 'en-IN',
      },
    ],
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} /><HomePage /></>;
}
