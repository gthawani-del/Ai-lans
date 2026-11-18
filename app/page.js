import HomePage from './HomePage';

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
  twitter: { card: 'summary_large_image', title: 'weareailabs | Hands-on AI Business Workshop', images: ['/brand/weareailabs-home.webp'] }
};

export default function Page() { return <HomePage/>; }
