import VolunteerHome from './VolunteerHome';
import './volunteer.css';

export const metadata = {
  title: 'Volunteer with weareailabs',
  description: 'Help participants turn real business ideas into working AI projects. Technical, creative and operational backgrounds are welcome.',
  alternates: { canonical: '/volunteer' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Volunteer with weareailabs',
    description: 'Help participants turn real business ideas into working AI projects. Technical, creative and operational backgrounds are welcome.',
    type: 'website',
    locale: 'en_IN',
    images: [{ url: '/brand/weareailabs-volunteer.webp', width: 240, height: 130, alt: 'weareailabs volunteer programme' }],
  },
  twitter: { card: 'summary_large_image', title: 'Volunteer with weareailabs', images: ['/brand/weareailabs-volunteer.webp'] },
};

export default function VolunteerPage() {
  return <div className="volunteerHome"><VolunteerHome /></div>;
}
