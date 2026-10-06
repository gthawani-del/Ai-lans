"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import Lottie from "lottie-react";
import learningPulse from "./learning-pulse.json";
import { demoLmsData, getDemoSummary } from "../data/demo-data";
import {
  ArrowUpRight, Bell, BookOpen, Bookmark, CalendarDays, CheckCircle2, ChevronLeft,
  ChevronRight, CircleHelp, Clock3, Compass, Download, FileText, FolderKanban, Home,
  Library, MapPin, MessageCircle, Plus, PlayCircle, Search, ShieldCheck, Sparkles,
  Trophy, Upload, UserRound, UsersRound, Video, X
} from "lucide-react";

const primaryNav = [
  ["/lms", "Home"],
  ["/lms/learn", "Learn"],
  ["/lms/workshops", "Workshops"],
  ["/lms/community", "Community"],
  ["/lms/projects", "Projects"],
];

const utilityNav = [
  ["/lms/guide", "Getting around", Compass],
  ["/lms/library", "Library", Library],
  ["/lms/skills", "Skills", Sparkles],
  ["/lms/assessments", "Assessments", ShieldCheck],
  ["/lms/certificates", "Certificates", Trophy],
  ["/lms/profile", "Profile", UserRound],
];

function SignatureMotion() {
  return <div className="signature-motion" aria-hidden="true"><Lottie animationData={learningPulse} loop autoplay /></div>;
}

function HelpTooltip({ text, label = "More information", children }) {
  const id = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);

  return <span className="help-tooltip" onMouseLeave={()=>setOpen(false)}>
    <button
      type="button"
      className="help-tooltip-trigger"
      aria-label={label}
      aria-describedby={open ? id : undefined}
      aria-expanded={open}
      onMouseEnter={()=>setOpen(true)}
      onFocus={()=>setOpen(true)}
      onBlur={()=>setOpen(false)}
      onClick={()=>setOpen(value=>!value)}
    >
      {children || <CircleHelp size={16} aria-hidden="true"/>}
    </button>
    {open && <span className="help-tooltip-bubble" role="tooltip" id={id}>{text}</span>}
  </span>;
}

const walkthroughSteps = [
  {
    selector:'[data-tour="programme"]',
    eyebrow:"YOUR PROGRAMME",
    title:"Everything starts from here.",
    body:"Home shows the programme you are enrolled in, its dates and your overall progress."
  },
  {
    selector:'[data-tour="next-action"]',
    eyebrow:"NEXT ACTION",
    title:"You never need to guess what to do next.",
    body:"This area changes with your programme state: pre-work, live session, deadline or next lesson."
  },
  {
    selector:'[data-tour="nav-workshops"]',
    eyebrow:"LIVE SESSIONS",
    title:"Your schedule lives here.",
    body:"See Day 1 and Day 2 sessions, registration state, timing, venue and later the recordings."
  },
  {
    selector:'[data-tour="nav-projects"]',
    eyebrow:"PRACTICAL WORK",
    title:"Projects turn learning into evidence.",
    body:"Build, submit, receive feedback and carry verified evidence into your Skills profile."
  },
  {
    selector:'[data-tour="more"]',
    eyebrow:"MORE",
    title:"Resources and progress stay out of the main navigation.",
    body:"Library, Skills, Assessments, Certificates, Profile and the permanent LMS Guide are here."
  }
];

