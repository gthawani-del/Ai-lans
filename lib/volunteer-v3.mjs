export const MODEL = "enhanced_v3";
export const COMMITMENT_VERSION = "2026-11-14";
export const commitments = [
  "I am available for both workshop days",
  "I am available for the full workshop hours",
  "I will bring my own laptop and charger",
  "I will help participants troubleshoot within my ability and escalate when needed",
  "I am comfortable supporting a group rather than only observing",
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
  role: [
    "Student",
    "Recent graduate",
    "Working Professional",
    "Founder",
    "Developer",
    "Designer",
    "AI Enthusiast",
    "Other",
  ],
  gender: ["Male", "Female", "Non-binary", "Prefer not to say", "Other"],
  background: [
    "Student / recent graduate",
    "Business / operations",
    "Engineering / technology",
    "Product / management",
    "Design / creative",
    "Data / AI",
    "Other",
  ],
  interest: [
    "AI tools & workflows",
    "Coding & APIs",
    "Automation / no-code",
    "Product & business",
    "Design & UX",
    "Data & analytics",
    "Research & problem solving",
    "Other",
  ],
  preferredRole: [
    "Table facilitator",
    "Technical support",
    "Product / business support",
    "Design / UX support",
    "General workshop support",
  ],
  usefulSkills: [
    "Debugging",
    "Coding",
    "Product thinking",
    "Design",
    "Research",
    "Coordination / communication",
    "Other",
  ],
  experience: [
    "Worked with a GitHub repository",
    "Deployed an application",
    "Created or used a database",
    "Implemented authentication",
    "Worked with APIs",
    "Configured environment variables",
    "Debugged a broken application",
  ],
  projectType: [
    "Web app / website",
    "Mobile app",
    "Automation / workflow",
    "AI assistant / agent",
    "Data / analytics project",
    "Prototype / proof of concept",
    "Design / research / operations work",
    "Other",
  ],
  contributionAreas: [
    "Product thinking",
    "Prompting / AI workflows",
    "Frontend",
    "Backend / APIs",
    "Database",
    "Deployment / DevOps",
    "Design / UX",
    "Testing / debugging",
    "Research / documentation",
    "Coordination / operations",
  ],
  involvement: [
    "Owned end-to-end",
    "Contributed significantly",
    "Assisted",
    "Observed only",
  ],
  languages: ["English", "Hindi", "Marathi", "Gujarati", "Other"],
  graduationStatus: ["Studying", "Graduated", "Not applicable"],
  certificateStatus: ["Received", "Awaiting", "Not available"],
  experienceStatus: ["Some experience", "No prior experience yet"],
  evidenceVisibility: ["Public links", "Private / cannot share"],
};
const yesNo = ["Yes", "No"];
// A compact declarative contract shared by browser validation and generated SQL validation.
export const rules = [
  {
    key: "name",
    label: "Full name",
    step: 0,
    min: 2,
    max: 100,
    required: true,
  },
  { key: "gender", label: "Gender", step: 0, enum: options.gender },
  {
    key: "genderOther",
    label: "Please specify gender",
    step: 0,
    min: 2,
    max: 80,
    when: { gender: "Other" },
    required: true,
  },
  {
    key: "email",
    label: "Email address",
    step: 0,
    max: 254,
    pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    required: true,
  },
  {
    key: "phone",
    label: "Indian mobile number",
    step: 0,
    pattern: "^\\+91[6-9][0-9]{9}$",
    required: true,
  },
  { key: "city", label: "City", step: 0, min: 2, max: 80, required: true },
  {
    key: "postcode",
    label: "PIN code",
    step: 0,
    pattern: "^[1-9][0-9]{5}$",
    required: true,
  },
  { key: "addressStreetArea", label: "Street / area", step: 0, max: 220 },
  { key: "addressBuilding", label: "Flat / building", step: 0, max: 180 },
  {
    key: "role",
    label: "Current role",
    step: 0,
    enum: options.role,
    required: true,
  },
  {
    key: "roleOther",
    label: "Please specify your role",
    step: 0,
    min: 2,
    max: 100,
    when: { role: "Other" },
    required: true,
  },
  {
    key: "employed",
    label: "Are you currently employed?",
    step: 0,
    enum: yesNo,
    required: true,
  },
  {
    key: "company",
    label: "Company",
    step: 0,
    min: 2,
    max: 150,
    when: { employed: "Yes" },
    required: true,
  },
  {
    key: "designation",
    label: "Designation",
    step: 0,
    min: 2,
    max: 100,
    when: { employed: "Yes" },
    required: true,
  },
  {
    key: "institution",
    label: "College / university",
    step: 0,
    min: 2,
    max: 150,
    when: { role: ["Student", "Recent graduate"] },
    required: true,
  },
  {
    key: "course",
    label: "Course / qualification",
    step: 0,
    min: 2,
    max: 100,
    when: { role: ["Student", "Recent graduate"] },
    required: true,
  },
  { key: "linkedin", label: "LinkedIn profile", step: 0, url: "linkedin" },
  { key: "github", label: "GitHub profile", step: 0, url: "github" },
  {
    key: "background",
    label: "Your profile",
    step: 1,
    enum: options.background,
    required: true,
  },
  {
    key: "backgroundOther",
    label: "Please specify your profile",
    step: 1,
    min: 2,
    max: 100,
    when: { background: "Other" },
    required: true,
  },
  {
    key: "interest",
    label: "Primary area of interest",
    step: 1,
    enum: options.interest,
    required: true,
  },
  {
    key: "interestOther",
    label: "Please specify your interest",
    step: 1,
    min: 2,
    max: 100,
    when: { interest: "Other" },
    required: true,
  },
  {
    key: "preferredRole",
    label: "Preferred volunteer role",
    step: 1,
    enum: options.preferredRole,
    required: true,
  },
  {
    key: "why",
    label: "Why would you like to volunteer?",
    step: 1,
    min: 30,
    max: 500,
    required: true,
  },
  {
    key: "usefulSkills",
    label: "Capabilities",
    step: 1,
    array: options.usefulSkills,
    required: true,
  },
  {
    key: "usefulOther",
    label: "Other capability",
    step: 1,
    min: 2,
    max: 100,
    when: { usefulSkills: "Other" },
    required: true,
  },
  {
    key: "experienceStatus",
    label: "Experience",
    step: 2,
    enum: options.experienceStatus,
    required: true,
  },
  {
    key: "experience",
    label: "Technical activities",
    step: 2,
    array: options.experience,
    when: { experienceStatus: "Some experience" },
  },
  {
    key: "projectType",
    label: "Type of work",
    step: 2,
    enum: options.projectType,
    when: { experienceStatus: "Some experience" },
    required: true,
  },
  {
    key: "projectTypeOther",
    label: "Other type of work",
    step: 2,
    min: 2,
    max: 100,
    when: { experienceStatus: "Some experience", projectType: "Other" },
    required: true,
  },
  {
    key: "contributionAreas",
    label: "Your contribution areas",
    step: 2,
    array: options.contributionAreas,
    when: { experienceStatus: "Some experience" },
    required: true,
  },
  {
    key: "strongest",
    label: "What did you build or help deliver?",
    step: 2,
    min: 10,
    max: 500,
    when: { experienceStatus: "Some experience" },
    required: true,
  },
  {
    key: "contribution",
    label: "What did you personally do?",
    step: 2,
    min: 10,
    max: 500,
    when: { experienceStatus: "Some experience" },
    required: true,
  },
  {
    key: "outcome",
    label: "Outcome / hardest challenge",
    step: 2,
    max: 500,
    when: { experienceStatus: "Some experience" },
  },
  {
    key: "evidenceVisibility",
    label: "Evidence availability",
    step: 2,
    enum: options.evidenceVisibility,
    when: { experienceStatus: "Some experience" },
    required: true,
  },
  {
    key: "privateEvidence",
    label: "Private work explanation",
    step: 2,
    min: 20,
    max: 500,
    when: {
      experienceStatus: "Some experience",
      evidenceVisibility: "Private / cannot share",
    },
    required: true,
  },
  {
    key: "projectUrl",
    label: "Live project / demo",
    step: 2,
    url: "web",
    when: {
      experienceStatus: "Some experience",
      evidenceVisibility: "Public links",
    },
  },
  {
    key: "repoUrl",
    label: "GitHub repository",
    step: 2,
    url: "repository",
    when: {
      experienceStatus: "Some experience",
      evidenceVisibility: "Public links",
    },
  },
  {
    key: "otherUrl",
    label: "Other evidence",
    step: 2,
    url: "web",
    when: {
      experienceStatus: "Some experience",
      evidenceVisibility: "Public links",
    },
  },
  {
    key: "csGraduate",
    label: "Are you a computer science graduate?",
    step: 3,
    enum: yesNo,
    required: true,
  },
  {
    key: "graduationStatus",
    label: "Graduation status",
    step: 3,
    enum: options.graduationStatus,
    required: true,
  },
  {
    key: "graduationYear",
    label: "Graduation year",
    step: 3,
    pattern: "^(19|20)[0-9]{2}$",
    when: { graduationStatus: "Graduated" },
    required: true,
  },
  {
    key: "certificateStatus",
    label: "Convocation certificate",
    step: 3,
    enum: options.certificateStatus,
    when: { graduationStatus: "Graduated" },
    required: true,
  },
  {
    key: "mumbaiResident",
    label: "Do you live in Mumbai?",
    step: 3,
    enum: yesNo,
    required: true,
  },
  {
    key: "languages",
    label: "Languages you speak",
    step: 3,
    array: options.languages,
    required: true,
  },
  {
    key: "languagesOther",
    label: "Other languages",
    step: 3,
    min: 2,
    max: 100,
    when: { languages: "Other" },
    required: true,
  },
  {
    key: "commitmentAgreed",
    label: "Agreement to all commitments",
    step: 3,
    boolean: true,
    required: true,
  },
  {
    key: "accurate",
    label: "Accuracy declaration",
    step: 4,
    boolean: true,
    required: true,
  },
  {
    key: "consent",
    label: "Selection and coordination consent",
    step: 4,
    boolean: true,
    required: true,
  },
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
  const d = { ...input };
  for (const [k, v] of Object.entries(d))
    if (typeof v === "string") d[k] = v.normalize("NFC").trim();
  d.phone = normalizePhone(d.phone);
  d.email = String(d.email || "").toLowerCase();
  for (const r of rules)
    if (!visible(r, d)) d[r.key] = r.array ? [] : r.boolean ? false : "";
  if (d.experienceStatus === "No prior experience yet") {
    d.experience = [];
    d.involvement = {};
  } else
    d.involvement = Object.fromEntries(
      (d.contributionAreas || []).map((k) => [k, d.involvement?.[k] || ""]),
    );
  d.organisation = d.employed === "Yes" ? d.company : d.institution || "";
  d.addressCityPostcode = [d.city, d.postcode].filter(Boolean).join(", ");
  d.countryCode = "in";
  d.commitment = d.commitmentAgreed ? [...commitments] : [];
  d.commitmentVersion = COMMITMENT_VERSION;
  d.formModel = MODEL;
  return d;
}
export function validate(
  input,
  step = null,
  { photo = true, activeTools = tools } = {},
) {
  const d = normalize(input),
    errors = {};
  for (const r of rules) {
    if ((step !== null && r.step !== step) || !visible(r, d)) continue;
    const v = d[r.key];
    let ok = true;
    if (r.boolean) ok = v === true;
    else if (r.array)
      ok =
        Array.isArray(v) &&
        (!r.required || v.length > 0) &&
        v.every((x) => r.array.includes(x)) &&
        new Set(v).size === v.length;
    else if (!v) ok = !r.required;
    else
      ok =
        typeof v === "string" &&
        (!r.min || v.length >= r.min) &&
        (!r.max || v.length <= r.max) &&
        (!r.enum || r.enum.includes(v)) &&
        (!r.pattern || new RegExp(r.pattern).test(v)) &&
        (!r.url || urlValid(v, r.url)) &&
        !/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v);
    if (!ok)
      errors[r.key] = r.url
        ? `Enter a valid HTTPS ${r.label.toLowerCase()} URL.`
        : r.pattern
          ? `Enter a valid ${r.label.toLowerCase()}.`
          : r.min
            ? `${r.label}: enter ${r.min}–${r.max} characters.`
            : `Please complete: ${r.label}.`;
  }
  if (step === null || step === 0)
    if (photo && !d.photoApproved)
      errors.photoApproved = "Upload your photo before continuing.";
  if (step === null || step === 1) {
    for (const [k, label] of activeTools)
      if (!levels.includes(d.stack?.[k]))
        errors.stack = `Choose a proficiency level for ${label}; “New to it” is welcome.`;
    if (
      !Array.isArray(d.customTools) ||
      d.customTools.length > 10 ||
      d.customTools.some(
        (t) =>
          !t.name?.trim() || t.name.length > 80 || !levels.includes(t.level),
      )
    )
      errors.customTools =
        "Enter a tool name and level for every additional tool (maximum 10).";
  }
  if (step === null || step === 2) {
    if (d.experienceStatus === "Some experience") {
      if (
        (d.contributionAreas || []).some(
          (x) => !options.involvement.includes(d.involvement?.[x]),
        )
      )
        errors.involvement =
          "Choose your involvement for each selected contribution.";
      if (d.evidenceVisibility === "Public links") {
        if (d.experience?.includes(options.experience[0]) && !d.repoUrl)
          errors.repoUrl = "Add a repository URL or choose private work.";
        if (d.experience?.includes(options.experience[1]) && !d.projectUrl)
          errors.projectUrl = "Add a live demo URL or choose private work.";
        if (
          (d.preferredRole === "Technical support" || d.experience?.length) &&
          !d.repoUrl &&
          !d.projectUrl &&
          !d.otherUrl
        )
          errors.otherUrl = "Provide one evidence link or choose private work.";
      }
    } else if (
      d.preferredRole === "Technical support" &&
      d.experienceStatus === "No prior experience yet"
    )
      errors.experienceStatus =
        "Technical support needs relevant experience. Choose another volunteer role to apply as a beginner.";
  }
  if (step === null || step === 3) {
    if (d.csGraduate === "Yes" && d.graduationStatus !== "Graduated")
      errors.graduationStatus =
        "Select Graduated, or correct your CS graduate answer.";
    if (
      d.graduationStatus === "Graduated" &&
      Number(d.graduationYear) > new Date().getFullYear()
    )
      errors.graduationYear =
        "Completed graduation year cannot be in the future.";
  }
  return errors;
}
export const initial = Object.assign(
  Object.fromEntries(
    rules.map((r) => [r.key, r.array ? [] : r.boolean ? false : ""]),
  ),
  {
    stack: {},
    customTools: [],
    involvement: {},
    photoApproved: false,
    commitment: [],
  },
);
export function reviewSections(input, activeTools = tools) {
  const d = normalize(input);
  return [0, 1, 2, 3].map((step) => ({
    step,
    rows: rules
      .filter((r) => r.step === step && visible(r, d))
      .map((r) => [
        r.label,
        Array.isArray(d[r.key])
          ? d[r.key].join(", ")
          : typeof d[r.key] === "boolean"
            ? d[r.key]
              ? "Confirmed"
              : "Not confirmed"
            : d[r.key] || "Not provided",
      ])
      .concat(
        step === 1
          ? [
              ...activeTools.map(([k, l]) => [l, d.stack?.[k] || "Not rated"]),
              ...(d.customTools || []).map((t) => [t.name, t.level]),
            ]
          : step === 2
            ? Object.entries(d.involvement || {})
            : [],
      ),
  }));
}
