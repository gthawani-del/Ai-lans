import { AppShell } from "@/components/app-shell";
import { Download, PlayCircle } from "lucide-react";
import styles from "../recordings.module.css";

export default function RecordingDetailPage(){
 return <AppShell>
  <div className="breadcrumb">Library <span>›</span> Recordings <span>›</span> AI Governance for Leaders</div>
  <div className={styles.detailLayout}>
   <main>
    <span className="eyebrow">WORKSHOP RECORDING</span>
    <h1 className={styles.detailTitle}>AI Governance for Leaders</h1>
    <p className={styles.detailDeck}>Decision rights, risk, accountability and practical governance for leaders deploying AI.</p>
    <div className={styles.player}><button><PlayCircle size={58}/></button><div><span>00:00</span><i/><span>48:12</span></div></div>
    <div className="tabs-row lesson-tabs"><button className="tab active">Overview</button><button className="tab">Chapters</button><button className="tab">Transcript</button><button className="tab">Resources</button><button className="tab">Discussion</button></div>
    <section className={styles.body}><h2>Session summary</h2><p>This session breaks governance down into operating decisions: what needs oversight, who owns what, how risk is evaluated, and how teams can move quickly without losing accountability.</p><h3>Key takeaways</h3><ul><li>Separate governance from bureaucracy.</li><li>Assign decision rights before scaling use cases.</li><li>Match controls to risk rather than applying one universal process.</li><li>Keep an audit trail of material AI decisions.</li></ul></section>
   </main>
   <aside className={styles.rail}>
    <section><span className="eyebrow">CHAPTERS</span>{[["00:00","Why governance matters"],["08:42","Decision rights"],["19:15","Risk tiers"],["31:06","Operating model"],["41:20","Q&A"]].map(x=><button key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong></button>)}</section>
    <section><span className="eyebrow">RESOURCES</span>{["Governance Checklist","Risk Tier Matrix","Decision Rights Template"].map(x=><div key={x}><strong>{x}</strong><button><Download size={15}/></button></div>)}</section>
    <section><span className="eyebrow">SPEAKER</span><h3>Dr. Meera Iyer</h3><p>Governance and responsible-AI advisor.</p></section>
   </aside>
  </div>
 </AppShell>
}
