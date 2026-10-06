"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, BookOpen, CalendarDays, Download, FolderKanban, Home, Library,
  PlayCircle, Search, ShieldCheck, Sparkles, Trophy, UserRound, UsersRound, Video
} from "lucide-react";

const nav = [
  ["/lms", "Home", Home],
  ["/lms/learn", "Learn", BookOpen],
  ["/lms/workshops", "Workshops", CalendarDays],
  ["/lms/community", "Community", UsersRound],
  ["/lms/projects", "Projects", FolderKanban],
  ["/lms/library", "Library", Library],
  ["/lms/skills", "Skills", Sparkles],
  ["/lms/assessments", "Assessments", ShieldCheck],
  ["/lms/certificates", "Certificates", Trophy],
  ["/lms/profile", "Profile", UserRound],
];

function Shell({ children }) {
  const pathname = usePathname();
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-logo brand-wordmark" aria-label="WeAreAiLabs">weareailabs</div>
      <nav className="side-nav">
        {nav.map(([href,label,Icon]) => {
          const active = href === "/lms" ? pathname === "/lms" : pathname.startsWith(href);
          return <Link key={href} href={href} className={active ? "nav-link active" : "nav-link"}><Icon size={19}/><span>{label}</span></Link>
        })}
      </nav>
    </aside>
    <section className="workspace">
      <header className="topbar">
        <label className="searchbox"><Search size={18}/><input placeholder="Search courses, workshops, people, resources..." /></label>
        <div className="top-actions"><button className="icon-button"><Bell size={19}/></button><div className="profile-chip"><div className="avatar">GT</div><div><strong>Gaurav Thawani</strong><span>Learner</span></div></div></div>
      </header>
      <main className="page">{children}</main>
    </section>
  </div>
}

const agenda = [
  ["09:30","Continue learning","AI Strategy for Business Leaders","Module 3 · 62% complete","Continue"],
  ["11:00","LIVE","AI Governance for Leaders","with Dr. Meera Iyer","Join session"],
  ["14:00","DUE","Project review","Responsible AI Strategy","Submit"],
];

