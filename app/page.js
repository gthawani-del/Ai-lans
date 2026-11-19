import HomePage from './HomePage';
import { createPageMetadata } from '../lib/seo';

const socialProfiles = [
  'https://www.facebook.com/weareailabs',
  'https://www.youtube.com/@weare_ailabs',
];

export const metadata = createPageMetadata({
  path: '/',
  title: 'weareailabs | Hands-on AI Business Workshop',
  description: 'Turn real business problems into working AI solutions. A hands-on Mumbai workshop for founders, CXOs and business leaders. Dates to be announced.',
  seo: { og_description: 'Stop learning about AI. Start building with it. Mumbai — dates to be announced.' },
  defaultImage: { src: '/brand/weareailabs-home.webp', alt: 'weareailabs — Explore Learn Create Together' },
  indexable: true,
  follow: true,
});

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
