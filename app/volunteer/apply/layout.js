import Image from 'next/image';
import Link from 'next/link';
import './theme.css';
import SocialLinks from '../../../components/SocialLinks';

export const metadata = { title: 'Volunteer application | weareailabs', description: 'Apply to support weareailabs participants with technical, creative or operational skills.', robots: { index: false, follow: false } };

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