function Walkthrough({ pathname }) {
  const storageKey = "weareailabs:lms-walkthrough-v1";
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (pathname !== "/lms") return;
    try {
      if (!window.localStorage.getItem(storageKey)) {
        const timer = window.setTimeout(()=>setOpen(true), 650);
        return () => window.clearTimeout(timer);
      }
    } catch {}
  }, [pathname]);

  useEffect(() => {
    const replay = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener("lms:walkthrough", replay);
    return () => window.removeEventListener("lms:walkthrough", replay);
  }, []);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const element = document.querySelector(walkthroughSteps[step].selector);
      if (!element) return setRect(null);
      const box = element.getBoundingClientRect();
      setRect({
        top: Math.max(6, box.top - 7),
        left: Math.max(6, box.left - 7),
        width: Math.min(window.innerWidth - 12, box.width + 14),
        height: box.height + 14
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, step, pathname]);

  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (event.key === "Escape") finish();
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  });

  const finish = () => {
    try { window.localStorage.setItem(storageKey, "done"); } catch {}
    setOpen(false);
    setStep(0);
  };

  if (!open || pathname !== "/lms") return null;
  const current = walkthroughSteps[step];

  return <>
    <div className="tour-backdrop" aria-hidden="true"/>
    {rect && <div className="tour-spotlight" aria-hidden="true" style={rect}/>}
    <section className="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="tour-card-top">
        <span>{current.eyebrow}</span>
        <button type="button" onClick={finish} aria-label="Close walkthrough"><X size={17}/></button>
      </div>
      <h2 id="tour-title">{current.title}</h2>
      <p>{current.body}</p>
      <div className="tour-progress" aria-label={"Step "+(step+1)+" of "+walkthroughSteps.length}>
        {walkthroughSteps.map((_,index)=><i className={index===step?"active":""} key={index}/>)}
      </div>
      <div className="tour-actions">
        <button type="button" className="tour-skip" onClick={finish}>Don’t show again</button>
        <div>
          {step>0 && <button type="button" className="tour-arrow" onClick={()=>setStep(step-1)} aria-label="Previous step"><ChevronLeft size={17}/></button>}
          <button type="button" className="button dark" onClick={()=>step===walkthroughSteps.length-1?finish():setStep(step+1)}>
            {step===walkthroughSteps.length-1?"Done":"Next"} {step<walkthroughSteps.length-1&&<ChevronRight size={16}/>}
          </button>
        </div>
      </div>
    </section>
  </>;
}

function Shell({ children }) {
  const pathname = usePathname();
  const shellRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".lms-page-enter", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .42, ease: "power2.out" });
      gsap.fromTo(".learner-nav-link", { autoAlpha: .55, y: -4 }, { autoAlpha: 1, y: 0, duration: .28, stagger: .025, ease: "power1.out" });
    }, shellRef);
    return () => ctx.revert();
  }, [pathname]);

  return <div className="app-shell learner-shell" ref={shellRef}>
    <a className="skip-link" href="#lms-main">Skip to content</a>
    <header className="learner-header">
      <div className="learner-header-inner">
        <Link className="learner-brand" href="/lms" aria-label="WeAreAiLabs LMS home">weareailabs</Link>

        <nav className="learner-nav" aria-label="Primary LMS">
          {primaryNav.map(([href,label]) => {
            const active = href === "/lms" ? pathname === "/lms" : pathname.startsWith(href);
            return <Link key={href} href={href} data-tour={"nav-"+label.toLowerCase()} className={active ? "learner-nav-link active" : "learner-nav-link"}>{label}</Link>;
          })}
          <details className="learner-more">
            <summary data-tour="more" aria-label="More: Library, Skills, Assessments, Certificates, Profile and LMS Guide">More</summary>
            <div className="learner-more-menu">
              {utilityNav.map(([href,label,Icon]) => <Link href={href} key={href}><Icon size={16} aria-hidden="true"/><span>{label}</span></Link>)}
            </div>
          </details>
        </nav>

        <div className="learner-tools">
          <form className="learner-search" role="search" onSubmit={(event)=>event.preventDefault()}>
            <Search size={17} aria-hidden="true"/>
            <input type="search" aria-label="Search LMS" placeholder="Search"/>
          </form>
          <HelpTooltip label="About notifications" text="Notifications will group feedback, session reminders and community mentions."><Bell size={18} aria-hidden="true"/></HelpTooltip>
          <HelpTooltip label="How to use this LMS" text="Need orientation? Open More → Getting around WeAreAiLabs."><CircleHelp size={18} aria-hidden="true"/></HelpTooltip>
          <Link href="/lms/profile" className="learner-profile" aria-label="Open profile">
            <span className="avatar" aria-hidden="true">GT</span>
            <span className="learner-profile-copy"><strong>Gaurav</strong><small>Learner</small></span>
          </Link>
        </div>
      </div>
    </header>
    <main className="page lms-page-enter" id="lms-main" tabIndex="-1">{children}</main>
    <Walkthrough pathname={pathname}/>
  </div>;
}

