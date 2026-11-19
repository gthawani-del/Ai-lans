import Image from 'next/image';
import Link from 'next/link';
import './theme.css';
import SocialLinks from '../../../components/SocialLinks';
import { createPageMetadata } from '../../../lib/seo';

const title = 'Volunteer application | weareailabs';
const description = 'Apply to support weareailabs participants with technical, creative or operational skills.';
export const metadata = createPageMetadata({title,description,path:'/volunteer/apply',defaultImage:{src:'/brand/weareailabs-volunteer.webp',alt:'weareailabs volunteer programme'},indexable:false,follow:false});

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
