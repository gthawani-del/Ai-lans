'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Eye, LockKeyhole } from 'lucide-react';

const dateTime=value=>value?new Date(value).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';
const statuses=[['new','New'],['in_review','In review'],['resolved','Resolved'],['spam_review','Spam review']];
const displayValue=value=>Array.isArray(value)?value.join(', '):typeof value==='boolean'?(value?'Yes':'No'):value==null?'—':String(value);
const csvCell=value=>{let text=String(value??'');if(/^[\s]*[=+\-@\t\r]/.test(text))text=`'${text}`;return `"${text.replace(/"/g,'""')}"`;};

export default function CmsFormSubmissions({ formId, supabase, onClose }) {
  const [data,setData]=useState(null);
  const [status,setStatus]=useState('all');
  const [offset,setOffset]=useState(0);
  const [detail,setDetail]=useState(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const limit=25;
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const {data:result,error:rpcError}=await supabase.rpc('cms_admin_list_form_submissions',{p_form_id:formId,p_status:status==='all'?null:status,p_limit:limit,p_offset:offset});
      if(rpcError)throw rpcError;setData(result||null);
    }catch(cause){setError(cause?.message||'Could not load the private submissions inbox.');}
    finally{setLoading(false);}
  },[formId,offset,status,supabase]);
  useEffect(()=>{load();},[load]);
  async function openDetail(row){setBusy(true);setError('');setNotice('');try{const {data:result,error:rpcError}=await supabase.rpc('cms_admin_get_form_submission',{p_submission_id:row.id});if(rpcError)throw rpcError;setDetail(result);}catch(cause){setError(cause?.message||'Could not open this response.');}finally{setBusy(false);}}
  async function updateStatus(next){if(!detail)return;setBusy(true);setError('');setNotice('');try{const {error:rpcError}=await supabase.rpc('cms_admin_update_form_submission_status',{p_submission_id:detail.submission.id,p_status:next,p_note:null});if(rpcError)throw rpcError;setNotice('Status updated and recorded in the audit history.');const refreshed=await supabase.rpc('cms_admin_get_form_submission',{p_submission_id:detail.submission.id});if(refreshed.error)throw refreshed.error;setDetail(refreshed.data);await load();}catch(cause){setError(cause?.message||'Could not update response status.');}finally{setBusy(false);}}
  async function requestExport(){setBusy(true);setError('');setNotice('');try{const {data:result,error:rpcError}=await supabase.rpc('cms_admin_export_form_submissions',{p_form_id:formId,p_limit:1000});if(rpcError)throw rpcError;const rows=result?.rows||[];const header=['Submission ID','Submitted at','Status','Form version','Answers by historical field label'];const csv=[header,...rows.map(row=>[row.id,dateTime(row.submitted_at),row.status,row.version_no,JSON.stringify(row.answers||[])])].map(line=>line.map(csvCell).join(',')).join('\r\n');const blob=new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`${data?.form?.handle||'form'}-responses.csv`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);setNotice(`${rows.length} response${rows.length===1?'':'s'} exported. The export action was audit logged.`);}catch(cause){setError(cause?.message||'Response export is not authorised for this account.');}finally{setBusy(false);}}

  if(detail){
    const submission=detail.submission||{};const fields=submission.definition?.fields||[];const answers=submission.answers||{};
    return <div className="boCmsStudio cmsFormStudio cmsFormInbox">
      <section className="boPanel boCmsIntro"><div><span className="boCmsKicker">PRIVATE SUBMISSION · VERSION {submission.version_no||'—'}</span><h2>{detail.form?.name||'Form response'}</h2><p>{dateTime(submission.submitted_at)} · {submission.id}</p></div><button className="boCmsQuiet" type="button" onClick={()=>setDetail(null)}><ArrowLeft size={15}/> Back to inbox</button></section>
      {error&&<div className="boCmsAlert" role="alert">{error}</div>}{notice&&<div className="boCmsNotice" role="status">{notice}</div>}
      <section className="boPanel cmsFormResponseDetail"><div className="cmsFormDetailToolbar"><label><span>Response status</span><select value={submission.status||'new'} disabled={busy} onChange={event=>updateStatus(event.target.value)}>{statuses.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><small>Every view and status change is recorded in the CMS audit log.</small></div>
        <dl className="cmsFormAnswerList">{fields.filter(field=>field.type!=='section_text'&&Object.prototype.hasOwnProperty.call(answers,field.key)).map(field=><div key={field.id||field.key}><dt>{field.label}</dt><dd>{displayValue(answers[field.key])}</dd></div>)}{!Object.keys(answers).length&&<div><dt>Answers</dt><dd>No answer values are stored on this response.</dd></div>}</dl>
        {submission.context_id&&<p className="cmsFormContextNote"><b>Verified context reference</b> {submission.context_id}</p>}
        <section className="cmsFormConsentEvidence"><h3>Consent evidence</h3>{submission.consents?.length?<ul>{submission.consents.map((item,index)=><li key={`${item.policy_version_id||'policy'}-${index}`}><b>{item.purpose}</b><span>{item.accepted?'Accepted':'Not accepted'} · {dateTime(item.accepted_at)}</span>{item.policy_version_id&&<small>Policy version {item.policy_version_id}</small>}</li>)}</ul>:<p>No consent record is attached to this submission version.</p>}</section>
      </section>
    </div>;
  }

  return <div className="boCmsStudio cmsFormStudio cmsFormInbox">
    <section className="boPanel boCmsIntro"><div><span className="boCmsKicker">PRIVATE DATA · SUPER ADMIN ACCESS</span><h2>{data?.form?.name||'Form submissions'}</h2><p>Responses are shown with the exact form version used at submission time.</p></div><div className="boCmsIntroActions"><button className="boCmsQuiet" type="button" onClick={onClose}><ArrowLeft size={15}/> Back to Forms</button><button className="boCmsQuiet" type="button" onClick={requestExport} disabled={busy} title="The server requires a separate per-account export grant."><Download size={14}/> Export (permission required)</button></div></section>
    <p className="cmsFormPrivacyNote"><LockKeyhole size={14}/> Opening a response and changing its status are audit logged. CSV export requires a separate explicit grant, which is not currently assigned.</p>
    {error&&<div className="boCmsAlert" role="alert">{error}</div>}{notice&&<div className="boCmsNotice" role="status">{notice}</div>}
    <section className="boPanel boCmsListPanel"><div className="boCmsFilters cmsFormInboxFilters"><label><span>Status</span><select value={status} onChange={event=>{setStatus(event.target.value);setOffset(0);}}><option value="all">All statuses</option>{statuses.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label><button className="boCmsQuiet" type="button" onClick={load} disabled={loading}>Refresh</button></div>
      {loading?<div className="boCmsEmpty" role="status">Loading private responses…</div>:data?.rows?.length?<><div className="boCmsTableWrap"><table className="boCmsTable"><thead><tr><th>Submitted</th><th>Form version</th><th>Status</th><th>Context</th><th>Actions</th></tr></thead><tbody>{data.rows.map(row=><tr key={row.id}><td>{dateTime(row.submitted_at)}<small>{row.id}</small></td><td>Version {row.version_no}</td><td><span className={'boCmsStatus boCmsStatus--'+row.status}>{statuses.find(item=>item[0]===row.status)?.[1]||row.status}</span></td><td>{row.context_id||'—'}</td><td><button className="cmsFormSubmissionOpen" type="button" onClick={()=>openDetail(row)} disabled={busy}><Eye size={14}/> View response</button></td></tr>)}</tbody></table></div><div className="cmsFormPagination"><span>{offset+1}–{Math.min(offset+data.rows.length,data.total)} of {data.total}</span><button type="button" aria-label="Previous page" disabled={offset<=0||loading} onClick={()=>setOffset(Math.max(0,offset-limit))}><ChevronLeft size={15}/></button><button type="button" aria-label="Next page" disabled={offset+limit>=data.total||loading} onClick={()=>setOffset(offset+limit)}><ChevronRight size={15}/></button></div></>:<div className="boCmsEmpty"><Eye size={25}/><strong>{status==='all'?'No responses have been received.':'No responses match this status.'}</strong><span>{status==='all'?'Public submissions are disabled, so this inbox is expected to be empty.':'Choose All statuses to review other responses.'}</span></div>}
    </section>
  </div>;
}
