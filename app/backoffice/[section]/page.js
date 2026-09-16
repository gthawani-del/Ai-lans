import BackofficeSection from '../BackofficeSection';

export default async function BackofficeSectionPage({params}){
  const {section}=await params;
  return <BackofficeSection section={section}/>;
}