const agenda = [
  ["09:30","Continue learning","AI Business Lab","Module 3 · 62% complete","Continue"],
  ["11:00","LIVE","AI Governance for Leaders","with Dr. Meera Iyer","Join session"],
  ["14:00","DUE","Project review","Responsible AI Strategy","Submit"],
];

export function DashboardScreen() {
  const { user, programme, sessions, projects, community, recordings } = demoLmsData;
  const summary = getDemoSummary();
  const nextSessions = sessions.filter(session => session.status === "registered").slice(0,3);
  const activeProject = projects.find(project => project.status === "in_progress");
  const latestDiscussion = community.posts[0];

  return <Shell>
    <div className="editorial-home module-home trust-home">
      <section className="trust-page-head" data-tour="programme">
        <div><span className="eyebrow">AI BUSINESS LAB · MUMBAI</span><h1>Welcome back, {user.firstName}.</h1><p>{programme.datesLabel} · {programme.format} · {programme.location}</p></div>
        <div className="trust-head-meta"><span className="help-label">PROGRAMME PROGRESS <HelpTooltip label="About programme progress" text="Progress counts completed pre-work and programme learning items. Live attendance and project review are tracked separately."/></span><strong>{programme.progress}%</strong><small>{summary.completedItems} of {summary.totalItems} learning items complete</small></div>
      </section>

      <section className="trust-next-action" data-tour="next-action">
        <div className="trust-action-label"><span className="eyebrow light">NEXT ACTION</span><small>Pre-work · due {programme.preworkDueLabel}</small></div>
        <div className="trust-action-copy"><h2>{programme.currentLesson.title}</h2><p>{programme.currentLesson.description}</p><div className="editorial-progress"><div className="progress"><span style={{width:programme.currentLesson.progress+"%"}}/></div><b>{programme.currentLesson.progress}%</b></div></div>
        <div className="trust-action-side"><SignatureMotion/><Link className="button accent" href="/lms/learn/ai-strategy/lesson/high-value-use-cases">Continue pre-work →</Link></div>
      </section>

      <section className="trust-two-col">
        <div>
          <div className="editorial-section-head"><div><span className="eyebrow">PROGRAMME SCHEDULE</span><h2>What’s next</h2></div><Link href="/lms/workshops">Full schedule →</Link></div>
          <div className="trust-schedule-list">
            {nextSessions.map(session => <Link className="trust-schedule-row" href="/lms/workshops" key={session.id}>
              <div className="trust-date"><strong>{session.day}</strong><span>{session.month}</span></div>
              <div><strong>{session.title}</strong><small>{session.time} IST · {session.format}</small></div>
              <span className="status in-progress">Registered</span>
              <ArrowUpRight size={16}/>
            </Link>)}
          </div>
        </div>

        <div>
          <div className="editorial-section-head"><div><span className="eyebrow">ACTIVE PROJECT</span><h2>{activeProject.title}</h2></div><Link href="/lms/projects">Projects →</Link></div>
          <div className="trust-project-summary">
            <p>{activeProject.description}</p>
            <div className="trust-project-status"><span className="status in-progress">In progress</span><span>Due {activeProject.dueLabel}</span><span>{activeProject.completedMilestones}/{activeProject.totalMilestones} milestones complete</span></div>
            <Link href="/lms/projects" className="text-link">Continue project →</Link>
          </div>
        </div>
      </section>

      <section className="trust-three-col">
        <div className="trust-stat-block"><span className="eyebrow">YOUR COHORT</span><strong>{community.memberCount}</strong><p>participants</p><div className="premium-avatar-stack"><span>PS</span><span>RM</span><span>AK</span><span>VS</span><span>+{community.memberCount-4}</span></div></div>
        <div className="trust-stat-block"><span className="eyebrow">DISCUSSIONS</span><strong>{community.posts.length}</strong><p>active threads</p><Link href="/lms/community">Open community →</Link></div>
        <div className="trust-stat-block"><span className="eyebrow">SKILLS WITH EVIDENCE</span><strong>{summary.skillsWithEvidence}</strong><p>of {demoLmsData.skills.length} tracked</p><Link href="/lms/skills">View skills →</Link></div>
      </section>

      <section className="editorial-bottom-grid">
        <div className="editorial-community-pulse">
          <div className="editorial-section-head"><div><span className="eyebrow">LATEST DISCUSSION</span><h2>{latestDiscussion.title}</h2></div><Link href="/lms/community/discussion/ai-roi">Open →</Link></div>
          <p className="trust-discussion-copy">{latestDiscussion.body}</p>
          <div className="trust-discussion-meta"><span>{latestDiscussion.replies} replies</span><span>{latestDiscussion.saves} saves</span><span>{latestDiscussion.scope}</span></div>
        </div>
        <div className="editorial-watch">
          <div className="editorial-section-head"><div><span className="eyebrow">WATCH AGAIN</span><h2>Recent recordings</h2></div><Link href="/lms/library/recordings">Library →</Link></div>
          {recordings.slice(0,2).map((recording,i)=><Link href="/lms/library/recordings" className="editorial-recording" key={recording.id}><span className={"editorial-recording-art "+(i===0?"recording-a":"recording-b")}><PlayCircle size={22}/></span><span><strong>{recording.title}</strong><small>{recording.duration} · {recording.ageLabel}</small></span></Link>)}
        </div>
      </section>
    </div>
  </Shell>
}

