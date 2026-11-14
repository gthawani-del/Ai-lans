import Image from 'next/image';
import Link from 'next/link';
import { IBM_Plex_Sans, Newsreader } from 'next/font/google';
import './theme.css';

const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--vf-sans' });
const serif = Newsreader({ subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap', variable: '--vf-serif' });

export const metadata = { title: 'Volunteer application | weareailabs' };

export default function VolunteerApplicationLayout({ children }) {
  return <div className={`volunteerFormTheme ${sans.variable} ${serif.variable}`}>
    <a className="vf-skip" href="#volunteer-application">Skip to application</a>
    <header className="vf-brand-header">
      <Link href="/volunteer" aria-label="weareailabs volunteer home"><Image src="/brand/weareailabs-volunteer.webp" alt="weareailabs — Explore. Learn. Create. Together." width={200} height={110} priority /></Link>
      <Link href="/volunteer">← Volunteer benefits</Link>
    </header>
    <div id="volunteer-application">{children}</div>
  </div>;
}
