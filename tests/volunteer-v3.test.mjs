import test from "node:test";
import assert from "node:assert/strict";
import {
  initial,
  errorStep,
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
  commitmentChecks: [...commitments],
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
    validate({ ...beginner, commitmentChecks: [], commitmentAgreed: true, commitment: commitments })
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

test('each commitment is acknowledged, with no implicit migration from blanket agreement',()=>{
 for(const checks of [undefined,[],commitments.slice(1),[...commitments.slice(1),commitments[1]]]){
  const errors=validate({...beginner,commitmentChecks:checks,commitmentAgreed:true});
  assert.ok(errors.commitmentChecks||errors.commitmentAgreed);
 }
 assert.deepEqual(validate({...beginner,commitmentChecks:[...commitments].reverse()}),{});
});

test('all remaining Other paths enforce and discard their dependent answers', () => {
 for (const [parent, value, child] of [
  ['gender','Other','genderOther'],['usefulSkills',['Other'],'usefulOther'],
  ['languages',['Other'],'languagesOther'],['projectType','Other','projectTypeOther']
 ]) {
  const base=parent==='projectType'?technical:beginner;
  assert.ok(validate({...base,[parent]:value,[child]:''})[child]);
  assert.equal(validate({...base,[parent]:value,[child]:'Specific example'})[child],undefined);
  assert.equal(normalize({...base,[child]:'Stale answer'})[child],'');
 }
});
test('contact boundaries and hostile URL formats are rejected',()=>{
 for(const phone of ['+91987654321','+9198765432100','+915876543210','98765abc10']) assert.ok(validate({...beginner,phone}).phone);
 for(const postcode of ['000000','4000010','4000a1']) assert.ok(validate({...beginner,postcode}).postcode);
 for(const email of ['a b@example.com','a@@example.com','a@b','a'.repeat(255)+'@example.com']) assert.ok(validate({...beginner,email}).email);
 for(const url of ['http://github.com/a/b','https://github.com/a','https://github.com.evil.example/a/b','https://user:password@github.com/a/b']) assert.equal(urlValid(url,'repository'),false);
});
test('education timeframe is explicit and conditional',()=>{
 const d={...beginner,csGraduate:'Yes',graduationStatus:'Graduated',graduationYear:'2025',certificateStatus:'Received'};
 const rule='csGraduated2024To2026';
 assert.ok(validate(d)[rule],'CS timeframe response must be required');
 assert.deepEqual(validate({...d,[rule]:'Yes'}),{});
 assert.deepEqual(validate({...beginner,[rule]:'Yes'}),{});
 assert.equal(normalize({...beginner,[rule]:'Yes'})[rule],'');
});

test('normalization drops unsolicited payload data and handles malformed dependencies',()=>{
 const d=normalize({...beginner,admin:true,consentRecordedAt:'forged',customTools:[{name:'Example',level:'Used it',secret:'discard'}]});
 assert.equal(d.admin,undefined); assert.equal(d.consentRecordedAt,undefined);
 assert.equal(d.customTools[0].secret,undefined);
 assert.doesNotThrow(()=>validate({...technical,contributionAreas:'Frontend'}));
 assert.ok(validate({...technical,contributionAreas:'Frontend'}).contributionAreas);
});
test('validation errors route to their actual form section',()=>{
 for(const [key,step] of Object.entries({name:0,stack:1,customTools:1,involvement:2,commitmentChecks:3,photoApproved:4,consent:4})) assert.equal(errorStep(key),step);
});

test('upload body limit checks streamed bytes without trusting Content-Length',async()=>{
 const {boundedBody}=await import('../lib/bounded-request.mjs');
 const req=(bytes,headers={})=>new Request('https://example.test',{method:'POST',body:new Uint8Array(bytes),headers,duplex:'half'});
 assert.equal((await boundedBody(req(4),4)).length,4);
 await assert.rejects(boundedBody(req(5),4),RangeError);
 await assert.rejects(boundedBody(req(5,{'content-length':'1'}),4),RangeError);
 await assert.rejects(boundedBody(req(1,{'content-length':'10'}),4),RangeError);
});
