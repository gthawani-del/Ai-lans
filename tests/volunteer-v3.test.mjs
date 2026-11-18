import test from "node:test";
import assert from "node:assert/strict";
import {initial,validate,normalize,options,commitments,configuredTools,errorStep,urlValid} from "../lib/volunteer-v3.mjs";

const base={
  ...initial,
  name:"Sample Volunteer",email:"volunteer@example.test",phone:"9876543210",city:"Mumbai",
  role:"Working Professional",preferredRole:"Operations and coordination",
  usefulSkills:["Coordination / communication"],
  why:"I would like to help workshop participants organise and test their ideas.",
  communicationExample:"I would explain the idea using a simple example and ask the participant to describe it back.",
  experienceStatus:"No prior experience yet",
  beginnerExample:"I helped organise a community activity and resolve scheduling problems.",
  languages:["English","Hindi"],attendance:"Need confirmed dates",
  deviceAvailability:"I can bring a laptop",
  commitmentChecks:[...commitments],accurate:true,consent:true,
  customTools:[],stack:{},photoApproved:false
};

test("nontechnical beginners can submit without photo, degree or public code",()=>{
  assert.deepEqual(validate(base),{});
  assert.equal(normalize(base).photoApproved,false);
  assert.equal(normalize(base).postcode,undefined);
  assert.equal(normalize(base).csGraduate,undefined);
  assert.equal(normalize(base).gender,undefined);
});
test("technical track requires experience and core tool ratings",()=>{
  const d={...base,preferredRole:"Technical builder / troubleshooting"};
  const e=validate(d);
  assert.ok(e.experienceStatus);
  assert.ok(e.stack);
  const stack=Object.fromEntries(configuredTools().map(([k])=>[k,"Comfortable"]));
  const experienced={...d,stack,experienceStatus:"Some experience",
    contributionAreas:["Frontend"],contributionLevel:"Contributed significantly",
    strongest:"Built a small business website.",contribution:"Implemented forms and validation.",
    evidenceVisibility:"Private / cannot share",privateEvidence:"Employer work that cannot be linked publicly."};
  assert.deepEqual(validate(experienced),{});
  assert.equal(normalize(experienced).involvement.Frontend,"Contributed significantly");
});
test("one portfolio or private explanation is enough",()=>{
  const v={...base,preferredRole:"UX and design",experienceStatus:"Some experience",
    contributionAreas:["Design / UX"],contributionLevel:"Assisted",
    strongest:"Designed a volunteer onboarding flow.",contribution:"Prepared layouts and tested usability.",
    evidenceVisibility:"Public links"};
  assert.ok(validate(v).otherUrl);
  assert.deepEqual(validate({...v,otherUrl:"https://portfolio.example.test/case-study"}),{});
  assert.deepEqual(validate({...v,evidenceVisibility:"Private / cannot share",privateEvidence:"This project is confidential and I can explain my responsibilities."}),{});
});
test("applicant must explicitly agree to every current commitment",()=>{
  assert.ok(validate({...base,commitmentChecks:commitments.slice(1)}).commitmentChecks);
  assert.deepEqual(validate({...base,commitmentChecks:[...commitments].reverse()}),{});
});
test("workshop availability and ability to bring a device are captured",()=>{
  assert.ok(validate({...base,attendance:""}).attendance);
  assert.ok(validate({...base,deviceAvailability:""}).deviceAvailability);
  assert.deepEqual(validate({...base,deviceAvailability:"I need a device",attendance:"Need travel support"}),{});
});
test("additional text paths and evidence URLs are safely validated",()=>{
  assert.ok(validate({...base,role:"Other",roleOther:""}).roleOther);
  assert.ok(validate({...base,languages:["Other"],languagesOther:""}).languagesOther);
  assert.ok(validate({...base,consent:false}).consent);
  assert.equal(urlValid("https://github.com.evil.test/user/repo","repository"),false);
  assert.equal(urlValid("https://github.com/user/repo","repository"),true);
  assert.equal(normalize({...base,admin:true}).admin,undefined);
});
test("errors return applicants to the correct section",()=>{
  for(const [k,s] of Object.entries({name:0,stack:1,communicationExample:1,contributionLevel:2,attendance:3,commitmentChecks:3,consent:4}))
    assert.equal(errorStep(k),s);
});
test("normalization discards stale conditional fields",()=>{
  const d=normalize({...base,projectUrl:"https://example.com",repoUrl:"https://github.com/test/repo",privateEvidence:"Stale"});
  assert.equal(d.projectUrl,"");assert.equal(d.repoUrl,"");assert.equal(d.privateEvidence,"");
});
test("bounded upload checks streamed bytes rather than trusting content length",async()=>{
 const {boundedBody}=await import("../lib/bounded-request.mjs");
 const req=(bytes,headers={})=>new Request("https://example.test",{method:"POST",body:new Uint8Array(bytes),headers,duplex:"half"});
 assert.equal((await boundedBody(req(4),4)).length,4);
 await assert.rejects(boundedBody(req(5),4),RangeError);
 await assert.rejects(boundedBody(req(5,{"content-length":"1"}),4),RangeError);
});