export function DashboardScreen() {
  const upcoming = [
    { date:"24", month:"OCT", title:"From AI Pilots to Real Impact", speaker:"Rohan Mehta", mode:"Online", tone:"one" },
    { date:"08", month:"NOV", title:"Building AI-Ready Teams", speaker:"Anita Kapoor", mode:"Mumbai", tone:"two" },
    { date:"22", month:"NOV", title:"AI & Regulation", speaker:"Vikram Sinha", mode:"Online", tone:"three" },
  ];

  return <Shell>
    <div className="premium-home">
      <section className="home-intro">
        <div>
          <span className="eyebrow">WELCOME BACK</span>
          <h1>Gaurav.</h1>
          <p>Keep learning. Build what’s next.</p>
        </div>
        <div className="home-date">
          <span>Tuesday</span>
          <strong>06 October</strong>
          <small>2026</small>
        </div>
      </section>

      <div className="home-grid">
        <section className="home-main">
          <article className="home-course-hero">
            <div className="hero-course-copy">
              <span className="eyebrow light">CONTINUE LEARNING</span>
              <div className="hero-course-kicker">AI STRATEGY · MODULE 3 OF 8</div>
              <h2>AI Strategy for<br/>Business Leaders</h2>
              <p>Identifying High-Value AI Use Cases</p>
              <div className="hero-progress-row"><div className="progress"><span style={{width:"62%"}}/></div><b>62%</b></div>
              <div className="action-row">
                <Link className="button accent premium-cta" href="/lms/learn/ai-strategy/lesson/high-value-use-cases">Continue learning →</Link>
                <Link className="text-link light-link" href="/lms/learn">View programme →</Link>
              </div>
            </div>
            <div className="home-hero-art">
              <div className="hero-art-label"><span>STRATEGY</span><strong>Turn possibility<br/>into progress.</strong><i/></div>
              <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
            </div>
          </article>

          <section className="home-section today-section">
            <div className="home-section-head"><div><span className="eyebrow">TODAY</span><h2>Your agenda</h2></div><a>View calendar →</a></div>
            <div className="premium-agenda">
              {agenda.map(([time,type,title,meta,action],i)=><div className="premium-agenda-row" key={time}>
                <time>{time}</time>
                <div className={"agenda-marker marker-"+i}>{i===1?<Video size={17}/>:<PlayCircle size={17}/>}</div>
                <div className="premium-agenda-copy">
                  <div><strong>{title}</strong>{type==="LIVE"||type==="DUE"?<span className={"status "+type.toLowerCase()}>{type}</span>:<span className="agenda-type">{type}</span>}</div>
                  <small>{meta}</small>
                </div>
                <button className={i===1?"button dark small":"button secondary small"}>{action}</button>
              </div>)}
            </div>
          </section>

          <section className="home-section">
            <div className="home-section-head"><div><span className="eyebrow">UPCOMING</span><h2>Workshops</h2></div><Link href="/lms/workshops">View all →</Link></div>
            <div className="premium-workshop-grid">
              {upcoming.map((w,i)=><article className="premium-workshop-card" key={w.title}>
                <div className={"premium-workshop-art "+w.tone}><span>{w.mode}</span></div>
                <div className="premium-workshop-meta"><div className="premium-date"><strong>{w.date}</strong><span>{w.month}</span></div><div><h3>{w.title}</h3><p>{w.speaker}</p></div></div>
                <div className="premium-workshop-footer"><span>11:00–12:30 IST</span><Link href={i===0?"/lms/workshops/from-ai-pilots-to-real-impact":"/lms/workshops"}>View →</Link></div>
              </article>)}
            </div>
          </section>
        </section>

        <aside className="home-rail">
          <section className="premium-side-panel cohort-panel">
            <div className="panel-heading"><div><span className="eyebrow">YOUR COHORT</span><h3>AI Strategy for Business Leaders</h3></div><Link href="/lms/community">Open →</Link></div>
            <p>Mumbai · October 2026</p>
            <div className="premium-avatar-stack"><span>PS</span><span>RM</span><span>AK</span><span>VS</span><span>+30</span></div>
            <div className="premium-metrics"><div><strong>7</strong><span>Discussions</span></div><div><strong>3</strong><span>Peer projects</span></div><div><strong>2</strong><span>Live sessions</span></div></div>
          </section>

          <section className="premium-side-panel">
            <div className="panel-heading"><div><span className="eyebrow">PROGRESS</span><h3>Skills</h3></div><Link href="/lms/skills">View all →</Link></div>
            {[["AI Strategy",78],["AI Governance",62],["Prompt Engineering",45],["Responsible AI",68]].map(([label,value])=><div className="premium-skill-row" key={label}><div><span>{label}</span><b>{value}%</b></div><div className="skill-track"><i style={{width:value+"%"}}/></div></div>)}
          </section>

          <section className="premium-side-panel premium-recordings">
            <div className="panel-heading"><div><span className="eyebrow">WATCH AGAIN</span><h3>Recent recordings</h3></div><Link href="/lms/library/recordings">View all →</Link></div>
            <Link className="premium-recording-row" href="/lms/library/recordings/ai-governance-for-leaders"><span className="premium-recording-thumb rec-one">▶</span><p><strong>AI Governance for Leaders</strong><small>48 min · 2 days ago</small></p></Link>
            <Link className="premium-recording-row" href="/lms/library/recordings"><span className="premium-recording-thumb rec-two">▶</span><p><strong>From Ideas to Implementation</strong><small>56 min · 1 week ago</small></p></Link>
          </section>
        </aside>
      </div>
    </div>
  </Shell>
}

export function LearnScreen() {
  const programs=["AI Strategy for Business Leaders","Build AI Products Without Code","Responsible AI for Organisations"];
  const courses=["Generative AI for Work","Prompt Engineering Essentials","AI for Data Analysis","AI in Marketing"];
  return <Shell><div className="learn-hero"><div><span className="eyebrow">LEARN</span><h1>Skills for what’s next.</h1><p>Practical learning for real world impact.</p></div><div className="hero-note">“Learn, unlearn and apply — faster than everyone else.”</div></div><div className="tabs-row">{["All","Programs","Courses","Workshops","Short Lessons","Learning Paths"].map((x,i)=><button className={i===0?"tab active":"tab"} key={x}>{x}</button>)}</div><div className="catalog-layout"><aside className="filters"><div className="panel-heading"><h3>Filter</h3><button>Clear all</button></div>{["Content type","Topic","Level"].map((g)=><fieldset key={g}><legend>{g}</legend>{["AI Strategy","Generative AI","Business & Leadership"].map(x=><label key={x}><input type="checkbox"/><span>{x}</span></label>)}</fieldset>)}</aside><section className="catalog-content"><div className="section-title"><h2>Featured Programs</h2><a>View all →</a></div><div className="program-grid">{programs.map((p,i)=><article className="program-card" key={p}><div className={"program-image p-"+(i+1)}/><div><h3>{p}</h3><p>Practical learning for measurable business impact.</p><small>{5+i} modules · {4+i} weeks</small><Link href={i===0?"/lms/learn/ai-strategy/lesson/high-value-use-cases":"/lms/learn"}>View program →</Link></div></article>)}</div><div className="section-title spaced"><h2>All Courses</h2><a>View all →</a></div><div className="course-grid">{courses.map((c,i)=><article className="course-card" key={c}><div className={"course-image c-"+(i+1)}/><h3>{c}</h3><p>Practical skills you can use immediately.</p><small>{8+i} lessons · 2 hours</small><Link href="/lms/learn/ai-strategy/lesson/high-value-use-cases">Start learning →</Link></article>)}</div></section></div></Shell>
}