export function LearnScreen() {
  const { programme } = demoLmsData;
  return <Shell>
    <div className="trust-learn module-learn">
      <header className="compact-page-head">
        <div><span className="eyebrow">LEARN</span><h1>{programme.title}</h1><p>{programme.datesLabel} · {programme.format} · {programme.location}</p></div>
        <div className="compact-head-action"><span>Programme progress</span><strong>{programme.progress}%</strong></div>
      </header>

      <section className="trust-continue-strip">
        <div><span className="eyebrow light">CONTINUE PRE-WORK</span><h2>{programme.currentLesson.title}</h2><p>{programme.currentLesson.description}</p></div>
        <div className="trust-continue-progress"><div className="progress"><span style={{width:programme.currentLesson.progress+"%"}}/></div><b>{programme.currentLesson.progress}%</b></div>
        <Link className="button accent" href="/lms/learn/ai-strategy/lesson/high-value-use-cases">Continue →</Link>
      </section>

      <section className="trust-learning-sections">
        {programme.stages.map(stage => <article className="trust-learning-stage" key={stage.id}>
          <div className="trust-stage-date"><span>{stage.label}</span><strong>{stage.dateLabel}</strong></div>
          <div className="trust-stage-main"><h2>{stage.title}</h2><p>{stage.description}</p>
            <div className="trust-stage-items">{stage.items.map(item => <div className="trust-stage-item" key={item.id}><span className={item.complete?"stage-check complete":"stage-check"}>{item.complete?"✓":"○"}</span><div><strong>{item.title}</strong><small>{item.meta}</small></div></div>)}</div>
          </div>
          <div className="trust-stage-status"><span>{stage.completedCount}/{stage.items.length} complete</span></div>
        </article>)}
      </section>

      <section className="trust-learning-links">
        <Link href="/lms/projects"><span className="eyebrow">PROJECTS</span><strong>{demoLmsData.projects.length} practical outputs</strong><ArrowUpRight size={17}/></Link>
        <Link href="/lms/workshops"><span className="eyebrow">LIVE SESSIONS</span><strong>{demoLmsData.sessions.length} scheduled sessions</strong><ArrowUpRight size={17}/></Link>
        <Link href="/lms/skills"><span className="eyebrow">SKILLS</span><strong>{demoLmsData.skills.length} capabilities tracked</strong><ArrowUpRight size={17}/></Link>
      </section>
    </div>
  </Shell>
}

