import RegistrationCheckoutV3 from './RegistrationCheckoutV3';

const title='Attendee application | weareailabs';
const description='Apply to attend the weareailabs workshop. Dates and venue are to be confirmed. No payment is taken with your application.';
export const metadata={title,description,alternates:{canonical:'/register'},robots:{index:false,follow:false},openGraph:{title,description,type:'website',images:['/brand/weareailabs-home.webp']},twitter:{card:'summary_large_image',title,description,images:['/brand/weareailabs-home.webp']}};

export default function RegisterPage(){
  return <RegistrationCheckoutV3/>;
}
