import { SectionScreen } from "../../../lms/runtime/screens";

export default async function LMSSection({ params }) {
  const { section } = await params;
  return <SectionScreen section={section} />;
}
