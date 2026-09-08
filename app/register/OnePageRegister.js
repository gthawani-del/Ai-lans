'use client';

import {useEffect,useRef,useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {
  attendeeAiReadinessSchema,
  attendeeDefaultValues,
  attendeeProfileSchema,
  attendeeSchema,
} from '../../lib/forms/attendee-schema';
import {
  aiLevels,
  aiTools,
  countries,
  dialByCountry,
  experienceRanges,
  functionalAreas,
  industries,
  roles,
} from '../../lib/forms/attendee-options';

const API='https://zvmmgkspdgbfcqmnizga.supabase.co/functions/v1';
const DRAFT_KEY='ai-lab-attendee-draft';
const DRAFT_VERSION=3;
const LEGACY_DRAFT_KEYS=['ai-lab-attendee-draft-v1'];

function FieldError({message}){
  if(!message)return null;
  return <span className="fieldError" role="alert">{message}</span>;
}

function UiIcon({name,size=18}){
  const common={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':'true'};
  const paths={
    user:<><circle cx="12" cy="8" r="3"/><path d="M6 20c.6-3.5 2.6-5.5 6-5.5s5.4 2 6 5.5"/></>,
    mail:<><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4.5 7 7.5 6 7.5-6"/></>,
    phone:<><path d="M7.2 3.8 4.7 5.2c-1 .6-1.3 1.8-.8 2.8 2.6 5.5 6.1 9 11.6 11.6 1 .5 2.2.2 2.8-.8l1.4-2.5-4.1-2-1.3 1.8c-2.5-1.1-4.4-3-5.5-5.5l1.8-1.3-2-4.1Z"/></>,
    pin:<><path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></>,
    building:<><path d="M5 21V5h10v16M9 8h2m-2 4h2m-2 4h2M15 10h4v11M3 21h18"/></>,
    calendar:<><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></>,
    shield:<><path d="M12 22s7-3.8 7-10V5l-7-3-7 3v7c0 6.2 7 10 7 10Z"/><path d="m9 12 2 2 4-4"/></>,
    cloud:<><path d="M7.5 18H6a4 4 0 0 1-.3-8A6.5 6.5 0 0 1 18 9a4.5 4.5 0 0 1 .5 9H16"/><path d="M12 11v9M9 14l3-3 3 3"/></>,
    clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    people:<><circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><circle cx="12" cy="6" r="2.8"/><path d="M3.5 18c.4-3 2.1-4.8 4.5-4.8M20.5 18c-.4-3-2.1-4.8-4.5-4.8M6.5 20c.4-4 2.4-6 5.5-6s5.1 2 5.5 6"/></>,
    bulb:<><path d="M9 18h6M10 21h4M8.8 15.3A6 6 0 1 1 15.2 15.3c-.8.6-1.2 1.4-1.2 2.2h-4c0-.8-.4-1.6-1.2-2.2Z"/></>,
    network:<><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/></>,
    rocket:<><path d="M14 4c2.9-1.2 5-1 6-.8.2 1 .4 3.1-.8 6l-5.7 5.7-4.4-4.4L14 4Z"/><path d="m8.5 12-3.3.8-2.2 2.2 4.2.7M12 15.5l-.8 3.3L9 21l-.7-4.2"/><circle cx="16.5" cy="6.5" r="1.3"/></>,
    check:<><path d="m5 12 4 4L19 6"/></>,
    lock:<><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    sparkle:<><path d="M12 3l1.3 4.2L17.5 8.5l-4.2 1.3L12 14l-1.3-4.2-4.2-1.3 4.2-1.3L12 3Z"/><path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z"/></>,
  };
  return <svg {...common}>{paths[name]||paths.sparkle}</svg>;
}

function AILabMark({small=false}){
  return <svg className={small?'aiMark small':'aiMark'} viewBox="0 0 48 48" role="img" aria-label="AI Lab"><path d="M23.8 4 8.2 39.5h10.2l5.5-13.4 5.7 13.4h10.3L25 4h-1.2Z"/></svg>;
}

function ModuleHeader({number,title,subtitle,locked=false,complete=false}){
  return <div className="moduleHeader">
    <div className="moduleNumber">{complete?<UiIcon name="check" size={16}/>:number}</div>
    <div className="moduleHeading"><h2>{title}</h2><p>{subtitle}</p></div>
    {locked&&<span className="moduleLock"><UiIcon name="lock" size={14}/> Complete the section above</span>}
    {complete&&!locked&&<span className="moduleDone">Complete</span>}
  </div>;
}

export default function OnePageRegister(){
  const [options,setOptions]=useState([]);
  const [optionsError,setOptionsError]=useState('');
  const [apiError,setApiError]=useState('');
  const [done,setDone]=useState(false);
  const [saveState,setSaveState]=useState('Saved locally');
  const [draftReady,setDraftReady]=useState(false);
  const [unlockedModule,setUnlockedModule]=useState(1);
  const saveTimer=useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    setError,
    clearErrors,
    formState:{errors,isSubmitting},
  }=useForm({resolver:zodResolver(attendeeSchema),defaultValues:attendeeDefaultValues,mode:'onTouched'});

  const values=watch();
  const currentTools=watch('ai_tools')||[];
  const currentMvp=watch('mvp_preferences')||[];

  const profileReady=attendeeProfileSchema.safeParse({
    full_name:values.full_name,
    email:values.email,
    phone_country_code:values.phone_country_code,
    phone:values.phone,
    city:values.city,
    country:values.country,
    career_role:values.career_role,
    company_organisation:values.company_organisation,
    industry:values.industry,
    years_experience:values.years_experience,
    functional_area:values.functional_area,
    age_band:values.age_band,
  }).success;

  const readinessReady=attendeeAiReadinessSchema.safeParse({
    ai_experience_level:values.ai_experience_level,
    ai_tools:currentTools,
    other_ai_tool:values.other_ai_tool,
  }).success;

  useEffect(()=>{
    if(profileReady)setUnlockedModule(current=>Math.max(current,2));
  },[profileReady]);

  useEffect(()=>{
    if(profileReady&&readinessReady)setUnlockedModule(current=>Math.max(current,3));
  },[profileReady,readinessReady]);

  useEffect(()=>{
    try{
      LEGACY_DRAFT_KEYS.forEach(key=>localStorage.removeItem(key));
      const raw=localStorage.getItem(DRAFT_KEY);
      if(raw){
        const saved=JSON.parse(raw);
        if(saved?.version===DRAFT_VERSION&&saved?.data){
          reset({...attendeeDefaultValues,...saved.data,consent:false});
          setSaveState('Draft restored');
        }else{
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    }catch{
      try{localStorage.removeItem(DRAFT_KEY)}catch{}
    }
    setDraftReady(true);
  },[reset]);

  useEffect(()=>{
    if(!draftReady)return;
    const subscription=watch(data=>{
      if(saveTimer.current)clearTimeout(saveTimer.current);
      setSaveState('Saving…');
      saveTimer.current=setTimeout(()=>{
        try{
          localStorage.setItem(DRAFT_KEY,JSON.stringify({version:DRAFT_VERSION,data:{...data,consent:false}}));
          setSaveState('Auto-saved just now');
        }catch{
          setSaveState('Saved on this page');
        }
      },500);
    });
    return()=>{
      subscription.unsubscribe();
      if(saveTimer.current)clearTimeout(saveTimer.current);
    };
  },[draftReady,watch]);

  useEffect(()=>{
    let active=true;
    fetch(API+'/attendee-options')
      .then(async response=>{
        if(!response.ok)throw new Error('Could not load build choices');
        return response.json();
      })
      .then(data=>{if(active)setOptions(data.options||[]);})
      .catch(()=>{if(active)setOptionsError('We could not load the build choices. Refresh the page and try again.');});
    return()=>{active=false};
  },[]);

  function updateCountry(event){
    const country=event.target.value;
    setValue('country',country,{shouldDirty:true,shouldTouch:true,shouldValidate:true});
    setValue('phone_country_code',dialByCountry[country]||'',{shouldDirty:true,shouldValidate:true});
  }

  function addTool(event){
    const tool=event.target.value;
    if(!tool||currentTools.includes(tool))return;
    setValue('ai_tools',[...currentTools,tool],{shouldDirty:true,shouldTouch:true,shouldValidate:true});
    clearErrors('ai_tools');
  }

  function removeTool(tool){
    setValue('ai_tools',currentTools.filter(item=>item!==tool),{shouldDirty:true,shouldTouch:true,shouldValidate:true});
    if(tool==='Other')setValue('other_ai_tool','',{shouldDirty:true,shouldValidate:true});
  }

  function toggleMvp(slug){
    if(currentMvp.includes(slug)){
      setValue('mvp_preferences',currentMvp.filter(item=>item!==slug),{shouldDirty:true,shouldTouch:true,shouldValidate:true});
      if(slug==='something-else')setValue('other_mvp_idea','',{shouldDirty:true,shouldValidate:true});
      clearErrors('mvp_preferences');
      return;
    }
    if(currentMvp.length>=2){
      setError('mvp_preferences',{type:'manual',message:'Select up to 2 build preferences'});
      return;
    }
    setValue('mvp_preferences',[...currentMvp,slug],{shouldDirty:true,shouldTouch:true,shouldValidate:true});
    clearErrors('mvp_preferences');
  }

  async function submitRegistration(data){
    setApiError('');
    try{
      const response=await fetch(API+'/submit-attendee-registration',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...data,_website:''}),
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||'Could not submit registration');
      try{localStorage.removeItem(DRAFT_KEY)}catch{}
      setDone(true);
    }catch(error){
      setApiError(error instanceof Error?error.message:'Could not submit registration');
    }
  }

  function handleInvalid(){
    setUnlockedModule(3);
    setApiError('Please complete the highlighted fields before submitting.');
  }

  if(done){
    return <main className="regDone"><div><span className="successMark">✓</span><small>AI LAB</small><h1>You’re registered.</h1><p>Thanks, {values.full_name}. Your workshop preferences have been received.</p><a href="/">Return to AI Lab →</a></div></main>;
  }

  return <main className="regShell onePageRegistration">
    <div className="regFrame onePageFrame">
      <aside className="regRail">
        <a href="/" className="regBrand"><AILabMark/><span>AI LAB<small>AI BUSINESS<br/>TRANSFORMATION</small></span></a>
        <h2>From Ideas to<br/>Real Impact</h2>
        <p>A hands-on workshop for CXOs, founders and business leaders.</p>
        <div className="benefits">
          <div><i><UiIcon name="people"/></i><span>Build <b>Real AI MVPs</b><small>in two days</small></span></div>
          <div><i><UiIcon name="bulb"/></i><span>Learn from<br/>experts & peers</span></div>
          <div><i><UiIcon name="network"/></i><span>Expand<br/>your network</span></div>
          <div><i><UiIcon name="rocket"/></i><span>Leave with a<br/>90-day action plan</span></div>
        </div>
        <div className="event"><b><UiIcon name="calendar" size={24}/></b><span>25 – 26 Sep 2026<small>Sofitel BKC, Mumbai</small></span></div>
        <blockquote>“Practical, focused and immediately applicable. A must for business leaders.”<small>— Previous Attendee</small></blockquote>
        <div className="railArt"><strong>Build<br/>What’s Next</strong></div>
      </aside>

      <section className="regMain onePageMain">
        <div className="moduleTrail" aria-label="Registration sections">
          <span className="active">01 About You</span>
          <span className={unlockedModule>=2?'active':''}>02 AI Readiness</span>
          <span className={unlockedModule>=3?'active':''}>03 What You’ll Build</span>
        </div>

        <form className="regCard onePageCard" onSubmit={handleSubmit(submitRegistration,handleInvalid)} noValidate>
          <div className="formHead onePageHead">
            <div><small>ATTENDEE REGISTRATION</small><h1>Let’s get to know <em>you.</em></h1><p>Complete one short page. We’ll reveal each section as you go.</p></div>
            <div className="time"><UiIcon name="clock" size={21}/><span>Takes about<br/><b>3 minutes</b></span></div>
          </div>

          <section className="formModule profileModule">
            <ModuleHeader number="01" title="About You" subtitle="Your contact and professional profile." complete={profileReady}/>
            <div className="moduleBody">
              <div className="two">
                <div className="field"><label htmlFor="full_name">Full Name *</label><div className="inputWrap"><span className="fieldIcon"><UiIcon name="user" size={17}/></span><input id="full_name" autoComplete="name" placeholder="Enter your full name" {...register('full_name')}/></div><FieldError message={errors.full_name?.message}/></div>
                <div className="field"><label htmlFor="email">Email Address *</label><div className="inputWrap"><span className="fieldIcon"><UiIcon name="mail" size={17}/></span><input id="email" type="email" autoComplete="email" placeholder="name@company.com" {...register('email')}/></div><FieldError message={errors.email?.message}/></div>
              </div>

              <div className="phoneCityRow">
                <div className="field phoneField"><label htmlFor="phone">Phone / WhatsApp *</label><div className="phoneControls"><div className="countryPicker"><span className="countryFlag" aria-hidden="true">flag</span><span className="dialDisplay">{values.phone_country_code}</span><select className="countrySelect" id="country" aria-label="Country" value={values.country||'India'} onChange={updateCountry}>{countries.map(country=><option key={country} value={country}>{country} {dialByCountry[country]}</option>)}</select><span className="countryChevron" aria-hidden="true">⌄</span></div><input type="hidden" {...register('phone_country_code')}/><input type="hidden" {...register('country')}/><div className="inputWrap phoneNumber"><span className="fieldIcon"><UiIcon name="phone" size={17}/></span><input id="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="98765 43210" {...register('phone')}/></div></div><FieldError message={errors.country?.message||errors.phone_country_code?.message||errors.phone?.message}/></div>
                <div className="field cityField"><label htmlFor="city">City *</label><div className="inputWrap"><span className="fieldIcon"><UiIcon name="pin" size={17}/></span><input id="city" autoComplete="address-level2" placeholder="Mumbai" {...register('city')}/></div><FieldError message={errors.city?.message}/></div>
              </div>

              <div className="profileRow profileRowPrimary">
                <div className="field"><label htmlFor="career_role">Current Role *</label><select id="career_role" {...register('career_role')}><option value="">Select role</option>{roles.map(role=><option key={role} value={role}>{role}</option>)}</select><FieldError message={errors.career_role?.message}/></div>
                <div className="field"><label htmlFor="company">Company / Organisation *</label><div className="inputWrap"><span className="fieldIcon"><UiIcon name="building" size={17}/></span><input id="company" autoComplete="organization" placeholder="Enter company name" {...register('company_organisation')}/></div><FieldError message={errors.company_organisation?.message}/></div>
                <div className="field"><label htmlFor="industry">Industry *</label><select id="industry" {...register('industry')}><option value="">Select industry</option>{industries.map(item=><option key={item}>{item}</option>)}</select><FieldError message={errors.industry?.message}/></div>
              </div>

              <div className="profileRow profileRowSecondary">
                <div className="field"><label htmlFor="experience">Experience *</label><select id="experience" {...register('years_experience')}><option value="">Select range</option>{experienceRanges.map(item=><option key={item}>{item}</option>)}</select><FieldError message={errors.years_experience?.message}/></div>
                <div className="field"><label htmlFor="function">Primary Function *</label><select id="function" {...register('functional_area')}><option value="">Select function</option>{functionalAreas.map(item=><option key={item}>{item}</option>)}</select><FieldError message={errors.functional_area?.message}/></div>
              </div>
            </div>
          </section>

          <section className={`formModule readinessModule ${unlockedModule<2?'isLocked':''}`}>
            <ModuleHeader number="02" title="Your AI Readiness" subtitle="A quick snapshot of where you are today." locked={unlockedModule<2} complete={unlockedModule>=2&&readinessReady}/>
            {unlockedModule>=2&&<div className="moduleBody revealBody">
              <fieldset className="aiLevelField"><legend>AI Experience *</legend><div className="aiLevelGroup">{aiLevels.map(level=><button type="button" className={values.ai_experience_level===level?'on':''} aria-pressed={values.ai_experience_level===level} onClick={()=>setValue('ai_experience_level',level,{shouldDirty:true,shouldTouch:true,shouldValidate:true})} key={level}>{level}</button>)}</div><FieldError message={errors.ai_experience_level?.message}/></fieldset>

              <div className="toolField"><label htmlFor="toolPicker">AI tools you use <span>Optional</span></label><div className="toolPickerRow"><div className="selectedTools" aria-live="polite">{currentTools.length?currentTools.map(tool=><button type="button" className="toolChip" onClick={()=>removeTool(tool)} aria-label={`Remove ${tool}`} key={tool}>{tool}<span>×</span></button>):<span className="emptyTools">No tools selected yet</span>}</div><select id="toolPicker" value="" onChange={addTool}><option value="">+ Add AI tool</option>{aiTools.filter(tool=>!currentTools.includes(tool)).map(tool=><option key={tool} value={tool}>{tool}</option>)}</select></div><FieldError message={errors.ai_tools?.message}/></div>

              {currentTools.includes('Other')&&<div className="field compactReveal"><label htmlFor="other_ai_tool">Other AI tool *</label><input id="other_ai_tool" placeholder="Enter the tool name" {...register('other_ai_tool')}/><FieldError message={errors.other_ai_tool?.message}/></div>}
            </div>}
          </section>

          <section className={`formModule buildModule ${unlockedModule<3?'isLocked':''}`}>
            <ModuleHeader number="03" title="What Would You Like to Build?" subtitle="Choose up to two. Your selection order becomes Preference 1 and 2." locked={unlockedModule<3}/>
            {unlockedModule>=3&&<div className="moduleBody revealBody">
              <div className="buildToolbar"><span><UiIcon name="sparkle" size={16}/> Select the outcomes most relevant to you</span><b>{currentMvp.length} / 2 selected</b></div>
              {optionsError&&<p className="regError" role="alert">{optionsError}</p>}
              {!optionsError&&options.length===0&&<div className="buildLoading">Loading build choices…</div>}
              <div className="onePageMvpGrid">{options.map(option=>{
                const selectedIndex=currentMvp.indexOf(option.slug);
                const selected=selectedIndex!==-1;
                return <button type="button" className={selected?'buildChoice on':'buildChoice'} aria-pressed={selected} onClick={()=>toggleMvp(option.slug)} key={option.slug}><span className="choiceTop"><b>{option.title}</b>{selected&&<i>Preference {selectedIndex+1}</i>}</span><span className="choiceDescription">{option.description}</span><span className="choiceCheck">{selected?'✓':'+'}</span></button>;
              })}</div>
              <FieldError message={errors.mvp_preferences?.message}/>

              {currentMvp.includes('something-else')&&<div className="field ideaField"><label htmlFor="other_mvp">Tell us what you would like to build *</label><textarea id="other_mvp" maxLength={300} placeholder="Describe the idea briefly…" {...register('other_mvp_idea')}/><FieldError message={errors.other_mvp_idea?.message}/></div>}

              <div className="completionZone">
                <label className="consent"><input type="checkbox" {...register('consent')}/><span>I agree to the use of my information for AI Lab workshop registration, planning and coordination.</span></label>
                <FieldError message={errors.consent?.message}/>
                {apiError&&<p className="regError" role="alert">{apiError}</p>}
                <button type="submit" className="completeButton" disabled={isSubmitting}>{isSubmitting?'Submitting…':'Complete Registration'}<span>→</span></button>
              </div>
            </div>}
          </section>

          <div className="trust onePageTrust"><span className="shield"><UiIcon name="shield" size={25}/></span><span><b>Your information is secure</b><small>We only use this information for workshop coordination.</small></span><span className="cloud"><UiIcon name="cloud" size={25}/></span><span><b>{saveState}</b><small>Your unfinished draft stays on this device.</small></span></div>
        </form>
      </section>

      <footer className="regFooter"><b><AILabMark small/><span>AI LAB<small>An ELIV8 LYF initiative</small></span></b><nav aria-label="Registration footer"><a href="#">Privacy</a><span aria-hidden="true">|</span><a href="#">Terms</a><span aria-hidden="true">|</span><a href="#">Contact</a></nav></footer>
    </div>
  </main>;
}
