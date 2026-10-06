import Link from "next/link";
import { CheckCircle2, Download, LockKeyhole, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { lessons } from "@/lib/demo-data";

export default function LessonPage() {
  return (
    <AppShell>
      <div className="lesson-layout">
        <section className="lesson-main">
          <div className="breadcrumb">Learn <span>›</span> AI Strategy for Business Leaders <span>›</span> Module 3 <span>›</span> Lesson 1</div>
          <span className="status in-progress">In Progress</span>
          <h1 className="lesson-title">Identifying High-Value AI Use Cases</h1>
          <p className="lesson-deck">Learn how to evaluate, prioritise and scope AI use cases that deliver real business impact.</p>

          <div className="video-stage">
            <div className="video-copy"><span>MODULE 3</span><h2>Identifying<br/>High-Value<br/>AI Use Cases</h2><p>From possibility to<br/>practical impact.</p></div>
            <button className="play-button" aria-label="Play lesson"><PlayCircle size={50}/></button>
            <div className="video-controls"><span>▶</span><div className="video-progress"><i/></div><span>0:12 / 12:34</span><span>CC</span><span>1×</span></div>
          </div>

          <div className="tabs-row lesson-tabs">{["Overview","Notes","Transcript","Resources","Discussion"].map((x,i)=><button className={i===0?"tab active":"tab"} key={x}>{x}</button>)}</div>

          <article className="lesson-body">
            <h2>About this lesson</h2>
            <p>In this lesson, we break down a practical framework to identify, evaluate and prioritise AI use cases in your organisation. You’ll learn how to assess business value, feasibility and readiness — with real examples from industry.</p>
            <div className="takeaways">
              <h3>Key takeaways</h3>
              <div><span><CheckCircle2 size={18}/> A simple framework to identify high-value use cases</span><span><CheckCircle2 size={18}/> Real examples from leading organisations</span><span><CheckCircle2 size={18}/> How to assess feasibility and ROI</span><span><CheckCircle2 size={18}/> A practical template you can use</span></div>
            </div>
            <div className="lesson-actions"><button className="button secondary">✓ Mark as complete</button><Link className="text-link" href="#">Next lesson →</Link></div>
          </article>
        </section>

        <aside className="lesson-rail">
          <section className="course-summary">
            <div className="course-cover"/>
            <h2>AI Strategy for Business Leaders</h2>
            <p>Turn AI potential into measurable business impact.</p>
            <div className="progress"><span style={{width:"62%"}}/></div>
            <div className="summary-meta"><span>Module 3 of 8</span><b>62% complete</b></div>
          </section>

          <section className="curriculum">
            <div className="tabs-row compact">{["Lessons","Materials","Assignments","Community"].map((x,i)=><button className={i===0?"tab active":"tab"} key={x}>{x}</button>)}</div>
            {lessons.map(([title,duration,active],i)=>(
              <div className={active?"lesson-row active":"lesson-row"} key={title}>
                <span>{active?<PlayCircle size={17}/>:<LockKeyhole size={15}/>}</span><strong>{title}</strong><small>{duration}</small>
              </div>
            ))}
          </section>

          <section className="resource-panel">
            <div className="panel-heading"><h3>Lesson resources</h3><a>View all →</a></div>
            {["Framework Template","Use Case Examples","ROI Calculator","Additional Reading"].map(x=><div className="resource-row" key={x}><span>DOC</span><strong>{x}</strong><button><Download size={15}/></button></div>)}
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
