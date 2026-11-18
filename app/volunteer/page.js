import VolunteerHome from './VolunteerHome';
import './volunteer.css';

export const metadata = {
  title: 'Volunteer with weareailabs',
  description: 'Help participants turn real business ideas into working AI projects. Technical, creative and operational backgrounds are welcome.',
};

export default function VolunteerPage() {
  return <div className="volunteerHome"><VolunteerHome /></div>;
}
