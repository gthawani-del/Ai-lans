'use client';

import {useEffect,useRef,useState} from 'react';
import './attendee-theme.css';
import {submitAttendeeApplication} from '../../lib/attendee-application.mjs';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {
  attendeeAiReadinessSchema,
  attendeeBuildSchema,
  attendeeDefaultValues,
  attendeeModuleFields,
  attendeeProfileSchema,
  attendeeSchema,
} from '../../lib/forms/attendee-schema';
import {
  aiLevels,
  aiTools,
  experienceRanges,
  functionalAreas,
  industries,
  roles,targetUsers,dataSources,successOutcomes,attendanceOptions,contactMethods,representativeDataOptions,discoverySources,aiLevelExamples,
} from '../../lib/forms/attendee-options';
import {getPhoneCountry,normalizeNationalPhone,phoneCountries} from '../../lib/forms/phone-country';
import SocialLinks from '../../components/SocialLinks';

const API='https://zvmmgkspdgbfcqmnizga.supabase.co/functions/v1';
const DRAFT_KEY='ai-lab-attendee-draft';
const DRAFT_VERSION=7;
const LEGACY_DRAFT_KEYS=['ai-lab-attendee-draft-v1'];
const THEME_KEY='ai-lab-registration-theme';
const TEXT_SCALE_KEY='ai-lab-registration-text-scale';
const TEXT_STEPS=[100,125,150,175,200];

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
    edit:<><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></>,
    card:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></>,
    search:<><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></>,
  };
  return <svg {...common}>{paths[name]||paths.sparkle}</svg>;
}

function AILabMark({small=false}){
  return <img className={small?'attendeeLogo small':'attendeeLogo'} src="/brand/weareailabs-volunteer.webp" alt="weareailabs — Explore. Learn. Create. Together." width="200" height="110"/>;
}

function ModuleHeader({number,title,subtitle,locked=false,complete=false}){
  return <div className="moduleHeader"><div className="moduleNumber">{complete?<UiIcon name="check" size={16}/>:number}</div><div className="moduleHeading"><h2>{title}</h2><p>{subtitle}</p></div>{locked&&<span className="moduleLock"><UiIcon name="lock" size={14}/> Complete the section above</span>}{complete&&!locked&&<span className="moduleDone">Complete</span>}</div>;
}



function DisplayControls({theme,onToggleTheme,textScale,onTextScale,textOpen,setTextOpen}){
  return <div className="displayControls" aria-label="Display preferences"><div className="textScaleControl"><button type="button" className="displayButton" aria-expanded={textOpen} aria-controls="text-size-popover" onClick={()=>setTextOpen(v=>!v)}><span className="aaMark">Aa</span><span className="srOnly">Text size</span></button>{textOpen&&<div className="textScalePopover" id="text-size-popover"><div className="textScaleTop"><b>Text size</b><span>{textScale}%</span></div><div className="textScaleSlider"><span>A−</span><input aria-label="Text size percentage" type="range" min="100" max="200" step="25" value={textScale} onChange={e=>onTextScale(Number(e.target.value))}/><span>A+</span></div><div className="textScaleStops">{TEXT_STEPS.map(step=><button type="button" className={textScale===step?'on':''} onClick={()=>onTextScale(step)} key={step}>{step}%</button>)}</div><button type="button" className="textReset" onClick={()=>onTextScale(100)}>Reset</button></div>}</div><button type="button" className="displayButton themeButton" aria-label={`Switch to ${theme==='dark'?'light':'dark'} mode`} onClick={onToggleTheme}><span aria-hidden="true">{theme==='dark'?'☀︎':'☾'}</span></button></div>;
}

