'use client';
import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Sparkles,X} from 'lucide-react';
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
 const[aboutOpen,setAboutOpen]=useState(false);const dialogRef=useRef(null);
 useEffect(()=>{try{if(!sessionStorage.getItem('ai-lab-volunteer-intro-seen'))setAboutOpen(true)}catch{setAboutOpen(true)}},[]);
 useEffect(()=>{if(aboutOpen)dialogRef.current?.focus()},[aboutOpen]);
 const closeAbout=()=>{try{sessionStorage.setItem('ai-lab-volunteer-intro-seen','1')}catch{}setAboutOpen(false)};
 return <main className="volunteerPage">
  <header className="volunteerNav"><Link href="/" aria-label="AI Lab home"><img src={AI_LAB_LOGO} alt="AI LAB"/></Link><button type="button" onClick={()=>setAboutOpen(true)}>WHAT IS AI LAB?</button><Link className="navApply" href="/volunteer/apply">START APPLICATION <ArrowRight/></Link></header>
  <section className="volunteerHero"><span className="volunteerEyebrow"><Sparkles/> VOLUNTEER AT AI LAB</span><h1>Don’t just attend.<br/><strong>Help build what happens.</strong></h1><p>Work alongside founders, CXOs, investors and business leaders as they turn real business problems into working AI MVPs — and prove what you can do in the process.</p><div className="heroVolunteerActions"><Link className="applyButton" href="/volunteer/apply"><span>BECOME AN AI LAB VOLUNTEER</span><ArrowRight/></Link><button type="button" onClick={()=>setAboutOpen(true)}>See what AI Lab is</button></div><div className="volunteerMeta"><span><b>2 DAYS</b> · Mumbai</span><span><b>HANDS-ON</b> · Active build role</span><span><b>REAL MVPs</b> · Real teams</span></div></section>
  <section className="benefitsSection"><div className="sectionLead"><span>WHY VOLUNTEER?</span><h2>This is where volunteering becomes opportunity.</h2><p>You help participants build. You grow while doing it.</p></div><div className="benefitGrid">{benefits.map(b=><article className={b.featured?'benefitCard featured':'benefitCard compact'} key={b.n}><span className="benefitNumber">{b.n}</span><div className="benefitImage"><Image src={b.image} alt="" width={230} height={135}/></div><div className="benefitCopy"><h2>{b.title}</h2><span className="titleRule"/><p>{b.copy}</p></div></article>)}</div></section>
  <section className="volunteerRole"><div><span>THE ROLE</span><h2>Come ready to contribute.</h2></div><div className="rolePoints"><p><b>Build with participants.</b><br/>Help teams move from idea to a working MVP.</p><p><b>Troubleshoot in real time.</b><br/>Work through tools, repositories, deployments and blockers.</p><p><b>Be present for both days.</b><br/>This is an active workshop role, not event observation.</p></div></section>
  <section className="volunteerFinal"><span>READY TO BUILD WITH US?</span><h2>Turn two workshop days into proof of what you can do.</h2><Link className="applyButton" href="/volunteer/apply"><span>START YOUR APPLICATION</span><ArrowRight/></Link><small>Secure application · Takes about 5 minutes</small></section>
  {aboutOpen&&<div className="aboutOverlay" onMouseDown={e=>e.target===e.currentTarget&&closeAbout()}><section className="aboutDialog" role="dialog" aria-modal="true" aria-labelledby="about-title" tabIndex={-1} ref={dialogRef} onKeyDown={e=>e.key==='Escape'&&closeAbout()}><button className="aboutClose" type="button" onClick={closeAbout} aria-label="Close"><X/></button><img src={AI_LAB_LOGO} alt="AI LAB"/><span>BEFORE YOU VOLUNTEER</span><h2 id="about-title">See what AI Lab actually is.</h2><p>AI Lab is a hands-on business workshop where founders and business leaders bring real problems and leave with working AI solutions. Volunteers work inside that build environment — not around it.</p><div className="aboutVideo"><div><Sparkles/><b>AI LAB IN ACTION</b><small>Workshop video</small></div></div><button className="aboutContinue" type="button" onClick={closeAbout}>EXPLORE VOLUNTEER ROLES <ArrowRight/></button></section></div>}
 </main>;
}