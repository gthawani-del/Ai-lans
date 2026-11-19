'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { SUPABASE_URL } from '../../lib/supabase-browser';
import { fieldIsVisible, validateCmsFormSubmission } from '../../supabase/functions/cms-public-form/validator.mjs';

const endpoint = `${SUPABASE_URL}/functions/v1/cms-public-form`;
const uuid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function InputField({ field, value, onChange, error, formId }) {
  const id = `${formId}-${field.id || field.key}`;
  const errorId = `${id}-error`;
  const helpId = field.help_text ? `${id}-help` : undefined;
  const describedBy = [helpId, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  const common = { id, name: field.key, 'aria-invalid': !!error, 'aria-describedby': describedBy, required: !!field.required };
  const options = Array.isArray(field.options) && field.options.length ? field.options : field.type === 'rating' ? [1,2,3,4,5].map(n=>({value:String(n),label:String(n)})) : [];
  let control;
  if (field.type === 'section_text') return <div className="cmsPublicFormSection"><h2>{field.label}</h2>{field.help_text && <p>{field.help_text}</p>}</div>;
  if (field.type === 'select') control = <select {...common} value={value ?? ''} onChange={event=>onChange(event.target.value)}><option value="">Choose an option</option>{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>;
  else if (['radio','rating'].includes(field.type)) control = <fieldset id={id} className="cmsPublicChoices" aria-describedby={describedBy} aria-required={field.required||undefined}><legend>{field.label}{field.required&&<span className="cmsPublicRequired">Required</span>}</legend>{options.map((option,index)=><label key={option.value}><input type="radio" name={field.key} value={option.value} required={!!field.required&&index===0} checked={String(value ?? '')===String(option.value)} onChange={()=>onChange(String(option.value))}/><span>{option.label}</span></label>)}</fieldset>;
  else if (field.type === 'checkbox_group') control = <fieldset id={id} className="cmsPublicChoices" aria-describedby={describedBy} aria-required={field.required||undefined}><legend>{field.label}{field.required&&<span className="cmsPublicRequired">Required</span>}</legend>{options.map(option=><label key={option.value}><input type="checkbox" name={`${field.key}[]`} value={option.value} checked={Array.isArray(value)&&value.includes(option.value)} onChange={event=>onChange(event.target.checked?[...(Array.isArray(value)?value:[]),option.value]:(value||[]).filter(item=>item!==option.value))}/><span>{option.label}</span></label>)}</fieldset>;
  else if (['boolean_checkbox','consent'].includes(field.type)) control = <label className="cmsPublicCheck"><input id={id} name={field.key} type="checkbox" required={!!field.required} checked={value===true} aria-invalid={!!error} aria-describedby={describedBy} onChange={event=>onChange(event.target.checked)}/><span>{field.label}{field.required&&<span className="cmsPublicRequired">Required</span>}</span></label>;
  else if (field.type === 'long_text') control = <textarea {...common} value={value ?? ''} maxLength={Number(field.constraints?.max_length)||3000} rows={4} onChange={event=>onChange(event.target.value)}/>;
  else if (field.type === 'number') control = <input {...common} type="number" value={value ?? ''} min={field.constraints?.min} max={field.constraints?.max} step={field.constraints?.integer?'1':field.constraints?.step||'any'} onChange={event=>onChange(event.target.value)}/>;
  else control = <input {...common} type={field.type==='email'?'email':field.type==='phone'?'tel':field.type==='date'?'date':'text'} autoComplete={field.type==='email'?'email':field.key==='full_name'?'name':field.type==='phone'?'tel':'on'} maxLength={Number(field.constraints?.max_length)||undefined} onChange={event=>onChange(event.target.value)}/>;
  return <div className={`cmsPublicFormField${error?' hasError':''}`}>
    {!['boolean_checkbox','consent','radio','rating','checkbox_group'].includes(field.type)&&<label htmlFor={id}>{field.label}{field.required&&<span className="cmsPublicRequired">Required</span>}</label>}
    {field.help_text&&<small id={helpId}>{field.help_text}</small>}{control}
    {error&&<span className="cmsPublicFormError" id={errorId}>{error}</span>}
  </div>;
}

export default function CmsPublicForm({ handle, formId, sourcePageId }) {
  const uniqueId=useId().replaceAll(':','');
  const [form,setForm]=useState(null); const [values,setValues]=useState({}); const [loadError,setLoadError]=useState('');
  const [errors,setErrors]=useState({}); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false); const [success,setSuccess]=useState(false);
  const idempotency=useRef(uuid()); const errorSummary=useRef(null);
  const load=useCallback(async()=>{
    setLoadError('');
    try{
      const url=new URL(endpoint); if(handle)url.searchParams.set('handle',handle); else if(formId)url.searchParams.set('form_id',formId); else throw new Error('Missing form reference');
      const response=await fetch(url,{method:'GET',cache:'no-store',credentials:'omit'});
      const data=await response.json().catch(()=>null);
      if(!response.ok||!data?.id)throw new Error(data?.error||'This form is not available.');
      setForm(data);
    }catch{setLoadError('This form is currently unavailable. Please contact the site team if you need help.');}
  },[formId,handle]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(Object.keys(errors).length)errorSummary.current?.focus();},[errors]);
  const visible= form?.fields?.filter(field=>fieldIsVisible(field,form.fields,values))||[];
  function update(key,value){setValues(current=>({...current,[key]:value}));setErrors(current=>{const next={...current};delete next[key];return next;});setMessage('');}
  async function submit(event){
    event.preventDefault(); if(!form||busy||success)return;
    const { _website, ...answerInput } = values;
    const validation=validateCmsFormSubmission(form,answerInput);
    if(Object.keys(validation.errors).length){setErrors(validation.errors);setMessage('Some answers need attention.');return;}
    setBusy(true);setErrors({});setMessage('Sending your response…');
    try{
      const response=await fetch(endpoint,{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json','X-Idempotency-Key':idempotency.current},body:JSON.stringify({handle:form.handle,version_id:form.version_id,answers:validation.answers,source_page_id:sourcePageId||null,context_id:null,_website:values._website||''})});
      const data=await response.json().catch(()=>null);
      if(response.status===409){setForm(null);setMessage(data?.error||'This form has changed. Reload the page before submitting.');await load();return;}
      if(!response.ok){if(data?.field_errors){setErrors(data.field_errors);setMessage(data.error||'Some answers need attention.');return;}throw new Error(data?.error||'We could not save your response. Please try again.');}
      idempotency.current=uuid();setSuccess(true);setMessage(data?.success||form.success?.text||'Your response has been received.');
    }catch(error){setMessage(error instanceof Error?error.message:'We could not save your response. Please try again.');}
    finally{setBusy(false);}
  }
  if(loadError)return <section className="cmsPublicFormState" role="status">{loadError}</section>;
  if(!form)return <section className="cmsPublicFormState" aria-busy="true">Loading form…</section>;
  if(form.availability_status!=='open')return <section className="cmsPublicFormState" role="status">{form.closed_message||'This form is currently closed.'}</section>;
  if(success)return <section className="cmsPublicFormState cmsPublicFormSuccess" role="status"><h2>Thank you</h2><p>{message}</p></section>;
  return <form className="cmsPublicForm" onSubmit={submit} noValidate aria-describedby={message?'cms-public-form-status':undefined}>
    <h2>{form.title}</h2>{form.description&&<p className="cmsPublicFormIntro">{form.description}</p>}
    {form.privacy_policy?.url&&<p className="cmsPublicPrivacyLink">Please review our <a href={form.privacy_policy.url}>Privacy Policy</a>.</p>}
    {Object.keys(errors).length>0&&<div ref={errorSummary} className="cmsPublicErrorSummary" role="alert" tabIndex={-1}><strong>Check these fields:</strong><ul>{Object.entries(errors).map(([key,text])=><li key={key}><a href={`#${uniqueId}-${form.fields.find(field=>field.key===key)?.id||key}`}>{text}</a></li>)}</ul></div>}
    {visible.map(field=><InputField key={field.id||field.key} field={field} formId={uniqueId} value={values[field.key]} error={errors[field.key]} onChange={value=>update(field.key,value)}/>)}
    <div className="cmsPublicHoneypot" aria-hidden="true"><label htmlFor={`${uniqueId}-website`}>Leave this field empty</label><input id={`${uniqueId}-website`} name="_website" tabIndex={-1} autoComplete="off" value={values._website||''} onChange={event=>update('_website',event.target.value)}/></div>
    <button className="cmsPublicSubmit" type="submit" disabled={busy} aria-disabled={busy}>{busy?'Sending…':form.submit_label||'Submit'}</button>
    <p id="cms-public-form-status" className="cmsPublicFormStatus" role="status" aria-live="polite">{message}</p>
  </form>;
}
