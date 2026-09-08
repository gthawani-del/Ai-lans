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
  roles,
} from '../../lib/forms/attendee-options';

const API='https://zvmmgkspdgbfcqmnizga.supabase.co/functions/v1';
const ASSET='https://zvmmgkspdgbfcqmnizga.supabase.co/storage/v1/object/public/ai-lab-ui/';
const DRAFT_KEY='ai-lab-attendee-draft';
const DRAFT_VERSION=2;
const LEGACY_DRAFT_KEYS=['ai-lab-attendee-draft-v1'];

const COUNTRY_FLAGS={
  India:'🇮🇳','United States':'🇺🇸',Canada:'🇨🇦','United Kingdom':'🇬🇧','United Arab Emirates':'🇦🇪',
  Singapore:'🇸🇬',Australia:'🇦🇺','New Zealand':'🇳🇿',Uganda:'🇺🇬',Kenya:'🇰🇪','South Africa':'🇿🇦',
  'Saudi Arabia':'🇸🇦',Qatar:'🇶🇦',Bahrain:'🇧🇭',Oman:'🇴🇲',Kuwait:'🇰🇼',Germany:'🇩🇪',France:'🇫🇷',
  Italy:'🇮🇹',Spain:'🇪🇸',Netherlands:'🇳🇱',Switzerland:'🇨🇭',Japan:'🇯🇵','South Korea':'🇰🇷',China:'🇨🇳',
  Malaysia:'🇲🇾',Indonesia:'🇮🇩',Thailand:'🇹🇭','Sri Lanka':'🇱🇰',Bangladesh:'🇧🇩',Pakistan:'🇵🇰',Nepal:'🇳🇵',
};

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
    executive:<><circle cx="12" cy="7" r="3"/><path d="M6 20v-2.5c0-3 2.3-5 6-5s6 2 6 5V20"/><path d="m9.5 14.2 2.5 2.1 2.5-2.1"/></>,
    founder:<><path d="M12 3 9.8 8.2 4 9l4.2 4-1 5.7L12 16l4.8 2.7-1-5.7L20 9l-5.8-.8L12 3Z"/></>,
    professional:<><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    entrepreneur:<><circle cx="12" cy="8" r="3"/><path d="M5.5 20c.6-4 2.9-6 6.5-6s5.9 2 6.5 6"/><path d="M4 12h3M17 12h3"/></>,
    consultant:<><path d="M12 21s6-4.7 6-11V5l-6-2-6 2v5c0 6.3 6 11 6 11Z"/><path d="m9.5 11 1.6 1.6 3.5-3.5"/></>,
    other:<><circle cx="12" cy="12" r="8"/><path d="M9.7 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.7 2-2.7 3.8M12 17h.01"/></>,
    people:<><circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><circle cx="12" cy="6" r="2.8"/><path d="M3.5 18c.4-3 2.1-4.8 4.5-4.8M20.5 18c-.4-3-2.1-4.8-4.5-4.8M6.5 20c.4-4 2.4-6 5.5-6s5.1 2 5.5 6"/></>,
    bulb:<><path d="M9 18h6M10 21h4M8.8 15.3A6 6 0 1 1 15.2 15.3c-.8.6-1.2 1.4-1.2 2.2h-4c0-.8-.4-1.6-1.2-2.2Z"/></>,
    network:<><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/></>,
    rocket:<><path d="M14 4c2.9-1.2 5-1 6-.8.2 1 .4 3.1-.8 6l-5.7 5.7-4.4-4.4L14 4Z"/><path d="m8.5 12-3.3.8-2.2 2.2 4.2.7M12 15.5l-.8 3.3L9 21l-.7-4.2"/><circle cx="16.5" cy="6.5" r="1.3"/></>,
    calendar:<><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></>,
    shield:<><path d="M12 22s7-3.8 7-10V5l-7-3-7 3v7c0 6.2 7 10 7 10Z"/><path d="m9 12 2 2 4-4"/></>,
    cloud:<><path d="M7.5 18H6a4 4 0 0 1-.3-8A6.5 6.5 0 0 1 18 9a4.5 4.5 0 0 1 .5 9H16"/><path d="M12 11v9M9 14l3-3 3 3"/></>,
    clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    arrow:<><path d="M5 12h14M14 7l5 5-5 5"/></>,
    back:<><path d="M19 12H5M10 7l-5 5 5 5"/></>,
  };
  return <svg {...common}>{paths[name]||paths.other}</svg>;
}

