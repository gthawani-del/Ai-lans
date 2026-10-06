"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight, Bell, BookOpen, Bookmark, CalendarDays, CheckCircle2, Clock3,
  Download, FileText, FolderKanban, Home, Library, MapPin, MessageCircle, Plus,
  PlayCircle, Search, ShieldCheck, Sparkles, Trophy, Upload, UserRound, UsersRound, Video
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
  const programs=[
    { title:"AI Strategy for Business Leaders", label:"EXECUTIVE PROGRAMME", desc:"Turn AI potential into measurable business impact.", meta:"8 modules · 6 weeks", level:"Intermediate", cover:"strategy", progress:"62%" },
    { title:"Build AI Products Without Code", label:"BUILD TRACK", desc:"Move from idea to a working prototype using modern AI tools.", meta:"6 modules · 4 weeks", level:"Beginner", cover:"builder" },
    { title:"Responsible AI for Organisations", label:"GOVERNANCE", desc:"Make AI adoption safer, accountable and practical.", meta:"5 modules · 4 weeks", level:"Intermediate", cover:"governance" },
  ];
  const courses=[
    { title:"Generative AI for Work", topic:"PRODUCTIVITY", length:"12 lessons · 2h 10m", cover:"work" },
    { title:"Prompt Engineering Essentials", topic:"PRACTICAL SKILL", length:"10 lessons · 1h 45m", cover:"prompt" },
    { title:"AI for Data Analysis", topic:"DATA", length:"8 lessons · 2h 05m", cover:"data" },
    { title:"AI for Marketing", topic:"FUNCTIONAL AI", length:"9 lessons · 1h 50m", cover:"marketing" },
  ];
  return <Shell>
    <div className="premium-learn">
      <header className="learn-premium-head">
        <div><span className="eyebrow">LEARN</span><h1>Skills for what’s next.</h1><p>Practical learning for real-world decisions, projects and leadership.</p></div>
        <div className="learn-head-note"><span>YOUR FOCUS</span><strong>AI Strategy</strong><small>4 skills in progress</small></div>
      </header>

      <section className="learning-resume">
        <div className="resume-index">03</div>
        <div className="resume-copy"><span className="eyebrow">CONTINUE LEARNING</span><h2>Identifying High-Value AI Use Cases</h2><p>AI Strategy for Business Leaders · Module 3 of 8</p></div>
        <div className="resume-progress"><div><span>Progress</span><b>62%</b></div><div className="skill-track"><i style={{width:"62%"}}/></div></div>
        <Link className="button dark" href="/lms/learn/ai-strategy/lesson/high-value-use-cases">Continue →</Link>
      </section>

      <div className="learn-nav-row">
        <div className="tabs-row premium-tabs">{["All","Programs","Courses","Workshops","Short Lessons","Learning Paths"].map((x,i)=><button className={i===0?"tab active":"tab"} key={x}>{x}</button>)}</div>
        <button className="learn-sort">Recommended ↓</button>
      </div>

      <div className="premium-catalog-layout">
        <aside className="premium-filter">
          <div className="premium-filter-head"><span>FILTERS</span><button>Clear</button></div>
          <fieldset><legend>Format</legend>{["Programs","Courses","Short lessons","Workshop replays"].map(x=><label key={x}><input type="checkbox"/><span>{x}</span></label>)}</fieldset>
          <fieldset><legend>Topic</legend>{["AI Strategy","Generative AI","Product & Design","Data & Analytics","Leadership","Governance"].map(x=><label key={x}><input type="checkbox"/><span>{x}</span></label>)}</fieldset>
          <fieldset><legend>Level</legend>{["Beginner","Intermediate","Advanced"].map(x=><label key={x}><input type="checkbox"/><span>{x}</span></label>)}</fieldset>
        </aside>

        <div className="premium-catalog">
          <div className="home-section-head"><div><span className="eyebrow">CURATED</span><h2>Featured programmes</h2></div><a>View all →</a></div>
          <div className="premium-program-grid">
            {programs.map((p,i)=><article className="premium-program-card" key={p.title}>
              <div className={"editorial-cover cover-"+p.cover}>
                <span>{p.label}</span><strong>{String(i+1).padStart(2,"0")}</strong><i/>
              </div>
              <div className="premium-program-copy">
                <div className="programme-meta"><span>{p.meta}</span><span>{p.level}</span></div>
                <h3>{p.title}</h3><p>{p.desc}</p>
                {p.progress&&<div className="programme-progress"><div className="skill-track"><i style={{width:p.progress}}/></div><b>{p.progress}</b></div>}
                <Link href={i===0?"/lms/learn/ai-strategy/lesson/high-value-use-cases":"/lms/learn"}>Explore programme <ArrowUpRight size={14}/></Link>
              </div>
            </article>)}
          </div>

          <div className="home-section-head learn-subhead"><div><span className="eyebrow">ON DEMAND</span><h2>Courses</h2></div><a>Browse all →</a></div>
          <div className="premium-course-list">
            {courses.map((c,i)=><article className="premium-course-row" key={c.title}>
              <div className={"course-tile tile-"+c.cover}><span>{String(i+1).padStart(2,"0")}</span><i/></div>
              <div><span className="course-topic">{c.topic}</span><h3>{c.title}</h3><p>{c.length} · Certificate eligible</p></div>
              <div className="course-skill-tags"><span>{i%2===0?"Business":"Hands-on"}</span><span>{i<2?"Popular":"New"}</span></div>
              <Link href="/lms/learn/ai-strategy/lesson/high-value-use-cases">Start <ArrowUpRight size={14}/></Link>
            </article>)}
          </div>

          <div className="home-section-head learn-subhead"><div><span className="eyebrow">GUIDED</span><h2>Learning paths</h2></div></div>
          <div className="learning-paths">
            <article><span>01</span><div><strong>From Beginner to Builder</strong><p>4 courses · 3 practical projects</p></div><ArrowUpRight size={18}/></article>
            <article><span>02</span><div><strong>AI for Business Functions</strong><p>Role-based learning across teams</p></div><ArrowUpRight size={18}/></article>
            <article><span>03</span><div><strong>Governance & Responsible AI</strong><p>Policy, risk and operating practice</p></div><ArrowUpRight size={18}/></article>
          </div>
        </div>
      </div>
    </div>
  </Shell>
}

