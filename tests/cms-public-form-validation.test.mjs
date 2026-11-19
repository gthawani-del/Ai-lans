import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCmsFormSubmission } from '../supabase/functions/cms-public-form/validator.mjs';

const contact = {
  fields: [
    { id:'name',key:'full_name',type:'short_text',label:'Full name',required:true,constraints:{max_length:120} },
    { id:'email',key:'email',type:'email',label:'Email',required:true,constraints:{max_length:254} },
    { id:'subject',key:'subject',type:'select',label:'Subject',required:true,options:[{value:'workshop',label:'Workshop'},{value:'other',label:'Other'}] },
    { id:'other',key:'subject_other',type:'short_text',label:'Please specify',required:true,visibility:{field_key:'subject',operator:'equals',value:'other'},constraints:{max_length:120} },
    { id:'consent',key:'privacy_ack',type:'consent',label:'I have read the privacy notice',required:true },
    { id:'marketing',key:'marketing_opt_in',type:'boolean_checkbox',label:'Send me updates',required:false },
  ],
};

test('accepts a valid submission and normalises email',()=>{
  const result=validateCmsFormSubmission(contact,{full_name:'Zoë O’Neil',email:' GT@Example.com ',subject:'workshop',privacy_ack:true,marketing_opt_in:false});
  assert.deepEqual(result.errors,{});
  assert.equal(result.answers.email,'gt@example.com');
  assert.equal(result.answers.marketing_opt_in,false);
});

test('enforces required fields and consent on the server contract',()=>{
  const result=validateCmsFormSubmission(contact,{full_name:'A',email:'bad',subject:'workshop',privacy_ack:false});
  assert.ok(result.errors.email);
  assert.ok(result.errors.privacy_ack);
});

test('requires a conditional answer only when visible and rejects hidden submitted values',()=>{
  const visibleMissing=validateCmsFormSubmission(contact,{full_name:'Ab',email:'a@b.com',subject:'other',privacy_ack:true});
  assert.ok(visibleMissing.errors.subject_other);
  const hiddenForged=validateCmsFormSubmission(contact,{full_name:'Ab',email:'a@b.com',subject:'workshop',subject_other:'forged',privacy_ack:true});
  assert.match(hiddenForged.errors.subject_other,/not available/);
});

test('rejects unknown keys, prototype pollution and unconfigured choices',()=>{
  const result=validateCmsFormSubmission(contact,{full_name:'Ab',email:'a@b.com',subject:'unknown',privacy_ack:true,extra:'x','__proto__':'pollute'});
  assert.ok(result.errors.subject);
  assert.ok(result.errors.extra);
  const pollution=JSON.parse('{"full_name":"Ab","email":"a@b.com","subject":"workshop","privacy_ack":true,"__proto__":"x"}');
  assert.ok(validateCmsFormSubmission(contact,pollution).errors.__proto__);
});

test('rejects invalid date, numeric range and duplicate multi-choice answers',()=>{
  const fields={fields:[
    {key:'date',id:'d',type:'date',label:'Date',required:true,constraints:{min:'2026-01-01'}},
    {key:'count',id:'n',type:'number',label:'Count',required:true,constraints:{min:1,max:5,integer:true}},
    {key:'topics',id:'t',type:'checkbox_group',label:'Topics',required:true,options:[{value:'a'},{value:'b'}]},
  ]};
  const result=validateCmsFormSubmission(fields,{date:'2026-02-30',count:9,topics:['a','a']});
  assert.ok(result.errors.date); assert.ok(result.errors.count); assert.ok(result.errors.topics);
});
