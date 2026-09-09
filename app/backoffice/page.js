'use client';

import {useCallback,useEffect,useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {
  AlertCircle,ArrowUpRight,CalendarDays,ChevronRight,CircleDollarSign,ClipboardList,
  Gauge,LayoutDashboard,LogOut,Settings2,Table2,Users,UserRoundCheck,WalletCards
} from 'lucide-react';
import {
  Bar,BarChart,CartesianGrid,Line,LineChart,ResponsiveContainer,Tooltip,XAxis,YAxis
} from 'recharts';
import {format,subDays} from 'date-fns';
import {getSupabaseBrowserClient,SUPABASE_PUBLISHABLE_KEY,SUPABASE_URL} from '../../lib/supabase-browser';

const API=`${SUPABASE_URL}/functions/v1/attendee-dashboard-stats`;
const ranges=[['7D','7d'],['30D','30d'],['All Time','all']];

function toInputDate(date){return format(date,'yyyy-MM-dd')}
function prettyDate(date){return format(new Date(`${date}T00:00:00`),'d MMM')}

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

  useEffect(()=>{
    let mounted=true;
    async function boot(){
      const {data:sessionData}=await supabase.auth.getSession();
      if(!mounted)return;
      if(!sessionData.session){router.replace('/backoffice/login');return;}
      const {data:admin}=await supabase.from('backoffice_users').select('email,role,is_active').eq('user_id',sessionData.session.user.id).maybeSingle();
      if(!admin?.is_active){await supabase.auth.signOut();router.replace('/backoffice/login');return;}
      setSession(sessionData.session);setProfile(admin);setLoadingAuth(false);
    }
    boot();
    const {data:listener}=supabase.auth.onAuthStateChange((_event,next)=>{
      if(!next)router.replace('/backoffice/login');
      else setSession(next);
    });
    return()=>{mounted=false;listener.subscription.unsubscribe()};
  },[router,supabase]);

  const resolvedRange=useMemo(()=>{
    if(showCustom)return{from:customFrom,to:customTo,label:`${prettyDate(customFrom)} – ${prettyDate(customTo)}`};
    if(range==='all')return{from:null,to:null,label:'All time'};
    const days=range==='7d'?7:30;
    return{from:toInputDate(subDays(new Date(),days-1)),to:toInputDate(new Date()),label:range==='7d'?'Last 7 days':'Last 30 days'};
  },[range,showCustom,customFrom,customTo]);

  const loadDashboard=useCallback(async()=>{
    if(!session)return;
    setLoading(true);setError('');
    try{
      const params=new URLSearchParams();
      if(resolvedRange.from)params.set('from',resolvedRange.from);
      if(resolvedRange.to)params.set('to',resolvedRange.to);
      const response=await fetch(`${API}?${params.toString()}`,{headers:{Authorization:`Bearer ${session.access_token}`,apikey:SUPABASE_PUBLISHABLE_KEY}});
      if(response.status===401||response.status===403){await supabase.auth.signOut();router.replace('/backoffice/login');return;}
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||'Could not load dashboard.');
      setData(result);
    }catch(err){setError(err instanceof Error?err.message:'Could not load dashboard.');}
    finally{setLoading(false)}
  },[session,resolvedRange,router,supabase]);

  useEffect(()=>{loadDashboard()},[loadDashboard]);

  async function signOut(){await supabase.auth.signOut();router.replace('/backoffice/login')}
  function chooseRange(value){setRange(value);setShowCustom(false)}

  if(loadingAuth)return <main className="boBoot">Checking administrator access…</main>;

  const counts=data?.counts||{};
  const settings=data?.settings||{max_attendees_per_table:5,volunteers_per_table:1,first_choice_weight:2,second_choice_weight:1};
  const demand=(data?.demand||[]).slice(0,6);
  const trend=(data?.registration_trend||[]).map(row=>({...row,label:format(new Date(`${row.date}T00:00:00`),'d MMM')}));
  const attentionTotal=(counts.payment_pending||0)+(data?.attention?.unallocated||0);

  return <main className="boV2">
    <aside className="boSidebar">
      <a className="boBrand" href="/"><img src="https://zvmmgkspdgbfcqmnizga.supabase.co/storage/v1/object/public/ai-lab-ui/logo/AI_LAB_primary_logo_transparent.png" alt="AI Lab"/><span>Back Office</span></a>
      <nav>
        <div className="boNavGroup"><b>Overview</b><SidebarItem icon={LayoutDashboard} label="Dashboard" active/><SidebarItem icon={AlertCircle} label="Attention Queue" disabled/></div>
        <div className="boNavGroup"><b>Cohort</b><SidebarItem icon={Gauge} label="Analysis" disabled/><SidebarItem icon={Users} label="Attendees" disabled/></div>
        <div className="boNavGroup"><b>Planning</b><SidebarItem icon={ClipboardList} label="MVP Demand" disabled/><SidebarItem icon={Table2} label="Table Allocation" disabled/></div>
        <div className="boNavGroup"><b>Operations</b><SidebarItem icon={UserRoundCheck} label="Volunteers" disabled/><SidebarItem icon={WalletCards} label="Payments" disabled/></div>
        <div className="boNavGroup"><b>Configuration</b><SidebarItem icon={Settings2} label="Settings" disabled/></div>
      </nav>
      <div className="boAdmin"><span>{profile?.email}</span><small>{(profile?.role||'super_admin').replaceAll('_',' ')}</small><button type="button" onClick={signOut}><LogOut size={14}/> Sign out</button></div>
    </aside>

    <section className="boCanvas">
      <header className="boTopbar"><div><span>OVERVIEW</span><h1>Dashboard</h1><p>Workshop registrations, demand and allocation readiness.</p></div><div className="boTopActions"><div className="boDateFilter" aria-label="Universal date filter">{ranges.map(([label,value])=><button type="button" className={!showCustom&&range===value?'on':''} onClick={()=>chooseRange(value)} key={value}>{label}</button>)}<button type="button" className={showCustom?'on':''} onClick={()=>setShowCustom(v=>!v)}><CalendarDays size={14}/> Custom</button></div><a href="/" target="_blank">View site <ArrowUpRight size={14}/></a></div></header>

      {showCustom&&<div className="boCustomRange"><label>From<input type="date" value={customFrom} max={customTo} onChange={e=>setCustomFrom(e.target.value)}/></label><span>to</span><label>To<input type="date" value={customTo} min={customFrom} onChange={e=>setCustomTo(e.target.value)}/></label><button type="button" onClick={loadDashboard}>Apply</button></div>}

      <div className="boScope"><span>{resolvedRange.label}</span><small>{data?.last_updated?`Updated ${format(new Date(data.last_updated),'h:mm a')}`:'Loading current data…'}</small></div>

      {error&&<div className="boError" role="alert">{error}<button onClick={loadDashboard}>Retry</button></div>}

      <div className={`boStats ${loading?'loading':''}`}>
        <StatCard label="Applications" value={counts.applications??'—'} meta="received" icon={Users}/>
        <StatCard label="Paid / Confirmed" value={counts.confirmed??'—'} meta="ready for planning" icon={CircleDollarSign}/>
        <StatCard label="Payment Pending" value={counts.payment_pending??'—'} meta="requires follow-up" icon={WalletCards} attention={(counts.payment_pending||0)>0}/>
        <StatCard label="Tables Required" value={counts.tables_required??'—'} meta={`${settings.max_attendees_per_table} attendees / table`} icon={Table2}/>
        <StatCard label="Volunteers Required" value={counts.volunteers_required??'—'} meta={`${settings.volunteers_per_table} / table`} icon={UserRoundCheck}/>
      </div>

      <div className="boCharts">
        <article className="boPanel"><div className="boPanelHead"><div><h2>Registrations over time</h2><p>Applications submitted in the selected date range.</p></div></div><div className="boChart">{trend.length?<ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{top:12,right:8,left:-18,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11}/><YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11}/><Tooltip/><Line type="monotone" dataKey="count" stroke="currentColor" strokeWidth={2.2} dot={{r:3}} activeDot={{r:4}}/></LineChart></ResponsiveContainer>:<EmptyChart>No registrations in this range.</EmptyChart>}</div></article>

        <article className="boPanel"><div className="boPanelHead"><div><h2>MVP demand</h2><p>Preference 1 = {settings.first_choice_weight} points · Preference 2 = {settings.second_choice_weight} point.</p></div><span className="boExplain">Code calculated</span></div><div className="boChart">{demand.length?<ResponsiveContainer width="100%" height="100%"><BarChart data={demand} layout="vertical" margin={{top:4,right:10,left:14,bottom:0}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" tickLine={false} axisLine={false} fontSize={11}/><YAxis type="category" dataKey="title" width={112} tickLine={false} axisLine={false} fontSize={10}/><Tooltip/><Bar dataKey="weighted" fill="currentColor" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer>:<EmptyChart>MVP demand appears as attendees register.</EmptyChart>}</div></article>
      </div>

      <div className="boLower">
        <article className="boPanel boAttention"><div className="boPanelHead"><div><h2>Attention needed</h2><p>Operational items requiring action.</p></div><span className={attentionTotal?'boCount':'boCount clear'}>{attentionTotal}</span></div><div className="boAttentionRows"><div><i/><span><b>{counts.payment_pending||0} payment pending</b><small>Registration started but payment is not confirmed.</small></span><ChevronRight size={15}/></div><div><i/><span><b>{data?.attention?.unallocated||0} confirmed attendees unallocated</b><small>Table allocation has not yet been published.</small></span><ChevronRight size={15}/></div></div></article>

        <article className="boPanel boLogic"><div className="boPanelHead"><div><h2>How allocation will work</h2><p>Plain-English rules before any plan is generated.</p></div></div><div className="boLogicSteps"><div><b>1</b><span><strong>MVP preference comes first</strong><small>We try to place attendees with their selected MVP. First choice carries {settings.first_choice_weight} points; second choice carries {settings.second_choice_weight}.</small></span></div><div><b>2</b><span><strong>Then we balance the table</strong><small>AI readiness, functional area and professional experience improve table diversity when preference fit allows it.</small></span></div><div><b>3</b><span><strong>Every assignment is explainable</strong><small>Admins will see why each attendee was placed, the score impact, and can override or lock the decision.</small></span></div></div></article>
      </div>
    </section>
  </main>;
}