export function LessonScreen() {
  const lessons=["Identify Your High-Value AI Use Case","Evaluating Feasibility and ROI","Building a Business Case","Stakeholder Alignment","From Pilot to Scale","Module Review & Quiz"];
  return <Shell><div className="lesson-layout"><section className="lesson-main"><div className="breadcrumb">Learn <span>›</span> AI Business Lab <span>›</span> Module 3</div><span className="status in-progress">In Progress</span><h1 className="lesson-title">Identify Your High-Value AI Use Case</h1><p className="lesson-deck">Learn how to evaluate, prioritise and scope AI use cases that deliver real business impact.</p><div className="video-stage"><div className="video-copy"><span>MODULE 3</span><h2>Identifying<br/>High-Value<br/>AI Use Cases</h2><p>From possibility to practical impact.</p></div><button className="play-button"><PlayCircle size={50}/></button><div className="video-controls"><span>▶</span><div className="video-progress"><i/></div><span>0:12 / 12:34</span><span>CC</span><span>1×</span></div></div><div className="tabs-row lesson-tabs">{["Overview","Notes","Transcript","Resources","Discussion"].map((x,i)=><button className={i===0?"tab active":"tab"} key={x}>{x}</button>)}</div><article className="lesson-body"><h2>About this lesson</h2><p>We break down a practical framework to identify, evaluate and prioritise AI use cases in your organisation.</p><div className="takeaways"><h3>Key takeaways</h3><div><span>✓ Identify high-value use cases</span><span>✓ Assess feasibility and ROI</span><span>✓ Learn from real examples</span><span>✓ Use a practical template</span></div></div></article></section><aside className="lesson-rail"><section className="course-summary"><div className="course-cover"/><h2>AI Business Lab</h2><p>Turn AI potential into measurable business impact.</p><div className="progress"><span style={{width:"62%"}}/></div><div className="summary-meta"><span>Module 3 of 8</span><b>62% complete</b></div></section><section className="curriculum">{lessons.map((x,i)=><div className={i===0?"lesson-row active":"lesson-row"} key={x}><span>{i===0?"▶":"🔒"}</span><strong>{i+1}. {x}</strong><small>{10+i}:21</small></div>)}</section></aside></div></Shell>
}