export function LessonScreen() {
  const lessons=["Identifying High-Value AI Use Cases","Evaluating Feasibility and ROI","Building a Business Case","Stakeholder Alignment","From Pilot to Scale","Module Review & Quiz"];
  return <Shell><div className="lesson-layout"><section className="lesson-main"><div className="breadcrumb">Learn <span>›</span> AI Strategy for Business Leaders <span>›</span> Module 3</div><span className="status in-progress">In Progress</span><h1 className="lesson-title">Identifying High-Value AI Use Cases</h1><p className="lesson-deck">Learn how to evaluate, prioritise and scope AI use cases that deliver real business impact.</p><div className="video-stage"><div className="video-copy"><span>MODULE 3</span><h2>Identifying<br/>High-Value<br/>AI Use Cases</h2><p>From possibility to practical impact.</p></div><button className="play-button"><PlayCircle size={50}/></button><div className="video-controls"><span>▶</span><div className="video-progress"><i/></div><span>0:12 / 12:34</span><span>CC</span><span>1×</span></div></div><div className="tabs-row lesson-tabs">{["Overview","Notes","Transcript","Resources","Discussion"].map((x,i)=><button className={i===0?"tab active":"tab"} key={x}>{x}</button>)}</div><article className="lesson-body"><h2>About this lesson</h2><p>We break down a practical framework to identify, evaluate and prioritise AI use cases in your organisation.</p><div className="takeaways"><h3>Key takeaways</h3><div><span>✓ Identify high-value use cases</span><span>✓ Assess feasibility and ROI</span><span>✓ Learn from real examples</span><span>✓ Use a practical template</span></div></div></article></section><aside className="lesson-rail"><section className="course-summary"><div className="course-cover"/><h2>AI Strategy for Business Leaders</h2><p>Turn AI potential into measurable business impact.</p><div className="progress"><span style={{width:"62%"}}/></div><div className="summary-meta"><span>Module 3 of 8</span><b>62% complete</b></div></section><section className="curriculum">{lessons.map((x,i)=><div className={i===0?"lesson-row active":"lesson-row"} key={x}><span>{i===0?"▶":"🔒"}</span><strong>{i+1}. {x}</strong><small>{10+i}:21</small></div>)}</section></aside></div></Shell>
}

