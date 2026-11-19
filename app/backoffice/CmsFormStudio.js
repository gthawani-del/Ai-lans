'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ClipboardList, ExternalLink, FilePlus2, LockKeyhole, Pencil, Search } from 'lucide-react';
import CmsFormEditor from './CmsFormEditor';
import CmsFormSubmissions from './CmsFormSubmissions';

const dateLabel = value => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const statusLabel = value => ({ protected: 'Protected integration', published: 'Published', paused: 'Paused', archived: 'Archived', draft: 'Draft' }[value] || value);
const slugify = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const milestoneFor = key => ({ waitlist_v1: 'M2.6-D', feedback_v1: 'M2.6-D', newsletter_v1: 'M2.6-D', workshop_registration_v1: 'M2.6-E', custom_v1: 'M2.6-E' }[key] || 'M2.6-B');

export default function CmsFormStudio({ profile, supabase }) {
  const [forms, setForms] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [status, setStatus] = useState('all');
  const [template, setTemplate] = useState('all');
  const [query, setQuery] = useState('');
  const [enabled, setEnabled] = useState(null);
  const [publicSubmissionsEnabled, setPublicSubmissionsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formName, setFormName] = useState('');
  const [publicTitle, setPublicTitle] = useState('');
  const [handle, setHandle] = useState('');
  const [handleTouched, setHandleTouched] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submissionsId, setSubmissionsId] = useState(null);
  const canManage = profile?.role === 'super_admin';

  const load = useCallback(async () => {
    if (!canManage) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [formResult, templateResult] = await Promise.all([
        supabase.rpc('cms_admin_list_forms', { p_query: query.trim() || null, p_status: status === 'all' ? null : status, p_template: template === 'all' ? null : template }),
        supabase.rpc('cms_admin_list_form_templates'),
      ]);
      if (formResult.error) throw formResult.error;
      if (templateResult.error) throw templateResult.error;
      setEnabled(formResult.data?.enabled === true);
      setPublicSubmissionsEnabled(formResult.data?.public_submissions_enabled === true);
      setForms(Array.isArray(formResult.data?.forms) ? formResult.data.forms : []);
      setTemplates(Array.isArray(templateResult.data) ? templateResult.data : []);
    } catch (cause) { setError(cause?.message || 'Could not load Form Studio.'); }
    finally { setLoading(false); }
  }, [canManage, query, status, template, supabase]);

  useEffect(() => { load(); }, [load]);
  const filteredTemplates = useMemo(() => templates, [templates]);
  function startCreate() {
    setCreating(true); setSelectedTemplate(null); setFormName(''); setPublicTitle(''); setHandle(''); setPurpose(''); setHandleTouched(false); setError(''); setNotice('');
  }
  function chooseTemplate(item) {
    setSelectedTemplate(item); setFormName(item.template_key === 'contact_v1' ? 'General Enquiry' : item.name); setPublicTitle(item.starter_definition?.title || item.name); setHandle(slugify(item.template_key === 'contact_v1' ? 'general-enquiry' : item.name)); setHandleTouched(false); setError('');
  }
  async function createDraft(event) {
    event.preventDefault(); if (!selectedTemplate || selectedTemplate.template_key !== 'contact_v1') return;
    setBusy(true); setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('cms_admin_create_form', {
        p_template_key: selectedTemplate.template_key,
        p_name: formName.trim(),
        p_public_title: publicTitle.trim(),
        p_handle: slugify(handle),
        p_purpose: purpose.trim(),
      });
      if (rpcError) throw rpcError;
      const id = data?.form?.id;
      if (!id) throw new Error('The draft was not returned by the server. Refresh the forms list before retrying.');
      setCreating(false); setSelectedTemplate(null); setNotice(`${data.form.name} was created as a private draft.`); setEditingId(id); await load();
    } catch (cause) { setError(cause?.message || 'Could not create the draft.'); }
    finally { setBusy(false); }
  }
  function openTemplate(item) { chooseTemplate(item); setCreating(true); }

  if (editingId) return <CmsFormEditor formId={editingId} supabase={supabase} onClose={() => { setEditingId(null); setNotice(''); load(); }} onSaved={message => { setNotice(message); load(); }} />;
  if (submissionsId) return <CmsFormSubmissions formId={submissionsId} supabase={supabase} onClose={() => { setSubmissionsId(null); load(); }} />;

  if (creating) return <div className="boCmsStudio cmsFormStudio">
    <section className="boPanel boCmsIntro"><div><span className="boCmsKicker">CONTENT · PHASE 2 · M2.6</span><h2>Choose a form template</h2><p>The Contact template is the first editable vertical slice. Other templates appear as they are implemented in sequence.</p></div><button className="boCmsQuiet" type="button" onClick={() => { setCreating(false); setSelectedTemplate(null); setError(''); }}><ArrowLeft size={15}/> Back to Forms</button></section>
    {error && <div className="boCmsAlert" role="alert">{error}</div>}
    <section className="boPanel cmsFormTemplateGrid" aria-label="Available form templates">
      {filteredTemplates.map(item => {
        const available = item.template_key === 'contact_v1';
        return <button type="button" className={'cmsFormTemplate '+(selectedTemplate?.template_key===item.template_key?'isSelected':'')+(available?'':' isUpcoming')} key={item.template_key} aria-pressed={selectedTemplate?.template_key===item.template_key} onClick={() => openTemplate(item)}>
          <span className="cmsFormTemplateIcon"><ClipboardList size={19}/></span><strong>{item.name}</strong><small>{item.summary}</small><em>{item.complexity} · {available?'available now':`planned ${milestoneFor(item.template_key)}`}</em>
        </button>;
      })}
    </section>
    {selectedTemplate && <form className="boPanel cmsFormSelection cmsFormCreateDetails" onSubmit={createDraft}>
      <div className="cmsFormCreateHeading"><span className="boCmsKicker">{selectedTemplate.name} · {milestoneFor(selectedTemplate.template_key)}</span><h3>{selectedTemplate.template_key==='contact_v1'?'Create a private draft':'Template not available yet'}</h3><p>{selectedTemplate.summary}</p></div>
      {selectedTemplate.template_key === 'contact_v1' ? <>
        <label><span>Internal form name</span><input value={formName} maxLength={160} onChange={event=>{setFormName(event.target.value);if(!handleTouched)setHandle(slugify(event.target.value));}} required minLength={2}/></label>
        <label><span>Public heading</span><input value={publicTitle} maxLength={160} onChange={event=>setPublicTitle(event.target.value)} required minLength={2}/></label>
        <label><span>Form handle</span><div className="cmsFormHandle"><b>/forms/</b><input value={handle} maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={event=>{setHandle(event.target.value);setHandleTouched(true);}} required/></div><small>Lowercase letters, numbers and hyphens. Uniqueness is checked on save.</small></label>
        <label><span>Submission purpose</span><textarea value={purpose} maxLength={500} minLength={2} onChange={event=>setPurpose(event.target.value)} rows={2} placeholder="Describe what this enquiry form is for" required/><small>Required to document why the form exists; this does not count as privacy approval.</small></label>
        <div className="cmsFormOwnerNote"><b>Operational owner</b><span>Assigned to your signed-in Super Admin account.</span><b>Privacy category</b><span>No approved retention/privacy category is configured yet. This draft cannot be published.</span></div>
        <p className="cmsFormFlagNote">Creating this draft does not publish it or enable public submissions. No email is sent.</p>
        <div className="cmsFormCreateActions"><button className="boCmsQuiet" type="button" onClick={() => setSelectedTemplate(null)} disabled={busy}>Cancel</button><button className="boCmsPrimary" type="submit" disabled={busy||!formName.trim()||!publicTitle.trim()||!handle.trim()||purpose.trim().length<2}><FilePlus2 size={15}/>{busy?'Creating draft…':'Create Contact draft'}</button></div>
      </> : <div className="cmsFormFutureNote"><p>This template is visible in the registry but cannot create a record yet. It will be enabled in {milestoneFor(selectedTemplate.template_key)}.</p><button className="boCmsQuiet" type="button" onClick={() => setSelectedTemplate(null)}>Choose another template</button></div>}
    </form>}
  </div>;

  return <div className="boCmsStudio cmsFormStudio">
    <section className="boPanel boCmsIntro"><div><span className="boCmsKicker">CONTENT · PHASE 2 · M2.6</span><h2>Forms</h2><p>Build reusable forms separately from pages. Existing applicant forms remain protected operational integrations.</p></div><div className="boCmsIntroActions"><button className="boCmsQuiet" type="button" onClick={load} disabled={loading}>Refresh</button>{canManage&&<button className="boCmsPrimary" type="button" onClick={startCreate}><FilePlus2 size={15}/> Create form</button>}</div></section>
    {!canManage && <div className="boCmsAlert" role="alert">Form Studio is restricted to active Super Admins.</div>}
    {error && <div className="boCmsAlert" role="alert">{error}<button type="button" onClick={load}>Retry</button></div>}
    {notice && <div className="boCmsNotice" role="status">{notice}</div>}
    {enabled === false && <div className="boCmsAlert" role="alert">Form Studio is currently disabled by its administrator feature flag.</div>}
    {publicSubmissionsEnabled && <div className="boCmsNotice" role="status">Public submissions are enabled.</div>}
    {canManage && enabled && <section className="boPanel boCmsListPanel">
      <div className="boCmsFilters"><label className="boCmsSearch"><Search size={15}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search form name or handle" aria-label="Search forms"/></label><label><span>Status</span><select value={status} onChange={event=>setStatus(event.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="paused">Paused</option><option value="archived">Archived</option><option value="protected">Protected integrations</option></select></label><label><span>Template</span><select value={template} onChange={event=>setTemplate(event.target.value)}><option value="all">All templates</option>{templates.map(item=><option value={item.template_key} key={item.template_key}>{item.name}</option>)}<option value="attendee_protected">Attendee protected</option><option value="volunteer_protected">Volunteer protected</option></select></label></div>
      {loading ? <div className="boCmsEmpty" role="status">Loading forms…</div> : forms.length ? <div className="boCmsTableWrap"><table className="boCmsTable"><thead><tr><th>Form name</th><th>Type</th><th>State</th><th>Responses</th><th>Last updated</th><th>Embedded pages</th><th>Actions</th></tr></thead><tbody>{forms.map(form=><tr key={form.id}><td><strong>{form.name}</strong><small>{form.kind==='protected'?'Code-owned integration':`/forms/${form.handle}`}</small></td><td>{form.kind==='protected'?'Protected':templates.find(item=>item.template_key===form.template_key)?.name||form.template_key}</td><td><span className={'boCmsStatus boCmsStatus--'+form.status}>{statusLabel(form.status)}</span></td><td>{form.response_count==null?'—':Number(form.response_count).toLocaleString('en-IN')}</td><td>{dateLabel(form.updated_at)}{form.updated_by&&<small>{form.updated_by}</small>}</td><td>{form.embedded_pages==null?'—':form.embedded_pages}</td><td>{form.kind==='protected'?<a className="cmsFormIntegrationLink" href={form.public_path} target="_blank" rel="noreferrer"><LockKeyhole size={13}/> View integration <ExternalLink size={12}/></a>:<div className="boCmsRowActions"><button type="button" onClick={()=>setEditingId(form.id)}><Pencil size={14}/> Edit draft</button><button type="button" onClick={()=>setEditingId(form.id)}><ExternalLink size={14}/> Preview</button><button type="button" onClick={()=>setSubmissionsId(form.id)}>Responses ({form.response_count||0})</button></div>}</td></tr>)}</tbody></table></div> : <div className="boCmsEmpty"><ClipboardList size={25}/><strong>{query||status!=='all'||template!=='all'?'No forms match these filters.':'No forms yet.'}</strong><span>{query||status!=='all'||template!=='all'?'Clear a filter to see other forms.':'Create a Contact draft to start. Public submissions remain disabled.'}</span>{!query&&status==='all'&&template==='all'&&<button className="boCmsPrimary" type="button" onClick={startCreate}><FilePlus2 size={15}/> Create your first form</button>}</div>}
    </section>}
    <p className="cmsFormFlagNote">Draft editing and local preview are available. Public publishing, submissions and notifications remain blocked until their approvals and security controls are in place.</p>
  </div>;
}
