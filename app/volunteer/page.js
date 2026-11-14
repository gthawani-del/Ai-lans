import { IBM_Plex_Sans, Newsreader } from 'next/font/google';
import VolunteerHome from './VolunteerHome';
import './volunteer.css';

const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--volunteer-sans' });
const serif = Newsreader({ subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap', variable: '--volunteer-serif' });

export const metadata = {
  title: 'Volunteer with weareailabs',
  description: 'Help participants turn real business ideas into working AI projects. Technical, creative and operational backgrounds are welcome.',
};

export default function VolunteerPage() {
  return <div className={`volunteerHome ${sans.variable} ${serif.variable}`}><VolunteerHome /></div>;
}
