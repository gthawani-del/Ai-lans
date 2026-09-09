'use client';

import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {
  AlertCircle,ArrowUpRight,Bell,CalendarDays,ChevronDown,ChevronRight,CircleDollarSign,
  ClipboardList,Database,Download,FileClock,Gauge,LayoutDashboard,LogOut,Minus,Moon,
  Plus,RefreshCw,Search,Settings2,Sun,Table2,Users,UserRoundCheck,WalletCards,X
} from 'lucide-react';
import {
  Bar,BarChart,CartesianGrid,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis
} from 'recharts';
import {format,subDays} from 'date-fns';
import {getSupabaseBrowserClient,SUPABASE_PUBLISHABLE_KEY,SUPABASE_URL} from '../../lib/supabase-browser';

const API=`${SUPABASE_URL}/functions/v1/attendee-dashboard-stats`;
const SEARCH_API=`${SUPABASE_URL}/functions/v1/backoffice-global-search`;
const ranges=[['7D','7d'],['30D','30d'],['All','all']];
const scales=[100,125,150,175,200];

function toInputDate(date){return format(date,'yyyy-MM-dd')}
function prettyDate(date){return format(new Date(`${date}T00:00:00`),'d MMM')}
function clampScale(value){return scales.reduce((best,n)=>Math.abs(n-value)<Math.abs(best-value)?n:best,100)}

function SidebarItem({icon:Icon,label,active=false,disabled=false}){
  return <div className={`boNavItem ${active?'active':''} ${disabled?'disabled':''}`} aria-disabled={disabled||undefined}><Icon size={16}/><span>{label}</span>{disabled&&<small>Soon</small>}</div>;
}

function StatCard({label,value,meta,icon:Icon,attention=false}){
  return <article className={`boStat ${attention?'attention':''}`}><div><span>{label}</span><strong>{value}</strong>{meta&&<small>{meta}</small>}</div><i><Icon size={18}/></i></article>;
}

function EmptyChart({children}){return <div className="boChartEmpty">{children}</div>}

