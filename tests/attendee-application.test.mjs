import test from 'node:test';
import assert from 'node:assert/strict';
import {submitAttendeeApplication} from '../lib/attendee-application.mjs';

test('application submits once without creating a payment session', async () => {
  const calls = [];
  const result = await submitAttendeeApplication({full_name:'QA Applicant',consent:true}, {
    endpoint:'https://example.invalid/functions/v1',
    fetcher:async (url, options) => { calls.push({url,body:JSON.parse(options.body)}); return {ok:true,json:async()=>({ok:true,id:'test-reference',status:'submitted'})}; },
  });
  assert.equal(calls.length,1);
  assert.ok(calls[0].url.endsWith('/submit-attendee-registration'));
  assert.equal(calls[0].body.form_version,'one_page_apply_20261118_v2');
  assert.deepEqual(result,{full_name:'QA Applicant',email:'',reference:'test-reference',existing:false});
});
test('failed or malformed responses cannot become acknowledgements',async()=>{
  for (const response of [{ok:false,json:async()=>({error:'Invalid application'})},{ok:true,json:async()=>({ok:true})},{ok:true,json:async()=>{throw new Error('invalid json')}}]) {
    await assert.rejects(submitAttendeeApplication({}, {endpoint:'https://example.invalid',fetcher:async()=>response}));
  }
});
test('existing paid record is reported as existing, not a new confirmed booking',async()=>{
  const result=await submitAttendeeApplication({full_name:'QA Applicant'}, {endpoint:'https://example.invalid',fetcher:async()=>({ok:true,json:async()=>({ok:true,id:'existing',already_paid:true})})});
  assert.equal(result.existing,true);
  assert.equal(result.reference,'existing');
});

test('workshop planning fields are forwarded in the attendee payload',async()=>{
 const captured=[];
 const form={full_name:'QA Applicant',business_problem:'Our team manually checks hundreds of records each week.',
  target_user:'Operations team',data_sources:['Excel / spreadsheets'],
  success_outcome:'Save time',attendance_availability:'I need the dates before confirming',
  mvp_preferences:['invoice-assistant'],consent:true};
 await submitAttendeeApplication(form,{endpoint:'https://example.invalid',
  fetcher:async(_url,opts)=>{captured.push(JSON.parse(opts.body));return{ok:true,json:async()=>({ok:true,id:'test-reference'})}}});
 assert.equal(captured[0].business_problem,form.business_problem);
 assert.deepEqual(captured[0].data_sources,form.data_sources);
 assert.equal(captured[0].attendance_availability,form.attendance_availability);
});

test('confirmation receives the actual application email without inventing response timing',async()=>{
 const result=await submitAttendeeApplication({full_name:'QA Applicant',email:'qa@example.test'},{
  endpoint:'https://example.invalid',
  fetcher:async()=>({ok:true,json:async()=>({ok:true,id:'application-123'})})
 });
 assert.equal(result.email,'qa@example.test');
 assert.equal(result.reference,'application-123');
 assert.equal(result.existing,false);
});

test('explicit contact method and representative-data permission are preserved in submission',async()=>{
 const form={full_name:'Test Applicant',email:'qa@example.test',preferred_contact_method:'Email',representative_data_permission:'I can use sample or synthetic data instead',participation_support:'Wheelchair accessible entrance',heard_about:'LinkedIn'};
 let posted;
 await submitAttendeeApplication(form,{endpoint:'https://example.invalid',fetcher:async(_url,opts)=>{posted=JSON.parse(opts.body);return{ok:true,json:async()=>({ok:true,id:'qa'})}}});
 for(const key of ['preferred_contact_method','representative_data_permission','participation_support','heard_about']) assert.equal(posted[key],form[key]);
});