export function WorkshopsScreen() {
  const { programme, sessions } = demoLmsData;
  const registered = sessions.filter(session => session.status === "registered");
  return <Shell>
    <div className="trust-workshops module-workshops">
      <header className="compact-page-head">
        <div><span className="eyebrow">LIVE SESSIONS</span><h1>{programme.title}</h1><p>{programme.datesLabel} · {programme.location}</p></div>
        <div className="compact-head-action"><span>Registered</span><strong>{registered.length}/{sessions.length}</strong></div>
      </header>

      <section className="trust-session-summary">
        <div><span className="eyebrow">DAY 1</span><h2>Build</h2><p>Hands-on application building from opportunity to working prototype.</p></div>
        <div><span className="eyebrow">DAY 2</span><h2>Refine + Decide</h2><p>Continue building, then close with the expert panel across legal, technology and business.</p></div>
      </section>

      <div className="editorial-section-head trust-schedule-head"><div><span className="eyebrow">SCHEDULE</span><h2>All sessions</h2></div><span className="trust-timezone">Times shown in IST</span></div>
      <div className="trust-session-list">
        {sessions.map(session => <article className="trust-session-row" key={session.id}>
          <div className="trust-date"><strong>{session.day}</strong><span>{session.month}</span></div>
          <div className="trust-session-time"><strong>{session.time}</strong><small>IST</small></div>
          <div className="trust-session-main"><span className="eyebrow">{session.track}</span><h3>{session.title}</h3><p>{session.facilitator} · {session.format}</p></div>
          <div className="trust-session-actions">
            {session.status==="registered"?<span className="status in-progress">✓ Registered</span>:<button className="button dark small">Register</button>}
            <Link href="/lms/workshops/from-ai-pilots-to-real-impact">Details →</Link>
          </div>
        </article>)}
      </div>

      <section className="trust-post-session">
        <div><span className="eyebrow light">AFTER THE LAB</span><h2>Recordings, resources and follow-up stay together.</h2><p>Every session will link to its recording, transcript, resources and discussion after the programme.</p></div>
        <Link href="/lms/library/recordings">Open recordings →</Link>
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
  const { community } = demoLmsData;
  return <Shell>
    <div className="trust-community module-community">
      <header className="compact-page-head">
        <div><span className="eyebrow">COMMUNITY</span><h1>Your cohort</h1><p>{community.memberCount} participants · AI Business Lab · Mumbai</p></div>
        <div className="context-head-stack community-head-actions"><Link className="context-help-link" href="/lms/guide#community">How Community works →</Link><button className="button dark"><Plus size={16}/> Start a discussion</button></div>
      </header>

      <div className="trust-community-tabs">{community.categories.map((category,i)=><button className={i===0?"active":""} key={category}>{category}</button>)}</div>

      <div className="community-layout trust-community-layout">
        <main>
          <div className="trust-new-divider"><span>New since your last visit</span></div>
          {community.posts.map((post,i)=><article className="trust-community-post" key={post.id}>
            <div className="post-avatar">{post.avatar}</div>
            <div>
              <div className="post-byline"><strong>{post.author}</strong><span>{post.scope} · {post.ageLabel}</span>{post.unread&&<HelpTooltip label="Unread discussion" text="New activity since your last visit."><i className="unread-dot" aria-hidden="true"/></HelpTooltip>}</div>
              <span className="post-tag">{post.category}</span>
              <h2>{post.title}</h2><p>{post.body}</p>
              <div className="post-actions"><Link href={i===0?"/lms/community/discussion/ai-roi":"/lms/community"}><MessageCircle size={15}/>{post.replies} replies</Link><button><Bookmark size={14}/>{post.saves} saves</button></div>
            </div>
          </article>)}
        </main>

        <aside className="trust-community-side">
          <section><span className="eyebrow">COHORT</span><h3>AI Business Lab</h3><p>{community.memberCount} participants · Mumbai</p><div className="premium-avatar-stack"><span>PS</span><span>RM</span><span>AK</span><span>VS</span><span>+{community.memberCount-4}</span></div></section>
          <section><span className="eyebrow">PRE-WORK AMA</span><h3>{community.ama.title}</h3><p>{community.ama.dateLabel} · {community.ama.description}</p><button className="button secondary">Submit a question</button></section>
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
      <aside><section className="premium-side-panel"><span className="eyebrow">THREAD CONTEXT</span><h3>AI Business Lab</h3><p>Module 3 · Identify Your High-Value AI Use Case</p><Link href="/lms/learn/ai-strategy/lesson/high-value-use-cases">Open lesson →</Link></section><section className="premium-side-panel"><span className="eyebrow">RELATED</span>{["How we prioritised 14 AI use cases","Pilot scorecards that finance trusts","When adoption metrics matter more than ROI"].map(x=><Link className="related-thread" href="/lms/community" key={x}>{x}<ArrowUpRight size={13}/></Link>)}</section></aside>
    </div>
  </Shell>
}

