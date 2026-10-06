import { notFound } from "next/navigation";
import { SectionShell } from "@/components/section-shell";

const sections: Record<string,{title:string;eyebrow:string;copy:string}> = {
  workshops: { title:"Workshops", eyebrow:"LIVE LEARNING", copy:"Join expert-led sessions, cohort workshops and practical working sessions." },
  community: { title:"Community", eyebrow:"CONNECT", copy:"Discuss, ask, share and learn with your cohort and the wider WeAreAiLabs community." },
  projects: { title:"Projects", eyebrow:"BUILD", copy:"Apply your learning through practical projects and real submissions." },
  library: { title:"Library", eyebrow:"RESOURCES", copy:"Access recordings, templates, case studies, prompt packs and supporting material." },
  skills: { title:"Skills", eyebrow:"PROGRESS", copy:"Track the capabilities you are building and the evidence behind them." },
  assessments: { title:"Assessments", eyebrow:"ASSESS", copy:"Manage quizzes, assignments and practical assessments in one place." },
  certificates: { title:"Certificates", eyebrow:"ACHIEVEMENTS", copy:"View earned credentials and verify completion." },
  profile: { title:"Profile", eyebrow:"ACCOUNT", copy:"Manage your profile, learning history and account preferences." },
};

export default async function SectionPage({params}:{params:Promise<{section:string}>}) {
  const {section}=await params;
  const item=sections[section];
  if(!item) notFound();
  return <SectionShell {...item}/>;
}
