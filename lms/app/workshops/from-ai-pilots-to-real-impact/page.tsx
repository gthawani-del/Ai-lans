import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CalendarDays, Clock3, Download, MapPin, UsersRound, Video } from "lucide-react";
import styles from "../workshops.module.css";

export default function WorkshopDetailPage(){
  return <AppShell>
    <div className="breadcrumb">Workshops <span>›</span> From AI Pilots to Real Impact</div>
    <section className={styles.detailHero}>
      <div>
        <span className="eyebrow">EXECUTIVE WORKSHOP</span>
        <h1>From AI Pilots to Real Impact</h1>
        <p>How leaders move from experiments to repeatable, measurable AI outcomes.</p>
        <div className={styles.metaStack}>
          <span><CalendarDays size={17}/> Saturday, 24 October 2026</span>
          <span><Clock3 size={17}/> 11:00–12:30 IST</span>
          <span><Video size={17}/> Online live session</span>
          <span><UsersRound size={17}/> AI Strategy for Business Leaders cohort</span>
        </div>
        <div className={styles.actions}><button className="button dark">Register</button><button className="button secondary">Add to calendar</button></div>
      </div>
      <div className={styles.detailVisual}><div>Move from<br/>pilot to progress.<i/></div></div>
    </section>

    <div className={styles.detailGrid}>
      <main>
        <section className={styles.detailSection}><h2>What you’ll work through</h2><p>This is a practical working session focused on operating models, decision frameworks and the steps needed to turn isolated AI pilots into business capability.</p>
          <div className={styles.outcomes}>
            <div><strong>01</strong><span>Identify why pilots stall after early proof-of-concept.</span></div>
            <div><strong>02</strong><span>Prioritise use cases using value, readiness and feasibility.</span></div>
            <div><strong>03</strong><span>Define ownership, governance and an adoption path.</span></div>
            <div><strong>04</strong><span>Leave with a practical scale-up framework.</span></div>
          </div>
        </section>

        <section className={styles.detailSection}><h2>Agenda</h2>
          <div className={styles.agenda}>
            <div><time>11:00</time><p><strong>Why pilots don’t scale</strong><span>Patterns we repeatedly see across organisations.</span></p></div>
            <div><time>11:20</time><p><strong>Value × readiness framework</strong><span>Prioritise what deserves to move forward.</span></p></div>
            <div><time>11:50</time><p><strong>Operating model</strong><span>Ownership, governance and execution.</span></p></div>
            <div><time>12:15</time><p><strong>Q&A and cohort discussion</strong><span>Apply the framework to your current context.</span></p></div>
          </div>
        </section>

        <section className={styles.detailSection}><h2>Resources</h2>
          <div className={styles.resources}><div><span>PDF</span><p><strong>AI Scale-Up Framework</strong><small>Workshop worksheet · 2.1 MB</small></p><button><Download size={16}/></button></div><div><span>XLS</span><p><strong>Use Case Prioritisation Matrix</strong><small>Template · 780 KB</small></p><button><Download size={16}/></button></div></div>
        </section>
      </main>

      <aside>
        <section className={styles.speakerCard}><span className="eyebrow">SPEAKER</span><div className={styles.speakerAvatar}>RM</div><h3>Rohan Mehta</h3><p>AI transformation advisor focused on practical enterprise adoption and operating-model change.</p></section>
        <section className={styles.sideInfo}><h3>Your cohort</h3><p>AI Strategy for Business Leaders</p><div className="avatar-row"><span>PS</span><span>AK</span><span>VS</span><span>+31</span></div><Link href="/community">Open cohort discussion →</Link></section>
        <section className={styles.sideInfo}><h3>After the workshop</h3><p>The recording, transcript, resources and follow-up discussion will appear in your Library.</p><Link href="/library/recordings">Go to recordings →</Link></section>
      </aside>
    </div>
  </AppShell>
}
