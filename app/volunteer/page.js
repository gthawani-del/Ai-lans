'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles, X } from 'lucide-react';
import './volunteer.css';

const AI_LAB_LOGO='https://zvmmgkspdgbfcqmnizga.supabase.co/storage/v1/object/public/ai-lab-ui/logo/AI_LAB_primary_logo_dark_web.webp';

const benefits=[
 {n:'01',title:'Direct Access',image:'/images/volunteer/volunteer-direct-access.webp',alt:'People representing direct access',copy:'Work alongside founders, CXOs, investors and business leaders rather than simply attending their sessions.',featured:true},
 {n:'02',title:'Get Seen',image:'/images/volunteer/volunteer-get-seen.webp',alt:'Eye representing visibility',copy:'Show how you think, solve and execute in front of people who regularly look for strong talent, collaborators and future leaders.',featured:true},
 {n:'03',title:'Build Your Network',image:'/images/volunteer/volunteer-build-network.webp',alt:'Handshake representing professional network',copy:'Build meaningful relationships with people creating, funding and operating the next wave of businesses.',featured:true},
 {n:'04',title:'Work on Real MVPs',image:'/images/volunteer/volunteer-real-mvps.webp',alt:'Rocket representing building products',copy:'Help participants turn actual business ideas into working AI products — not just follow tutorials.'},
 {n:'05',title:'Prove Your Ability',image:'/images/volunteer/volunteer-prove-ability.webp',alt:'Trophy representing demonstrated ability',copy:'Gain practical, hands-on experience you can genuinely talk about in interviews, applications and projects.'},
 {n:'06',title:'Sharpen Your Stack',image:'/images/volunteer/volunteer-sharpen-stack.webp',alt:'Code marks representing the AI build stack',copy:'Improve your skills with Claude/Codex, GitHub, Vercel, Supabase and the complete AI build stack.'}
];

export default function VolunteerPage(){
 const closeRef=useRef(null);
 useEffect(()=>{closeRef.current?.focus()},[]);
 return <main className="volunteerPage">
  <div className="volunteerBackdrop" aria-hidden="true"/>
  <section className="volunteerModal" role="dialog" aria-modal="true" aria-labelledby="volunteer-title" aria-describedby="volunteer-description">
   <Link className="volunteerClose" href="/" aria-label="Close volunteer information" ref={closeRef}><X aria-hidden="true"/></Link>
   <header className="volunteerIntro"><img className="volunteerLogo" src={AI_LAB_LOGO} alt="AI LAB"/>
    <span className="volunteerEyebrow"><Sparkles aria-hidden="true"/> WHY VOLUNTEER AT AI LAB?</span>
    <h1 id="volunteer-title">This is not event volunteering.<br/><strong>This is where volunteering becomes <span>opportunity.</span></strong></h1>
    <p id="volunteer-description">You’ll spend two days inside a live build environment, working alongside<br className="desktopBreak"/> founders, CXOs, investors and business leaders as they turn ideas into working AI MVPs.</p>
   </header>
   <div className="benefitGrid">
    {benefits.map((b)=><article className={b.featured?'benefitCard featured':'benefitCard compact'} key={b.n}>
      <span className="benefitNumber">{b.n}</span>
      <div className="benefitImage"><Image src={b.image} alt={b.alt} width={230} height={135} sizes={b.featured?'(max-width: 720px) 72px, 190px':'(max-width: 720px) 56px, 88px'}/></div>
      <div className="benefitCopy"><h2>{b.title}</h2><span className="titleRule" aria-hidden="true"/><p>{b.copy}</p></div>
    </article>)}
   </div>
   <footer className="volunteerFooter">
    <div className="growthNote"><ShieldCheck aria-hidden="true"/><p>You help participants build.<strong>You grow while doing it.</strong></p></div>
    <Link className="applyButton" href="/volunteer/apply"><Sparkles aria-hidden="true"/> <span>APPLY TO VOLUNTEER</span> <ArrowRight aria-hidden="true"/></Link>
    <div className="secureNote"><LockKeyhole aria-hidden="true"/><p>Secure application.<span>Takes ~5 minutes.</span></p></div>
   </footer>
  </section>
 </main>
}
