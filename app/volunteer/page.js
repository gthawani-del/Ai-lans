import VolunteerHome from './VolunteerHome';
import './volunteer.css';
import { createPageMetadata } from '../../lib/seo';

const title = 'Volunteer with weareailabs';
const description = 'Help participants turn real business ideas into working AI projects. Technical, creative and operational backgrounds are welcome.';
export const metadata = createPageMetadata({
  title,
  description,
  path: '/volunteer',
  defaultImage: { src: '/brand/weareailabs-volunteer.webp', alt: 'weareailabs volunteer programme' },
  indexable: false,
  follow: true,
});

export default function VolunteerPage() {
  return <div className="volunteerHome"><VolunteerHome /></div>;
}
