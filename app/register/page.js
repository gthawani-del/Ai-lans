import RegistrationCheckoutV3 from './RegistrationCheckoutV3';

export const metadata={title:'Attendee application | weareailabs',description:'Apply to attend the weareailabs workshop. Dates and venue are to be confirmed. No payment is taken with your application.',robots:{index:false,follow:false}};

export default function RegisterPage(){
  return <RegistrationCheckoutV3/>;
}
