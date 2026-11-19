'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Eye, History as HistoryIcon, Plus, Save, Trash2 } from 'lucide-react';
import CmsFormPublicationSettings from './CmsFormPublicationSettings';

const FIELD_TYPES = [
  ['short_text','Short text'],['email','Email'],['phone','Phone'],['long_text','Long text'],['select','Select'],
  ['radio','Radio choices'],['checkbox_group','Checkbox group'],['boolean_checkbox','Checkbox'],['number','Number'],
  ['date','Date'],['rating','Rating'],['section_text','Instruction text'],['consent','Consent'],['hidden_context','Verified context'],
];
const slugify = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9_ -]/g, '').replace(/[ -]+/g, '_').replace(/^_+|_+$/g, '').slice(0,64) || 'new_field';
const uid = () => globalThis.crypto?.randomUUID?.() || `field_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
const clone = value => JSON.parse(JSON.stringify(value));
const matchesRule = (rule, values) => {
  if (!rule) return true;
  const value = values[rule.field_key];
  if (rule.operator === 'is_answered') return value !== undefined && value !== '' && value !== false;
  if (rule.operator === 'is_not_answered') return value === undefined || value === '' || value === false;
  if (rule.operator === 'not_equals') return String(value ?? '') !== String(rule.value ?? '');
  if (rule.operator === 'contains_option') return Array.isArray(value) && value.includes(rule.value);
  return String(value ?? '') === String(rule.value ?? '');
};

function FormField({ field, value, onChange, error, preview = false }) {
  const id = `form-field-${field.id}`;
  const label = <label htmlFor={id}>{field.label}{field.required && <span aria-hidden="true"> *</span>}</label>;
  const common = { id, name: field.key, value: value ?? '', onChange: event => onChange(event.target.value), required: field.required, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined, placeholder: field.placeholder || '' };
  if (field.type === 'section_text') return <div className="cmsFormPreviewSection"><h3>{field.label}</h3>{field.help_text && <p>{field.help_text}</p>}</div>;
  if (field.type === 'hidden_context') return <div className="cmsFormContextPreview"><b>{field.label}</b><span>Verified context is supplied by the trusted page integration, not this preview.</span></div>;
  let control;
  if (field.type === 'long_text') control = <textarea {...common} rows={4} maxLength={Number(field.constraints?.max_length) || 3000}/>;
  else if (field.type === 'select') control = <select {...common}><option value="">Choose an option</option>{(field.options || []).map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>;
  else if (field.type === 'radio' || field.type === 'rating') control = <div className="cmsFormChoiceList" role="radiogroup" aria-labelledby={`${id}-legend`}><span className="cmsFormChoiceLegend" id={`${id}-legend`}>{field.type==='rating'?'Choose a rating':field.label}</span>{(field.options || (field.type==='rating'?[1,2,3,4,5].map(n=>({value:String(n),label:String(n)})):[])).map(option=><label className="cmsFormChoice" key={option.value}><input type="radio" name={field.key} value={option.value} checked={String(value||'')===String(option.value)} onChange={()=>onChange(String(option.value))}/><span>{option.label}</span></label>)}</div>;
  else if (field.type === 'checkbox_group') control = <div className="cmsFormChoiceList"><span className="cmsFormChoiceLegend">{field.label}</span>{(field.options||[]).map(option=><label className="cmsFormChoice" key={option.value}><input type="checkbox" checked={Array.isArray(value)&&value.includes(option.value)} onChange={event=>onChange(event.target.checked?[...(Array.isArray(value)?value:[]),option.value]:(value||[]).filter(item=>item!==option.value))}/><span>{option.label}</span></label>)}</div>;
  else if (field.type === 'boolean_checkbox' || field.type === 'consent') control = <label className="cmsFormCheck"><input type="checkbox" checked={Boolean(value)} onChange={event=>onChange(event.target.checked)}/><span>{field.help_text || field.label}</span></label>;
  else control = <input {...common} type={field.type==='email'?'email':field.type==='phone'?'tel':field.type==='number'?'number':field.type==='date'?'date':'text'} maxLength={Number(field.constraints?.max_length) || undefined} min={field.constraints?.min} max={field.constraints?.max} />;
  return <div className={'cmsFormPreviewField '+(error?'hasError':'')} data-preview-field={field.key}>{field.type!=='boolean_checkbox'&&field.type!=='consent'&&field.type!=='radio'&&field.type!=='rating'&&label}{field.help_text&&field.type!=='boolean_checkbox'&&field.type!=='consent'&&<small>{field.help_text}</small>}{control}{error&&<span className="cmsFormFieldError" id={`${id}-error`} role="alert">{error}</span>}</div>;
}

export default function CmsFormEditor({ formId, supabase, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [definition, setDefinition] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [panel, setPanel] = useState('Fields');
  const [device, setDevice] = useState('desktop');
  const [values, setValues] = useState({});
  const [simulationErrors, setSimulationErrors] = useState({});
  const [simulationMessage, setSimulationMessage] = useState('');
  const [history, setHistory] = useState(null);
  const [availability, setAvailability] = useState('open');
  const [closedMessage, setClosedMessage] = useState('');
  const [savedAvailability, setSavedAvailability] = useState({availability_status:'open',closed_message:''});
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [publishing,setPublishing]=useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Loading draft…');
  const selectedField = definition?.fields?.find(item=>item.id===selectedId) || null;
  const fields = definition?.fields || [];
  const draftDirty = useMemo(() => Boolean(definition&&form&&JSON.stringify({form,definition})!==savedSnapshot),[definition,form,savedSnapshot]);
  const availabilityDirty=availability!==savedAvailability.availability_status||closedMessage!==savedAvailability.closed_message;
  const dirty=draftDirty||availabilityDirty;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('cms_admin_get_form_editor', { p_form_id: formId });
      if (rpcError) throw rpcError;
      if (!data?.form?.definition) throw new Error('The draft definition was not returned.');
      const {data:availabilityData,error:availabilityError}=await supabase.rpc('cms_admin_get_form_availability',{p_form_id:formId});
      if(availabilityError)throw availabilityError;
      const nextForm=data.form; const nextDefinition=clone(nextForm.definition);
      setForm(nextForm);setAvailability(availabilityData?.availability_status||'open');setClosedMessage(availabilityData?.closed_message||'');setSavedAvailability({availability_status:availabilityData?.availability_status||'open',closed_message:availabilityData?.closed_message||''});setDefinition(nextDefinition); setSavedSnapshot(JSON.stringify({form:nextForm,definition:nextDefinition})); setSelectedId(nextDefinition.fields?.[0]?.id||null); setStatus(`Saved draft · version ${nextForm.version_no}`);
    } catch (cause) { setError(cause?.message||'Could not load this draft.'); }
    finally { setLoading(false); }
  },[formId,supabase]);
  useEffect(()=>{load();},[load]);

  useEffect(()=>{
    if(!dirty)return;
    const beforeUnload=event=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',beforeUnload);return()=>window.removeEventListener('beforeunload',beforeUnload);
  },[dirty]);

  function close(){if(dirty&&!window.confirm('You have unsaved form changes. Leave without saving?'))return;onClose?.();}
  function patchDefinition(change){setDefinition(current=>({...current,...change}));setStatus('Unsaved changes');setSimulationMessage('');setSimulationErrors({});}
  function patchForm(change){setForm(current=>({...current,...change}));setStatus('Unsaved changes');}
  function patchField(id,change){patchDefinition({fields:fields.map(item=>item.id===id?{...item,...change}:item)});}
  function renameFieldKey(id,nextKey){const field=fields.find(item=>item.id===id);if(!field)return;patchDefinition({fields:fields.map(item=>item.id===id?{...item,key:slugify(nextKey)}:item.visibility?.field_key===field.key?{...item,visibility:{...item.visibility,field_key:slugify(nextKey)}}:item)});}
  function addField(type='short_text'){
    const label=type==='select'?'New select field':type==='long_text'?'New long answer':'New question';
    const keyBase=slugify(label);let key=keyBase;let suffix=2;while(fields.some(item=>item.key===key))key=`${keyBase}_${suffix++}`;
    const options=['select','radio','checkbox_group'].includes(type)?[{value:'option_1',label:'Option 1'},{value:'option_2',label:'Option 2'}]:undefined;
    const field={id:uid(),key,type,label,required:false,order:fields.length,constraints:{},...(options?{options}:{})};
    patchDefinition({fields:[...fields,field]});setSelectedId(field.id);setPanel('Fields');
    window.setTimeout(()=>document.getElementById(`cms-form-field-${field.id}`)?.focus(),0);
  }
  function moveField(index,direction){const next=[...fields];const to=index+direction;if(to<0||to>=next.length)return;[next[index],next[to]]=[next[to],next[index]];next.forEach((item,i)=>item.order=i);patchDefinition({fields:next});}
  function deleteField(field){const dependentCount=fields.filter(item=>item.visibility?.field_key===field.key).length;const message=`Remove “${field.label}” from this draft?${dependentCount?` ${dependentCount} conditional field${dependentCount===1?'':'s'} will become unconditional.`:''}`;if(!window.confirm(message))return;const next=fields.filter(item=>item.id!==field.id).map((item,i)=>item.visibility?.field_key===field.key?({...item,visibility:undefined,order:i}):({...item,order:i}));patchDefinition({fields:next});setSelectedId(next[0]?.id||null);}
  function setOptions(text){const labels=text.split('\n').map(value=>value.trim()).filter(Boolean).slice(0,50);const used=new Set();const options=labels.map((label,index)=>{let value=selectedField.options?.[index]?.value||slugify(label)||`option_${index+1}`;if(used.has(value))value=`${value}_${index+1}`;used.add(value);return {value,label};});patchField(selectedId,{options});}
  function setVisibility(enabled){if(!selectedField)return;if(!enabled){patchField(selectedId,{visibility:undefined});return;}const source=previousFields[0];const option=source?.options?.find(item=>item.value==='other')||source?.options?.[0];patchField(selectedId,{visibility:source?{field_key:source.key,operator:'equals',value:option?.value||''}:undefined});}
  async function saveDraft(){if(!form||!definition)return;setSaving(true);setError('');setStatus('Saving…');
    try{
      const {data,error:rpcError}=await supabase.rpc('cms_admin_save_form_draft',{
        p_form_id:form.id,p_expected_draft_version_id:form.draft_version_id,p_name:form.name.trim(),p_public_title:definition.title.trim(),p_handle:form.handle.trim(),p_purpose:form.purpose||'',p_definition:definition,
      });
      if(rpcError)throw rpcError;if(!data?.form)throw new Error('The saved version was not returned.');
      const nextForm=data.form;const nextDefinition=clone(nextForm.definition);setForm(nextForm);setDefinition(nextDefinition);setSavedSnapshot(JSON.stringify({form:nextForm,definition:nextDefinition}));setStatus(`Saved draft · version ${nextForm.version_no}`);setSimulationMessage('');onSaved?.(`${nextForm.name} saved as draft version ${nextForm.version_no}.`);
    }catch(cause){setStatus('Save failed');setError(cause?.message||'Could not save this draft.');}
    finally{setSaving(false);}
  }
  function simulate(){const nextErrors={};for(const field of fields){if(!matchesRule(field.visibility,values))continue;if(field.required&&(values[field.key]===undefined||values[field.key]===''||values[field.key]===false))nextErrors[field.key]='This field is required.';if(field.type==='email'&&values[field.key]&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values[field.key])))nextErrors[field.key]='Enter a valid email address.';}
    setSimulationErrors(nextErrors);setSimulationMessage(Object.keys(nextErrors).length?'Review the highlighted fields.':'Preview check passed. No response was sent or stored.');
  }
  function changeValue(key,value){setValues(current=>({...current,[key]:value}));setSimulationErrors(current=>({...current,[key]:undefined}));setSimulationMessage('');}
  async function openHistory(){setBusy(true);setError('');try{const {data,error:rpcError}=await supabase.rpc('cms_admin_list_form_versions',{p_form_id:formId});if(rpcError)throw rpcError;setHistory(Array.isArray(data)?data:[]);}catch(cause){setError(cause?.message||'Could not load form history.');}finally{setBusy(false);}}
  async function restoreVersion(version){if(!window.confirm(`Restore version ${version.version_no} as a new draft? The original revision will remain unchanged.`))return;setBusy(true);setError('');try{const {data,error:rpcError}=await supabase.rpc('cms_admin_restore_form_version',{p_form_id:formId,p_version_id:version.id,p_expected_draft_version_id:form.draft_version_id});if(rpcError)throw rpcError;if(!data?.form)throw new Error('The restored draft was not returned.');const nextForm=data.form;const nextDefinition=clone(nextForm.definition);setForm(nextForm);setDefinition(nextDefinition);setSavedSnapshot(JSON.stringify({form:nextForm,definition:nextDefinition}));setSelectedId(nextDefinition.fields?.[0]?.id||null);setHistory(null);setStatus(`Restored to new draft · version ${nextForm.version_no}`);onSaved?.(`Previous version restored to new draft version ${nextForm.version_no}.`);}catch(cause){setError(cause?.message||'Could not restore that version.');}finally{setBusy(false);}}
  async function saveAvailability(){setAvailabilitySaving(true);setError('');setStatus('Saving availability…');try{const {data,error:rpcError}=await supabase.rpc('cms_admin_set_form_availability',{p_form_id:formId,p_status:availability,p_closed_message:closedMessage});if(rpcError)throw rpcError;const next={availability_status:data?.availability_status||availability,closed_message:data?.closed_message??closedMessage};setAvailability(next.availability_status);setClosedMessage(next.closed_message);setSavedAvailability(next);setStatus('Availability saved');}catch(cause){setError(cause?.message||'Could not update form availability.');setStatus('Save failed');}finally{setAvailabilitySaving(false);}}
  async function publishForm(){if(dirty){setError('Save the draft before publishing.');return;}if(!form?.draft_version_id)return;setPublishing(true);setError('');setStatus('Checking publication requirements…');try{const {data,error:rpcError}=await supabase.rpc('cms_admin_publish_form',{p_form_id:formId,p_expected_draft_version_id:form.draft_version_id});if(rpcError)throw rpcError;setForm(current=>({...current,status:'published',has_published_version:true,published_version_id:data.published_version_id,published_version_no:data.version_no}));setStatus(`Published version ${data.version_no}`);onSaved?.(`Published ${form.name}, version ${data.version_no}.`);}catch(cause){setError(cause?.message||'Could not publish this form.');setStatus('Publication blocked');}finally{setPublishing(false);}}
  const visibleFields=fields.filter(field=>matchesRule(field.visibility,values));
  const selectedIndex=fields.findIndex(item=>item.id===selectedId);
  const previousFields=selectedIndex<0?[]:fields.slice(0,selectedIndex).filter(item=>['select','radio'].includes(item.type));
  const optionsText=(selectedField?.options||[]).map(item=>item.label).join('\n');

  if(loading)return <div className="boCmsStudio cmsFormStudio"><section className="boPanel boCmsEmpty" role="status">Loading private form draft…</section></div>;
  if(error&&!form)return <div className="boCmsStudio cmsFormStudio"><section className="boPanel boCmsAlert" role="alert">{error}<button type="button" onClick={close}>Back to Forms</button></section></div>;

  return <div className="cmsFormEditor">
    <header className="cmsFormEditorTop"><div className="cmsFormEditorIdentity"><button className="boCmsQuiet" type="button" onClick={close}><ArrowLeft size={15}/> Forms</button><div><span className="boCmsKicker">PRIVATE DRAFT · NOINDEX</span><h2>{form?.name||'Form draft'}</h2><p>{status} · {form?.template_name||'Contact'}{form?.has_published_version?' · published version remains unchanged':''}</p></div></div>
      <div className="cmsFormEditorActions"><button className="boCmsQuiet" type="button" onClick={openHistory} disabled={busy}><HistoryIcon size={15}/> History</button><button className="boCmsQuiet" type="button" onClick={()=>{setPanel('Preview');setSimulationMessage('');}}><Eye size={15}/> Preview</button><button className="boCmsPrimary" type="button" onClick={saveDraft} disabled={!draftDirty||saving}><Save size={15}/>{saving?'Saving…':'Save draft'}</button><button className="boCmsPrimary" type="button" onClick={publishForm} disabled={dirty||saving||publishing}>{publishing?'Publishing…':form?.has_published_version?'Publish update':'Publish'}</button></div>
    </header>
    {error&&<div className="boCmsAlert" role="alert">{error}{error.includes('changed in another session')&&<button type="button" onClick={load}>Reload latest version</button>}</div>}
    {!form?.has_published_version&&<p className="cmsFormPublishGate" role="status">The public route stays unavailable until an approved privacy policy, retention category and production collection gate are in place.</p>}
    <nav className="cmsFormMobileTabs" aria-label="Form editor panels" role="tablist">{['Fields','Preview','Settings'].map(value=><button type="button" role="tab" aria-selected={panel===value} className={panel===value?'isActive':''} onClick={()=>setPanel(value)} key={value}>{value}</button>)}</nav>
    <div className="cmsFormEditorGrid">
      <section className={'boPanel cmsFormFieldLibrary '+(panel==='Fields'?'isMobileActive':'')} aria-label="Fields">
        <div className="cmsFormPanelTitle"><div><span className="boCmsKicker">FIELD LIBRARY</span><h3>Fields</h3></div><button className="boCmsQuiet" type="button" onClick={()=>addField('short_text')}><Plus size={14}/> Add</button></div>
        <div className="cmsFormAddTypes">{[['short_text','Short text'],['email','Email'],['select','Select'],['long_text','Long text']].map(([type,label])=><button type="button" onClick={()=>addField(type)} key={type}>+ {label}</button>)}</div>
        <ol className="cmsFormFieldList">{fields.map((field,index)=><li className={selectedId===field.id?'isSelected':''} key={field.id}>
          <button id={`cms-form-field-${field.id}`} className="cmsFormSelectField" type="button" onClick={()=>{setSelectedId(field.id);setPanel('Fields');}} aria-current={selectedId===field.id?'true':undefined}><span>{field.label}</span><small>{field.type}{field.required?' · required':''}{field.visibility?' · conditional':''}</small></button>
          <div className="cmsFormOrder"><button aria-label={`Move ${field.label} up`} disabled={index===0} type="button" onClick={()=>moveField(index,-1)}><ArrowUp size={13}/></button><button aria-label={`Move ${field.label} down`} disabled={index===fields.length-1} type="button" onClick={()=>moveField(index,1)}><ArrowDown size={13}/></button></div>
        </li>)}</ol>
      </section>

      <section className={'boPanel cmsFormCanvasPanel '+(panel==='Preview'?'isMobileActive':'')} aria-label="Live form preview">
        <div className="cmsFormPanelTitle"><div><span className="boCmsKicker">LIVE PREVIEW · LOCAL ONLY</span><h3>{definition?.title||'Form preview'}</h3></div><div className="cmsFormDeviceSwitch" role="group" aria-label="Preview size"><button type="button" aria-pressed={device==='desktop'} onClick={()=>setDevice('desktop')}>Desktop</button><button type="button" aria-pressed={device==='mobile'} onClick={()=>setDevice('mobile')}>Mobile</button></div></div>
        <div className={`cmsFormPreviewViewport cmsFormPreviewViewport--${device}`}><form className="cmsPublicFormPreview" onSubmit={event=>event.preventDefault()} noValidate><h2>{definition?.title}</h2>{definition?.description&&<p>{definition.description}</p>}
          {visibleFields.map(field=><FormField key={field.id} field={field} value={values[field.key]} onChange={value=>changeValue(field.key,value)} error={simulationErrors[field.key]} preview/>)}
          <button className="cmsFormPreviewSubmit" type="button" onClick={simulate}>{definition?.submit_label||'Submit'}</button>
          {simulationMessage&&<p className="cmsFormSimulationMessage" role="status">{simulationMessage}</p>}
        </form></div>
        <div className="cmsFormSimulationTools"><span>Try invalid and valid values here. Simulation never sends or stores a response.</span><button className="boCmsQuiet" type="button" onClick={()=>{setValues({});setSimulationErrors({});setSimulationMessage('Preview values cleared.');}}>Reset preview values</button></div>
      </section>

      <aside className={'boPanel cmsFormInspector '+(panel==='Settings'?'isMobileActive':'')} aria-label="Form and field settings">
        {panel==='Settings'?<>
          <div className="cmsFormPanelTitle"><div><span className="boCmsKicker">FORM SETTINGS</span><h3>General</h3></div></div>
          <label><span>Internal name</span><input value={form?.name||''} maxLength={160} onChange={event=>patchForm({name:event.target.value})}/></label>
          <label><span>Public heading</span><input value={definition?.title||''} maxLength={160} onChange={event=>patchDefinition({title:event.target.value})}/></label>
          <label><span>Form handle</span><div className="cmsFormHandle"><b>/forms/</b><input value={form?.handle||''} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} onChange={event=>patchForm({handle:event.target.value})}/></div></label>
          <label><span>Description</span><textarea rows={3} maxLength={500} value={definition?.description||''} onChange={event=>patchDefinition({description:event.target.value})}/></label>
          <label><span>Submit button text</span><input value={definition?.submit_label||''} maxLength={80} onChange={event=>patchDefinition({submit_label:event.target.value})}/></label>
          <label><span>Purpose note</span><textarea rows={3} maxLength={500} value={form?.purpose||''} onChange={event=>patchForm({purpose:event.target.value})}/></label>
          <fieldset className="cmsFormAvailability"><legend>Availability</legend><label><span>Current state</span><select value={availability} onChange={event=>setAvailability(event.target.value)}><option value="open">Open</option><option value="closed">Closed</option></select></label>{availability==='closed'&&<label><span>Closed message</span><textarea rows={2} maxLength={300} value={closedMessage} onChange={event=>setClosedMessage(event.target.value)} placeholder="This form is currently closed."/></label>}<small>This setting is stored and audited. The public route is not active while submissions are disabled.</small><button className="boCmsQuiet" type="button" onClick={saveAvailability} disabled={availabilitySaving}>{availabilitySaving?'Saving…':'Save availability'}</button></fieldset>
          <CmsFormPublicationSettings formId={formId} supabase={supabase}/>
        </>:selectedField?<>
          <div className="cmsFormPanelTitle"><div><span className="boCmsKicker">FIELD INSPECTOR</span><h3>{selectedField.label}</h3></div><button className="cmsFormDelete" type="button" onClick={()=>deleteField(selectedField)} aria-label={`Delete ${selectedField.label}`}><Trash2 size={15}/></button></div>
          <label><span>Field type</span><select value={selectedField.type} onChange={event=>{const type=event.target.value;const options=['select','radio','checkbox_group'].includes(type)?(selectedField.options?.length?selectedField.options:[{value:'option_1',label:'Option 1'},{value:'option_2',label:'Option 2'}]):undefined;patchField(selectedId,{type,...(options?{options}:{})});}}>{FIELD_TYPES.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Label</span><input value={selectedField.label} maxLength={160} onChange={event=>{const label=event.target.value;patchField(selectedId,{label});}}/></label>
          <label><span>Stable field key</span><input value={selectedField.key} maxLength={64} pattern="[a-z][a-z0-9_]{0,63}" onChange={event=>renameFieldKey(selectedId,event.target.value)}/></label>
          <label><span>Help text</span><textarea rows={2} maxLength={300} value={selectedField.help_text||''} onChange={event=>patchField(selectedId,{help_text:event.target.value})}/></label>
          {selectedField.type!=='section_text'&&selectedField.type!=='hidden_context'&&<label className="cmsFormToggle"><input type="checkbox" checked={Boolean(selectedField.required)} onChange={event=>patchField(selectedId,{required:event.target.checked})}/><span>Required field</span></label>}
          {['select','radio','checkbox_group'].includes(selectedField.type)&&<label><span>Choices (one per line)</span><textarea rows={5} value={optionsText} onChange={event=>setOptions(event.target.value)}/><small>Existing option values stay in order when choice labels change.</small></label>}
          {['short_text','long_text','email','phone'].includes(selectedField.type)&&<label><span>Maximum length</span><input type="number" min="1" max="3000" value={selectedField.constraints?.max_length||''} onChange={event=>patchField(selectedId,{constraints:{...selectedField.constraints,max_length:event.target.value?Number(event.target.value):undefined}})}/></label>}
          {['short_text','long_text'].includes(selectedField.type)&&previousFields.length>0&&<fieldset className="cmsFormLogic"><legend>Conditional visibility</legend><label className="cmsFormToggle"><input type="checkbox" checked={Boolean(selectedField.visibility)} onChange={event=>setVisibility(event.target.checked)}/><span>Show only when an earlier answer matches</span></label>{selectedField.visibility&&<><label><span>Earlier field</span><select value={selectedField.visibility.field_key} onChange={event=>{const source=previousFields.find(item=>item.key===event.target.value);patchField(selectedId,{visibility:{...selectedField.visibility,field_key:event.target.value,value:source?.options?.[0]?.value||''}})}}>{previousFields.map(field=><option key={field.id} value={field.key}>{field.label}</option>)}</select></label><label><span>Answer equals</span><select value={selectedField.visibility.value||''} onChange={event=>patchField(selectedId,{visibility:{...selectedField.visibility,value:event.target.value}})}>{(previousFields.find(field=>field.key===selectedField.visibility.field_key)?.options||[]).map(option=><option value={option.value} key={option.value}>{option.label}</option>)}</select></label></>}</fieldset>}
          {selectedField.type==='consent'&&<p className="cmsFormPublishGate">Consent cannot be preselected. This field cannot be published until an approved policy version is linked.</p>}
          {selectedField.type==='hidden_context'&&<p className="cmsFormPublishGate">Context values are not trusted from a browser field. Server-side page or workshop verification is required.</p>}
        </>:<div className="boCmsEmpty"><strong>Select a field</strong><span>Choose a field in the list or add a field to edit its settings.</span></div>}
        {panel==='Fields'&&fields.length>1&&<div className="cmsFormInspectorOrder"><span>Order {selectedIndex+1} of {fields.length}</span></div>}
      </aside>
    </div>
    {history&&<div className="cmsFormHistoryOverlay" onMouseDown={event=>{if(event.target===event.currentTarget)setHistory(null)}}><section className="boPanel cmsFormHistoryDialog" role="dialog" aria-modal="true" aria-labelledby="cms-form-history-title"><div className="cmsFormPanelTitle"><div><span className="boCmsKicker">IMMUTABLE VERSION LOG</span><h3 id="cms-form-history-title">Form history</h3></div><button className="boCmsQuiet" type="button" onClick={()=>setHistory(null)}>Close</button></div>{history.length?<ol>{history.map(version=><li key={version.id}><div><b>Version {version.version_no}{version.is_current_draft?' · current draft':''}{version.is_current_published?' · published':''}</b><span>{new Date(version.created_at).toLocaleString('en-IN')} · {version.created_by||'Admin'}</span></div>{!version.is_current_draft&&<button className="boCmsQuiet" type="button" onClick={()=>restoreVersion(version)} disabled={busy}>Restore as new draft</button>}</li>)}</ol>:<p>No saved form versions yet.</p>}<small>Restoring creates a new version. Existing versions and any responses remain unchanged.</small></section></div>}
  </div>;
}
