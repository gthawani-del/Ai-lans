import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { featuredPrograms } from "@/lib/demo-data";

export default function LearnPage() {
  return (
    <AppShell>
      <div className="learn-hero">
        <div><span className="eyebrow">LEARN</span><h1>Skills for what’s next.</h1><p>Practical learning for real world impact.</p></div>
        <div className="hero-note">“Learn, unlearn and apply — faster than everyone else.”</div>
      </div>

      <div className="tabs-row">
        {["All","Programs","Courses","Workshops","Short Lessons","Learning Paths"].map((x,i)=><button className={i===0?"tab active":"tab"} key={x}>{x}</button>)}
      </div>

      <div className="catalog-layout">
        <aside className="filters">
          <div className="panel-heading"><h3>Filter</h3><button>Clear all</button></div>
          <FilterGroup title="Content type" items={["Programs","Courses","Workshops","Short Lessons","Learning Paths"]}/>
          <FilterGroup title="Topic" items={["AI Strategy","Generative AI","Product & Design","Data & Analytics","Business & Leadership","AI for Functions","Regulation & Ethics"]}/>
          <FilterGroup title="Level" items={["Beginner","Intermediate","Advanced"]}/>
        </aside>

        <section className="catalog-content">
          <div className="section-title"><h2>Featured Programs</h2><a>View all →</a></div>
          <div className="program-grid">
            {featuredPrograms.map((p,i)=>(
              <article className="program-card" key={p.title}>
                <div className={"program-image p-"+(i+1)}/>
                <div><h3>{p.title}</h3><p>{p.desc}</p><small>{p.meta}</small>
                  <Link href={i===0?"/learn/ai-strategy/lesson/high-value-use-cases":"/learn"}>View program →</Link>
                </div>
              </article>
            ))}
          </div>

          <div className="section-title spaced"><h2>All Courses</h2><a>View all →</a></div>
          <div className="course-grid">
            {["Generative AI for Work","Prompt Engineering Essentials","AI for Data Analysis","AI in Marketing"].map((x,i)=>(
              <article className="course-card" key={x}><div className={"course-image c-"+(i+1)}/><h3>{x}</h3><p>Practical skills you can use immediately.</p><small>{8+i} lessons · 2 hours</small><Link href="/learn/ai-strategy/lesson/high-value-use-cases">Start learning →</Link></article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function FilterGroup({title,items}:{title:string;items:string[]}) {
  return <fieldset><legend>{title}</legend>{items.map(x=><label key={x}><input type="checkbox"/><span>{x}</span></label>)}</fieldset>
}