function AILabMark({small=false}){
  return <svg className={small?'aiMark small':'aiMark'} viewBox="0 0 48 48" role="img" aria-label="AI Lab">
    <defs>
      <linearGradient id={small?'markGradSmall':'markGrad'} x1="5" y1="3" x2="42" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#b12cff"/>
        <stop offset=".52" stopColor="#7144ff"/>
        <stop offset="1" stopColor="#1e5cff"/>
      </linearGradient>
    </defs>
    <path d="M23.8 4 8.2 39.5h10.2l5.5-13.4 5.7 13.4h10.3L25 4h-1.2Z" fill={`url(#${small?'markGradSmall':'markGrad'})`}/>
    <path d="M16.2 25.5h16.2" stroke="#fff" strokeWidth="4.2" strokeLinecap="round" opacity=".92"/>
  </svg>;
}

function MountainArt(){
  return <svg className="mountainSvg" viewBox="0 0 360 220" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient id="mountainGlow" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#6238ff" stopOpacity=".95"/>
        <stop offset="1" stopColor="#13276d" stopOpacity=".25"/>
      </linearGradient>
    </defs>
    <path d="M0 176 55 112l30 33 50-72 44 57 38-45 60 75 33-36 50 52v44H0Z" fill="url(#mountainGlow)" opacity=".72"/>
    <path d="M0 196 60 150l31 28 49-57 52 52 43-35 52 42 25-20 48 36v24H0Z" fill="#091446" opacity=".9"/>
    <path d="m58 113 27 32 50-72 44 57" stroke="#8f6bff" strokeWidth="1.2" fill="none" opacity=".48"/>
  </svg>;
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
  const flag=COUNTRY_FLAGS[values.country]||'🌐';

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
    const dial=dialByCountry[event.target.value]||'';
    setValue('phone_country_code',dial,{shouldDirty:true,shouldValidate:true});
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

  const roleIconNames=['executive','founder','professional','entrepreneur','consultant','other'];

  return <main className="regShell">
    <div className="regFrame">
      <aside className="regRail">
        <a href="/" className="regBrand">
          <AILabMark/>
          <span>AI LAB<small>AI BUSINESS<br/>TRANSFORMATION</small></span>
        </a>
        <h2>From Ideas to<br/>Real Impact</h2>
        <p>A hands-on workshop for CXOs, founders and business leaders.</p>
        <div className="benefits">
          <div><i><UiIcon name="people"/></i><span>Build <b>Real AI MVPs</b><small>in two days</small></span></div>
          <div><i><UiIcon name="bulb"/></i><span>Learn from<br/>experts & peers</span></div>
          <div><i><UiIcon name="network"/></i><span>Expand<br/>your network</span></div>
          <div><i><UiIcon name="rocket"/></i><span>Leave with a<br/>90-day action plan</span></div>
        </div>
        <div className="event">
          <b><UiIcon name="calendar" size={24}/></b>
          <span>25 – 26 Sep 2026<small>Sofitel BKC, Mumbai</small></span>
        </div>
        <blockquote>
          “Practical, focused and immediately applicable. A must for business leaders.”
          <small>— Previous Attendee</small>
        </blockquote>
        <div className="railArt">
          <MountainArt/>
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

        <form className={`regCard ${step===1?'step1Card':''}`} onSubmit={handleSubmit(submitRegistration)} noValidate>
          {step===1&&<>
            <div className="formHead">
              <div>
                <small>ATTENDEE REGISTRATION</small>
                <h1>Let’s get to know <em>you.</em></h1>
                <p>Share a few details so we can personalise your workshop experience.</p>
              </div>
              <div className="time"><UiIcon name="clock" size={21}/><span>Takes about<br/><b>3 minutes</b></span></div>
            </div>

            <div className="field full">
              <label htmlFor="full_name">Full Name *</label>
              <div className="inputWrap"><span className="fieldIcon"><UiIcon name="user" size={17}/></span><input id="full_name" autoComplete="name" placeholder="Enter your full name" {...register('full_name')}/></div>
              <FieldError message={errors.full_name?.message}/>
            </div>

            <div className="field full">
              <label htmlFor="email">Email Address *</label>
              <div className="inputWrap"><span className="fieldIcon"><UiIcon name="mail" size={17}/></span><input id="email" type="email" autoComplete="email" placeholder="name@company.com" {...register('email')}/></div>
              <FieldError message={errors.email?.message}/>
            </div>

            <div className="phoneCityRow">
              <div className="field phoneField">
                <label htmlFor="phone">Phone / WhatsApp *</label>
                <div className="phoneControls">
                  <div className="countryPicker">
                    <span className="countryFlag" aria-hidden="true">{flag}</span>
                    <input className="dialEditor" aria-label="Phone country code" inputMode="tel" {...register('phone_country_code')}/>
                    <select className="countrySelect" id="country" aria-label="Country" autoComplete="country-name" {...register('country',{onChange:updateCountry})}>
                      {countries.map(country=><option key={country} value={country}>{country}</option>)}
                    </select>
                    <span className="countryChevron" aria-hidden="true">⌄</span>
                  </div>
                  <div className="inputWrap phoneNumber"><span className="fieldIcon"><UiIcon name="phone" size={17}/></span><input id="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="98765 43210" {...register('phone')}/></div>
                </div>
                <FieldError message={errors.country?.message||errors.phone_country_code?.message||errors.phone?.message}/>
              </div>

              <div className="field cityField">
                <label htmlFor="city">City *</label>
                <div className="inputWrap"><span className="fieldIcon"><UiIcon name="pin" size={17}/></span><input id="city" autoComplete="address-level2" placeholder="Mumbai" {...register('city')}/></div>
                <FieldError message={errors.city?.message}/>
              </div>
            </div>

            <fieldset>
              <legend>Your Current Role *</legend>
              <div className="roleGrid">
                {roles.map((role,index)=><button type="button" className={currentRole===role?'on':''} aria-pressed={currentRole===role} onClick={()=>selectRole(role)} key={role}>
                  <UiIcon name={roleIconNames[index]} size={15}/>{role}
                </button>)}
              </div>
              <FieldError message={errors.career_role?.message}/>
            </fieldset>

            <div className="two">
              <div className="field">
                <label htmlFor="company">Company / Organisation *</label>
                <div className="inputWrap"><span className="fieldIcon"><UiIcon name="building" size={17}/></span><input id="company" autoComplete="organization" placeholder="Enter company name" {...register('company_organisation')}/></div>
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
            <button type="button" disabled={step===1||isSubmitting} onClick={previousStep}><UiIcon name="back" size={17}/><span>Back</span></button>
            {step<3
              ?<button type="button" className="primary" onClick={nextStep}>Save & Continue <UiIcon name="arrow" size={17}/></button>
              :<button type="submit" className="primary" disabled={isSubmitting}>{isSubmitting?'Submitting…':'Submit Registration →'}</button>}
          </div>

          <div className="trust">
            <span className="shield"><UiIcon name="shield" size={25}/></span>
            <span><b>Your information is secure</b><small>We only use this information for workshop coordination.</small></span>
            <span className="cloud"><UiIcon name="cloud" size={25}/></span>
            <span><b>{saveState}</b><small>Your unfinished draft stays on this device.</small></span>
          </div>
        </form>
      </section>

      <footer className="regFooter">
        <b><AILabMark small/><span>AI LAB<small>An ELIV8 LYF initiative</small></span></b>
        <nav aria-label="Registration footer"><a href="#">Privacy</a><span aria-hidden="true">|</span><a href="#">Terms</a><span aria-hidden="true">|</span><a href="#">Contact</a></nav>
      </footer>
    </div>
  </main>;
}
