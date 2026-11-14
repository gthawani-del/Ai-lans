import RegistrationCheckoutV3 from './RegistrationCheckoutV3';

export const metadata={title:'Workshop registration demo | weareailabs',description:'Preview the weareailabs workshop registration flow. Dates and venue are to be confirmed. This is a test payment flow.',robots:{index:false,follow:false}};

export default function RegisterPage(){
  return <RegistrationCheckoutV3/>;
}
