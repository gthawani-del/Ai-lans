'use client';
import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,LockKeyhole,ShieldCheck,Sparkles,X} from 'lucide-react';
import './volunteer.css';

const AI_LAB_LOGO='https://zvmmgkspdgbfcqmnizga.supabase.co/storage/v1/object/public/ai-lab-ui/logo/AI_LAB_primary_logo_dark_web.webp';
const benefits=[
 {n:'01',title:'Direct Access',image:'/images/volunteer/volunteer-direct-access.webp',copy:'Work alongside founders, CXOs, investors and business leaders rather than simply attending their sessions.',featured:true},
 {n:'02',title:'Get Seen',image:'/images/volunteer/volunteer-get-seen.webp',copy:'Show how you think, solve and execute in front of people who regularly look for strong talent, collaborators and future leaders.',featured:true},
 {n:'03',title:'Build Your Network',image:'/images/volunteer/volunteer-build-network.webp',copy:'Build meaningful relationships with people creating, funding and operating the next wave of businesses.',featured:true},
 {n:'04',title:'Work on Real MVPs',image:'/images/volunteer/volunteer-real-mvps.webp',copy:'Help participants turn actual business ideas into working AI products — not just follow tutorials.'},
 {n:'05',title:'Prove Your Ability',image:'/images/volunteer/volunteer-prove-ability.webp',copy:'Gain practical, hands-on experience you can genuinely talk about in interviews, applications and projects.'},
 {n:'06',title:'Sharpen Your Stack',image:'/images/volunteer/volunteer-sharpen-stack.webp',copy:'Improve your skills with Claude/Codex, GitHub, Vercel, Supabase and the complete AI build stack.'}
];
export default function VolunteerPage(){
 const[aboutOpen,setAboutOpen]=useState(true);const dialogRef=useRef(null);
 useEffect(()=>{if(aboutOpen)dialogRef.current?.focus()},[aboutOpen]);
 const closeAbout=()=>setAboutOpen(false);
 return <main className="volunteerPage">
  <header className="volunteerNav"><Link href="/" aria-label="AI Lab home"><img src={AI_LAB_LOGO} alt="AI LAB"/></Link><button type="button" onClick={()=>setAboutOpen(true)}>WHAT IS AI LAB?</button><Link className="navApply" href="/volunteer/apply">START APPLICATION <ArrowRight/></Link></header>
  <section className="originalVolunteerLanding">
   <div className="volunteerIntro"><span className="volunteerEyebrow"><Sparkles/> WHY VOLUNTEER AT AI LAB?</span><h1>This is not event volunteering.<br/><strong>This is where volunteering becomes <span>opportunity.</span></strong></h1><p>You’ll spend two days inside a live build environment, working alongside<br className="desktopBreak"/> founders, CXOs, investors and business leaders as they turn ideas into working AI MVPs.</p></div>
   <div className="benefitGrid">{benefits.map(b=><article className={b.featured?'benefitCard featured':'benefitCard compact'} key={b.n}><span className="benefitNumber">{b.n}</span><div className="benefitImage"><Image src={b.image} alt="" width={230} height={135}/></div><div className="benefitCopy"><h2>{b.title}</h2><span className="titleRule"/><p>{b.copy}</p></div></article>)}</div>
   <div className="landingAction"><div className="growthNote"><ShieldCheck/><p>You help participants build.<strong>You grow while doing it.</strong></p></div><Link className="applyButton" href="/volunteer/apply"><Sparkles/><span>START YOUR APPLICATION</span><ArrowRight/></Link><div className="secureNote"><LockKeyhole/><p>Secure application.<span>Takes ~5 minutes.</span></p></div></div>
  </section>
  {aboutOpen&&<div className="aboutOverlay" onMouseDown={e=>e.target===e.currentTarget&&closeAbout()}><section className="aboutDialog" role="dialog" aria-modal="true" aria-labelledby="about-title" tabIndex={-1} ref={dialogRef} onKeyDown={e=>e.key==='Escape'&&closeAbout()}><button className="aboutClose" type="button" onClick={closeAbout} aria-label="Close"><X/></button><img src={AI_LAB_LOGO} alt="AI LAB"/><span>BEFORE YOU VOLUNTEER</span><h2 id="about-title">See what AI Lab actually is.</h2><p>AI Lab is a hands-on business workshop where founders and business leaders bring real problems and leave with working AI solutions. Volunteers work inside that build environment — not around it.</p><div className="aboutVideo"><div><Sparkles/><b>AI LAB IN ACTION</b><small>Workshop video</small></div></div><button className="aboutContinue" type="button" onClick={closeAbout}>EXPLORE VOLUNTEER ROLES <ArrowRight/></button></section></div>}
 </main>;
}