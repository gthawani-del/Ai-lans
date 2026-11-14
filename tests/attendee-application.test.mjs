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
  assert.equal(calls[0].body.form_version,'one_page_apply_20261114');
  assert.deepEqual(result,{full_name:'QA Applicant',reference:'test-reference',existing:false});
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