export function LessonScreen() {
  const lessons=["Identifying High-Value AI Use Cases","Evaluating Feasibility and ROI","Building a Business Case","Stakeholder Alignment","From Pilot to Scale","Module Review & Quiz"];
  return <Shell><div className="lesson-layout"><section className="lesson-main"><div className="breadcrumb">Learn <span>›</span> AI Strategy for Business Leaders <span>›</span> Module 3</div><span className="status in-progress">In Progress</span><h1 className="lesson-title">Identifying High-Value AI Use Cases</h1><p className="lesson-deck">Learn how to evaluate, prioritise and scope AI use cases that deliver real business impact.</p><div className="video-stage"><div className="video-copy"><span>MODULE 3</span><h2>Identifying<br/>High-Value<br/>AI Use Cases</h2><p>From possibility to practical impact.</p></div><button className="play-button"><PlayCircle size={50}/></button><div className="video-controls"><span>▶</span><div className="video-progress"><i/></div><span>0:12 / 12:34</span><span>CC</span><span>1×</span></div></div><div className="tabs-row lesson-tabs">{["Overview","Notes","Transcript","Resources","Discussion"].map((x,i)=><button className={i===0?"tab active":"tab"} key={x}>{x}</button>)}</div><article className="lesson-body"><h2>About this lesson</h2><p>We break down a practical framework to identify, evaluate and prioritise AI use cases in your organisation.</p><div className="takeaways"><h3>Key takeaways</h3><div><span>✓ Identify high-value use cases</span><span>✓ Assess feasibility and ROI</span><span>✓ Learn from real examples</span><span>✓ Use a practical template</span></div></div></article></section><aside className="lesson-rail"><section className="course-summary"><div className="course-cover"/><h2>AI Strategy for Business Leaders</h2><p>Turn AI potential into measurable business impact.</p><div className="progress"><span style={{width:"62%"}}/></div><div className="summary-meta"><span>Module 3 of 8</span><b>62% complete</b></div></section><section className="curriculum">{lessons.map((x,i)=><div className={i===0?"lesson-row active":"lesson-row"} key={x}><span>{i===0?"▶":"🔒"}</span><strong>{i+1}. {x}</strong><small>{10+i}:21</small></div>)}</section></aside></div></Shell>
}

export function WorkshopsScreen() {
  return <Shell><div className="lms-page-heading"><span className="eyebrow">WORKSHOPS</span><h1>Live learning. Real skills.</h1><p>Join expert-led sessions, cohort workshops and practical working sessions.</p></div><section className="lms-feature"><div><span className="eyebrow">NEXT LIVE SESSION</span><h2>From AI Pilots to Real Impact</h2><p>Move from isolated experiments to repeatable business outcomes.</p><Link className="button dark" href="/lms/workshops/from-ai-pilots-to-real-impact">View workshop</Link></div><div className="lms-feature-art">Practical AI<br/>for leaders.</div></section><div className="section-title spaced"><h2>Upcoming workshops</h2></div><div className="lms-list">{["From AI Pilots to Real Impact","Building AI-Ready Teams","AI & Regulation: What Leaders Need to Know"].map((x,i)=><div className="lms-list-row" key={x}><strong>{["24 OCT","08 NOV","22 NOV"][i]}</strong><div><h3>{x}</h3><p>Thu, 11:00–12:30 · {["Rohan Mehta","Anita Kapoor","Vikram Sinha"][i]}</p></div><Link className="button secondary small" href={i===0?"/lms/workshops/from-ai-pilots-to-real-impact":"/lms/workshops"}>View</Link></div>)}</div></Shell>
}

export function WorkshopDetailScreen() {
  return <Shell><div className="breadcrumb">Workshops <span>›</span> From AI Pilots to Real Impact</div><section className="lms-detail-hero"><div><span className="eyebrow">EXECUTIVE WORKSHOP</span><h1>From AI Pilots to Real Impact</h1><p>How leaders move from experiments to repeatable, measurable AI outcomes.</p><div className="lms-meta">24 October 2026 · 11:00–12:30 IST · Online live session</div><button className="button dark">Register</button></div><div className="lms-feature-art">Move from<br/>pilot to progress.</div></section><div className="lms-two-col"><main><section className="lms-panel"><h2>What you’ll work through</h2><p>Operating models, decision frameworks and the steps needed to turn isolated AI pilots into business capability.</p></section><section className="lms-panel"><h2>Agenda</h2>{["11:00 Why pilots don’t scale","11:20 Value × readiness framework","11:50 Operating model","12:15 Q&A and cohort discussion"].map(x=><div className="lms-agenda" key={x}>{x}</div>)}</section></main><aside><section className="lms-panel"><span className="eyebrow">SPEAKER</span><h3>Rohan Mehta</h3><p>AI transformation advisor focused on practical enterprise adoption.</p></section><section className="lms-panel"><h3>After the workshop</h3><p>The recording, transcript and resources will appear in your Library.</p><Link href="/lms/library/recordings">Go to recordings →</Link></section></aside></div></Shell>
}

