export const MODEL = "enhanced_v3";
export const COMMITMENT_VERSION = "2026-11-18-role-based";
export const commitments = [
  "I can support both workshop days once the dates are confirmed",
  "I can support the agreed full-day workshop hours",
  "I will arrange a suitable laptop or flag if I need one",
  "I will help participants within my skills and escalate issues when needed",
  "I will actively support participants rather than only observe",
  "I will complete orientation or preparation requested by the team",
  "I will keep participant information confidential and will not copy or reuse it",
  "I understand this is an active volunteer role",
];
export const tools = [
  ["claude", "Claude / Claude Code"],
  ["codex", "OpenAI Codex"],
  ["github", "GitHub"],
  ["vercel", "Vercel"],
  ["supabase", "Supabase"],
];
export function configuredTools(config = {}) {
  const names = config.stack_tools || tools.map((t) => t[1]);
  return names.map(
    (name, i) => tools.find((t) => t[1] === name) || ["tool_" + i, name],
  );
}
export const levels = ["New to it", "Used it", "Comfortable", "Built with it"];
export const options = {
  role:["Student","Recent graduate","Working Professional","Founder","Developer","Designer","AI Enthusiast","Other"],
  background:["Student / recent graduate","Business / operations","Engineering / technology","Product / management","Design / creative","Data / AI","Other"],
  preferredRole:[
    "Technical builder / troubleshooting","AI workflow and prompting",
    "Product and business analysis","UX and design","Research and documentation",
    "Teaching and facilitation","Operations and coordination"
  ],
  usefulSkills:["Debugging","Coding","AI prompting / workflows","Product thinking","Design","Research","Teaching / mentoring","Coordination / communication","Other"],
  experienceStatus:["Some experience","No prior experience yet"],
  projectType:["Web app / website","Mobile app","Automation / workflow","AI assistant / agent","Data / analytics project","Prototype / proof of concept","Design / research / operations work","Other"],
  contributionAreas:["Product thinking","Prompting / AI workflows","Frontend","Backend / APIs","Database","Deployment / DevOps","Design / UX","Testing / debugging","Research / documentation","Coordination / operations","Teaching / facilitation"],
  involvement:["Owned end-to-end","Contributed significantly","Assisted","Observed only"],
  evidenceVisibility:["Public links","Private / cannot share"],
  languages:["English","Hindi","Marathi","Gujarati","Malayalam","Other"],
  attendance:["Yes, both days","Need confirmed dates","Need travel support"],
  deviceAvailability:["I can bring a laptop","I need a device","Not sure yet"]
};
export const rules = [
  {key:"name",label:"Full name",step:0,min:2,max:100,required:true},
  {key:"email",label:"Email address",step:0,max:254,pattern:"^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$",required:true},
  {key:"phone",label:"Indian mobile number",step:0,pattern:"^\\\\+91[6-9][0-9]{9}$",required:true},
  {key:"city",label:"City / travel-from location",step:0,min:2,max:80,required:true},
  {key:"role",label:"Current status or role",step:0,enum:options.role,required:true},
  {key:"roleOther",label:"Please specify your role",step:0,min:2,max:100,when:{role:"Other"},required:true},
  {key:"company",label:"Organisation (if applicable)",step:0,max:150},
  {key:"preferredRole",label:"Preferred volunteer contribution",step:1,enum:options.preferredRole,required:true},
  {key:"usefulSkills",label:"Your strongest capabilities",step:1,array:options.usefulSkills,required:true},
  {key:"usefulOther",label:"Other capability",step:1,min:2,max:100,when:{usefulSkills:"Other"},required:true},
  {key:"why",label:"Why do you want to volunteer?",step:1,min:30,max:500,required:true},
  {key:"communicationExample",label:"How would you help a non-technical participant understand a difficult idea?",step:1,min:30,max:500,required:true},
  {key:"background",label:"Relevant background (optional)",step:1,enum:options.background},
  {key:"backgroundOther",label:"Please specify your background",step:1,min:2,max:100,when:{background:"Other"},required:true},
  {key:"experienceStatus",label:"Relevant experience",step:2,enum:options.experienceStatus,required:true},
  {key:"beginnerExample",label:"Tell us about a course, personal project or activity where you helped solve a problem",step:2,min:20,max:500,when:{experienceStatus:"No prior experience yet"},required:true},
  {key:"projectType",label:"Type of work",step:2,enum:options.projectType,when:{experienceStatus:"Some experience"}},
  {key:"projectTypeOther",label:"Other type of work",step:2,min:2,max:100,when:{experienceStatus:"Some experience",projectType:"Other"},required:true},
  {key:"contributionAreas",label:"Areas you contributed to",step:2,array:options.contributionAreas,when:{experienceStatus:"Some experience"},required:true},
  {key:"contributionLevel",label:"How much did you personally contribute?",step:2,enum:options.involvement,when:{experienceStatus:"Some experience"},required:true},
  {key:"strongest",label:"What did you build, organise or help deliver?",step:2,min:10,max:500,when:{experienceStatus:"Some experience"},required:true},
  {key:"contribution",label:"What did you personally do?",step:2,min:10,max:500,when:{experienceStatus:"Some experience"},required:true},
  {key:"evidenceVisibility",label:"Evidence availability",step:2,enum:options.evidenceVisibility,when:{experienceStatus:"Some experience"},required:true},
  {key:"privateEvidence",label:"Describe your private or confidential work without sharing protected information",step:2,min:20,max:500,when:{experienceStatus:"Some experience",evidenceVisibility:"Private / cannot share"},required:true},
  {key:"projectUrl",label:"Live project / demo (if applicable)",step:2,url:"web",when:{experienceStatus:"Some experience",evidenceVisibility:"Public links"}},
  {key:"repoUrl",label:"GitHub repository (if applicable)",step:2,url:"repository",when:{experienceStatus:"Some experience",evidenceVisibility:"Public links"}},
  {key:"otherUrl",label:"Portfolio, case study, writing sample or other evidence",step:2,url:"web",when:{experienceStatus:"Some experience",evidenceVisibility:"Public links"}},
  {key:"languages",label:"Languages you can use with participants",step:3,array:options.languages,required:true},
  {key:"languagesOther",label:"Other languages",step:3,min:2,max:100,when:{languages:"Other"},required:true},
  {key:"attendance",label:"Availability for two days in Mumbai",step:3,enum:options.attendance,required:true},
  {key:"deviceAvailability",label:"Laptop availability",step:3,enum:options.deviceAvailability,required:true},
  {key:"commitmentChecks",label:"Volunteer commitments",step:3,array:commitments,minItems:commitments.length,required:true},
  {key:"accurate",label:"Accuracy declaration",step:4,boolean:true,required:true},
  {key:"consent",label:"Application processing consent",step:4,boolean:true,required:true}
];
export function visible(rule, d) {
  return (
    !rule.when ||
    Object.entries(rule.when).every(([k, v]) =>
      Array.isArray(d[k])
        ? d[k].includes(v)
        : Array.isArray(v)
          ? v.includes(d[k])
          : d[k] === v,
    )
  );
}
export function normalizePhone(v) {
  let n = String(v || "").replace(/[\s()-]/g, "");
  if (/^[6-9][0-9]{9}$/.test(n)) n = "+91" + n;
  else if (/^91[6-9][0-9]{9}$/.test(n)) n = "+" + n;
  return n;
}
export function urlValid(v, kind = "web") {
  try {
    const u = new URL(v);
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      u.port ||
      /\s/.test(v)
    )
      return false;
    const host = u.hostname.toLowerCase();
    const parts = u.pathname.split("/").filter(Boolean);
    if (kind === "linkedin")
      return (
        ["linkedin.com", "www.linkedin.com", "in.linkedin.com"].includes(
          host,
        ) &&
        parts.length === 2 &&
        parts[0] === "in"
      );
    if (kind === "github" || kind === "repository")
      return (
        ["github.com", "www.github.com"].includes(host) &&
        parts.length === (kind === "repository" ? 2 : 1) &&
        parts.every((x) => /^[\w.-]+$/.test(x))
      );
    return host.includes(".");
  } catch {
    return false;
  }
}
export function normalize(input = {}) {
  const allowed=new Set([...rules.map(r=>r.key),"stack","customTools","photoApproved"]);
  const d=Object.fromEntries(Object.entries(input||{}).filter(([k])=>allowed.has(k)));
  for(const [k,v] of Object.entries(d))if(typeof v==="string")d[k]=v.normalize("NFC").trim();
  d.phone=normalizePhone(d.phone);
  d.email=String(d.email||"").toLowerCase();
  for(const r of rules)if(!visible(r,d))d[r.key]=r.array?[]:r.boolean?false:"";
  d.stack=d.stack&&typeof d.stack==="object"&&!Array.isArray(d.stack)?d.stack:{};
  d.customTools=Array.isArray(d.customTools)?d.customTools.map(t=>({name:String(t?.name||"").trim(),level:String(t?.level||"")})):[];
  d.involvement=d.experienceStatus==="Some experience"&&Array.isArray(d.contributionAreas)?
    Object.fromEntries(d.contributionAreas.map(a=>[a,d.contributionLevel||""])):{};
  d.experience=[];
  d.organisation=d.company||"";
  d.addressCityPostcode=d.city||"";
  d.countryCode="in";
  d.commitmentAgreed=Array.isArray(d.commitmentChecks)&&d.commitmentChecks.length===commitments.length&&commitments.every(s=>d.commitmentChecks.includes(s));
  d.commitment=d.commitmentAgreed?[...commitments]:[];
  d.commitmentVersion=COMMITMENT_VERSION;
  d.formModel=MODEL;
  return d;
}
export function validate(input,step=null,{photo=true,activeTools=tools}={}){
  const d=normalize(input),errors={};
  for(const r of rules){
    if((step!==null&&r.step!==step)||!visible(r,d))continue;
    const v=d[r.key];let ok=true;
    if(r.boolean)ok=v===true;
    else if(r.array)ok=Array.isArray(v)&&(!r.required||v.length>0)&&(!r.minItems||v.length>=r.minItems)&&v.every(x=>r.array.includes(x))&&new Set(v).size===v.length;
    else if(!v)ok=!r.required;
    else ok=typeof v==="string"&&(!r.min||v.length>=r.min)&&(!r.max||v.length<=r.max)&&(!r.enum||r.enum.includes(v))&&(!r.pattern||new RegExp(r.pattern).test(v))&&(!r.url||urlValid(v,r.url))&&!Array.from(v).some(ch=>{const code=ch.charCodeAt(0);return code<32&&code!==9&&code!==10&&code!==13;});
    if(!ok)errors[r.key]=r.url?`Enter a valid HTTPS ${r.label.toLowerCase()} URL.`:r.min?`${r.label}: enter ${r.min}–${r.max} characters.`:`Please complete: ${r.label}.`;
  }
  if(step===null||step===1){
    const needsTools=d.preferredRole==="Technical builder / troubleshooting";
    if(needsTools)for(const [k,label] of activeTools)if(!levels.includes(d.stack[k]))errors.stack=`Choose a proficiency level for ${label}.`;
    for(const [k,v] of Object.entries(d.stack))if(!levels.includes(v)||!activeTools.some(([id])=>id===k))errors.stack="Invalid tool rating.";
    if(d.customTools.length>10||d.customTools.some(t=>!t.name||t.name.length>80||!levels.includes(t.level)))errors.customTools="Each additional tool needs a name and level.";
  }
  if(step===null||step===2){
    if(d.preferredRole==="Technical builder / troubleshooting"&&d.experienceStatus==="No prior experience yet")
      errors.experienceStatus="Technical builder volunteers need relevant experience. Please choose another contribution track.";
    if(d.experienceStatus==="Some experience"&&d.evidenceVisibility==="Public links"&&!d.projectUrl&&!d.repoUrl&&!d.otherUrl)
      errors.otherUrl="Add one relevant work link, or choose private work and explain it.";
  }
  return errors;
}
export const initial=Object.assign(Object.fromEntries(rules.map(r=>[r.key,r.array?[]:r.boolean?false:""])),{
  stack:{},customTools:[],involvement:{},photoApproved:false,commitment:[]
});
export function reviewSections(input,activeTools=tools){
  const d=normalize(input);
  return [0,1,2,3].map(step=>({
    step,
    rows:rules.filter(r=>r.step===step&&visible(r,d)).map(r=>[
      r.label,Array.isArray(d[r.key])?d[r.key].join(", "):
      typeof d[r.key]==="boolean"?(d[r.key]?"Confirmed":"Not confirmed"):d[r.key]||"Not provided"
    ]).concat(step===1?activeTools.filter(([k])=>d.stack[k]).map(([k,label])=>[label,d.stack[k]]):[])
  }));
}
// Every validation path must return applicants to the field they can correct.
export function errorStep(key) {
  return rules.find(r => r.key === key)?.step ??
    ({stack:1, customTools:1, photoApproved:4}[key] ?? 0);
}