export function WorkshopsScreen() {
  const rows=[
    {date:"24",month:"OCT",title:"From AI Pilots to Real Impact",speaker:"Rohan Mehta",role:"AI transformation advisor",time:"11:00–12:30",format:"Online",cohort:"AI Strategy Cohort",state:"REGISTERED",tone:"one"},
    {date:"08",month:"NOV",title:"Building AI-Ready Teams",speaker:"Anita Kapoor",role:"Organisation design leader",time:"11:00–12:30",format:"Mumbai",cohort:"AI Strategy Cohort",state:"OPEN",tone:"two"},
    {date:"22",month:"NOV",title:"AI & Regulation: What Leaders Need to Know",speaker:"Vikram Sinha",role:"Technology counsel",time:"11:00–12:30",format:"Online",cohort:"Leadership Series",state:"OPEN",tone:"three"},
    {date:"05",month:"DEC",title:"Scaling AI Across the Enterprise",speaker:"Nisha Rao",role:"Enterprise AI operator",time:"15:00–16:30",format:"Mumbai",cohort:"Leadership Series",state:"OPEN",tone:"four"},
  ];
  return <Shell>
    <div className="premium-workshops">
      <header className="workshops-premium-head">
        <div><span className="eyebrow">WORKSHOPS</span><h1>Live learning.<br/>Real decisions.</h1><p>Expert-led sessions built around the work leaders actually need to do.</p></div>
        <div className="workshop-stats"><div><strong>4</strong><span>upcoming</span></div><div><strong>2</strong><span>registered</span></div><div><strong>7.5h</strong><span>attended</span></div></div>
      </header>

      <div className="tabs-row premium-tabs workshop-tabs">{["Upcoming","Registered","Past sessions","Recordings"].map((x,i)=><button className={i===0?"tab active":"tab"} key={x}>{x}</button>)}</div>

      <section className="premium-workshop-feature">
        <div className="feature-date-block"><span>OCT</span><strong>24</strong><small>SATURDAY</small></div>
        <div className="feature-workshop-copy"><span className="eyebrow">NEXT LIVE SESSION</span><h2>From AI Pilots to Real Impact</h2><p>Move from isolated experiments to repeatable business outcomes — using a practical scale-up framework.</p><div className="feature-workshop-meta"><span><Clock3 size={15}/> 11:00–12:30 IST</span><span><Video size={15}/> Online</span><span><UsersRound size={15}/> 34 cohort members</span></div><div className="action-row"><Link className="button dark" href="/lms/workshops/from-ai-pilots-to-real-impact">Open workshop →</Link><button className="button secondary">Add to calendar</button></div></div>
        <div className="feature-workshop-art"><span>WORKSHOP 04</span><strong>From pilot<br/>to progress.</strong><i/></div>
      </section>

      <section className="workshop-schedule">
        <div className="home-section-head"><div><span className="eyebrow">SCHEDULE</span><h2>Upcoming workshops</h2></div><a>Calendar view →</a></div>
        <div className="premium-workshop-rows">
          {rows.map((w,i)=><article className="premium-workshop-row" key={w.title}>
            <div className="schedule-date"><strong>{w.date}</strong><span>{w.month}</span></div>
            <div className={"schedule-art schedule-"+w.tone}><span>{w.format}</span></div>
            <div className="schedule-main"><div className="schedule-title-line"><h3>{w.title}</h3><span className={w.state==="REGISTERED"?"registered-state":"open-state"}>{w.state}</span></div><div className="speaker-line"><span className="speaker-initial">{w.speaker.split(" ").map(x=>x[0]).join("")}</span><p><strong>{w.speaker}</strong><small>{w.role}</small></p></div></div>
            <div className="schedule-context"><span><Clock3 size={14}/>{w.time}</span><span><UsersRound size={14}/>{w.cohort}</span></div>
            <Link className="schedule-link" href={i===0?"/lms/workshops/from-ai-pilots-to-real-impact":"/lms/workshops"}>View <ArrowUpRight size={15}/></Link>
          </article>)}
        </div>
      </section>

      <section className="workshop-after">
        <div><span className="eyebrow">AFTER THE ROOM</span><h2>Every workshop keeps working.</h2><p>Recordings, transcripts, resources and cohort discussions are kept together so the learning continues after the session.</p></div>
        <Link href="/lms/library/recordings">Browse recordings <ArrowUpRight size={16}/></Link>
      </section>
    </div>
  </Shell>
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


export function CommunityScreen() {
  const posts=[
    {avatar:"PS",name:"Priya Shah",role:"AI Strategy Cohort",time:"2h",tag:"DISCUSSION",title:"How are you measuring ROI on AI pilots?",body:"We have good pilot-level engagement, but I’m struggling with what to track once a use case moves into a business team. What has worked for others?",replies:12,saves:8},
    {avatar:"RM",name:"Rohan Mehta",role:"Workshop faculty",time:"5h",tag:"FRAMEWORK",title:"A simple way to separate experimentation from scale",body:"Sharing the 2×2 framework from last week’s session. The useful distinction is not pilot vs production — it is evidence vs operating readiness.",replies:18,saves:23},
    {avatar:"AK",name:"Anita Kapoor",role:"Cohort member",time:"1d",tag:"SHOW & TELL",title:"Our first internal AI enablement playbook",body:"We turned our workshop notes into a 6-page internal guide for managers. Posting the structure here in case it helps anyone building something similar.",replies:9,saves:14},
  ];
  return <Shell>
    <div className="premium-community">
      <header className="community-head">
        <div><span className="eyebrow">COMMUNITY</span><h1>Learn together.<br/>Build in public.</h1><p>Questions, frameworks and practical work from your cohort and the wider WeAreAiLabs network.</p></div>
        <button className="button dark community-new"><Plus size={16}/> Start a discussion</button>
      </header>

      <div className="tabs-row premium-tabs community-tabs">{["My cohort","All discussions","Q&A","Show & Tell","Announcements"].map((x,i)=><button className={i===0?"tab active":"tab"} key={x}>{x}</button>)}</div>

      <div className="community-layout">
        <main className="community-feed">
          <Link className="pinned-discussion" href="/lms/community/discussion/ai-roi">
            <div><span className="eyebrow">PINNED · COHORT QUESTION</span><h2>What should AI ROI actually look like?</h2><p>A focused thread before our next workshop — share one metric you trust and one you don’t.</p></div><ArrowUpRight size={20}/>
          </Link>

          <div className="feed-toolbar"><span>Latest from your cohort</span><button>Newest ↓</button></div>
          {posts.map((p,i)=><article className="community-post" key={p.title}>
            <div className="post-avatar">{p.avatar}</div>
            <div className="post-main">
              <div className="post-byline"><strong>{p.name}</strong><span>{p.role} · {p.time}</span></div>
              <span className="post-tag">{p.tag}</span>
              <h3>{p.title}</h3><p>{p.body}</p>
              <div className="post-actions"><Link href={i===0?"/lms/community/discussion/ai-roi":"/lms/community"}><MessageCircle size={15}/>{p.replies} replies</Link><button><Bookmark size={14}/>{p.saves} saves</button><button>Share</button></div>
            </div>
          </article>)}
        </main>

        <aside className="community-rail">
          <section className="premium-side-panel community-cohort">
            <span className="eyebrow">YOUR COHORT</span><h3>AI Strategy for Business Leaders</h3><p>Mumbai · October 2026</p><div className="premium-avatar-stack"><span>PS</span><span>RM</span><span>AK</span><span>VS</span><span>+30</span></div><div className="community-cohort-stats"><span><b>34</b> members</span><span><b>7</b> active discussions</span></div>
          </section>
          <section className="premium-side-panel ama-panel"><span className="eyebrow">UPCOMING AMA</span><div className="ama-date"><strong>09</strong><span>OCT</span></div><h3>Ask Dr. Meera Iyer</h3><p>AI governance, decision rights and risk. Add your question before Thursday.</p><button className="button secondary">Submit a question</button></section>
          <section className="premium-side-panel"><div className="panel-heading"><div><span className="eyebrow">CONTRIBUTORS</span><h3>Most helpful this week</h3></div></div>{[["RM","Rohan Mehta","18 helpful replies"],["PS","Priya Shah","12 helpful replies"],["AK","Anita Kapoor","9 helpful replies"]].map(x=><div className="contributor-row" key={x[1]}><span>{x[0]}</span><p><strong>{x[1]}</strong><small>{x[2]}</small></p></div>)}</section>
        </aside>
      </div>
    </div>
  </Shell>
}

export function CommunityThreadScreen() {
  const replies=[
    ["RM","Rohan Mehta","Workshop faculty","I’d split ROI into three layers: operational value, adoption evidence, and strategic option value. The mistake is forcing all three into one financial number too early."],
    ["AK","Anita Kapoor","Cohort member","We started with time-to-complete and rework reduction because finance could validate both. Revenue impact came much later."],
    ["VS","Vikram Sinha","Cohort member","For regulated workflows we also track the cost of control — human review effort, exceptions and escalation time."],
  ];
  return <Shell>
    <div className="breadcrumb">Community <span>›</span> AI Strategy Cohort <span>›</span> Discussion</div>
    <div className="thread-layout">
      <main>
        <article className="thread-question">
          <div className="thread-author"><span>PS</span><p><strong>Priya Shah</strong><small>AI Strategy Cohort · 2 hours ago</small></p></div>
          <span className="post-tag">DISCUSSION</span><h1>How are you measuring ROI on AI pilots?</h1><p>We have good pilot-level engagement, but I’m struggling with what to track once a use case moves into a business team. What has worked for others?</p>
          <div className="thread-meta"><span>12 replies</span><span>8 saves</span><span>34 cohort members can view</span></div>
        </article>
        <div className="reply-heading"><strong>12 replies</strong><button>Most helpful ↓</button></div>
        {replies.map(r=><article className="thread-reply" key={r[1]}><div className="thread-author"><span>{r[0]}</span><p><strong>{r[1]}</strong><small>{r[2]}</small></p></div><p>{r[3]}</p><div><button>Helpful</button><button>Reply</button></div></article>)}
        <section className="reply-composer"><div className="post-avatar">GT</div><div><textarea placeholder="Add to the discussion..."/><div><span>Keep it practical and useful to the cohort.</span><button className="button dark">Reply</button></div></div></section>
      </main>
      <aside><section className="premium-side-panel"><span className="eyebrow">THREAD CONTEXT</span><h3>AI Strategy for Business Leaders</h3><p>Module 3 · Identifying High-Value AI Use Cases</p><Link href="/lms/learn/ai-strategy/lesson/high-value-use-cases">Open lesson →</Link></section><section className="premium-side-panel"><span className="eyebrow">RELATED</span>{["How we prioritised 14 AI use cases","Pilot scorecards that finance trusts","When adoption metrics matter more than ROI"].map(x=><Link className="related-thread" href="/lms/community" key={x}>{x}<ArrowUpRight size={13}/></Link>)}</section></aside>
    </div>
  </Shell>
}

export function ProjectsScreen() {
  const projects=[
    {title:"AI Research Assistant",type:"CAPSTONE",desc:"Design a focused AI assistant that helps a business team research, synthesise and decide faster.",due:"18 Oct",status:"IN PROGRESS",tone:"research"},
    {title:"Responsible AI Playbook",type:"PRACTICAL BRIEF",desc:"Turn governance principles into a concise operating playbook for a real organisation.",due:"02 Nov",status:"NOT STARTED",tone:"govern"},
    {title:"AI Opportunity Map",type:"STRATEGY EXERCISE",desc:"Map and prioritise opportunities across one business function using evidence and readiness.",due:"15 Nov",status:"NOT STARTED",tone:"map"},
  ];
  return <Shell>
    <div className="premium-projects">
      <header className="projects-head"><div><span className="eyebrow">PROJECTS</span><h1>Build. Share.<br/>Get feedback.</h1><p>Turn learning into evidence by solving practical, real-world briefs.</p></div><div className="projects-score"><span>YOUR PROJECTS</span><strong>1 / 3</strong><small>currently in progress</small></div></header>

      <section className="active-project">
        <div className="active-project-art"><span>CAPSTONE 01</span><strong>Research.<br/>Synthesis.<br/>Decision.</strong><i/></div>
        <div className="active-project-copy"><span className="eyebrow">ACTIVE PROJECT</span><h2>AI Research Assistant</h2><p>Design a focused assistant that helps a business team research, synthesise and decide faster.</p><div className="active-project-meta"><span><Clock3 size={15}/> Due 18 October</span><span><UsersRound size={15}/> 11 cohort submissions</span></div><div className="project-progress"><span>Brief reviewed</span><span>Evidence added</span><span className="current">Build in progress</span><span>Submit</span></div><div className="action-row"><Link className="button dark" href="/lms/projects/ai-research-assistant">Continue project →</Link><Link className="text-link" href="/lms/community">See peer work →</Link></div></div>
      </section>

      <div className="home-section-head project-subhead"><div><span className="eyebrow">YOUR BRIEFS</span><h2>Projects</h2></div><button className="project-filter">All projects ↓</button></div>
      <div className="project-grid">
        {projects.map((p,i)=><article className="project-card" key={p.title}><div className={"project-cover project-"+p.tone}><span>{p.type}</span><strong>{String(i+1).padStart(2,"0")}</strong></div><div className="project-copy"><div className="project-status-line"><span className={p.status==="IN PROGRESS"?"project-live":"project-muted"}>{p.status}</span><small>Due {p.due}</small></div><h3>{p.title}</h3><p>{p.desc}</p><div className="project-card-foot"><span>{i===0?"3 of 4 milestones":"4 milestones"}</span><Link href={i===0?"/lms/projects/ai-research-assistant":"/lms/projects"}>{i===0?"Continue":"View brief"} <ArrowUpRight size={14}/></Link></div></div></article>)}
      </div>

      <section className="peer-showcase"><div><span className="eyebrow">FROM YOUR COHORT</span><h2>Peer work worth seeing.</h2><p>Selected submissions and work-in-progress shared by your cohort.</p></div><div className="peer-items"><article><span>PS</span><div><strong>Procurement Research Copilot</strong><p>Priya Shah · 14 helpful reactions</p></div></article><article><span>AK</span><div><strong>Manager AI Readiness Toolkit</strong><p>Anita Kapoor · 11 helpful reactions</p></div></article></div><Link href="/lms/community">Open showcase →</Link></section>
    </div>
  </Shell>
}

export function ProjectDetailScreen() {
  return <Shell>
    <div className="breadcrumb">Projects <span>›</span> AI Research Assistant</div>
    <div className="project-detail-head"><div><span className="eyebrow">CAPSTONE PROJECT</span><h1>AI Research Assistant</h1><p>Design a focused assistant that helps a business team research, synthesise and decide faster.</p></div><div className="project-due"><span>DUE</span><strong>18</strong><small>OCTOBER</small></div></div>
    <div className="project-detail-layout">
      <main>
        <section className="project-brief-block"><span className="eyebrow">THE BRIEF</span><h2>Build for a real decision.</h2><p>Choose one recurring research task from a real business context. Design a lightweight AI workflow that improves the quality or speed of that task without hiding the evidence behind the answer.</p></section>
        <section className="project-detail-section"><h2>Deliverables</h2>{[["01","Problem statement","What decision or task are you improving?"],["02","Working prototype","A usable URL, repository or recorded walkthrough."],["03","Evidence pack","Sources, screenshots and test cases showing how it performs."],["04","Reflection","What worked, what failed, and what you would improve."]].map(x=><div className="deliverable" key={x[0]}><strong>{x[0]}</strong><div><h3>{x[1]}</h3><p>{x[2]}</p></div><CheckCircle2 size={18}/></div>)}</section>
        <section className="project-detail-section"><h2>How it will be reviewed</h2><div className="criteria-grid"><div><strong>30%</strong><span>Problem clarity</span></div><div><strong>30%</strong><span>Practical usefulness</span></div><div><strong>25%</strong><span>Evidence & testing</span></div><div><strong>15%</strong><span>Reflection</span></div></div></section>
      </main>
      <aside><section className="premium-side-panel"><span className="eyebrow">YOUR PROGRESS</span><div className="project-side-progress"><span className="done">Brief reviewed</span><span className="done">Evidence added</span><span className="current">Build in progress</span><span>Submit project</span></div><Link className="button dark project-submit-cta" href="/lms/projects/ai-research-assistant/submit">Submit project →</Link></section><section className="premium-side-panel"><span className="eyebrow">RESOURCES</span>{["Research workflow canvas","Evaluation checklist","Example submission"].map(x=><a className="project-resource" key={x}><FileText size={15}/>{x}<Download size={14}/></a>)}</section><section className="premium-side-panel"><span className="eyebrow">DISCUSSION</span><h3>11 people are working on this brief</h3><p>Ask for feedback or share what you are testing.</p><Link href="/lms/community">Open project discussion →</Link></section></aside>
    </div>
  </Shell>
}

export function ProjectSubmissionScreen() {
  return <Shell>
    <div className="breadcrumb">Projects <span>›</span> AI Research Assistant <span>›</span> Submit</div>
    <div className="submission-head"><span className="eyebrow">PROJECT SUBMISSION</span><h1>Show the work.</h1><p>Submit enough evidence for an instructor to understand what you built, how it works and what you learned.</p></div>
    <div className="submission-layout">
      <main className="submission-form">
        <section><span className="submission-step">01</span><div><label>Working URL</label><input placeholder="https://..."/><small>Prototype, deployed app, repository or shared workspace.</small></div></section>
        <section><span className="submission-step">02</span><div><label>What did you build?</label><textarea placeholder="Describe the problem, user and solution in a few clear paragraphs."/></div></section>
        <section><span className="submission-step">03</span><div><label>Evidence</label><div className="upload-zone"><Upload size={20}/><strong>Add screenshots or files</strong><span>PNG, JPG, PDF · up to 10 MB each</span></div></div></section>
        <section><span className="submission-step">04</span><div><label>Reflection</label><textarea placeholder="What worked? What did not? What would you change next?"/></div></section>
        <div className="submission-actions"><button className="button secondary">Save draft</button><button className="button dark">Submit for review</button></div>
      </main>
      <aside><section className="premium-side-panel"><span className="eyebrow">BEFORE YOU SUBMIT</span>{["The URL opens without requesting access","Your evidence shows the actual workflow","You have described at least one limitation","Your reflection is specific, not generic"].map(x=><label className="submission-check" key={x}><input type="checkbox"/><span>{x}</span></label>)}</section><section className="premium-side-panel"><span className="eyebrow">REVIEW</span><p>Instructor review normally appears here after submission, with score, comments and skill evidence.</p></section></aside>
    </div>
  </Shell>
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
  if(section==="community") return <CommunityScreen/>;
  if(section==="projects") return <ProjectsScreen/>;
  const item = sectionCopy[section] || ["Not found","LMS","This LMS area is not available."];
  return <Shell><div className="page-heading"><span className="eyebrow">{item[1]}</span><h1>{item[0]}</h1><p>{item[2]}</p></div><div className="empty-module"><div><span className="eyebrow">MODULE READY</span><h2>{item[0]}</h2><p>This area is wired into the LMS route system and will be expanded from the approved UI specification.</p></div></div></Shell>
}
