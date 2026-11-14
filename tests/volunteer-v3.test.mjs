import test from "node:test";
import assert from "node:assert/strict";
import {
  initial,
  validate,
  normalize,
  tools,
  options,
  commitments,
  urlValid,
} from "../lib/volunteer-v3.mjs";
export const beginner = {
  ...initial,
  name: "आर्या D’Souza",
  email: "arya@example.com",
  phone: "98765 43210",
  city: "Mumbai",
  postcode: "400001",
  role: "Other",
  roleOther: "Career transition",
  employed: "No",
  background: "Business / operations",
  interest: "Product & business",
  preferredRole: "General workshop support",
  why: "I can help teams organise their research and explain their product ideas.",
  usefulSkills: ["Research"],
  stack: Object.fromEntries(tools.map(([k]) => [k, "New to it"])),
  experienceStatus: "No prior experience yet",
  csGraduate: "No",
  graduationStatus: "Not applicable",
  mumbaiResident: "No",
  languages: ["Hindi"],
  commitmentAgreed: true,
  accurate: true,
  consent: true,
  photoApproved: true,
};
export const technical = {
  ...beginner,
  preferredRole: "Technical support",
  experienceStatus: "Some experience",
  experience: [options.experience[0], options.experience[1]],
  projectType: "Web app / website",
  contributionAreas: ["Frontend"],
  involvement: { Frontend: "Contributed significantly" },
  strongest: "Built a small inventory management website.",
  contribution: "Implemented inventory editing and validation.",
  evidenceVisibility: "Private / cannot share",
  privateEvidence:
    "Employer-owned code; I can explain the architecture without disclosing confidential data.",
};
test("broader pool and private technical work are accepted", () => {
  assert.deepEqual(validate(beginner), {});
  assert.deepEqual(validate(technical), {});
});
test("India contacts, PIN and platform URLs reject bad inputs", () => {
  for (const [key, value] of [
    ["phone", "+15551234567"],
    ["phone", "1234567890"],
    ["postcode", "012345"],
    ["postcode", "40001"],
    ["email", "bad@@example.com"],
    ["github", "https://linkedin.com/in/person"],
    ["linkedin", "https://github.com/person"],
  ])
    assert.ok(validate({ ...beginner, [key]: value })[key], key);
  assert.equal(normalize(beginner).phone, "+919876543210");
  assert.equal(
    urlValid("https://github.com.evil.test/person", "github"),
    false,
  );
  assert.equal(
    urlValid("https://user:pass@github.com/person", "github"),
    false,
  );
});
test("all Other paths and employment fields are required when selected", () => {
  for (const [parent, child] of [
    ["role", "roleOther"],
    ["background", "backgroundOther"],
    ["interest", "interestOther"],
  ])
    assert.ok(validate({ ...beginner, [parent]: "Other", [child]: "" })[child]);
  assert.ok(validate({ ...beginner, employed: "Yes" }).company);
  assert.ok(validate({ ...beginner, employed: "Yes" }).designation);
});
test("honest experience answer required and public claims need matching evidence", () => {
  assert.ok(validate({ ...beginner, experienceStatus: "" }).experienceStatus);
  let e = validate({
    ...technical,
    evidenceVisibility: "Public links",
    privateEvidence: "",
  });
  assert.ok(e.repoUrl);
  assert.ok(e.projectUrl);
  assert.deepEqual(
    validate({
      ...technical,
      evidenceVisibility: "Public links",
      repoUrl: "https://github.com/arya/project",
      projectUrl: "https://example.com",
    }),
    {},
  );
});
test("commitment requires explicit boolean and hidden values are discarded", () => {
  assert.ok(
    validate({ ...beginner, commitmentAgreed: false, commitment: commitments })
      .commitmentAgreed,
  );
  const d = normalize({
    ...beginner,
    company: "Old employer",
    repoUrl: "https://github.com/old/repo",
    experience: [options.experience[0]],
    involvement: { Frontend: "Owned end-to-end" },
  });
  assert.equal(d.company, "");
  assert.equal(d.repoUrl, "");
  assert.deepEqual(d.experience, []);
  assert.deepEqual(d.involvement, {});
});
test("new screening fields do not exclude non-CS or non-Mumbai applicants", () => {
  assert.deepEqual(
    validate({
      ...beginner,
      graduationStatus: "Graduated",
      graduationYear: "2010",
      certificateStatus: "Not available",
    }),
    {},
  );
  assert.ok(validate({ ...beginner, csGraduate: "Yes" }).graduationStatus);
});
test("tampered enums, duplicates and missing proficiency fail", () => {
  assert.ok(validate({ ...beginner, languages: ["Klingon"] }).languages);
  assert.ok(validate({ ...beginner, languages: ["Hindi", "Hindi"] }).languages);
  assert.ok(validate({ ...beginner, stack: {} }).stack);
  assert.ok(validate({ ...beginner, consent: "true" }).consent);
});