export function ProjectsScreen() {
  const { projects } = demoLmsData;
  return <Shell>
    <div className="trust-projects module-projects">
      <header className="compact-page-head">
        <div><span className="eyebrow">PROJECTS</span><h1>Practical outputs</h1><p>Three pieces of work move from pre-work to in-room build to post-lab action.</p></div>
        <div className="context-head-stack"><div className="compact-head-action"><span>In progress</span><strong>{projects.filter(p=>p.status==="in_progress").length}/{projects.length}</strong></div><Link className="context-help-link" href="/lms/guide#projects">How project feedback works →</Link></div>
      </header>

      <div className="trust-project-list">
        {projects.map(project => <article className="trust-project-row" key={project.id}>
          <div className="trust-project-state"><span className={project.status==="in_progress"?"status in-progress":"status open-state"}>{project.statusLabel}</span><small>Due {project.dueLabel}</small></div>
          <div className="trust-project-main"><span className="eyebrow">{project.phase}</span><h2>{project.title}</h2><p>{project.description}</p></div>
          <div className="trust-project-progress"><strong>{project.completedMilestones}/{project.totalMilestones}</strong><span>milestones</span></div>
          <div className="trust-project-review"><span className="review-help"><HelpTooltip label="About project review" text="After submission, a facilitator can review the project, leave rubric feedback and add evidence to your Skills profile."/></span>
            {project.review.state==="feedback_ready"?<><span className="status in-progress">Feedback ready</span><small>{project.review.reviewer} · {project.review.comments} comments</small></>:project.review.state==="in_review"?<><span className="status due">In review</span><small>{project.review.reviewer}</small></>:<><span className="project-muted">Not submitted</span><small>No reviewer yet</small></>}
          </div>
          <Link href={project.id==="opportunity-map"?"/lms/projects/ai-research-assistant":"/lms/projects"}>{project.status==="in_progress"?"Continue":"View brief"} <ArrowUpRight size={15}/></Link>
        </article>)}
      </div>

      <section className="trust-feedback-explainer">
        <div><span className="eyebrow light">FEEDBACK LOOP</span><h2>Submit → review → revise → complete.</h2><p>Each project can carry facilitator comments, rubric scores and evidence into your Skills profile.</p></div>
        <Link href="/lms/skills">See Skills × Evidence →</Link>
      </section>
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


export function SkillsScreen() {
  const { skills } = demoLmsData;
  return <Shell>
    <div className="trust-skills">
      <header className="compact-page-head">
        <div><span className="eyebrow">SKILLS × EVIDENCE</span><h1>Your capability record</h1><p>Skills grow when there is evidence behind them — projects, reviews and facilitator sign-off.</p></div>
        <div className="context-head-stack"><div className="compact-head-action"><span className="help-label">With evidence <HelpTooltip label="About skill evidence" text="Evidence can come from project submissions, reviewed work, cohort contributions and facilitator sign-off."/></span><strong>{skills.filter(skill=>skill.evidence.length>0).length}/{skills.length}</strong></div><Link className="context-help-link" href="/lms/guide#skills">How Skills × Evidence works →</Link></div>
      </header>

      <div className="skills-table" role="table" aria-label="Skills and evidence">
        <div className="skills-table-head" role="row"><span>Skill</span><span>Level</span><span>Evidence</span><span>Last updated</span></div>
        {skills.map(skill => <div className="skills-table-row" role="row" key={skill.id}>
          <div><strong>{skill.name}</strong><p>{skill.description}</p></div>
          <div><span className={"skill-level level-"+skill.levelKey}>{skill.level}</span></div>
          <div className="skill-evidence-list">{skill.evidence.length?skill.evidence.map(item=><Link href={item.href} key={item.label}>{item.label}<ArrowUpRight size={13}/></Link>):<span className="skill-empty">Complete a project milestone to add evidence.</span>}</div>
          <div><span>{skill.updatedLabel}</span></div>
        </div>)}
      </div>

      <section className="skills-explainer">
        <span className="eyebrow">HOW IT WORKS</span>
        <div><strong>1. Learn</strong><p>Complete pre-work and live sessions.</p></div>
        <div><strong>2. Apply</strong><p>Use the skill in a project or exercise.</p></div>
        <div><strong>3. Verify</strong><p>Facilitator review or project evidence confirms it.</p></div>
      </section>
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

export function GuideScreen() {
  const restartTour = () => {
    try { window.localStorage.removeItem("weareailabs:lms-walkthrough-v1"); } catch {}
    window.location.href = "/lms";
  };

  const sections = [
    { id:"learn", label:"01", title:"Learn", copy:"Complete pre-work and access the programme material you need before and during the Lab.", href:"/lms/learn" },
    { id:"sessions", label:"02", title:"Live Sessions", copy:"See Day 1 and Day 2 timing, venue, registration state and later the session recordings.", href:"/lms/workshops" },
    { id:"projects", label:"03", title:"Projects", copy:"Build practical outputs, submit them for review, revise with feedback and carry evidence into Skills.", href:"/lms/projects" },
    { id:"community", label:"04", title:"Community", copy:"Ask questions, compare approaches, join cohort discussions and continue the conversation after the Lab.", href:"/lms/community" },
    { id:"skills", label:"05", title:"Skills × Evidence", copy:"See capabilities you have demonstrated and the work, feedback or facilitator sign-off supporting them.", href:"/lms/skills" },
    { id:"library", label:"06", title:"Library", copy:"Return to recordings, transcripts, templates and supporting resources after sessions are published.", href:"/lms/library" }
  ];

  return <Shell>
    <div className="guide-page">
      <header className="guide-head">
        <div><span className="eyebrow">LMS GUIDE</span><h1>Getting around WeAreAiLabs</h1><p>You only need to understand one workflow: prepare, attend, build, get feedback, show evidence and keep access.</p></div>
        <button className="button secondary" type="button" onClick={restartTour}>Replay 5-step tour</button>
      </header>

      <section className="guide-flow" aria-labelledby="guide-flow-title">
        <div><span className="eyebrow">THE FLOW</span><h2 id="guide-flow-title">How the LMS fits together</h2></div>
        <ol>
          {["Learn","Attend","Build","Get feedback","Show evidence","Keep access"].map((item,index)=><li key={item}><span>{String(index+1).padStart(2,"0")}</span><strong>{item}</strong>{index<5&&<ChevronRight size={16} aria-hidden="true"/>}</li>)}
        </ol>
      </section>

      <section className="guide-map">
        <div className="editorial-section-head"><div><span className="eyebrow">START HERE</span><h2>Where everything lives</h2></div></div>
        {sections.map(item=><article className="guide-row" id={item.id} key={item.id}>
          <span className="guide-number">{item.label}</span>
          <div><h3>{item.title}</h3><p>{item.copy}</p></div>
          <Link href={item.href}>Open <ArrowUpRight size={15}/></Link>
        </article>)}
      </section>

      <section className="guide-principles">
        <div><span className="eyebrow">WHEN IN DOUBT</span><h2>Use Home as your control point.</h2><p>Home always shows your programme, the next action, upcoming sessions, active project and current cohort context.</p></div>
        <div><strong>More</strong><p>Library, Skills, Assessments, Certificates, Profile and this guide stay under More so the main navigation remains simple.</p></div>
      </section>
    </div>
  </Shell>
}

export function SectionScreen({ section }) {
  if(section==="community") return <CommunityScreen/>;
  if(section==="projects") return <ProjectsScreen/>;
  if(section==="skills") return <SkillsScreen/>;
  const item = sectionCopy[section] || ["This area","LMS","Nothing is available here yet."];
  const emptyCopy = {
    library:"Recordings and resources will appear here as they are published.",
    assessments:"No assessments are due right now.",
    certificates:"Certificates will appear here after programme completion.",
    profile:"Your account and learning history will appear here."
  };
  return <Shell><div className="compact-page-head"><div><span className="eyebrow">{item[1]}</span><h1>{item[0]}</h1><p>{item[2]}</p></div></div><div className="trust-empty-state"><span className="eyebrow">NOTHING TO SHOW YET</span><h2>{item[0]}</h2><p>{emptyCopy[section] || "There is nothing to show here yet."}</p></div></Shell>
}