export default function Backoffice(){
  const router=useRouter();
  const supabase=getSupabaseBrowserClient();
  const searchRef=useRef(null);
  const [session,setSession]=useState(null);
  const [profile,setProfile]=useState(null);
  const [loadingAuth,setLoadingAuth]=useState(true);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [data,setData]=useState(null);
  const [range,setRange]=useState('30d');
  const [customFrom,setCustomFrom]=useState(toInputDate(subDays(new Date(),29)));
  const [customTo,setCustomTo]=useState(toInputDate(new Date()));
  const [showCustom,setShowCustom]=useState(false);
  const [selectedWorkshop,setSelectedWorkshop]=useState('ai-lab-mumbai-2026');
  const [dateBasis,setDateBasis]=useState('registration');
  const [theme,setTheme]=useState('light');
  const [textScale,setTextScale]=useState(100);
  const [density,setDensity]=useState('compact');
  const [showNotifications,setShowNotifications]=useState(false);
  const [showProfile,setShowProfile]=useState(false);
  const [query,setQuery]=useState('');
  const [searchResults,setSearchResults]=useState([]);
  const [searching,setSearching]=useState(false);
  const [searchOpen,setSearchOpen]=useState(false);
  const [selectedPerson,setSelectedPerson]=useState(null);

  useEffect(()=>{
    let mounted=true;
    async function boot(){
      const {data:sessionData}=await supabase.auth.getSession();
      if(!mounted)return;
      if(!sessionData.session){router.replace('/backoffice/login');return;}
      const userId=sessionData.session.user.id;
      const [{data:admin},{data:prefs}]=await Promise.all([
        supabase.from('backoffice_users').select('email,role,is_active').eq('user_id',userId).maybeSingle(),
        supabase.from('backoffice_user_preferences').select('theme,text_scale,density,selected_workshop_key,default_date_range,date_basis').eq('user_id',userId).maybeSingle()
      ]);
      if(!admin?.is_active){await supabase.auth.signOut();router.replace('/backoffice/login');return;}
      if(prefs){
        setTheme(prefs.theme||'light');
        setTextScale(clampScale(Number(prefs.text_scale)||100));
        setDensity(prefs.density||'compact');
        setSelectedWorkshop(prefs.selected_workshop_key||'ai-lab-mumbai-2026');
        setRange(prefs.default_date_range==='event'?'30d':(prefs.default_date_range||'30d'));
        setDateBasis(prefs.date_basis||'registration');
      }
      setProfile(admin);
      setSession(sessionData.session);
      setLoadingAuth(false);
    }
    boot();
    const {data:listener}=supabase.auth.onAuthStateChange((_event,next)=>{
      if(!next)router.replace('/backoffice/login');
      else setSession(next);
    });
    return()=>{mounted=false;listener.subscription.unsubscribe()};
  },[router,supabase]);

  useEffect(()=>{
    function onKey(event){
      if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){
        event.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
      if(event.key==='Escape'){setSearchOpen(false);setShowNotifications(false);setShowProfile(false);}
    }
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[]);

  const resolvedRange=useMemo(()=>{
    if(showCustom)return{from:customFrom,to:customTo,label:`${prettyDate(customFrom)} – ${prettyDate(customTo)}`};
    if(range==='all')return{from:null,to:null,label:'All time'};
    const days=range==='7d'?7:30;
    return{from:toInputDate(subDays(new Date(),days-1)),to:toInputDate(new Date()),label:range==='7d'?'Last 7 days':'Last 30 days'};
  },[range,showCustom,customFrom,customTo]);

  const savePreferences=useCallback(async(patch)=>{
    if(!session)return;
    await supabase.from('backoffice_user_preferences').update({...patch,updated_at:new Date().toISOString()}).eq('user_id',session.user.id);
  },[session,supabase]);

  const loadDashboard=useCallback(async()=>{
    if(!session)return;
    setLoading(true);setError('');
    try{
      const params=new URLSearchParams({workshop_key:selectedWorkshop,date_basis:dateBasis});
      if(resolvedRange.from)params.set('from',resolvedRange.from);
      if(resolvedRange.to)params.set('to',resolvedRange.to);
      const response=await fetch(`${API}?${params.toString()}`,{headers:{Authorization:`Bearer ${session.access_token}`,apikey:SUPABASE_PUBLISHABLE_KEY}});
      if(response.status===401||response.status===403){await supabase.auth.signOut();router.replace('/backoffice/login');return;}
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||'Could not load dashboard.');
      setData(result);
    }catch(err){setError(err instanceof Error?err.message:'Could not load dashboard.');}
    finally{setLoading(false)}
  },[session,resolvedRange,selectedWorkshop,dateBasis,router,supabase]);

  useEffect(()=>{loadDashboard()},[loadDashboard]);

  useEffect(()=>{
    if(!session||query.trim().length<2){setSearchResults([]);setSearching(false);return;}
    let cancelled=false;
    setSearching(true);
    const timer=setTimeout(async()=>{
      try{
        const params=new URLSearchParams({q:query.trim(),workshop_key:selectedWorkshop});
        const response=await fetch(`${SEARCH_API}?${params.toString()}`,{headers:{Authorization:`Bearer ${session.access_token}`,apikey:SUPABASE_PUBLISHABLE_KEY}});
        const result=await response.json().catch(()=>({results:[]}));
        if(!cancelled)setSearchResults(response.ok?(result.results||[]):[]);
      }finally{if(!cancelled)setSearching(false)}
    },250);
    return()=>{cancelled=true;clearTimeout(timer)};
  },[query,session,selectedWorkshop]);

  async function signOut(){await supabase.auth.signOut();router.replace('/backoffice/login')}
  function chooseRange(value){setRange(value);setShowCustom(false);savePreferences({default_date_range:value})}
  function changeWorkshop(value){setSelectedWorkshop(value);savePreferences({selected_workshop_key:value})}
  function changeDateBasis(value){setDateBasis(value);savePreferences({date_basis:value})}
  function toggleTheme(){const next=theme==='dark'?'light':'dark';setTheme(next);savePreferences({theme:next})}
  function changeScale(value){const next=clampScale(Number(value));setTextScale(next);savePreferences({text_scale:next})}
  function stepScale(direction){const i=scales.indexOf(textScale);const next=scales[Math.max(0,Math.min(scales.length-1,i+direction))];changeScale(next)}
  function changeDensity(value){setDensity(value);savePreferences({density:value})}

  function exportDashboard(){
    const rows=[['Scope',resolvedRange.label],['Date basis',dateBasis],['Cohort',data?.workshop?.name||selectedWorkshop],['Applications',counts.applications||0],['Paid / Confirmed',counts.confirmed||0],['Payment Pending',counts.payment_pending||0],['Tables Required',counts.tables_required||0],['Volunteers Required',counts.volunteers_required||0],[],['MVP','First choice','Second choice','Weighted score'],...demand.map(x=>[x.title,x.first,x.second,x.weighted])];
    const csv=rows.map(row=>row.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=`ai-lab-dashboard-${toInputDate(new Date())}.csv`;a.click();URL.revokeObjectURL(url);
  }

  if(loadingAuth)return <main className="boBoot">Checking administrator access…</main>;

  const counts=data?.counts||{};
  const settings=data?.settings||{max_attendees_per_table:5,volunteers_per_table:1,first_choice_weight:2,second_choice_weight:1};
  const demand=(data?.demand||[]).slice(0,6);
  const trend=(data?.registration_trend||[]).map(row=>({...row,label:format(new Date(`${row.date}T00:00:00`),'d MMM')}));
  const attentionTotal=(counts.payment_pending||0)+(data?.attention?.unallocated||0);
  const cohorts=data?.cohorts||[];
  const chartFont=Math.round(10*(textScale/100));

  return <main className="boV2" data-theme={theme} data-density={density} style={{'--bo-scale':textScale/100}}>
    <aside className="boSidebar">
      <a className="boBrand" href="/"><img src="https://zvmmgkspdgbfcqmnizga.supabase.co/storage/v1/object/public/ai-lab-ui/logo/AI_LAB_primary_logo_transparent.png" alt="AI Lab"/><span>Back Office</span></a>
      <nav>
        <div className="boNavGroup"><b>Overview</b><SidebarItem icon={LayoutDashboard} label="Dashboard" active/><SidebarItem icon={AlertCircle} label="Attention Queue" disabled/></div>
        <div className="boNavGroup"><b>Cohort</b><SidebarItem icon={Gauge} label="Analysis" disabled/><SidebarItem icon={Users} label="Attendees" disabled/></div>
        <div className="boNavGroup"><b>Planning</b><SidebarItem icon={ClipboardList} label="MVP Demand" disabled/><SidebarItem icon={Table2} label="Table Allocation" disabled/></div>
        <div className="boNavGroup"><b>Operations</b><SidebarItem icon={UserRoundCheck} label="Volunteers" disabled/><SidebarItem icon={WalletCards} label="Payments" disabled/></div>
        <div className="boNavGroup"><b>Configuration</b><SidebarItem icon={Settings2} label="MVP Options" disabled/><SidebarItem icon={Settings2} label="Settings" disabled/></div>
        <div className="boNavGroup"><b>System</b><SidebarItem icon={Database} label="Data Quality" disabled/><SidebarItem icon={FileClock} label="Audit Log" disabled/></div>
      </nav>
      <div className="boAdmin"><span>{profile?.email}</span><small>{(profile?.role||'super_admin').replaceAll('_',' ')}</small><button type="button" onClick={signOut}><LogOut size={14}/> Sign out</button></div>
    </aside>

    <section className="boCanvas">
      <div className="boUniversalBar">
        <label className="boCohortControl" title="Universal cohort filter"><span>Cohort</span><select value={selectedWorkshop} onChange={e=>changeWorkshop(e.target.value)}>{cohorts.length?cohorts.map(c=><option key={c.workshop_key} value={c.workshop_key}>{c.name}</option>):<option value={selectedWorkshop}>AI Lab Mumbai 2026</option>}</select><ChevronDown size={13}/></label>

        <div className="boGlobalSearch">
          <Search size={15}/><input ref={searchRef} value={query} onChange={e=>{setQuery(e.target.value);setSearchOpen(true)}} onFocus={()=>setSearchOpen(true)} placeholder="Search people…" aria-label="Search attendees and volunteers"/><kbd>⌘K</kbd>
          {searchOpen&&query.trim().length>=2&&<div className="boSearchResults">{searching?<div className="boSearchState">Searching…</div>:searchResults.length?searchResults.map(person=><button key={person.id} type="button" onClick={()=>{setSelectedPerson(person);setSearchOpen(false)}}><span><strong>{person.full_name}</strong><small>{person.company_organisation||person.career_role||person.city||'Attendee'}</small></span><em>{person.payment_status==='paid'?'Paid':person.status?.replaceAll('_',' ')}</em></button>):<div className="boSearchState">No matching attendee. Volunteer records will appear here when that module opens.</div>}</div>}
        </div>

        <div className="boUniversalRight">
          <label className="boBasisControl" title="Choose which date field the universal range uses"><span>Date</span><select value={dateBasis} onChange={e=>changeDateBasis(e.target.value)}><option value="registration">Registration</option><option value="payment">Payment</option></select></label>

          <div className="boDateFilter" aria-label="Universal date filter">{ranges.map(([label,value])=><button type="button" className={!showCustom&&range===value?'on':''} onClick={()=>chooseRange(value)} key={value}>{label}</button>)}<button type="button" className={showCustom?'on':''} onClick={()=>setShowCustom(v=>!v)} title="Custom date range"><CalendarDays size={14}/></button></div>

          <div className="boTextScaleInline" aria-label="Text size"><button type="button" onClick={()=>stepScale(-1)} disabled={textScale===100} title="Decrease text"><Minus size={12}/></button><input aria-label="Text size percentage" type="range" min="100" max="200" step="25" value={textScale} onChange={e=>changeScale(e.target.value)}/><button type="button" onClick={()=>stepScale(1)} disabled={textScale===200} title="Increase text"><Plus size={12}/></button><span>{textScale}%</span></div>

          <button className="boIconControl" type="button" onClick={toggleTheme} title={theme==='dark'?'Use light mode':'Use dark mode'}>{theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}</button>
          <button className={`boIconControl ${loading?'spinning':''}`} type="button" onClick={loadDashboard} title={data?.last_updated?`Refresh data · updated ${format(new Date(data.last_updated),'h:mm a')}`:'Refresh data'}><RefreshCw size={15}/></button>

          <div className="boPopoverWrap"><button className="boIconControl" type="button" onClick={()=>{setShowNotifications(v=>!v);setShowProfile(false)}} title="Attention and notifications"><Bell size={15}/>{attentionTotal>0&&<b>{attentionTotal>99?'99+':attentionTotal}</b>}</button>{showNotifications&&<div className="boPopover boNotifyPopover"><header><strong>Attention needed</strong><span>{attentionTotal}</span></header><div><b>{counts.payment_pending||0} payment pending</b><small>Registration started but payment is not confirmed.</small></div><div><b>{data?.attention?.unallocated||0} confirmed attendees unallocated</b><small>Ready for table planning once allocation opens.</small></div></div>}</div>

          <div className="boPopoverWrap"><button className="boProfileControl" type="button" onClick={()=>{setShowProfile(v=>!v);setShowNotifications(false)}} title="Admin profile"><span>{(profile?.email||'A').slice(0,1).toUpperCase()}</span><ChevronDown size={12}/></button>{showProfile&&<div className="boPopover boProfilePopover"><strong>{profile?.email}</strong><small>{(profile?.role||'super_admin').replaceAll('_',' ')}</small><hr/><label>Display density</label><div className="boDensityToggle"><button type="button" className={density==='compact'?'on':''} onClick={()=>changeDensity('compact')}>Compact</button><button type="button" className={density==='comfortable'?'on':''} onClick={()=>changeDensity('comfortable')}>Comfortable</button></div><button className="boSignoutMenu" type="button" onClick={signOut}><LogOut size={13}/> Sign out</button></div>}</div>
        </div>
      </div>

      <header className="boTopbar"><div><span>OVERVIEW</span><h1>Dashboard</h1><p>Workshop registrations, demand and allocation readiness.</p></div><div className="boPageActions"><button type="button" onClick={exportDashboard}><Download size={14}/> Export</button><a href="/" target="_blank">View site <ArrowUpRight size={14}/></a></div></header>

      {showCustom&&<div className="boCustomRange"><label>From<input type="date" value={customFrom} max={customTo} onChange={e=>setCustomFrom(e.target.value)}/></label><span>to</span><label>To<input type="date" value={customTo} min={customFrom} onChange={e=>setCustomTo(e.target.value)}/></label><button type="button" onClick={loadDashboard}>Apply</button></div>}

      <div className="boScope"><span>{data?.workshop?.name||'AI Lab'} · {resolvedRange.label} · filtered by {dateBasis} date</span><small>{data?.last_updated?`Updated ${format(new Date(data.last_updated),'h:mm a')}`:'Loading current data…'}</small></div>

      {error&&<div className="boError" role="alert">{error}<button onClick={loadDashboard}>Retry</button></div>}

      <div className={`boStats ${loading?'loading':''}`}>
        <StatCard label="Applications" value={counts.applications??'—'} meta="received" icon={Users}/>
        <StatCard label="Paid / Confirmed" value={counts.confirmed??'—'} meta="ready for planning" icon={CircleDollarSign}/>
        <StatCard label="Payment Pending" value={counts.payment_pending??'—'} meta="requires follow-up" icon={WalletCards} attention={(counts.payment_pending||0)>0}/>
        <StatCard label="Tables Required" value={counts.tables_required??'—'} meta={`${settings.max_attendees_per_table} attendees / table`} icon={Table2}/>
        <StatCard label="Volunteers Required" value={counts.volunteers_required??'—'} meta={`${settings.volunteers_per_table} / table`} icon={UserRoundCheck}/>
      </div>

      <div className="boCharts">
        <article className="boPanel"><div className="boPanelHead"><div><h2>{dateBasis==='payment'?'Payments':'Registrations'} over time</h2><p>Activity in the selected universal date range.</p></div><span className="boExplain">Code calculated</span></div><div className="boChart">{trend.length?<ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{top:12,right:8,left:-18,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={chartFont}/><YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={chartFont}/><Tooltip/><Line type="monotone" dataKey="count" stroke="currentColor" strokeWidth={2.2} dot={{r:3}} activeDot={{r:4}}/></LineChart></ResponsiveContainer>:<EmptyChart>No activity in this range.</EmptyChart>}</div></article>

        <article className="boPanel"><div className="boPanelHead"><div><h2>MVP demand</h2><p>Preference 1 = {settings.first_choice_weight} points · Preference 2 = {settings.second_choice_weight} point.</p></div><span className="boExplain">Code calculated</span></div><div className="boChart">{demand.length?<ResponsiveContainer width="100%" height="100%"><BarChart data={demand} layout="vertical" margin={{top:4,right:10,left:14,bottom:0}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" tickLine={false} axisLine={false} fontSize={chartFont}/><YAxis type="category" dataKey="title" width={Math.round(112*(textScale/100))} tickLine={false} axisLine={false} fontSize={chartFont}/><Tooltip/><Bar dataKey="weighted" fill="currentColor" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer>:<EmptyChart>MVP demand appears as attendees register.</EmptyChart>}</div></article>
      </div>

      <div className="boLower">
        <article id="attention" className="boPanel boAttention"><div className="boPanelHead"><div><h2>Attention needed</h2><p>Operational items requiring action.</p></div><span className={attentionTotal?'boCount':'boCount clear'}>{attentionTotal}</span></div><div className="boAttentionRows"><div><i/><span><b>{counts.payment_pending||0} payment pending</b><small>Registration started but payment is not confirmed.</small></span><ChevronRight size={15}/></div><div><i/><span><b>{data?.attention?.unallocated||0} confirmed attendees unallocated</b><small>Table allocation has not yet been published.</small></span><ChevronRight size={15}/></div></div></article>

        <article className="boPanel boLogic"><div className="boPanelHead"><div><h2>How allocation will work</h2><p>Plain-English rules before any plan is generated.</p></div></div><div className="boLogicSteps"><div><b>1</b><span><strong>MVP preference comes first</strong><small>We try to place attendees with their selected MVP. First choice carries {settings.first_choice_weight} points; second choice carries {settings.second_choice_weight}.</small></span></div><div><b>2</b><span><strong>Then we balance the table</strong><small>AI readiness, functional area and professional experience improve table diversity when preference fit allows it.</small></span></div><div><b>3</b><span><strong>Every assignment is explainable</strong><small>Admins will see why each attendee was placed, the score impact, and can override or lock the decision.</small></span></div></div></article>
      </div>
    </section>

    {selectedPerson&&<div className="boPersonOverlay" role="dialog" aria-modal="true" aria-label="Person details" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedPerson(null)}}><aside className="boPersonDrawer"><button className="boDrawerClose" type="button" onClick={()=>setSelectedPerson(null)}><X size={16}/></button><span>ATTENDEE</span><h2>{selectedPerson.full_name}</h2><p>{selectedPerson.career_role||'Role not specified'}{selectedPerson.company_organisation?` · ${selectedPerson.company_organisation}`:''}</p><dl><div><dt>Email</dt><dd>{selectedPerson.email}</dd></div><div><dt>Phone</dt><dd>{selectedPerson.phone_country_code} {selectedPerson.phone}</dd></div><div><dt>City</dt><dd>{selectedPerson.city||'—'}</dd></div><div><dt>AI readiness</dt><dd>{selectedPerson.ai_experience_level||'—'}</dd></div><div><dt>Application</dt><dd>{selectedPerson.status?.replaceAll('_',' ')||'—'}</dd></div><div><dt>Payment</dt><dd>{selectedPerson.payment_status?.replaceAll('_',' ')||'—'}</dd></div></dl><small>Full attendee record view will open from the Attendees module.</small></aside></div>}
  </main>;
}
