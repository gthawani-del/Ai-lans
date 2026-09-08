'use client';

import {useEffect,useRef,useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {
  attendeeDefaultValues,
  attendeeSchema,
  attendeeStepFields,
} from '../../lib/forms/attendee-schema';
import {
  aiLevels,
  aiTools,
  countries,
  dialByCountry,
  experienceRanges,
  functionalAreas,
  industries,
  roleIcons,
  roles,
} from '../../lib/forms/attendee-options';

const API='https://zvmmgkspdgbfcqmnizga.supabase.co/functions/v1';
const ASSET='https://zvmmgkspdgbfcqmnizga.supabase.co/storage/v1/object/public/ai-lab-ui/';
const DRAFT_KEY='ai-lab-attendee-draft-v1';

function FieldError({message}){
  if(!message)return null;
  return <span className="fieldError" role="alert">{message}</span>;
}

function Icon({children}){
  return <span className="fieldIcon" aria-hidden="true">{children}</span>;
}

export default function Register(){
  const [step,setStep]=useState(1);
  const [options,setOptions]=useState([]);
  const [apiError,setApiError]=useState('');
  const [done,setDone]=useState(false);
  const [saveState,setSaveState]=useState('Saved locally');
  const [draftReady,setDraftReady]=useState(false);
  const saveTimer=useRef(null);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    reset,
    setValue,
    setError,
    clearErrors,
    formState:{errors,isSubmitting},
  }=useForm({
    resolver:zodResolver(attendeeSchema),
    defaultValues:attendeeDefaultValues,
    mode:'onTouched',
  });

  const values=watch();
  const currentRole=watch('career_role');
  const currentTools=watch('ai_tools')||[];
  const currentMvp=watch('mvp_preferences')||[];

  useEffect(()=>{
    try{
      const raw=localStorage.getItem(DRAFT_KEY);
      if(raw){
        const saved=JSON.parse(raw);
        reset({...attendeeDefaultValues,...saved,consent:false});
        setSaveState('Draft restored');
      }
    }catch{}
    setDraftReady(true);
  },[reset]);

  useEffect(()=>{
    if(!draftReady)return;
    const subscription=watch(data=>{
      if(saveTimer.current)clearTimeout(saveTimer.current);
      setSaveState('Saving…');
      saveTimer.current=setTimeout(()=>{
        try{
          localStorage.setItem(DRAFT_KEY,JSON.stringify({...data,consent:false}));
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
        if(!response.ok)throw new Error('Could not load MVP options');
        return response.json();
      })
      .then(data=>{
        if(active)setOptions(data.options||[]);
      })
      .catch(()=>{
        if(active)setApiError('We could not load the MVP choices. Refresh the page and try again.');
      });
    return()=>{active=false};
  },[]);

  async function nextStep(){
    setApiError('');
    const valid=await trigger(attendeeStepFields[step],{shouldFocus:true});
    if(!valid)return;
    setStep(current=>Math.min(3,current+1));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function previousStep(){
    setApiError('');
    setStep(current=>Math.max(1,current-1));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function selectRole(role){
    setValue('career_role',role,{shouldDirty:true,shouldTouch:true,shouldValidate:true});
  }

  function toggleTool(tool){
    const next=currentTools.includes(tool)
      ? currentTools.filter(item=>item!==tool)
      : [...currentTools,tool];
    setValue('ai_tools',next,{shouldDirty:true,shouldTouch:true,shouldValidate:true});
  }

  function toggleMvp(slug){
    if(currentMvp.includes(slug)){
      setValue('mvp_preferences',currentMvp.filter(item=>item!==slug),{
        shouldDirty:true,
        shouldTouch:true,
        shouldValidate:true,
      });
      clearErrors('mvp_preferences');
      return;
    }
    if(currentMvp.length>=2){
      setError('mvp_preferences',{type:'manual',message:'Select up to 2 MVPs'});
      return;
    }
    setValue('mvp_preferences',[...currentMvp,slug],{
      shouldDirty:true,
      shouldTouch:true,
      shouldValidate:true,
    });
    clearErrors('mvp_preferences');
  }

  function updateCountry(event){
    const dial=dialByCountry[event.target.value];
    if(dial){
      setValue('phone_country_code',dial,{shouldDirty:true,shouldValidate:true});
    }
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

  if(done){
    return <main className="regDone">
      <div>
        <span className="successMark">✓</span>
        <small>AI LAB</small>
        <h1>You’re registered.</h1>
        <p>Thanks, {values.full_name}. Your workshop preferences have been received.</p>
        <a href="/">Return to AI Lab →</a>
      </div>
    </main>;
  }

  return <main className="regShell">
    <div className="regFrame">
      <aside className="regRail">
        <a href="/" className="regBrand">
          <span className="brandMark">A</span>
          <span>AI LAB<small>AI BUSINESS<br/>TRANSFORMATION</small></span>
        </a>
        <h2>From Ideas to<br/>Real Impact</h2>
        <p>A hands-on workshop for CXOs, founders and business leaders.</p>
        <div className="benefits">
          <div><i>♟</i><span>Build <b>Real AI MVPs</b><small>in two days</small></span></div>
          <div><i>✦</i><span>Learn from<br/>experts & peers</span></div>
          <div><i>⌘</i><span>Expand<br/>your network</span></div>
          <div><i>↗</i><span>Leave with a<br/>90-day action plan</span></div>
        </div>
        <div className="event">
          <b>▣</b>
          <span>25 – 26 Sep 2026<small>Sofitel BKC, Mumbai</small></span>
        </div>
        <blockquote>
          “Practical, focused and immediately applicable. A must for business leaders.”
          <small>— Previous Attendee</small>
        </blockquote>
        <div className="railArt">
          <img src={ASSET+'attendee-mumbai-skyline.jpg'} alt="Mumbai skyline"/>
          <strong>Build<br/>What’s Next</strong>
        </div>
      </aside>

      <section className="regMain">
        <div className="stepCount">Step {step} of 3</div>
        <div className="steps" aria-label={`Registration step ${step} of 3`}>
          {['You & Profile','AI & Your Interests','Review & Submit'].map((label,index)=><div className={step>=index+1?'active':''} key={label}>
            <b>{step>index+1?'✓':index+1}</b>
            <span>{label}</span>
          </div>)}
        </div>

        <form className="regCard" onSubmit={handleSubmit(submitRegistration)} noValidate>
          {step===1&&<>
            <div className="formHead">
              <div>
                <small>ATTENDEE REGISTRATION</small>
                <h1>Let’s get to know <em>you.</em></h1>
                <p>Share a few details so we can personalise your workshop experience.</p>
              </div>
              <div className="time">◷ <span>Takes about<br/><b>3 minutes</b></span></div>
            </div>

            <div className="field full">
              <label htmlFor="full_name">Full Name *</label>
              <div className="inputWrap"><Icon>♙</Icon><input id="full_name" autoComplete="name" placeholder="Enter your full name" {...register('full_name')}/></div>
              <FieldError message={errors.full_name?.message}/>
            </div>

            <div className="field full">
              <label htmlFor="email">Email Address *</label>
              <div className="inputWrap"><Icon>✉</Icon><input id="email" type="email" autoComplete="email" placeholder="name@company.com" {...register('email')}/></div>
              <FieldError message={errors.email?.message}/>
            </div>

            <div className="field">
              <label>Phone / WhatsApp *</label>
              <div className="phoneWrap">
                <input className="dialCode" aria-label="Phone country code" inputMode="tel" {...register('phone_country_code')}/>
                <div className="inputWrap"><Icon>⌕</Icon><input type="tel" autoComplete="tel" inputMode="tel" placeholder="98765 43210" {...register('phone')}/></div>
              </div>
              <FieldError message={errors.phone_country_code?.message||errors.phone?.message}/>
            </div>

            <div className="two locationRow">
              <div className="field">
                <label htmlFor="city">City *</label>
                <div className="inputWrap"><Icon>⌖</Icon><input id="city" autoComplete="address-level2" placeholder="Mumbai" {...register('city')}/></div>
                <FieldError message={errors.city?.message}/>
              </div>
              <div className="field">
                <label htmlFor="country">Country *</label>
                <select id="country" autoComplete="country-name" {...register('country',{onChange:updateCountry})}>
                  {countries.map(country=><option key={country} value={country}>{country}</option>)}
                </select>
                <FieldError message={errors.country?.message}/>
              </div>
            </div>

            <fieldset>
              <legend>Your Current Role *</legend>
              <div className="roleGrid">
                {roles.map((role,index)=><button type="button" className={currentRole===role?'on':''} aria-pressed={currentRole===role} onClick={()=>selectRole(role)} key={role}>
                  <span>{roleIcons[index]}</span>{role}
                </button>)}
              </div>
              <FieldError message={errors.career_role?.message}/>
            </fieldset>

            <div className="two">
              <div className="field">
                <label htmlFor="company">Company / Organisation *</label>
                <div className="inputWrap"><Icon>▥</Icon><input id="company" autoComplete="organization" placeholder="Enter company name" {...register('company_organisation')}/></div>
                <FieldError message={errors.company_organisation?.message}/>
              </div>
              <div className="field">
                <label htmlFor="industry">Industry *</label>
                <select id="industry" {...register('industry')}>
                  <option value="">Select industry</option>
                  {industries.map(item=><option key={item}>{item}</option>)}
                </select>
                <FieldError message={errors.industry?.message}/>
              </div>
            </div>

            <div className="two">
              <div className="field">
                <label htmlFor="experience">Years of Professional Experience *</label>
                <select id="experience" {...register('years_experience')}>
                  <option value="">Select range</option>
                  {experienceRanges.map(item=><option key={item}>{item}</option>)}
                </select>
                <FieldError message={errors.years_experience?.message}/>
              </div>
              <div className="field">
                <label htmlFor="function">Primary Functional Area *</label>
                <select id="function" {...register('functional_area')}>
                  <option value="">Select function</option>
                  {functionalAreas.map(item=><option key={item}>{item}</option>)}
                </select>
                <FieldError message={errors.functional_area?.message}/>
              </div>
            </div>
          </>}

          {step===2&&<>
            <div className="formHead visualHead">
              <div>
                <small>ATTENDEE REGISTRATION</small>
                <h1>Your AI experience & what you want to <em>build.</em></h1>
                <p>Tell us where you are today and choose up to two MVPs in order of preference.</p>
              </div>
              <div className="headVisuals">
                <img src={ASSET+'attendee-wave-light.jpg'} alt="Abstract AI wave"/>
                <img src={ASSET+'step1-workshop-desk.jpg'} alt="Hands-on AI workshop desk"/>
              </div>
            </div>

            <fieldset>
              <legend>Your AI Experience Level *</legend>
              <div className="levelGrid">
                {aiLevels.map(level=><button type="button" className={values.ai_experience_level===level?'on':''} aria-pressed={values.ai_experience_level===level} onClick={()=>setValue('ai_experience_level',level,{shouldDirty:true,shouldTouch:true,shouldValidate:true})} key={level}><b>{level}</b></button>)}
              </div>
              <FieldError message={errors.ai_experience_level?.message}/>
            </fieldset>

            <fieldset>
              <legend>Which AI tools have you used?</legend>
              <div className="chips">
                {aiTools.map(tool=><button type="button" className={currentTools.includes(tool)?'on':''} aria-pressed={currentTools.includes(tool)} onClick={()=>toggleTool(tool)} key={tool}>{tool}</button>)}
              </div>
              <FieldError message={errors.ai_tools?.message}/>
            </fieldset>

            <fieldset>
              <legend>What would you like to build? <small>Select up to 2 — first selection is Preference 1.</small></legend>
              <div className="mvpGrid">
                {options.map(option=><button type="button" className={currentMvp.includes(option.slug)?'on':''} aria-pressed={currentMvp.includes(option.slug)} onClick={()=>toggleMvp(option.slug)} key={option.slug}>
                  <i>{currentMvp.includes(option.slug)?currentMvp.indexOf(option.slug)+1:''}</i>
                  <b>{option.title}</b>
                  <span>{option.description}</span>
                </button>)}
              </div>
              <FieldError message={errors.mvp_preferences?.message}/>
            </fieldset>

            {currentMvp.includes('something-else')&&<div className="field">
              <label htmlFor="other_mvp">Tell us what you would like to build</label>
              <textarea id="other_mvp" maxLength={300} placeholder="Describe the idea briefly…" {...register('other_mvp_idea')}/>
              <FieldError message={errors.other_mvp_idea?.message}/>
            </div>}
          </>}

          {step===3&&<>
            <div className="formHead visualHead">
              <div>
                <small>ATTENDEE REGISTRATION</small>
                <h1>Almost <em>there.</em></h1>
                <p>Review your details before submitting.</p>
              </div>
              <img className="singleHeadVisual" src={ASSET+'step1-workshop-collaboration.jpg'} alt="AI Lab workshop collaboration"/>
            </div>

            <div className="review">
              <section>
                <h3>Your Profile <button type="button" onClick={()=>setStep(1)}>Edit</button></h3>
                <b>{values.full_name}</b>
                <p>{values.email}<br/>{values.phone_country_code} {values.phone}<br/>{values.city}, {values.country}<br/>{values.career_role}<br/>{values.company_organisation} · {values.industry}<br/>{values.years_experience} years · {values.functional_area}</p>
              </section>
              <section>
                <h3>AI Experience <button type="button" onClick={()=>setStep(2)}>Edit</button></h3>
                <p><b>{values.ai_experience_level}</b><br/>{currentTools.join(', ')||'No tools selected'}</p>
              </section>
              <section>
                <h3>Workshop Interests <button type="button" onClick={()=>setStep(2)}>Edit</button></h3>
                {currentMvp.map((slug,index)=><p key={slug}>Preference {index+1}: <b>{options.find(option=>option.slug===slug)?.title||slug}</b></p>)}
              </section>
            </div>

            <label className="consent">
              <input type="checkbox" {...register('consent')}/>
              <span>I agree to the use of my information for AI Lab workshop registration, planning and coordination.</span>
            </label>
            <FieldError message={errors.consent?.message}/>
          </>}

          {apiError&&<p className="regError" role="alert">{apiError}</p>}

          <div className="regActions">
            <button type="button" disabled={step===1||isSubmitting} onClick={previousStep}>← <span>Back</span></button>
            {step<3
              ?<button type="button" className="primary" onClick={nextStep}>Save & Continue <span>→</span></button>
              :<button type="submit" className="primary" disabled={isSubmitting}>{isSubmitting?'Submitting…':'Submit Registration →'}</button>}
          </div>

          <div className="trust">
            <span className="shield">⬟</span>
            <span><b>Your information is secure</b><small>Used only for workshop registration and coordination.</small></span>
            <span className="cloud">♧</span>
            <span><b>{saveState}</b><small>Your unfinished draft stays on this device.</small></span>
          </div>
        </form>

        <footer className="regFooter">
          <b><span className="miniMark">A</span><span>AI LAB<small>An ELIV8 LYF initiative</small></span></b>
          <nav aria-label="Registration footer"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Contact</a></nav>
        </footer>
      </section>
    </div>
  </main>;
}
