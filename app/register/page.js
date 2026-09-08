'use client';

import {useEffect,useRef,useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {attendeeDefaultValues,attendeeSchema,attendeeStepFields} from '../../lib/forms/attendee-schema';

const API='https://zvmmgkspdgbfcqmnizga.supabase.co/functions/v1';
const ASSET='https://zvmmgkspdgbfcqmnizga.supabase.co/storage/v1/object/public/ai-lab-ui/';
const DRAFT_KEY='ai-lab-attendee-draft-v1';
const roles=['CXO / Executive','Founder / Co-founder','Senior Professional','Entrepreneur','Consultant','Other'];
const tools=['ChatGPT','Claude','Gemini','Copilot','Notion AI','Midjourney','DALL-E','Other'];
const levels=['Beginner','Intermediate','Advanced','Expert'];
const industries=['Technology','Financial Services','Professional Services','Retail / Consumer','Healthcare','Manufacturing','Media / Marketing','Education','Real Estate','Hospitality / Travel','Sports / Gaming','Government / Public Sector','Non-profit','Other'];
const functions=['Leadership / Strategy','Sales / Business Development','Marketing','Finance','Operations','HR / People','Technology / Product','Legal / Compliance','Consulting','Other'];
const countries=['Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Costa Rica','Croatia','Cuba','Cyprus','Czechia','Democratic Republic of the Congo','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Ivory Coast','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Republic of the Congo','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];
const dialByCountry={India:'+91','United States':'+1',Canada:'+1','United Kingdom':'+44','United Arab Emirates':'+971',Singapore:'+65',Australia:'+61','New Zealand':'+64',Uganda:'+256',Kenya:'+254','South Africa':'+27','Saudi Arabia':'+966',Qatar:'+974',Bahrain:'+973',Oman:'+968',Kuwait:'+965',Germany:'+49',France:'+33',Italy:'+39',Spain:'+34',Netherlands:'+31',Switzerland:'+41',Japan:'+81','South Korea':'+82',China:'+86',HongKong:'+852',Malaysia:'+60',Indonesia:'+62',Thailand:'+66',Sri Lanka:'+94',Bangladesh:'+880',Pakistan:'+92',Nepal:'+977'};
const roleIcons=['◉','◆','▤','♙','◇','◌'];
const FieldError=({message})=>message?<span className="fieldError" role="alert">{message}</span>:null;
const Icon=({children})=><span className="fieldIcon" aria-hidden="true">{children}</span>;

export default function Register(){
  const[step,setStep]=useState(1);
  const[options,setOptions]=useState([]);
  const[apiError,setApiError]=useState('');
  const[done,setDone]=useState(false);
  const[savedLabel,setSavedLabel]=useState('Saved locally');
  const[hydrated,setHydrated]=useState(false);
  const saveTimer=useRef(null);

  const{register,handleSubmit,trigger,setValue,setError,clearErrors,watch,reset,formState:{errors,isSubmitting}}=useForm({resolver:zodResolver(attendeeSchema),defaultValues:attendeeDefaultValues,mode:'onTouched'});
  const values=watch();
  const careerRole=watch('career_role');
  const aiTools=watch('ai_tools')||[];
  const mvpPreferences=watch('mvp_preferences')||[];
  const selectedCountry=watch('country');

  useEffect(()=>{
    try{
      const saved=localStorage.getItem(DRAFT_KEY);
      if(saved){const parsed=JSON.parse(saved);reset({...attendeeDefaultValues,...parsed,consent:false});setSavedLabel('Draft restored');}
    }catch{}
    setHydrated(true);
  },[reset]);

  useEffect(()=>{
    if(!hydrated)return;
    if(saveTimer.current)clearTimeout(saveTimer.current);
    setSavedLabel('Saving…');
    saveTimer.current=setTimeout(()=>{
      try{localStorage.setItem(DRAFT_KEY,JSON.stringify({...values,consent:false}));setSavedLabel('Auto-saved just now');}catch{setSavedLabel('Saved on this page');}
    },450);
    return()=>{if(saveTimer.current)clearTimeout(saveTimer.current)};
  },[values,hydrated]);

  useEffect(()=>{
    let active=true;
    fetch(API+'/attendee-options').then(async r=>{if(!r.ok)throw new Error('MVP options unavailable');return r.json()}).then(x=>{if(active)setOptions(x.options||[])}).catch(()=>{if(active)setApiError('We could not load the MVP choices. Please refresh and try again.')});
    return()=>{active=false};
  },[]);

  const nextStep=async()=>{
    setApiError('');
    const valid=await trigger(attendeeStepFields[step],{shouldFocus:true});
    if(!valid)return;
    setStep(s=>Math.min(3,s+1));
    window.scrollTo({top:0,behavior:'smooth'});
  };
  const previousStep=()=>{setApiError('');setStep(s=>Math.max(1,s-1));window.scrollTo({top:0,behavior:'smooth'})};
  const chooseRole=role=>setValue('career_role',role,{shouldDirty:true,shouldTouch:true,shouldValidate:true});
  const toggleTool=tool=>{const current=aiTools;setValue('ai_tools',current.includes(tool)?current.filter(x=>x!==tool):[...current,tool],{shouldDirty:true,shouldTouch:true,shouldValidate:true})};
  const chooseMvp=slug=>{
    const current=mvpPreferences;
    if(current.includes(slug)){setValue('mvp_preferences',current.filter(x=>x!==slug),{shouldDirty:true,shouldTouch:true,shouldValidate:true});clearErrors('mvp_preferences');return}
    if(current.length>=2){setError('mvp_preferences',{type:'manual',message:'Select up to 2 MVPs'});return}
    setValue('mvp_preferences',[...current,slug],{shouldDirty:true,shouldTouch:true,shouldValidate:true});clearErrors('mvp_preferences');
  };
  const onCountryChange=e=>{const country=e.target.value;const dial=dialByCountry[country];if(dial)setValue('phone_country_code',dial,{shouldDirty:true,shouldValidate:true})};

  const onSubmit=async data=>{
    setApiError('');
    try{
      const r=await fetch(API+'/submit-attendee-registration',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,_website:''})});
      const x=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(x.error||'Could not submit registration');
      try{localStorage.removeItem(DRAFT_KEY)}catch{}
      setDone(true);
    }catch(e){setApiError(e instanceof Error?e.message:'Could not submit registration')}
  };

  if(done)return <main className="regDone"><div><span className="successMark">✓</span><small>AI LAB</small><h1>You’re registered.</h1><p>Thanks, {values.full_name}. Your workshop preferences have been received.</p><a href="/">Return to AI Lab →</a></div></main>;

  return <main className="regShell"><div className="regFrame">
    <aside className="regRail">
      <a href="/" className="regBrand"><span className="brandMark">A</span><span>AI LAB<small>AI BUSINESS<br/>TRANSFORMATION</small></span></a>
      <h2>From Ideas to<br/>Real Impact</h2><p>A hands-on workshop for CXOs, founders and business leaders.</p>
      <div className="benefits"><div><i>♟</i><span>Build <b>Real AI MVPs</b><small>in two days</small></span></div><div><i>✦</i><span>Learn from<br/>experts & peers</span></div><div><i>⌘</i><span>Expand<br/>your network</span></div><div><i>↗</i><span>Leave with a<br/>90-day action plan</span></div></div>
      <div className="event"><b>▣</b><span>25 – 26 Sep 2026<small>Sofitel BKC, Mumbai</small></span></div>
      <blockquote>“Practical, focused and immediately applicable. A must for business leaders.”<small>— Previous Attendee</small></blockquote>
      <div className="railArt"><img src={ASSET+'attendee-mumbai-skyline.jpg'} alt="Mumbai skyline"/><strong>Build<br/>What’s Next</strong></div>
    </aside>

    <section className="regMain">
      <div className="stepCount">Step {step} of 3</div>
      <div className="steps" aria-label={`Registration step ${step} of 3`}>{['You & Profile','AI & Your Interests','Review & Submit'].map((x,i)=><div className={step>=i+1?'active':''} key={x}><b>{step>i+1?'✓':i+1}</b><span>{x}</span></div>)}</div>

      <form className="regCard" onSubmit={handleSubmit(onSubmit)} noValidate>
        {step===1&&<>
          <div className="formHead"><div><small>ATTENDEE REGISTRATION</small><h1>Let’s get to know <em>you.</em></h1><p>Share a few details so we can personalise your workshop experience.</p></div><div className="time">◷ <span>Takes about<br/><b>3 minutes</b></span></div></div>
          <div className="field full"><label htmlFor="full_name">Full Name *</label><div className="inputWrap"><Icon>♙</Icon><input id="full_name" autoComplete="name" placeholder="Enter your full name" {...register('full_name')}/></div><FieldError message={errors.full_name?.message}/></div>
          <div className="field full"><label htmlFor="email">Email Address *</label><div className="inputWrap"><Icon>✉</Icon><input id="email" type="email" autoComplete="email" placeholder="name@company.com" {...register('email')}/></div><FieldError message={errors.email?.message}/></div>
          <div className="field"><label>Phone / WhatsApp *</label><div className="phoneWrap"><input className="dialCode" aria-label="Phone country code" inputMode="tel" {...register('phone_country_code')}/><div className="inputWrap"><Icon>⌕</Icon><input type="tel" autoComplete="tel" inputMode="tel" placeholder="98765 43210" {...register('phone')}/></div></div><FieldError message={errors.phone_country_code?.message||errors.phone?.message}/></div>
          <div className="two locationRow"><div className="field"><label htmlFor="city">City *</label><div className="inputWrap"><Icon>⌖</Icon><input id="city" autoComplete="address-level2" placeholder="Mumbai" {...register('city')}/></div><FieldError message={errors.city?.message}/></div><div className="field"><label htmlFor="country">Country *</label><select id="country" autoComplete="country-name" {...register('country',{onChange:onCountryChange})}>{countries.map(x=><option key={x} value={x}>{x}</option>)}</select><FieldError message={errors.country?.message}/></div></div>
          <fieldset><legend>Your Current Role *</legend><div className="roleGrid">{roles.map((x,i)=><button type="button" className={careerRole===x?'on':''} aria-pressed={careerRole===x} onClick={()=>chooseRole(x)} key={x}><span>{roleIcons[i]}</span>{x}</button>)}</div><FieldError message={errors.career_role?.message}/></fieldset>
          <div className="two"><div className="field"><label htmlFor="company">Company / Organisation *</label><div className="inputWrap"><Icon>▥</Icon><input id="company" autoComplete="organization" placeholder="Enter company name" {...register('company_organisation')}/></div><FieldError message={errors.company_organisation?.message}/></div><div className="field"><label htmlFor="industry">Industry *</label><select id="industry" {...register('industry')}><option value="">Select industry</option>{industries.map(x=><option key={x}>{x}</option>)}</select><FieldError message={errors.industry?.message}/></div></div>
          <div className="two"><div className="field"><label htmlFor="experience">Years of Professional Experience *</label><select id="experience" {...register('years_experience')}><option value="">Select range</option>{['0–2','3–5','6–10','11–15','15+'].map(x=><option key={x}>{x}</option>)}</select><FieldError message={errors.years_experience?.message}/></div><div className="field"><label htmlFor="function">Primary Functional Area *</label><select id="function" {...register('functional_area')}><option value="">Select function</option>{functions.map(x=><option key={x}>{x}</option>)}</select><FieldError message={errors.functional_area?.message}/></div></div>
        </>}

        {step===2&&<>
          <div className="formHead visualHead"><div><small>ATTENDEE REGISTRATION</small><h1>Your AI experience & what you want to <em>build.</em></h1><p>Tell us where you are today and choose up to two MVPs in order of preference.</p></div><div className="headVisuals"><img src={ASSET+'attendee-wave-light.jpg'} alt="Abstract AI wave"/><img src={ASSET+'step1-workshop-desk.jpg'} alt="Hands-on AI workshop desk"/></div></div>
          <fieldset><legend>Your AI Experience Level *</legend><div className="levelGrid">{levels.map(x=><button type="button" className={values.ai_experience_level===x?'on':''} aria-pressed={values.ai_experience_level===x} onClick={()=>setValue('ai_experience_level',x,{shouldDirty:true,shouldTouch:true,shouldValidate:true})} key={x}><b>{x}</b></button>)}</div><FieldError message={errors.ai_experience_level?.message}/></fieldset>
          <fieldset><legend>Which AI tools have you used?</legend><div className="chips">{tools.map(x=><button type="button" className={aiTools.includes(x)?'on':''} aria-pressed={aiTools.includes(x)} onClick={()=>toggleTool(x)} key={x}>{x}</button>)}</div><FieldError message={errors.ai_tools?.message}/></fieldset>
          <fieldset><legend>What would you like to build? <small>Select up to 2 — your first selection is Preference 1.</small></legend><div className="mvpGrid">{options.map(o=><button type="button" className={mvpPreferences.includes(o.slug)?'on':''} aria-pressed={mvpPreferences.includes(o.slug)} onClick={()=>chooseMvp(o.slug)} key={o.slug}><i>{mvpPreferences.includes(o.slug)?mvpPreferences.indexOf(o.slug)+1:''}</i><b>{o.title}</b><span>{o.description}</span></button>)}</div><FieldError message={errors.mvp_preferences?.message}/></fieldset>
          {mvpPreferences.includes('something-else')&&<div className="field"><label htmlFor="other_mvp">Tell us what you would like to build</label><textarea id="other_mvp" maxLength={300} placeholder="Describe the idea briefly…" {...register('other_mvp_idea')}/><FieldError message={errors.other_mvp_idea?.message}/></div>}
        </>}

        {step===3&&<>
          <div className="formHead visualHead"><div><small>ATTENDEE REGISTRATION</small><h1>Almost <em>there.</em></h1><p>Review your details before submitting.</p></div><img className="singleHeadVisual" src={ASSET+'step1-workshop-collaboration.jpg'} alt="AI Lab workshop collaboration"/></div>
          <div className="review"><section><h3>Your Profile <button type="button" onClick={()=>setStep(1)}>Edit</button></h3><b>{values.full_name}</b><p>{values.email}<br/>{values.phone_country_code} {values.phone}<br/>{values.city}, {selectedCountry}<br/>{values.career_role}<br/>{values.company_organisation} · {values.industry}<br/>{values.years_experience} years · {values.functional_area}</p></section><section><h3>AI Experience <button type="button" onClick={()=>setStep(2)}>Edit</button></h3><p><b>{values.ai_experience_level}</b><br/>{aiTools.join(', ')||'No tools selected'}</p></section><section><h3>Workshop Interests <button type="button" onClick={()=>setStep(2)}>Edit</button></h3>{mvpPreferences.map((s,i)=><p key={s}>Preference {i+1}: <b>{options.find(o=>o.slug===s)?.title||s}</b></p>)}</section></div>
          <label className="consent"><input type="checkbox" {...register('consent')}/><span>I agree to the use of my information for AI Lab workshop registration, planning and coordination.</span></label><FieldError message={errors.consent?.message}/>
        </>}

        {apiError&&<p className="regError" role="alert">{apiError}</p>}
        <div className="regActions"><button type="button" disabled={step===1||isSubmitting} onClick={previousStep}>← <span>Back</span></button>{step<3?<button type="button" className="primary" onClick={nextStep}>Save & Continue <span>→</span></button>:<button type="submit" className="primary" disabled={isSubmitting}>{isSubmitting?'Submitting…':'Submit Registration →'}</button>}</div>
        <div className="trust"><span className="shield">⬟</span><span><b>Your information is secure</b><small>Used only for workshop registration and coordination.</small></span><span className="cloud">♧</span><span><b>{savedLabel}</b><small>Your unfinished draft stays on this device.</small></span></div>
      </form>

      <footer className="regFooter"><b><span className="miniMark">A</span><span>AI LAB<small>An ELIV8 LYF initiative</small></span></b><nav aria-label="Registration footer"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Contact</a></nav></footer>
    </section>
  </div></main>;
}
