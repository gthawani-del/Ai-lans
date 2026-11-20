export const metadata = {
  title: 'Registration form test | weareailabs',
  description: 'Private test route for the weareailabs registration form.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://weareailabs.com/register-rhf-test' },
  openGraph: {
    title: 'Registration form test | weareailabs',
    description: 'Private test route for the weareailabs registration form.',
    url: 'https://weareailabs.com/register-rhf-test',
    type: 'website',
    images: [{ url: 'https://weareailabs.com/brand/weareailabs-home.webp', alt: 'weareailabs' }],
  },
  twitter: { card: 'summary_large_image', title: 'Registration form test | weareailabs', description: 'Private test route for the weareailabs registration form.', images: ['https://weareailabs.com/brand/weareailabs-home.webp'] },
};

export default function RegistrationProbeLayout({ children }) {
  return children;
}
