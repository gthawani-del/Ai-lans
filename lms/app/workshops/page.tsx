import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CalendarDays, Clock3, MapPin, UsersRound, Video } from "lucide-react";
import styles from "./workshops.module.css";

const upcoming = [
  { date:"24", month:"OCT", title:"From AI Pilots to Real Impact", speaker:"Rohan Mehta", meta:"Thu, 11:00–12:30", mode:"Online", accent:"a" },
  { date:"08", month:"NOV", title:"Building AI-Ready Teams", speaker:"Anita Kapoor", meta:"Thu, 11:00–12:30", mode:"Mumbai", accent:"b" },
  { date:"22", month:"NOV", title:"AI & Regulation: What Leaders Need to Know", speaker:"Vikram Sinha", meta:"Thu, 11:00–12:30", mode:"Online", accent:"c" },
];

const past = [
  { title:"AI Governance for Leaders", meta:"90 min · 2 Oct 2026" },
  { title:"Designing AI Use Cases", meta:"75 min · 18 Sep 2026" },
];

export default function WorkshopsPage(){
  return <AppShell>
    <div className={styles.heading}>
      <div><span className="eyebrow">WORKSHOPS</span><h1>Live learning. Real skills.</h1><p>Join expert-led sessions, cohort workshops and practical working sessions.</p></div>
      <div className={styles.summary}><strong>2</strong><span>registered workshops</span><strong>4</strong><span>sessions this quarter</span></div>
    </div>

    <div className={styles.tabs}>
      <button className={styles.active}>Upcoming</button><button>Registered</button><button>Past</button><button>Recordings</button>
    </div>

    <section className={styles.featured}>
      <div className={styles.featureCopy}>
        <span className="eyebrow">NEXT LIVE SESSION</span>
        <h2>From AI Pilots to Real Impact</h2>
        <p>Move from isolated experiments to repeatable business outcomes. A practical executive session with frameworks you can apply immediately.</p>
        <div className={styles.metaRow}><span><CalendarDays size={16}/> 24 Oct 2026</span><span><Clock3 size={16}/> 11:00–12:30</span><span><Video size={16}/> Online</span></div>
        <div className={styles.actions}><Link className="button dark" href="/workshops/from-ai-pilots-to-real-impact">View workshop</Link><button className="button secondary">Add to calendar</button></div>
      </div>
      <div className={styles.featureArt}><div>Practical AI<br/>for leaders.<i/></div></div>
    </section>

    <section className={styles.section}>
      <div className="section-title"><h2>Upcoming workshops</h2><a>View calendar →</a></div>
      <div className={styles.workshopList}>
        {upcoming.map((w,i)=><article className={styles.workshopRow} key={w.title}>
          <div className={styles.date}><strong>{w.date}</strong><span>{w.month}</span></div>
          <div className={styles.thumb+" "+styles[w.accent]} />
          <div className={styles.workshopInfo}><h3>{w.title}</h3><p>{w.meta} · {w.mode}</p><small>{w.speaker}</small></div>
          <div className={styles.cohort}><UsersRound size={16}/><span>AI Strategy Cohort</span></div>
          <Link className="button secondary small" href={i===0?"/workshops/from-ai-pilots-to-real-impact":"/workshops"}>View</Link>
        </article>)}
      </div>
    </section>

    <section className={styles.bottomGrid}>
      <div>
        <div className="section-title"><h2>Your workshop journey</h2></div>
        <div className={styles.journey}>
          <div><strong>4</strong><span>attended</span></div><div><strong>7.5h</strong><span>live learning</span></div><div><strong>3</strong><span>resources saved</span></div>
        </div>
      </div>
      <div>
        <div className="section-title"><h2>Recent sessions</h2><Link href="/library/recordings">View recordings →</Link></div>
        <div className={styles.pastList}>{past.map(x=><div key={x.title}><span className={styles.miniPlay}>▶</span><p><strong>{x.title}</strong><small>{x.meta}</small></p></div>)}</div>
      </div>
    </section>
  </AppShell>
}
