export const demoLmsData = {
  user: {
    firstName: "Gaurav",
    displayName: "Gaurav",
    initials: "GT"
  },
  programme: {
    id: "ai-business-lab-mumbai-oct-2026",
    title: "AI Business Lab",
    datesLabel: "24–25 October 2026",
    preworkDueLabel: "20 October",
    format: "2-day in-person programme",
    location: "Mumbai",
    attendeeCount: 34,
    progress: 25,
    currentLesson: {
      id: "identify-use-case",
      title: "Identify Your High-Value AI Use Case",
      description: "Choose one business problem you want to work on during the Lab and frame the opportunity clearly.",
      progress: 50
    },
    stages: [
      {
        id: "prework",
        label: "PRE-WORK",
        dateLabel: "Before 24 Oct",
        title: "Arrive with a real problem",
        description: "Short preparation so Day 1 starts with context instead of theory.",
        completedCount: 1,
        items: [
          { id:"context", title:"AI opportunity primer", meta:"12 min · complete", complete:true },
          { id:"use-case", title:"Identify your high-value AI use case", meta:"20 min · in progress", complete:false }
        ]
      },
      {
        id: "day1",
        label: "DAY 1",
        dateLabel: "24 Oct",
        title: "Build",
        description: "From opportunity framing to a working AI application.",
        completedCount: 0,
        items: [
          { id:"session-1", title:"From AI opportunity to scoped use case", meta:"09:30 · live session", complete:false },
          { id:"session-2", title:"Build sprint: working AI application", meta:"14:00 · live session", complete:false }
        ]
      },
      {
        id: "day2",
        label: "DAY 2",
        dateLabel: "25 Oct",
        title: "Refine + Decide",
        description: "Improve the build, review business readiness and close with the expert panel.",
        completedCount: 0,
        items: [
          { id:"session-3", title:"Build sprint: refine and test", meta:"09:30 · live session", complete:false },
          { id:"session-4", title:"Expert panel: Legal, Technology & Business", meta:"14:00 · panel", complete:false }
        ]
      },
      {
        id: "after",
        label: "AFTER",
        dateLabel: "Post-Lab",
        title: "Apply",
        description: "Recordings, community, follow-up advisory and a 90-day action plan.",
        completedCount: 0,
        items: [
          { id:"recordings", title:"Workshop recordings & resources", meta:"Published after the Lab", complete:false },
          { id:"action-plan", title:"90-day AI action plan", meta:"Due 02 Nov", complete:false }
        ]
      }
    ]
  },
  sessions: [
    { id:"day1-opportunity", day:"24", month:"OCT", time:"09:30–12:30", title:"From AI Opportunity to Scoped Use Case", track:"DAY 1 · BUILD", facilitator:"WeAreAiLabs Faculty", format:"In person · Mumbai", status:"registered" },
    { id:"day1-build", day:"24", month:"OCT", time:"14:00–17:00", title:"Build Sprint: Working AI Application", track:"DAY 1 · BUILD", facilitator:"WeAreAiLabs Faculty", format:"In person · Mumbai", status:"registered" },
    { id:"day2-refine", day:"25", month:"OCT", time:"09:30–12:30", title:"Build Sprint: Refine & Test", track:"DAY 2 · BUILD", facilitator:"WeAreAiLabs Faculty", format:"In person · Mumbai", status:"registered" },
    { id:"day2-panel", day:"25", month:"OCT", time:"14:00–16:00", title:"Expert Panel: Legal, Technology & Business", track:"DAY 2 · PANEL", facilitator:"Invited Expert Panel", format:"In person · Mumbai", status:"registered" }
  ],
  projects: [
    {
      id:"opportunity-map",
      phase:"PRE-WORK",
      title:"AI Opportunity Map",
      description:"Frame one real business problem, map value and readiness, and select the use case you will take into the Lab.",
      dueLabel:"20 Oct",
      status:"in_progress",
      statusLabel:"In progress",
      completedMilestones:2,
      totalMilestones:4,
      review:{ state:"not_submitted", reviewer:null, comments:0 }
    },
    {
      id:"working-prototype",
      phase:"IN-ROOM BUILD",
      title:"Working AI Prototype",
      description:"Build and test a practical AI application during the two-day Lab.",
      dueLabel:"25 Oct · 13:00",
      status:"not_started",
      statusLabel:"Not started",
      completedMilestones:0,
      totalMilestones:4,
      review:{ state:"not_submitted", reviewer:null, comments:0 }
    },
    {
      id:"action-plan",
      phase:"POST-LAB",
      title:"90-Day AI Action Plan",
      description:"Turn workshop learning into a practical next-step plan for your organisation.",
      dueLabel:"02 Nov",
      status:"not_started",
      statusLabel:"Not started",
      completedMilestones:0,
      totalMilestones:3,
      review:{ state:"not_submitted", reviewer:null, comments:0 }
    }
  ],
  community: {
    memberCount: 34,
    categories:["Discussion","Q&A","Framework","Show & Tell","Announcement"],
    ama:{
      title:"Ask the Expert Panel",
      dateLabel:"09 Oct · 17:00 IST",
      description:"Submit questions on legal, technology and business considerations before the Lab."
    },
    posts:[
      { id:"ai-roi", avatar:"PS", author:"Priya Shah", scope:"AI Business Lab", ageLabel:"2h", category:"Discussion", title:"How are you measuring ROI on AI pilots?", body:"We have good pilot-level engagement, but what are people measuring once a use case moves into an actual business workflow?", replies:12, saves:8, unread:true },
      { id:"prioritisation", avatar:"RM", author:"Rohan Mehta", scope:"AI Business Lab", ageLabel:"5h", category:"Framework", title:"A simple way to separate experimentation from scale", body:"Sharing the value × readiness framework before the Lab so everyone can pressure-test one real use case.", replies:18, saves:23, unread:true },
      { id:"playbook", avatar:"AK", author:"Anita Kapoor", scope:"Alumni", ageLabel:"1d", category:"Show & Tell", title:"Our first internal AI enablement playbook", body:"We turned our workshop notes into a short manager guide. Sharing the structure for anyone doing something similar.", replies:9, saves:14, unread:false }
    ]
  },
  recordings:[
    { id:"governance", title:"AI Governance for Leaders", duration:"48 min", ageLabel:"2 days ago" },
    { id:"ideas-to-implementation", title:"From Ideas to Implementation", duration:"56 min", ageLabel:"1 week ago" }
  ],
  skills:[
    { id:"use-case-prioritisation", name:"Use-case prioritisation", description:"Frame, compare and select AI opportunities using value and readiness.", level:"Developing", levelKey:"developing", updatedLabel:"06 Oct", evidence:[{label:"AI Opportunity Map · problem framing",href:"/lms/projects"}] },
    { id:"ai-roi", name:"AI ROI measurement", description:"Define practical evidence of value before and after deployment.", level:"Started", levelKey:"started", updatedLabel:"06 Oct", evidence:[{label:"ROI discussion · cohort contribution",href:"/lms/community/discussion/ai-roi"}] },
    { id:"workflow-design", name:"AI workflow design", description:"Design a useful human + AI workflow around a real task.", level:"Started", levelKey:"started", updatedLabel:"04 Oct", evidence:[{label:"Pre-work · workflow notes",href:"/lms/learn"}] },
    { id:"prototype-building", name:"Prototype building", description:"Turn a scoped problem into a working AI application.", level:"Not started", levelKey:"not_started", updatedLabel:"—", evidence:[] },
    { id:"responsible-ai", name:"Responsible AI judgement", description:"Apply governance and risk thinking to a practical AI use case.", level:"Not started", levelKey:"not_started", updatedLabel:"—", evidence:[] }
  ]
};

export function getDemoSummary(){
  const stages=demoLmsData.programme.stages;
  const totalItems=stages.reduce((sum,stage)=>sum+stage.items.length,0);
  const completedItems=stages.reduce((sum,stage)=>sum+stage.items.filter(item=>item.complete).length,0);
  return {
    totalItems,
    completedItems,
    registeredSessions:demoLmsData.sessions.filter(session=>session.status==="registered").length,
    activeProjects:demoLmsData.projects.filter(project=>project.status==="in_progress").length,
    skillsWithEvidence:demoLmsData.skills.filter(skill=>skill.evidence.length>0).length
  };
}
