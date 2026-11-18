'use client';

import {useCallback,useEffect,useMemo,useState} from 'react';
import {SUPABASE_PUBLISHABLE_KEY,SUPABASE_URL} from '../../lib/supabase-browser';

const API=SUPABASE_URL+'/functions/v1/privacy-admin';
const INITIAL={request_type:'deletion',applicant_email:'',application_type:'unknown',application_reference:'',handling_note:''};
const TYPES=[['access','Access'],['correction','Correction'],['deletion','Deletion'],['withdrawal','Withdrawal'],['other','Other']];
const STATUSES=[['received','Received'],['verifying','Verifying'],['in_review','In review'],['completed','Completed'],['rejected','Rejected']];
const VERIFICATIONS=[['pending','Pending'],['verified','Verified'],['not_verified','Not verified']];
const kinds=['unknown','attendee','volunteer'];
const date=v=>v?new Date(v).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—';

export default function PrivacyRetentionWorkspace({supabase,profile}){
 const [data,setData]=useState(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [showNew,setShowNew]=useState(false);
 const [form,setForm]=useState(INITIAL);
 const [selectedId,setSelectedId]=useState('');
 const [edit,setEdit]=useState(null);
 const [confirmDeletion,setConfirmDeletion]=useState(false);
 const canManage=['super_admin','operations'].includes(profile?.role);
 const call=useCallback(async(body)=>{
   const {data:auth,error:authError}=await supabase.auth.getSession();
   if(authError||!auth?.session?.access_token)throw new Error('Administrator session expired. Please sign in again.');
   const res=await fetch(API,{method:body?'POST':'GET',cache:'no-store',headers:{
     Authorization:'Bearer '+auth.session.access_token,apikey:SUPABASE_PUBLISHABLE_KEY,
     ...(body?{'Content-Type':'application/json'}:{})
   },...(body?{body:JSON.stringify(body)}:{})});
   const json=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(json.error||'Could not load privacy records.');
   return json;
 },[supabase]);
 const reload=useCallback(async()=>{
   try{const result=await call();setData(result);setError('')}
   catch(e){setError(e?.message||'Could not load privacy data')}
 },[call]);
 useEffect(()=>{if(canManage)reload()},[canManage,reload]);
 const cases=data?.requests||[];
 const reports=data?.reports||[];
 const admins=data?.admins||[];
 const ownerName=id=>admins.find(a=>a.user_id===id)?.email||'Unassigned';
 const latest=reports[0]||null;
 const overdue=data?.overdue_drafts||[];
 const active=cases.filter(c=>!['completed','rejected'].includes(c.status)).length;
 const selected=cases.find(c=>c.id===selectedId);
 const monthRows=useMemo(()=>reports.slice(0,12),[reports]);
 function openCase(c){
   setSelectedId(c.id);
   setEdit({status:c.status,verification_status:c.verification_status,assigned_to:c.assigned_to||c.created_by,legal_hold:!!c.legal_hold,
     handling_note:c.handling_note||'',resolution_note:c.resolution_note||''});
   setConfirmDeletion(false);setError('');setMessage('');
 }
 async function createCase(e){
   e.preventDefault();if(busy)return;
   setBusy(true);setMessage('');setError('');
   try{
     await call({action:'create',...form});
     setForm(INITIAL);setShowNew(false);await reload();setMessage('Privacy request recorded.');
   }catch(e){setError(e?.message||'Could not record request')}
   finally{setBusy(false)}
 }
 async function saveCase(e){
   e.preventDefault();if(busy||!selected||!edit)return;
   if(edit.status==='completed'&&selected.request_type==='deletion'&&!confirmDeletion){
     setError('Confirm the data was deleted through a separately verified procedure. This screen does not delete applications.');return;
   }
   setBusy(true);setError('');setMessage('');
   try{
     await call({action:'update',id:selected.id,...edit,deletion_confirmed:confirmDeletion});
     await reload();setSelectedId('');setEdit(null);setMessage('Privacy request updated and audit event recorded.');
   }catch(e){setError(e?.message||'Could not update privacy request')}
   finally{setBusy(false)}
 }
 if(!canManage)return <section className="boPanel"><h2>Restricted access</h2><p>Only authorized super administrators and operations staff can review privacy requests.</p></section>;
 return <div className="boPrivacy">
   <section className="boPanel boPrivacyIntro">
     <div><h2>Privacy & Retention</h2><p>Track applicant privacy requests and inspect monthly retention reviews. <strong>This screen does not delete personal information.</strong></p></div>
     <button type="button" onClick={reload} disabled={busy}>Refresh</button>
   </section>
   {error&&<div className="boPrivacyAlert" role="alert">{error}</div>}
   {message&&<div className="boPrivacyNotice" role="status">{message}</div>}
   {!data&&!error&&<div className="boPanel">Loading privacy records…</div>}
   {data&&<>
     <div className="boPrivacyMetrics">
       <div className="boPanel"><span>Open privacy requests</span><strong>{active}</strong></div>
       <div className="boPanel"><span>Overdue volunteer drafts</span><strong>{overdue.length}{overdue.length===100?'+':''}</strong></div>
       <div className="boPanel"><span>Orphan photo objects (last report)</span><strong>{latest?.orphan_photo_objects??'—'}</strong></div>
       <div className="boPanel"><span>Last report generated</span><strong className="boPrivacyDate">{date(latest?.generated_at)}</strong></div>
     </div>
     <section className="boPanel">
       <div className="boPrivacyTitle"><div><h3>Privacy request register</h3><p>Log requests received at <a href="mailto:connect@eliv8lyf.com">connect@eliv8lyf.com</a>. Verify identity before sharing or removing data.</p></div><button type="button" onClick={()=>{setShowNew(s=>!s);setError('')}}>{showNew?'Cancel':'Log request'}</button></div>
       {showNew&&<form className="boPrivacyForm" onSubmit={createCase}>
         <label>Request type<select value={form.request_type} onChange={e=>setForm(v=>({...v,request_type:e.target.value}))}>{TYPES.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
         <label>Applicant email<input type="email" required maxLength={254} autoComplete="off" value={form.applicant_email} onChange={e=>setForm(v=>({...v,applicant_email:e.target.value}))}/></label>
         <label>Application type<select value={form.application_type} onChange={e=>setForm(v=>({...v,application_type:e.target.value}))}>{kinds.map(k=><option value={k} key={k}>{k}</option>)}</select></label>
         <label>Application reference (optional)<input maxLength={120} value={form.application_reference} onChange={e=>setForm(v=>({...v,application_reference:e.target.value}))}/></label>
         <label className="wide">Internal handling note (no sensitive documents)<textarea rows={2} maxLength={1500} value={form.handling_note} onChange={e=>setForm(v=>({...v,handling_note:e.target.value}))}/></label>
         <div className="wide"><button type="submit" disabled={busy}>{busy?'Saving…':'Save request'}</button></div>
       </form>}
       <div className="boTableWrap"><table className="boDataTable"><thead><tr><th>Received</th><th>Applicant</th><th>Request</th><th>Owner</th><th>Verification</th><th>Status</th><th></th></tr></thead><tbody>
         {cases.map(c=><tr key={c.id}><td>{date(c.created_at)}</td><td>{c.applicant_email}</td><td>{c.request_type}</td><td>{ownerName(c.assigned_to||c.created_by)}</td><td>{c.verification_status}</td><td>{c.status}</td><td><button type="button" onClick={()=>openCase(c)}>Review</button></td></tr>)}
       </tbody></table>{!cases.length&&<p>No privacy requests recorded yet.</p>}</div>
     </section>
     {selected&&edit&&<section className="boPanel">
       <div className="boPrivacyTitle"><div><h3>Request review</h3><p>{selected.request_type} · {selected.applicant_email} · {selected.application_type}</p></div><button type="button" onClick={()=>{setSelectedId('');setEdit(null)}}>Close</button></div>
       <form className="boPrivacyForm" onSubmit={saveCase}>
         <label>Responsible administrator<select disabled={['completed','rejected'].includes(selected.status)} value={edit.assigned_to||''} onChange={e=>setEdit(v=>({...v,assigned_to:e.target.value}))}>{admins.map(a=><option value={a.user_id} key={a.user_id}>{a.email}</option>)}</select></label>
         <label>Status<select disabled={['completed','rejected'].includes(selected.status)} value={edit.status} onChange={e=>setEdit(v=>({...v,status:e.target.value}))}>{STATUSES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
         <label>Identity verification<select disabled={['completed','rejected'].includes(selected.status)} value={edit.verification_status} onChange={e=>setEdit(v=>({...v,verification_status:e.target.value}))}>{VERIFICATIONS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
         <label className="boPrivacyCheckbox"><input type="checkbox" disabled={['completed','rejected'].includes(selected.status)} checked={edit.legal_hold} onChange={e=>setEdit(v=>({...v,legal_hold:e.target.checked}))}/> Legal hold / retention exception</label>
         <label className="wide">Handling notes<textarea disabled={['completed','rejected'].includes(selected.status)} rows={2} maxLength={1500} value={edit.handling_note} onChange={e=>setEdit(v=>({...v,handling_note:e.target.value}))}/></label>
         <label className="wide">Resolution and verification details<textarea disabled={['completed','rejected'].includes(selected.status)} rows={2} maxLength={1500} value={edit.resolution_note} onChange={e=>setEdit(v=>({...v,resolution_note:e.target.value}))}/></label>
         {edit.status==='completed'&&selected.request_type==='deletion'&&<label className="wide boPrivacyCheckbox"><input type="checkbox" checked={confirmDeletion} onChange={e=>setConfirmDeletion(e.target.checked)}/> I confirm data removal was executed and independently checked outside this register</label>}
         {!['completed','rejected'].includes(selected.status)&&<div className="wide"><button type="submit" disabled={busy}>{busy?'Saving…':'Save case and audit'}</button></div>}
       </form>
     </section>}
     <section className="boPanel">
       <div className="boPrivacyTitle"><div><h3>Monthly retention review</h3><p>Scheduled for the first day of each month. Report-only, no data is automatically deleted. The latest snapshot counts may differ from the live overdue list above.</p></div></div>
       <div className="boTableWrap"><table className="boDataTable"><thead><tr><th>Month</th><th>Overdue drafts</th><th>Drafts with photos</th><th>Orphan photos</th><th>Open requests</th><th>Generated</th></tr></thead><tbody>
       {monthRows.map(r=><tr key={r.id}><td>{r.report_month}</td><td>{r.draft_overdue_30d}</td><td>{r.photos_linked_to_overdue_drafts}</td><td>{r.orphan_photo_objects}</td><td>{r.open_privacy_requests}</td><td>{date(r.generated_at)}</td></tr>)}
       </tbody></table>{!monthRows.length&&<p>First retention report is not available yet.</p>}</div>
       <p className="boPrivacyFoot">The 30-day draft threshold is a review trigger, not permission to delete. For case handling, verify applicant identity, active status, legal holds and linked files before any separately approved removal.</p>
     </section>
     <section className="boPanel"><h3>Overdue draft review queue</h3><p>Minimal record references only. Do not delete by age alone.</p><div className="boTableWrap"><table className="boDataTable"><thead><tr><th>Application reference</th><th>Last updated</th><th>Photo attached</th></tr></thead><tbody>
       {overdue.map(x=><tr key={x.id}><td><code>{x.id}</code></td><td>{date(x.updated_at)}</td><td>{x.has_photo?'Yes':'No'}</td></tr>)}
     </tbody></table>{!overdue.length&&<p>No volunteer draft exceeds the 30-day review threshold.</p>}</div></section>
   </>}
 </div>;
}
