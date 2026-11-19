'use client';

import { useCallback, useEffect, useState } from 'react';

export default function CmsFormPublicationSettings({ formId, supabase, onSettingsChanged }) {
  const [settings,setSettings]=useState(null); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [notice,setNotice]=useState('');
  const [policy,setPolicy]=useState({document_id:'',version_id:'',public_url:'',snapshot_hash:'',owner_approved:false});
  const [retention,setRetention]=useState({id:null,policy_key:'',label:'',purpose:'',retention_days:'',review_owner:'',owner_approved:false});
  const [selectedRetention,setSelectedRetention]=useState('');
  const [notification,setNotification]=useState({enabled:false,recipient_email:'',owner_approved:false});
  const [gateConfirmed,setGateConfirmed]=useState(false);
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{const {data,error}=await supabase.rpc('cms_admin_get_form_publication_settings',{p_form_id:formId});if(error)throw error;setSettings(data);setPolicy({...data?.privacy_policy,owner_approved:data?.privacy_policy?.configured===true});setSelectedRetention(data?.retention_policy_id||'');setNotification({...data?.notification,owner_approved:data?.notification?.configured===true});}
    catch(e){setError(e?.message||'Could not load privacy and publication settings.');}
    finally{setLoading(false);}
  },[formId,supabase]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(!retention.id&&settings?.retention_policies?.length){const first=settings.retention_policies[0];setRetention({id:first.id,policy_key:first.policy_key,label:first.label,purpose:first.purpose,retention_days:first.retention_days??'',review_owner:first.review_owner||'',owner_approved:first.owner_approved});}},[settings,retention.id]);
  async function run(action,success){setBusy(true);setError('');setNotice('');try{await action();setNotice(success);await load();onSettingsChanged?.();}catch(e){setError(e?.message||'Could not save these settings.');}finally{setBusy(false);}}
  async function savePolicy(event){event.preventDefault();await run(async()=>{const {error}=await supabase.rpc('cms_admin_set_form_privacy_policy',{p_document_id:policy.document_id,p_version_id:policy.version_id,p_public_url:policy.public_url,p_snapshot_hash:policy.snapshot_hash,p_owner_approved:policy.owner_approved});if(error)throw error;},'Privacy policy reference saved.');}
  async function saveRetention(event){event.preventDefault();await run(async()=>{const {data,error}=await supabase.rpc('cms_admin_save_form_retention_policy',{p_policy_id:retention.id||null,p_policy_key:retention.policy_key,p_label:retention.label,p_purpose:retention.purpose,p_retention_days:retention.retention_days===''?null:Number(retention.retention_days),p_review_owner:retention.review_owner,p_owner_approved:retention.owner_approved});if(error)throw error;if(!retention.id&&data?.id)setRetention(current=>({...current,id:data.id}));},'Retention category saved.');}
  async function assignRetention(){await run(async()=>{const {error}=await supabase.rpc('cms_admin_set_form_retention',{p_form_id:formId,p_policy_id:selectedRetention});if(error)throw error;},'Retention category assigned to this form.');}
  async function saveNotification(event){event.preventDefault();await run(async()=>{const {error}=await supabase.rpc('cms_admin_save_form_notification_rule',{p_form_id:formId,p_enabled:notification.enabled,p_recipient_email:notification.recipient_email,p_owner_approved:notification.owner_approved});if(error)throw error;},'Notification routing saved.');}
  async function setGate(enabled){await run(async()=>{const {error}=await supabase.rpc('cms_admin_set_form_public_submissions_enabled',{p_enabled:enabled});if(error)throw error;setGateConfirmed(false);},enabled?'Public submission gate enabled.':'Public submission gate disabled.');}
  if(loading)return <section className="cmsFormGovernance" aria-busy="true"><h3>Privacy & publishing</h3><p>Loading owner-controlled settings…</p></section>;
  return <section className="cmsFormGovernance" aria-labelledby="cms-form-governance-title">
    <div><span className="boCmsKicker">OWNER CONTROLLED</span><h3 id="cms-form-governance-title">Privacy & publishing</h3><p>Values here must come from approved policies and operational decisions. Blank settings keep publication closed.</p></div>
    {error&&<p className="cmsFormPublishGate" role="alert">{error}</p>}{notice&&<p className="cmsFormSaved" role="status">{notice}</p>}
    <form onSubmit={savePolicy} className="cmsFormGovernanceGroup"><h4>Approved privacy policy version</h4>
      <label><span>Document ID</span><input value={policy.document_id||''} maxLength={160} onChange={e=>setPolicy({...policy,document_id:e.target.value})}/></label>
      <label><span>Version ID</span><input value={policy.version_id||''} maxLength={160} onChange={e=>setPolicy({...policy,version_id:e.target.value})}/></label>
      <label><span>Public HTTPS URL</span><input type="url" value={policy.public_url||''} onChange={e=>setPolicy({...policy,public_url:e.target.value})} placeholder="https://…"/></label>
      <label><span>Approved snapshot hash</span><input value={policy.snapshot_hash||''} maxLength={128} onChange={e=>setPolicy({...policy,snapshot_hash:e.target.value})}/></label>
      <label className="cmsFormOwnerConfirm"><input type="checkbox" checked={!!policy.owner_approved} onChange={e=>setPolicy({...policy,owner_approved:e.target.checked})}/><span>I confirm these values identify the approved privacy policy version.</span></label>
      <button className="boCmsQuiet" type="submit" disabled={busy}>Save policy reference</button>
    </form>
    <form onSubmit={saveRetention} className="cmsFormGovernanceGroup"><h4>Retention category</h4>
      {settings?.retention_policies?.length>0&&<label><span>Existing category</span><select value={retention.id||''} onChange={e=>{const next=settings.retention_policies.find(p=>p.id===e.target.value);setRetention(next?{...next,retention_days:next.retention_days??''}:{id:null,policy_key:'',label:'',purpose:'',retention_days:'',review_owner:'',owner_approved:false});}}><option value="">Create a new category</option>{settings.retention_policies.map(item=><option key={item.id} value={item.id}>{item.label}{item.owner_approved?' · approved':' · draft'}</option>)}</select></label>}
      <label><span>Category key</span><input value={retention.policy_key||''} maxLength={80} onChange={e=>setRetention({...retention,policy_key:e.target.value})} placeholder="Owner-defined key" required/></label>
      <label><span>Category label</span><input value={retention.label||''} maxLength={160} onChange={e=>setRetention({...retention,label:e.target.value})} required/></label>
      <label><span>Collection purpose</span><textarea value={retention.purpose||''} maxLength={500} rows={2} onChange={e=>setRetention({...retention,purpose:e.target.value})} required/></label>
      <label><span>Retention days</span><input type="number" min="1" max="36500" value={retention.retention_days??''} onChange={e=>setRetention({...retention,retention_days:e.target.value})} placeholder="Set by owner"/></label>
      <label><span>Review owner</span><input value={retention.review_owner||''} maxLength={160} onChange={e=>setRetention({...retention,review_owner:e.target.value})}/></label>
      <label className="cmsFormOwnerConfirm"><input type="checkbox" checked={!!retention.owner_approved} onChange={e=>setRetention({...retention,owner_approved:e.target.checked})}/><span>I confirm this category and period are approved for use.</span></label>
      <button className="boCmsQuiet" type="submit" disabled={busy}>Save retention category</button>
      <label><span>Assign to this form</span><select value={selectedRetention} onChange={e=>setSelectedRetention(e.target.value)}><option value="">Select approved category…</option>{(settings?.retention_policies||[]).filter(item=>item.owner_approved&&item.retention_days).map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <button className="boCmsQuiet" type="button" disabled={busy||!selectedRetention} onClick={assignRetention}>Assign category</button>
    </form>
    <form onSubmit={saveNotification} className="cmsFormGovernanceGroup"><h4>Internal notification</h4>
      <label><span>Authorised recipient</span><input type="email" value={notification.recipient_email||''} onChange={e=>setNotification({...notification,recipient_email:e.target.value})} placeholder="Enter an owner-approved address"/></label>
      <label className="cmsFormOwnerConfirm"><input type="checkbox" checked={!!notification.enabled} onChange={e=>setNotification({...notification,enabled:e.target.checked})}/><span>Enable internal new-response notifications</span></label>
      <label className="cmsFormOwnerConfirm"><input type="checkbox" checked={!!notification.owner_approved} onChange={e=>setNotification({...notification,owner_approved:e.target.checked})}/><span>I confirm this recipient is authorised for this form.</span></label>
      <p>Email delivery requires verified provider secrets in production. No response answers are included in notification emails.</p>
      <button className="boCmsQuiet" type="submit" disabled={busy}>Save notification route</button>
    </form>
    <div className="cmsFormGovernanceGroup"><h4>Public submissions</h4><p>Current gate: <b>{settings?.public_gate?'Enabled':'Disabled'}</b>. This is a global switch. Publishing a form still checks its assigned privacy and retention values.</p>
      <label className="cmsFormOwnerConfirm"><input type="checkbox" checked={gateConfirmed} onChange={e=>setGateConfirmed(e.target.checked)}/><span>I am authorised to open or close public CMS form collection.</span></label>
      <div className="cmsFormGovernanceActions"><button className="boCmsQuiet" type="button" disabled={busy||!gateConfirmed||settings?.public_gate} onClick={()=>setGate(true)}>Enable public collection</button><button className="boCmsQuiet" type="button" disabled={busy||!gateConfirmed||!settings?.public_gate} onClick={()=>setGate(false)}>Disable public collection</button></div>
    </div>
  </section>;
}
