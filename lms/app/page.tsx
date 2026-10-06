import Link from "next/link";
import { ArrowRight, Play, Video } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { agenda, workshops } from "@/lib/demo-data";

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="dashboard-intro">
        <div>
          <span className="eyebrow">WELCOME BACK,</span>
          <h1>Gaurav.</h1>
          <p>Keep learning. Build what’s next.</p>
        </div>
        <blockquote>“The most valuable skill today is the ability to learn, unlearn and apply — faster than everyone else.”</blockquote>
      </section>

      <div className="dashboard-grid">
        <section className="primary-column">
          <article className="continue-panel">
            <div className="continue-copy">
              <span className="eyebrow light">CONTINUE LEARNING</span>
              <h2>AI Strategy for<br/>Business Leaders</h2>
              <p>Module 3 of 8</p>
              <strong>Identifying High-Value AI Use Cases</strong>
              <div className="progress"><span style={{ width: "62%" }} /></div>
              <div className="progress-meta"><span>62%</span></div>
              <div className="action-row">
                <Link className="button accent" href="/learn/ai-strategy/lesson/high-value-use-cases">Continue learning <ArrowRight size={16}/></Link>
                <Link className="text-link light-link" href="/learn">View programme <ArrowRight size={14}/></Link>
              </div>
            </div>
            <div className="continue-art">
              <div className="art-copy">Strategy<br/>to real impact.<span/></div>
            </div>
          </article>

          <section className="section-block">
            <div className="section-title"><h2>Today</h2><span>Tuesday, 6 October 2026</span><a>View full calendar →</a></div>
            <div className="agenda-list">
              {agenda.map((item, i) => (
                <div className="agenda-row" key={item.time}>
                  <time>{item.time}</time>
                  <div className="agenda-icon">{i === 1 ? <Video size={18}/> : <Play size={18}/>}</div>
                  <div className="agenda-copy">
                    <strong>{item.title}</strong>
                    <span>{item.type === "LIVE" || item.type === "DUE" ? <b className={"status "+item.type.toLowerCase()}>{item.type}</b> : item.type}</span>
                    <small>{item.meta}</small>
                  </div>
                  <button className={i === 1 ? "button dark small" : "button secondary small"}>{item.action}</button>
                </div>
              ))}
            </div>
          </section>

          <section className="section-block">
            <div className="section-title"><h2>Upcoming workshops</h2><a href="/workshops">View all →</a></div>
            <div className="workshop-grid">
              {workshops.map((w, i) => (
                <article className="workshop-card" key={w.title}>
                  <div className={"workshop-image image-"+(i+1)} />
                  <div className="workshop-body">
                    <span className="date-box">{w.date}</span>
                    <h3>{w.title}</h3>
                    <p>{w.meta}</p>
                    <Link href="/workshops">Register →</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <aside className="right-column">
          <section className="side-panel">
            <div className="panel-heading"><h3>Your Cohort</h3><a href="/community">View cohort →</a></div>
            <h4>AI Strategy for Business Leaders</h4>
            <p>Mumbai · Oct 2026 · 34 participants</p>
            <div className="avatar-row"><span>PS</span><span>RM</span><span>AK</span><span>VS</span><span>+30</span></div>
            <div className="metrics">
              <div><strong>7</strong><span>Discussions</span></div>
              <div><strong>3</strong><span>Peer projects</span></div>
              <div><strong>2</strong><span>Live workshops</span></div>
            </div>
          </section>

          <section className="side-panel">
            <div className="panel-heading"><h3>Skills progress</h3><a href="/skills">View all →</a></div>
            {[
              ["AI Strategy",78],["AI Governance",62],["Prompt Engineering",45],["Responsible AI",68]
            ].map(([label, value]) => (
              <div className="skill-row" key={label as string}>
                <span>{label}</span><div className="skill-track"><i style={{width: value+"%"}} /></div><b>{value}%</b>
              </div>
            ))}
          </section>

          <section className="side-panel recordings">
            <div className="panel-heading"><h3>Recent recordings</h3><a href="/library">View all →</a></div>
            <div><span className="recording-thumb">▶</span><p><strong>The Changing Role of Leadership in an AI-First World</strong><small>48 min · 2 days ago</small></p></div>
            <div><span className="recording-thumb">▶</span><p><strong>From Ideas to Implementation</strong><small>56 min · 1 week ago</small></p></div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
