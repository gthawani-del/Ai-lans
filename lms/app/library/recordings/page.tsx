import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PlayCircle, Search } from "lucide-react";
import styles from "./recordings.module.css";

const recordings=[
  {title:"AI Governance for Leaders",speaker:"Dr. Meera Iyer",length:"48 min",date:"2 Oct 2026",tone:"a"},
  {title:"From Pilots to Profit",speaker:"Rohan Mehta",length:"56 min",date:"25 Sep 2026",tone:"b"},
  {title:"Responsible AI in Practice",speaker:"Vikram Sinha",length:"52 min",date:"18 Sep 2026",tone:"c"},
  {title:"Building AI-Ready Teams",speaker:"Anita Kapoor",length:"64 min",date:"10 Sep 2026",tone:"d"},
  {title:"Prompting for Business Leaders",speaker:"Nisha Rao",length:"39 min",date:"2 Sep 2026",tone:"e"},
  {title:"AI Strategy: Ask Better Questions",speaker:"Rohan Mehta",length:"44 min",date:"28 Aug 2026",tone:"f"},
];

export default function RecordingsPage(){
 return <AppShell>
  <div className={styles.heading}><div><span className="eyebrow">RECORDINGS</span><h1>Learn anytime.</h1><p>Workshop recordings, session clips, transcripts and resources — organised around your learning.</p></div></div>
  <div className={styles.toolbar}><div className={styles.search}><Search size={17}/><input placeholder="Search recordings, speakers or topics..."/></div><div className={styles.filters}><button className={styles.active}>All</button><button>Workshops</button><button>Panels</button><button>Masterclasses</button></div></div>
  <section className={styles.featured}>
    <div className={styles.video}><button><PlayCircle size={52}/></button></div>
    <div><span className="eyebrow">FEATURED RECORDING</span><h2>AI Governance for Leaders</h2><p>A practical session on decision rights, risk, accountability and how to put responsible AI governance into operating practice.</p><small>Dr. Meera Iyer · 48 min · 2 Oct 2026</small><Link className="button dark" href="/library/recordings/ai-governance-for-leaders">Watch recording</Link></div>
  </section>
  <div className="section-title spaced"><h2>All recordings</h2><span>6 sessions</span></div>
  <div className={styles.grid}>{recordings.map((r,i)=><article key={r.title}><div className={styles.thumb+" "+styles[r.tone]}><PlayCircle size={34}/></div><div><h3>{r.title}</h3><p>{r.speaker}</p><small>{r.length} · {r.date}</small><Link href={i===0?"/library/recordings/ai-governance-for-leaders":"/library/recordings"}>Watch →</Link></div></article>)}</div>
 </AppShell>
}
