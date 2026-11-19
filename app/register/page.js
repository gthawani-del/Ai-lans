import RegistrationCheckoutV3 from './RegistrationCheckoutV3';
import { createPageMetadata } from '../../lib/seo';

const title='Attendee application | weareailabs';
const description='Apply to attend the weareailabs workshop. Dates and venue are to be confirmed. No payment is taken with your application.';
export const metadata=createPageMetadata({title,description,path:'/register',defaultImage:{src:'/brand/weareailabs-home.webp',alt:'weareailabs'},indexable:false,follow:false});

export default function RegisterPage(){
  return <RegistrationCheckoutV3/>;
}