function SmartPhoneField({values,setValue,register,error}){
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState('');
  const wrapRef=useRef(null);
  const selected=getPhoneCountry(values.country);
  const filtered=phoneCountries.filter(item=>`${item.name} ${item.dial}`.toLowerCase().includes(query.toLowerCase())).slice(0,80);

  useEffect(()=>{
    function outside(event){if(wrapRef.current&&!wrapRef.current.contains(event.target))setOpen(false);}
    function key(event){if(event.key==='Escape')setOpen(false);}
    document.addEventListener('mousedown',outside);
    document.addEventListener('keydown',key);
    return()=>{document.removeEventListener('mousedown',outside);document.removeEventListener('keydown',key);};
  },[]);

  function choose(meta){
    setValue('country',meta.name,{shouldDirty:true,shouldTouch:true,shouldValidate:true});
    setValue('phone_country_code',meta.dial,{shouldDirty:true,shouldTouch:true,shouldValidate:true});
    setValue('phone',normalizeNationalPhone(values.phone,meta.name),{shouldDirty:true,shouldTouch:true,shouldValidate:true});
    setOpen(false);
    setQuery('');
  }

  function changePhone(event){
    const clean=normalizeNationalPhone(event.target.value,values.country);
    setValue('phone',clean,{shouldDirty:true,shouldTouch:true,shouldValidate:true});
  }

  return <div className="field phoneField"><label htmlFor="phone">Mobile number *</label><div className="smartPhone" ref={wrapRef}><button type="button" className="countryComboTrigger" aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><span className="flagEmoji" aria-hidden="true">{selected.flag}</span><strong>{selected.dial}</strong><span className="comboChevron" aria-hidden="true">⌄</span></button><div className="inputWrap phoneNumber"><span className="fieldIcon"><UiIcon name="phone" size={17}/></span><input id="phone" type="tel" autoComplete="tel-national" inputMode="numeric" pattern="[0-9]*" maxLength={selected.code==='IN'?10:15} value={values.phone||''} placeholder={selected.code==='IN'?'9876543210':'Phone number'} onChange={changePhone}/></div>{open&&<div className="countryComboPopover"><div className="countrySearch"><UiIcon name="search" size={15}/><input autoFocus aria-label="Search country or dial code" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search country or code"/></div><div className="countryOptions" role="listbox" aria-label="Country calling codes">{filtered.map(item=><button type="button" role="option" aria-selected={item.code===selected.code} className={item.code===selected.code?'countryOption selected':'countryOption'} onClick={()=>choose(item)} key={item.code}><span className="flagEmoji" aria-hidden="true">{item.flag}</span><span>{item.name}</span><strong>{item.dial}</strong>{item.code===selected.code&&<UiIcon name="check" size={14}/>}</button>)}</div></div>}</div><input type="hidden" {...register('phone')}/><input type="hidden" {...register('phone_country_code')}/><input type="hidden" {...register('country')}/><FieldError message={error}/>{selected.code==='IN'&&<small className="phoneHint">10-digit Indian mobile number</small>}</div>;
}

function SuccessScreen({success,theme,textScale}){
  return <main className="paymentSuccessPage" data-theme={theme} data-text-scale={textScale} style={{fontSize:`${textScale}%`}}>
    <div className="successContent" aria-live="polite">
      <small>weareailabs</small>
      <h1>{success.existing?'Application already on file':'Application received'}</h1>
      <p className="successLead">{success.existing?'We found an existing registration for this email. Contact the team if you need to update it.':'Your application has been saved for the workshop team to review.'} No payment has been taken by this form, and this acknowledgement does not confirm a workshop place.</p>
      <div className="successMeta">
        <div><span>Attendee</span><b>{success.full_name}</b></div>
        {success.email&&<div><span>Application email</span><b style={{overflowWrap:'anywhere'}}>{success.email}</b></div>}
        <div><span>Workshop</span><b>Mumbai · dates and venue to be confirmed</b></div>
        <div><span>Application reference</span><b style={{overflowWrap:'anywhere'}}>{success.reference}</b></div>
      </div>
      <h2>What happens next?</h2>
      <p>The workshop team will review your application and contact you using your supplied details about the next steps, workshop schedule and participation decision. No response date has been announced.</p>
      <p>The workshop fee is ₹25,000 per participant. If your application is selected, the team will share payment and refund details separately. No payment has been taken here.</p>
      <p>Please do not submit another application. To correct or update your answers, contact <a href="mailto:connect@weareailabs.com">connect@weareailabs.com</a> and include your application reference.</p>
      <a href="/" className="successReturn">Return to weareailabs →</a>
      <p><a href="/privacy">Privacy policy</a></p>
    </div>
  </main>;
}

export default function RegistrationCheckoutV3(){
  const [options,setOptions]=useState([]);
  const [optionsError,setOptionsError]=useState('');
  const [apiError,setApiError]=useState('');
  const [saveState,setSaveState]=useState('Saved locally');
  const [draftReady,setDraftReady]=useState(false);
  const [unlockedModule,setUnlockedModule]=useState(1);
  const [reviewOpen,setReviewOpen]=useState(false);
  const [success,setSuccess]=useState(null);
  const [theme,setTheme]=useState('light');
  const [textScale,setTextScale]=useState(100);
  const [textOpen,setTextOpen]=useState(false);
  const saveTimer=useRef(null);

  const {register,handleSubmit,trigger,watch,reset,setValue,setError,clearErrors,formState:{errors,isSubmitting}}=useForm({resolver:zodResolver(attendeeSchema),defaultValues:attendeeDefaultValues,mode:'onTouched'});
  const values=watch();
  const currentTools=watch('ai_tools')||[];
  const currentMvp=watch('mvp_preferences')||[];
  const currentSources=watch('data_sources')||[];
  const profileReady=attendeeProfileSchema.safeParse({full_name:values.full_name,email:values.email,phone_country_code:values.phone_country_code,phone:values.phone,city:values.city,country:values.country,career_role:values.career_role,company_organisation:values.company_organisation,industry:values.industry,years_experience:values.years_experience,functional_area:values.functional_area,age_band:values.age_band,current_title:values.current_title,preferred_contact_method:values.preferred_contact_method}).success;
  const readinessReady=attendeeAiReadinessSchema.safeParse({ai_experience_level:values.ai_experience_level,ai_tools:currentTools,other_ai_tool:values.other_ai_tool}).success;
  const buildReady=attendeeBuildSchema.safeParse({mvp_preferences:currentMvp,other_mvp_idea:values.other_mvp_idea,business_problem:values.business_problem,target_user:values.target_user,data_sources:currentSources,success_outcome:values.success_outcome,success_detail:values.success_detail,attendance_availability:values.attendance_availability,representative_data_permission:values.representative_data_permission,participation_support:values.participation_support,heard_about:values.heard_about}).success;

  useEffect(()=>{if(profileReady)setUnlockedModule(c=>Math.max(c,2));},[profileReady]);
  useEffect(()=>{if(profileReady&&readinessReady)setUnlockedModule(c=>Math.max(c,3));},[profileReady,readinessReady]);
  useEffect(()=>{try{const savedTheme=localStorage.getItem(THEME_KEY);const systemDark=window.matchMedia?.('(prefers-color-scheme: dark)').matches;setTheme(savedTheme==='dark'||savedTheme==='light'?savedTheme:(systemDark?'dark':'light'));const storedScale=Number(localStorage.getItem(TEXT_SCALE_KEY));if(TEXT_STEPS.includes(storedScale))setTextScale(storedScale);}catch{}},[]);
  useEffect(()=>{try{LEGACY_DRAFT_KEYS.forEach(key=>localStorage.removeItem(key));const raw=localStorage.getItem(DRAFT_KEY);if(raw){const saved=JSON.parse(raw);if([5,6,DRAFT_VERSION].includes(saved?.version)&&saved?.data){const legacyRoles={'CXO / Executive':'CXO / executive','Founder / Co-founder':'Founder / business owner','Senior Professional':'Senior manager / business leader','Entrepreneur':'Founder / business owner'};const legacyAi={'Beginner':'No hands-on experience','Intermediate':'I use AI occasionally','Advanced':'I use AI regularly','Expert':'Advanced / specialist'};reset({...attendeeDefaultValues,...saved.data,career_role:legacyRoles[saved.data.career_role]||saved.data.career_role,ai_experience_level:legacyAi[saved.data.ai_experience_level]||saved.data.ai_experience_level,consent:false});setSaveState('Draft restored');}else localStorage.removeItem(DRAFT_KEY);}}catch{try{localStorage.removeItem(DRAFT_KEY)}catch{}}setDraftReady(true);},[reset]);
  useEffect(()=>{if(!draftReady||success)return;const subscription=watch(data=>{if(saveTimer.current)clearTimeout(saveTimer.current);setSaveState('Saving…');saveTimer.current=setTimeout(()=>{try{localStorage.setItem(DRAFT_KEY,JSON.stringify({version:DRAFT_VERSION,data:{...data,consent:false}}));setSaveState('Auto-saved just now');}catch{setSaveState('Save failed — draft will be lost on refresh');}},500);});return()=>{subscription.unsubscribe();if(saveTimer.current)clearTimeout(saveTimer.current);};},[draftReady,watch,success]);
  useEffect(()=>{let active=true;fetch(API+'/attendee-options').then(async r=>{if(!r.ok)throw new Error();return r.json();}).then(d=>{if(active)setOptions(d.options||[]);}).catch(()=>{if(active)setOptionsError('We could not load the build choices. Refresh the page and try again.');});return()=>{active=false};},[]);

  function clearDraft(){
    if(!window.confirm('Clear your registration answers saved on this device? This does not delete any application already sent to the team.'))return;
    reset(attendeeDefaultValues);if(saveTimer.current)clearTimeout(saveTimer.current);
    try{localStorage.removeItem(DRAFT_KEY);LEGACY_DRAFT_KEYS.forEach(k=>localStorage.removeItem(k));setSaveState('Draft cleared');}catch{setSaveState('Could not clear device storage');}
    setUnlockedModule(1);setReviewOpen(false);setApiError('');
  }
  function addTool(event){const tool=event.target.value;if(!tool||currentTools.includes(tool))return;setValue('ai_tools',[...currentTools,tool],{shouldDirty:true,shouldTouch:true,shouldValidate:true});clearErrors('ai_tools');}
  function removeTool(tool){setValue('ai_tools',currentTools.filter(item=>item!==tool),{shouldDirty:true,shouldTouch:true,shouldValidate:true});if(tool==='Other')setValue('other_ai_tool','',{shouldDirty:true,shouldValidate:true});}
  function toggleMvp(slug){if(currentMvp.includes(slug)){setValue('mvp_preferences',currentMvp.filter(item=>item!==slug),{shouldDirty:true,shouldTouch:true,shouldValidate:true});if(slug==='something-else')setValue('other_mvp_idea','',{shouldDirty:true,shouldValidate:true});clearErrors('mvp_preferences');return;}if(currentMvp.length>=2){setError('mvp_preferences',{type:'manual',message:'Choose one primary area and at most one backup'});return;}setValue('mvp_preferences',[...currentMvp,slug],{shouldDirty:true,shouldTouch:true,shouldValidate:true});clearErrors('mvp_preferences');}
  function toggleDataSource(source){const next=source==='Not sure yet'?['Not sure yet']:(currentSources.includes(source)?currentSources.filter(x=>x!==source):[...currentSources.filter(x=>x!=='Not sure yet'),source]);setValue('data_sources',next,{shouldDirty:true,shouldTouch:true,shouldValidate:true});}
  function changeTheme(){setTheme(t=>{const next=t==='dark'?'light':'dark';try{localStorage.setItem(THEME_KEY,next)}catch{}return next;});}
  function changeTextScale(next){setTextScale(next);try{localStorage.setItem(TEXT_SCALE_KEY,String(next))}catch{}}
  function scrollTo(id){setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}),40);}

  async function openReview(){setApiError('');const fields=[...attendeeModuleFields.profile,...attendeeModuleFields.readiness,...attendeeModuleFields.build.filter(x=>x!=='consent')];const valid=await trigger(fields,{shouldFocus:true});if(!valid||!profileReady||!readinessReady||!buildReady){setUnlockedModule(3);setApiError('Please complete the highlighted fields before reviewing your application.');return;}setReviewOpen(true);scrollTo('review-application');}
  function editModule(id){setReviewOpen(false);scrollTo(id);}

  async function confirmApplication(data){
    setApiError('');
    try{
      const acknowledgement=await submitAttendeeApplication(data,{endpoint:API});
      if(saveTimer.current)clearTimeout(saveTimer.current);
      try{localStorage.removeItem(DRAFT_KEY)}catch{}
      setSuccess(acknowledgement);
    }catch(error){setApiError(error instanceof Error?error.message:'Could not submit your application');}
  }

  function handleInvalid(){setApiError('Please complete the highlighted fields before continuing.');}
  function optionTitle(slug){return options.find(option=>option.slug===slug)?.title||slug;}
  if(success)return <SuccessScreen success={success} theme={theme} textScale={textScale}/>;

  return <main className="regShell onePageRegistration registrationCheckout" data-theme={theme} data-text-scale={textScale} style={{fontSize:`${textScale}%`}}><div className="regFrame onePageFrame"><aside className="regRail"><a href="/" className="regBrand"><AILabMark/></a><h2>From Ideas to<br/>Real Impact</h2><p>A hands-on workshop for CXOs, founders and business leaders.</p><div className="benefits"><div><i><UiIcon name="people"/></i><span>Build <b>Real AI MVPs</b><small>in two days</small></span></div><div><i><UiIcon name="bulb"/></i><span>Learn from<br/>experts & peers</span></div><div><i><UiIcon name="network"/></i><span>Expand<br/>your network</span></div><div><i><UiIcon name="rocket"/></i><span>Leave with a<br/>90-day action plan</span></div></div><div className="event"><b><UiIcon name="calendar" size={24}/></b><span>Dates to be confirmed<small>Mumbai · venue to be confirmed</small></span></div><div className="railArt"><strong>Build<br/>What’s Next</strong></div></aside>

      <section className="regMain onePageMain"><p><a href="/privacy" target="_blank" rel="noopener noreferrer">How we use your information (opens in a new tab)</a></p><p role="note">Two-day Mumbai workshop · <strong>Fee: ₹25,000 per participant.</strong> Dates and venue are coming soon. Applying does not confirm a place and no payment is taken here; payment and refund details will be shared separately.</p><button type="button" className="reg-clear-draft" disabled={isSubmitting} onClick={clearDraft}>Clear saved draft</button><div className="moduleTrail moduleTrailFour" aria-label="Registration sections"><span className="active">01 About You</span><span className={unlockedModule>=2?'active':''}>02 AI Readiness</span><span className={unlockedModule>=3?'active':''}>03 What You’ll Build</span><span className={reviewOpen?'active':''}>04 Review</span></div>
        <form className="regCard onePageCard" onSubmit={handleSubmit(confirmApplication,handleInvalid)} noValidate><div className="formHead onePageHead checkoutHead compactCheckoutHead"><div className="checkoutTitleBlock"><h1 className="registrationTitle">ATTENDEE APPLICATION</h1><p>Complete the sections below and submit your application for review.</p></div><div className="headerUtilities"><DisplayControls theme={theme} onToggleTheme={changeTheme} textScale={textScale} onTextScale={changeTextScale} textOpen={textOpen} setTextOpen={setTextOpen}/><div className="time"><UiIcon name="clock" size={21}/><span>Takes about<br/><b>5 minutes</b></span></div></div></div>

          <section className="formModule profileModule" id="module-about"><ModuleHeader number="01" title="About You" subtitle="Your contact and professional profile." complete={profileReady}/><div className="moduleBody"><div className="two"><div className="field"><label htmlFor="full_name">Full Name *</label><div className="inputWrap"><span className="fieldIcon"><UiIcon name="user" size={17}/></span><input id="full_name" autoComplete="name" maxLength={120} placeholder="Enter your full name" {...register('full_name')}/></div><FieldError message={errors.full_name?.message}/></div><div className="field"><label htmlFor="email">Email Address *</label><div className="inputWrap"><span className="fieldIcon"><UiIcon name="mail" size={17}/></span><input id="email" type="email" autoComplete="email" maxLength={254} placeholder="name@company.com" {...register('email')}/></div><FieldError message={errors.email?.message}/></div></div><div className="phoneCityRow"><SmartPhoneField values={values} setValue={setValue} register={register} error={errors.country?.message||errors.phone_country_code?.message||errors.phone?.message}/><div className="field cityField"><label htmlFor="city">City *</label><div className="inputWrap"><span className="fieldIcon"><UiIcon name="pin" size={17}/></span><input id="city" autoComplete="address-level2" maxLength={120} placeholder="Mumbai" {...register('city')}/></div><FieldError message={errors.city?.message}/></div></div><div className="field attendeeContactMethod"><label htmlFor="preferred_contact_method">How should we contact you about your application? *</label><select id="preferred_contact_method" {...register('preferred_contact_method')}><option value="">Choose preferred method</option>{contactMethods.map(method=><option key={method} value={method}>{method}</option>)}</select><FieldError message={errors.preferred_contact_method?.message}/><small>We will use your details for application updates, not marketing. WhatsApp is optional.</small></div><div className="profileRow profileRowPrimary"><div className="field"><label htmlFor="career_role">Current Role *</label><select id="career_role" {...register('career_role')}><option value="">Select role</option>{roles.map(role=><option key={role} value={role}>{role}</option>)}</select><FieldError message={errors.career_role?.message}/></div><div className="field"><label htmlFor="company">Company / Organisation *</label><div className="inputWrap"><span className="fieldIcon"><UiIcon name="building" size={17}/></span><input id="company" autoComplete="organization" maxLength={160} placeholder="Enter company name" {...register('company_organisation')}/></div><button type="button" className="independentShortcut" onClick={()=>setValue('company_organisation','Independent / Not applicable',{shouldDirty:true,shouldTouch:true,shouldValidate:true})}>I am independent / not affiliated with an organisation</button><FieldError message={errors.company_organisation?.message}/></div><div className="field"><label htmlFor="industry">Industry *</label><select id="industry" {...register('industry')}><option value="">Select industry</option>{industries.map(item=><option key={item} value={item}>{item}</option>)}</select><FieldError message={errors.industry?.message}/></div></div><div className="profileRow profileRowSecondary"><div className="field"><label htmlFor="experience">Total professional experience *</label><select id="experience" {...register('years_experience')}><option value="">Select range</option>{experienceRanges.map(item=><option key={item} value={item}>{item}</option>)}</select><FieldError message={errors.years_experience?.message}/></div><div className="field"><label htmlFor="function">Primary Function *</label><select id="function" {...register('functional_area')}><option value="">Select function</option>{functionalAreas.map(item=><option key={item} value={item}>{item}</option>)}</select><FieldError message={errors.functional_area?.message}/></div><div className="field"><label htmlFor="current_title">Designation <span>(optional)</span></label><input id="current_title" maxLength={100} placeholder="Your current title" {...register('current_title')}/><FieldError message={errors.current_title?.message}/></div></div></div></section>

          <section className={`formModule readinessModule ${unlockedModule<2?'isLocked':''}`} id="module-readiness"><ModuleHeader number="02" title="Your AI Readiness" subtitle="A quick snapshot of where you are today." locked={unlockedModule<2} complete={unlockedModule>=2&&readinessReady}/>{unlockedModule>=2&&<div className="moduleBody revealBody"><fieldset className="aiLevelField"><legend>AI Experience *</legend><div className="aiLevelGroup">{aiLevels.map(level=><button type="button" className={values.ai_experience_level===level?'on':''} aria-pressed={values.ai_experience_level===level} onClick={()=>setValue('ai_experience_level',level,{shouldDirty:true,shouldTouch:true,shouldValidate:true})} key={level}><span className="aiLevelLabel">{level}</span><small className="aiLevelExample">{aiLevelExamples[level]}</small></button>)}</div><FieldError message={errors.ai_experience_level?.message}/></fieldset><div className="toolField"><label htmlFor="toolPicker">AI tools you use <span>Optional</span></label><div className="toolPickerRow"><div className="selectedTools" aria-live="polite">{currentTools.length?currentTools.map(tool=><button type="button" className="toolChip" onClick={()=>removeTool(tool)} aria-label={`Remove ${tool}`} key={tool}>{tool}<span>×</span></button>):<span className="emptyTools">No tools selected yet</span>}</div><select id="toolPicker" value="" onChange={addTool}><option value="">+ Add AI tool</option>{aiTools.filter(tool=>!currentTools.includes(tool)).map(tool=><option key={tool} value={tool}>{tool}</option>)}</select></div><FieldError message={errors.ai_tools?.message}/></div>{currentTools.includes('Other')&&<div className="field compactReveal"><label htmlFor="other_ai_tool">Other AI tool *</label><input id="other_ai_tool" maxLength={120} placeholder="Enter the tool name" {...register('other_ai_tool')}/><FieldError message={errors.other_ai_tool?.message}/></div>}</div>}</section>

          <section className={`formModule buildModule ${unlockedModule<3?'isLocked':''}`} id="module-build"><ModuleHeader number="03" title="What Would You Like to Build?" subtitle="Choose one primary business area and an optional backup. These cards are examples, not fixed solutions." locked={unlockedModule<3} complete={unlockedModule>=3&&buildReady}/>{unlockedModule>=3&&<div className="moduleBody revealBody"><div className="buildToolbar"><span><UiIcon name="sparkle" size={16}/> Choose the area in which you want to improve a process</span><b>{currentMvp.length} / 2 selected</b></div>{optionsError&&<p className="regError" role="alert">{optionsError}</p>}{!optionsError&&options.length===0&&<div className="buildLoading">Loading build choices…</div>}<div className="onePageMvpGrid">{options.map(option=>{const selectedIndex=currentMvp.indexOf(option.slug);const selected=selectedIndex!==-1;return <button type="button" className={selected?'buildChoice on':'buildChoice'} aria-pressed={selected} onClick={()=>toggleMvp(option.slug)} key={option.slug}><span className="choiceTop"><b>{option.title}</b>{selected&&<i>{selectedIndex===0?'Primary area':'Backup area'}</i>}</span><span className="choiceDescription">{option.description}</span><span className="choiceCheck">{selected?'✓':'+'}</span></button>;})}</div><FieldError message={errors.mvp_preferences?.message}/>{currentMvp.includes('something-else')&&<div className="field ideaField"><label htmlFor="other_mvp">Tell us what you would like to build *</label><textarea id="other_mvp" maxLength={300} placeholder="Describe the idea briefly…" {...register('other_mvp_idea')}/><FieldError message={errors.other_mvp_idea?.message}/></div>}<div className="attendeeProblemGroup">
  <h3>Tell us about the problem</h3><p>No coding knowledge or company files are needed. Describe your current work in plain language.</p>
  <div className="field"><label htmlFor="business_problem">What problem or workflow would you like to improve? *</label><textarea id="business_problem" rows={4} maxLength={700} placeholder="For example: Our team manually reads invoices and enters details into Excel." {...register('business_problem')}/><FieldError message={errors.business_problem?.message}/></div>
  <div className="attendeeProblemRow">
    <div className="field"><label htmlFor="target_user">Who would use the solution? *</label><select id="target_user" {...register('target_user')}><option value="">Choose one</option>{targetUsers.map(u=><option key={u} value={u}>{u}</option>)}</select><FieldError message={errors.target_user?.message}/></div>
    <div className="field"><label htmlFor="success_outcome">What outcome matters most? *</label><select id="success_outcome" {...register('success_outcome')}><option value="">Choose an outcome</option>{successOutcomes.map(u=><option key={u} value={u}>{u}</option>)}</select><FieldError message={errors.success_outcome?.message}/></div>
  </div>
  <fieldset className="attendeeSources"><legend>What information or systems might be needed? *</legend><p>Select any that apply, or Not sure yet. Please do not upload confidential information.</p><div className="attendeeChoiceRow">{dataSources.map(source=><label key={source}><input type="checkbox" checked={currentSources.includes(source)} onChange={()=>toggleDataSource(source)}/><span>{source}</span></label>)}</div><FieldError message={errors.data_sources?.message}/></fieldset>
  <div className="field"><label htmlFor="success_detail">Anything else about your desired result? <span>(optional)</span></label><textarea id="success_detail" rows={2} maxLength={300} placeholder="For example: Reduce weekly invoice processing from four hours to one." {...register('success_detail')}/><FieldError message={errors.success_detail?.message}/></div>
  <div className="field"><label htmlFor="attendance_availability">Can you attend a two-day in-person workshop in Mumbai? *</label><select id="attendance_availability" {...register('attendance_availability')}><option value="">Select availability</option>{attendanceOptions.map(u=><option key={u} value={u}>{u}</option>)}</select><FieldError message={errors.attendance_availability?.message}/><small>Dates and venue will be confirmed before final selection.</small></div>
</div><div className="field"><label htmlFor="representative_data_permission">What data could you use during the workshop? *</label><select id="representative_data_permission" {...register('representative_data_permission')}><option value="">Select an option</option>{representativeDataOptions.map(u=><option key={u} value={u}>{u}</option>)}</select><FieldError message={errors.representative_data_permission?.message}/><small>Never upload confidential or personal business data to this application.</small></div>
  <div className="field"><label htmlFor="participation_support">Would any participation support help? <span>(optional)</span></label><textarea id="participation_support" rows={2} maxLength={300} placeholder="For example, seating or access arrangements. Please avoid medical details." {...register('participation_support')}/><FieldError message={errors.participation_support?.message}/></div>
  <div className="field"><label htmlFor="heard_about">How did you hear about us? <span>(optional)</span></label><select id="heard_about" {...register('heard_about')}><option value="">Prefer not to say</option>{discoverySources.map(u=><option key={u} value={u}>{u}</option>)}</select><FieldError message={errors.heard_about?.message}/></div>
  <div className="reviewLaunch"><button type="button" className="reviewButton" onClick={openReview}>Review Application <span>→</span></button>{apiError&&!reviewOpen&&<p className="regError" role="alert">{apiError}</p>}</div></div>}</section>

          {reviewOpen&&<section className="reviewApplication" id="review-application"><div className="reviewHeader"><div><span className="reviewEyebrow">REVIEW BEFORE SUBMITTING</span><h2>Review your application</h2><p>Check everything below. You can edit any section before continuing.</p></div><span className="reviewReady"><UiIcon name="check" size={15}/> Ready to submit</span></div><div className="reviewGrid"><article><div className="reviewCardHead"><b>About You</b>{<button type="button" onClick={()=>editModule('module-about')}><UiIcon name="edit" size={13}/> Edit</button>}</div><dl><div><dt>Name</dt><dd>{values.full_name}</dd></div><div><dt>Email</dt><dd>{values.email}</dd></div><div><dt>Phone</dt><dd>{getPhoneCountry(values.country).flag} {values.phone_country_code} {values.phone}</dd></div><div><dt>Preferred contact</dt><dd>{values.preferred_contact_method}</dd></div><div><dt>Location</dt><dd>{values.city}, {values.country}</dd></div><div><dt>Role</dt><dd>{values.career_role}</dd></div><div><dt>Company</dt><dd>{values.company_organisation}</dd></div><div><dt>Industry</dt><dd>{values.industry}</dd></div><div><dt>Total experience</dt><dd>{values.years_experience}</dd></div><div><dt>Primary Function</dt><dd>{values.functional_area}</dd></div>{values.current_title&&<div><dt>Designation</dt><dd>{values.current_title}</dd></div>}</dl></article><article><div className="reviewCardHead"><b>AI Readiness</b>{<button type="button" onClick={()=>editModule('module-readiness')}><UiIcon name="edit" size={13}/> Edit</button>}</div><dl><div><dt>AI Experience</dt><dd>{values.ai_experience_level}</dd></div><div><dt>Tools used</dt><dd>{currentTools.length?currentTools.join(', '):'None selected'}</dd></div>{currentTools.includes('Other')&&<div><dt>Other tool</dt><dd>{values.other_ai_tool}</dd></div>}</dl></article><article><div className="reviewCardHead"><b>What You’ll Build</b>{<button type="button" onClick={()=>editModule('module-build')}><UiIcon name="edit" size={13}/> Edit</button>}</div><dl>{currentMvp.map((slug,index)=><div key={slug}><dt>Preference {index+1}</dt><dd>{optionTitle(slug)}</dd></div>)}{currentMvp.includes('something-else')&&<div><dt>Your idea</dt><dd>{values.other_mvp_idea}</dd></div>}<div><dt>Business problem</dt><dd>{values.business_problem}</dd></div><div><dt>Target user</dt><dd>{values.target_user}</dd></div><div><dt>Information sources</dt><dd>{currentSources.join(', ')}</dd></div><div><dt>Success outcome</dt><dd>{values.success_outcome}</dd></div>{values.success_detail&&<div><dt>Extra context</dt><dd>{values.success_detail}</dd></div>}<div><dt>Two-day availability</dt><dd>{values.attendance_availability}</dd></div><div><dt>Representative data</dt><dd>{values.representative_data_permission}</dd></div>{values.participation_support&&<div><dt>Participation support</dt><dd>{values.participation_support}</dd></div>}{values.heard_about&&<div><dt>How they heard</dt><dd>{values.heard_about}</dd></div>}</dl></article></div>{<div className="reviewConfirm"><label className="consent"><input type="checkbox" {...register('consent')}/><span>I agree to eliv8Lyf using my information to review my weareailabs application and coordinate workshop participation. This does not sign me up for marketing.</span></label><p><a href="/privacy" target="_blank" rel="noopener noreferrer">Read the privacy policy (opens in a new tab)</a></p><FieldError message={errors.consent?.message}/>{apiError&&<p className="regError" role="alert">{apiError}</p>}<button type="submit" className="completeButton" disabled={isSubmitting}>{isSubmitting?'Submitting…':'Submit application'}<span>→</span></button></div>}</section>}



          <div className="trust onePageTrust"><span className="shield"><UiIcon name="shield" size={25}/></span><span><b>Your application information</b><small>Used for application review and workshop coordination.</small></span><span className="cloud"><UiIcon name="cloud" size={25}/></span><span><b>{saveState}</b><small>Your unfinished draft stays on this device.</small></span></div>
        </form></section><footer className="regFooter"><b><AILabMark small/></b><p><a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy policy (opens in a new tab)</a> · <a href="mailto:connect@weareailabs.com">Contact eliv8Lyf</a></p><SocialLinks/></footer></div></main>;
}
