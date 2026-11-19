'use client';
import {useCallback,useEffect,useState} from 'react';
import {ChevronLeft,ChevronRight,RefreshCw,Search} from 'lucide-react';
const PAGE_SIZE=50;
const MODULES=['forms','pages','media','dashboard','configuration','system','attendees','volunteers','workshop'];
const OUTCOMES=['success','failed','denied'];
const nice=value=>String(value||'').replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());
const time=value=>value?new Date(value).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';
export default function CmsActivityLog({supabase}){
 const [filters,setFilters]=useState({query:'',module:'',action:'',outcome:'',from:'',to:''});
 const [queryInput,setQueryInput]=useState(''),[actions,setActions]=useState([]),[result,setResult]=useState({rows:[],count:0}),[offset,setOffset]=useState(0),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const load=useCallback(async(nextOffset=0)=>{setLoading(true);setError('');try{const from=filters.from?new Date(filters.from+'T00:00:00').toISOString():null;const to=filters.to?new Date(filters.to+'T00:00:00').toISOString():null;const {data,error}=await supabase.rpc('cms_admin_list_activity_log',{p_query:filters.query,p_module:filters.module,p_action:filters.action,p_outcome:filters.outcome,p_from:from,p_to:to,p_limit:PAGE_SIZE,p_offset:nextOffset});if(error)throw error;setResult({rows:Array.isArray(data?.rows)?data.rows:[],count:Number(data?.count)||0});setActions(Array.isArray(data?.actions)?data.actions:[]);setOffset(nextOffset);}catch(cause){setError(cause?.message||'Could not load the activity log.');setResult({rows:[],count:0});}finally{setLoading(false);}},[filters,supabase]);
 useEffect(()=>{load(0);},[load]);
 function apply(event){event.preventDefault();setOffset(0);setFilters(current=>({...current,query:queryInput.trim()}));}
 function change(key,value){setOffset(0);setFilters(current=>({...current,[key]:value}));}
 const range=result.count?(offset+1)+'–'+Math.min(offset+result.rows.length,result.count)+' of '+result.count:'0 events';
 return <main className="boCmsStudio cmsActivityLog" aria-labelledby="activity-title">
  <section className="boPanel boCmsIntro"><div><span className="boCmsKicker">SYSTEM · SHARED AUDIT TRAIL</span><h2 id="activity-title">Admin Activity Log</h2><p>Search administrative actions across CMS modules. Submission answers and free-text values are excluded.</p></div><button className="boCmsQuiet" type="button" onClick={()=>load(offset)} disabled={loading}><RefreshCw size={15}/> Refresh</button></section>
  <section className="boPanel cmsActivityFilters" aria-label="Activity log filters">
   <form className="cmsActivitySearch" onSubmit={apply}><label htmlFor="activity-search">Search events</label><div><Search size={16}/><input id="activity-search" type="search" maxLength={120} value={queryInput} onChange={event=>setQueryInput(event.target.value)} placeholder="Actor, action, module or record ID"/><button className="boCmsPrimary" type="submit">Search</button></div></form>
   <label><span>Module</span><select value={filters.module} onChange={event=>change('module',event.target.value)}><option value="">All modules</option>{MODULES.map(item=><option value={item} key={item}>{nice(item)}</option>)}</select></label>
   <label><span>Action</span><select value={filters.action} onChange={event=>change('action',event.target.value)}><option value="">All actions</option>{actions.map(item=><option value={item} key={item}>{nice(item)}</option>)}</select></label>
   <label><span>Outcome</span><select value={filters.outcome} onChange={event=>change('outcome',event.target.value)}><option value="">All outcomes</option>{OUTCOMES.map(item=><option value={item} key={item}>{nice(item)}</option>)}</select></label>
   <label><span>From date</span><input type="date" value={filters.from} onChange={event=>change('from',event.target.value)}/></label><label><span>To date</span><input type="date" value={filters.to} onChange={event=>change('to',event.target.value)}/></label>
  </section>
  {error&&<p className="boCmsAlert" role="alert">{error}</p>}
  <section className="boPanel boCmsListPanel" aria-label="Activity events" aria-busy={loading}>
   {loading?<p className="boCmsEmpty" role="status">Loading activity…</p>:result.rows.length?<div className="boCmsTableWrap"><table className="boCmsTable cmsActivityTable"><thead><tr><th>Time</th><th>Actor</th><th>Module / action</th><th>Record</th><th>Outcome</th><th>Safe details</th></tr></thead><tbody>{result.rows.map(row=><tr key={row.id}><td>{time(row.occurred_at)}</td><td>{row.actor_email||nice(row.actor_type)}</td><td><b>{nice(row.module)}</b><small>{nice(row.action)}</small></td><td><b>{nice(row.entity_type)}</b><small>{row.entity_id||'—'}</small></td><td><span className={'boCmsStatus boCmsStatus--'+row.outcome}>{nice(row.outcome)}</span></td><td>{Object.entries(row.metadata||{}).length?Object.entries(row.metadata).map(([key,value])=><span className="cmsActivityMeta" key={key}>{nice(key)}: {String(value)}</span>):'—'}</td></tr>)}</tbody></table></div>:<p className="boCmsEmpty">No activity events match these filters.</p>}
   <div className="cmsFormPagination"><span>{range}</span><button type="button" aria-label="Previous page" disabled={offset===0||loading} onClick={()=>load(Math.max(0,offset-PAGE_SIZE))}><ChevronLeft size={15}/></button><button type="button" aria-label="Next page" disabled={offset+PAGE_SIZE>=result.count||loading} onClick={()=>load(offset+PAGE_SIZE)}><ChevronRight size={15}/></button></div>
  </section>
 </main>;
}