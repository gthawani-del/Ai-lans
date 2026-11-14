'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { ArrowRight, ArrowUpRight, Users, Lightbulb, Share2, Laptop, Award, Layers, X } from 'lucide-react';

const logo = '/brand/weareailabs-volunteer.webp';
const benefits = [
  { title: 'Direct access', Icon: Users, copy: 'Work alongside founders, CXOs and business leaders.' },
  { title: 'Get seen', Icon: Lightbulb, copy: 'Show how you think, solve problems and contribute.' },
  { title: 'Build your network', Icon: Share2, copy: 'Connect with people building real businesses.' },
  { title: 'Work on real MVPs', Icon: Laptop, copy: 'Help turn ideas into working AI products.' },
  { title: 'Prove your ability', Icon: Award, copy: 'Gain practical experience you can demonstrate.' },
  { title: 'Sharpen your stack', Icon: Layers, copy: 'Build with AI tools, GitHub, Vercel and Supabase.' },
];

export default function VolunteerHome() {
  const about = useRef(null);
  return <>
    <a className="vh-skip" href="#volunteer-content">Skip to content</a>
    <header className="vh-header">
      <div className="vh-header-inner">
        <Link className="vh-logo" href="/" aria-label="weareailabs home">
          <Image src={logo} alt="weareailabs — Explore. Learn. Create. Together." width={240} height={130} priority />
        </Link>
        <div className="vh-header-actions">
          <button className="vh-about-link" onClick={() => about.current?.showModal()}>About weareailabs</button>
          <Link className="vh-button" href="/volunteer/apply">Start application <ArrowUpRight size={20} aria-hidden="true" /></Link>
        </div>
      </div>
    </header>
    <main id="volunteer-content" className="vh-main">
      <section className="vh-hero" aria-labelledby="volunteer-heading">
        <p className="vh-eyebrow">Volunteer with weareailabs</p>
        <h1 id="volunteer-heading">This is where volunteering<br className="vh-desktop-break" /> <span>becomes opportunity.</span></h1>
        <p className="vh-intro">Help participants turn real business ideas into working AI projects.<br className="vh-desktop-break" /> Technical, creative and operational backgrounds are welcome.</p>
      </section>
      <section className="vh-benefits" aria-labelledby="benefits-heading">
        <div className="vh-section-title"><h2 id="benefits-heading">What you gain</h2></div>
        <div className="vh-grid">
          {benefits.map(({ title, Icon, copy }, index) => <article className="vh-card" key={title}>
            <div className="vh-icon"><Icon size={32} strokeWidth={1.5} aria-hidden="true" /></div>
            <span className="vh-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <h3>{title}</h3><p>{copy}</p>
          </article>)}
        </div>
      </section>
      <section className="vh-action" aria-labelledby="action-heading">
        <div><h2 id="action-heading">You help participants build. You grow while doing it.</h2><p>Workshop dates, hours and venue will be confirmed.</p></div>
        <Link className="vh-button" href="/volunteer/apply">Start your application <ArrowRight size={20} aria-hidden="true" /></Link>
      </section>
    </main>
    <footer className="vh-footer"><Link href="/">weareailabs</Link><p>Explore. Learn. Create. Together.</p></footer>
    <dialog className="vh-dialog" ref={about} aria-labelledby="about-heading" onClick={event => { if (event.target === event.currentTarget) about.current?.close(); }}>
      <div className="vh-dialog-content">
        <button className="vh-close" aria-label="Close about weareailabs" onClick={() => about.current?.close()}><X size={22} /></button>
        <Image src={logo} alt="weareailabs" width={240} height={130} />
        <p className="vh-dialog-eyebrow">Before you volunteer</p>
        <h2 id="about-heading">Build together at weareailabs.</h2>
        <p>weareailabs is a hands-on business workshop where founders and business leaders bring real problems and build working AI solutions. Volunteers work inside that build environment, helping participants turn ideas into projects.</p>
        <button className="vh-button" onClick={() => about.current?.close()}>Explore volunteer benefits <ArrowRight size={20} aria-hidden="true" /></button>
      </div>
    </dialog>
  </>;
}
