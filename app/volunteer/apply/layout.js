import Image from 'next/image';
import Link from 'next/link';
import './theme.css';
import SocialLinks from '../../../components/SocialLinks';

const title = 'Volunteer application | weareailabs';
const description = 'Apply to support weareailabs participants with technical, creative or operational skills.';
export const metadata = { title, description, alternates: { canonical: '/volunteer/apply' }, robots: { index: false, follow: false }, openGraph: { title, description, type: 'website', images: ['/brand/weareailabs-volunteer.webp'] }, twitter: { card: 'summary_large_image', title, description, images: ['/brand/weareailabs-volunteer.webp'] } };

export default function VolunteerApplicationLayout({ children }) {
  return <div className="volunteerFormTheme" style={{ '--vf-sans': 'system-ui, -apple-system, Segoe UI, sans-serif', '--vf-serif': 'Georgia, serif' }}>
    <a className="vf-skip" href="#volunteer-application">Skip to application</a>
    <header className="vf-brand-header">
      <Link href="/volunteer" aria-label="weareailabs volunteer home"><Image src="/brand/weareailabs-volunteer.webp" alt="weareailabs — Explore. Learn. Create. Together." width={200} height={110} priority /></Link>
      <Link href="/volunteer">← Volunteer benefits</Link>
    </header>
    <div id="volunteer-application">{children}</div>
    <footer className="vf-social-footer"><SocialLinks/></footer>
  </div>;
}
