export const agenda = [
  { time: "09:30", type: "Continue learning", title: "AI Strategy for Business Leaders", meta: "Module 3 · 62% complete", action: "Continue" },
  { time: "11:00", type: "LIVE", title: "AI Governance for Leaders", meta: "with Dr. Meera Iyer", action: "Join session" },
  { time: "14:00", type: "DUE", title: "Project review", meta: "Responsible AI Strategy", action: "Submit" },
];

export const workshops = [
  { date: "24 OCT", title: "From AI Pilots to Real Impact", meta: "Thu, 11:00–12:30 · Rohan Mehta" },
  { date: "08 NOV", title: "Building AI-Ready Teams", meta: "Thu, 11:00–12:30 · Anita Kapoor" },
  { date: "22 NOV", title: "AI & Regulation: What Leaders Need to Know", meta: "Thu, 11:00–12:30 · Vikram Sinha" },
];

export const featuredPrograms = [
  { title: "AI Strategy for Business Leaders", desc: "Turn AI potential into measurable business impact.", meta: "8 modules · 6 weeks · Intermediate" },
  { title: "Build AI Products Without Code", desc: "From idea to working prototype.", meta: "6 modules · 4 weeks · Beginner" },
  { title: "Responsible AI for Organisations", desc: "Govern, mitigate and scale with confidence.", meta: "5 modules · 4 weeks · Intermediate" },
];

export const lessons = [
  ["1. Identifying High-Value AI Use Cases", "12:34", true],
  ["2. Evaluating Feasibility and ROI", "10:21", false],
  ["3. Building a Business Case", "14:08", false],
  ["4. Stakeholder Alignment", "11:52", false],
  ["5. From Pilot to Scale", "13:37", false],
  ["6. Module Review & Quiz", "08:15", false],
] as const;