export function RecordingsScreen() {
  const rs=["AI Governance for Leaders","From Pilots to Profit","Responsible AI in Practice","Building AI-Ready Teams","Prompting for Business Leaders","AI Strategy: Ask Better Questions"];
  return <Shell><div className="lms-page-heading"><span className="eyebrow">RECORDINGS</span><h1>Learn anytime.</h1><p>Workshop recordings, session clips, transcripts and resources.</p></div><section className="lms-feature"><div className="lms-feature-art">▶</div><div><span className="eyebrow">FEATURED RECORDING</span><h2>AI Governance for Leaders</h2><p>Decision rights, risk, accountability and practical governance for leaders deploying AI.</p><Link className="button dark" href="/lms/library/recordings/ai-governance-for-leaders">Watch recording</Link></div></section><div className="section-title spaced"><h2>All recordings</h2></div><div className="lms-card-grid">{rs.map((r,i)=><article key={r}><div className={"lms-media media-"+(i%3+1)}>▶</div><h3>{r}</h3><p>48 min · Workshop recording</p><Link href={i===0?"/lms/library/recordings/ai-governance-for-leaders":"/lms/library/recordings"}>Watch →</Link></article>)}</div></Shell>
}

export function RecordingDetailScreen() {
  return <Shell><div className="breadcrumb">Library <span>›</span> Recordings <span>›</span> AI Governance for Leaders</div><div className="lms-two-col wide"><main><span className="eyebrow">WORKSHOP RECORDING</span><h1 className="lesson-title">AI Governance for Leaders</h1><p className="lesson-deck">Decision rights, risk, accountability and practical governance for leaders deploying AI.</p><div className="video-stage"><button className="play-button"><PlayCircle size={58}/></button><div className="video-controls"><span>00:00</span><div className="video-progress"><i/></div><span>48:12</span></div></div><div className="tabs-row lesson-tabs">{["Overview","Chapters","Transcript","Resources","Discussion"].map((x,i)=><button className={i===0?"tab active":"tab"} key={x}>{x}</button>)}</div><section className="lms-panel"><h2>Session summary</h2><p>This session breaks governance down into operating decisions: what needs oversight, who owns what, how risk is evaluated, and how teams can move quickly without losing accountability.</p></section></main><aside><section className="lms-panel"><span className="eyebrow">CHAPTERS</span>{["00:00 Why governance matters","08:42 Decision rights","19:15 Risk tiers","31:06 Operating model","41:20 Q&A"].map(x=><div className="lms-agenda" key={x}>{x}</div>)}</section><section className="lms-panel"><span className="eyebrow">RESOURCES</span>{["Governance Checklist","Risk Tier Matrix","Decision Rights Template"].map(x=><div className="resource-row" key={x}><strong>{x}</strong><button><Download size={15}/></button></div>)}</section></aside></div></Shell>
}

const sectionCopy = {
  community:["Community","CONNECT","Discuss, ask, share and learn with your cohort and the wider WeAreAiLabs community."],
  projects:["Projects","BUILD","Apply your learning through practical projects and real submissions."],
  library:["Library","RESOURCES","Access recordings, templates, case studies, prompt packs and supporting material."],
  skills:["Skills","PROGRESS","Track the capabilities you are building and the evidence behind them."],
  assessments:["Assessments","ASSESS","Manage quizzes, assignments and practical assessments in one place."],
  certificates:["Certificates","ACHIEVEMENTS","View earned credentials and verify completion."],
  profile:["Profile","ACCOUNT","Manage your profile, learning history and account preferences."]
};

export function SectionScreen({ section }) {
  const item = sectionCopy[section] || ["Not found","LMS","This LMS area is not available."];
  return <Shell><div className="page-heading"><span className="eyebrow">{item[1]}</span><h1>{item[0]}</h1><p>{item[2]}</p></div><div className="empty-module"><div><span className="eyebrow">MODULE READY</span><h2>{item[0]}</h2><p>This area is wired into the LMS route system and will be expanded from the approved UI specification.</p></div></div></Shell>
}
