'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ClipboardList, FilePlus2, LockKeyhole, Search } from 'lucide-react';

const dateLabel = value => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const statusLabel = value => ({ protected: 'Protected integration', published: 'Published', paused: 'Paused', archived: 'Archived', draft: 'Draft' }[value] || value);

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
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
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

  if (creating) return <div className="boCmsStudio cmsFormStudio">
    <section className="boPanel boCmsIntro"><div><span className="boCmsKicker">CONTENT · PHASE 2 · M2.6-A</span><h2>Choose a form template</h2><p>Templates start as drafts. The Contact draft editor is the next Form Studio rollout.</p></div><button className="boCmsQuiet" type="button" onClick={() => { setCreating(false); setSelectedTemplate(null); }}><ArrowLeft size={15}/> Back to Forms</button></section>
    {error && <div className="boCmsAlert" role="alert">{error}</div>}
    <section className="boPanel cmsFormTemplateGrid" aria-label="Available form templates">
      {filteredTemplates.map(item => <button type="button" className={'cmsFormTemplate '+(selectedTemplate?.template_key===item.template_key?'isSelected':'')} key={item.template_key} onClick={() => setSelectedTemplate(item)}>
        <span className="cmsFormTemplateIcon"><ClipboardList size={19}/></span><strong>{item.name}</strong><small>{item.summary}</small><em>{item.complexity} · draft only</em>
      </button>)}
    </section>
    {selectedTemplate && <section className="boPanel cmsFormSelection" aria-live="polite"><div><span className="boCmsKicker">SELECTED TEMPLATE</span><h3>{selectedTemplate.name}</h3><p>{selectedTemplate.summary}</p><small>{selectedTemplate.starter_definition?.fields?.length || 0} starter fields · nothing has been saved or published in M2.6-A.</small></div><button className="boCmsPrimary" type="button" disabled><FilePlus2 size={15}/> Draft editor in M2.6-B</button></section>}
    <p className="cmsFormFlagNote">Public submissions are disabled until the required privacy, retention and security approvals are recorded.</p>
  </div>;

  return <div className="boCmsStudio cmsFormStudio">
    <section className="boPanel boCmsIntro"><div><span className="boCmsKicker">CONTENT · PHASE 2 · M2.6-A</span><h2>Forms</h2><p>Manage reusable forms separately from pages. Existing applicant forms remain protected operational integrations.</p></div><div className="boCmsIntroActions"><button className="boCmsQuiet" type="button" onClick={load} disabled={loading}>Refresh</button>{canManage&&<button className="boCmsPrimary" type="button" onClick={() => { setCreating(true); setSelectedTemplate(null); }}><FilePlus2 size={15}/> Create form</button>}</div></section>
    {!canManage && <div className="boCmsAlert" role="alert">Form Studio is restricted to active Super Admins.</div>}
    {error && <div className="boCmsAlert" role="alert">{error}<button type="button" onClick={load}>Retry</button></div>}
    {enabled === false && <div className="boCmsAlert" role="alert">Form Studio is currently disabled by its administrator feature flag.</div>}
    {publicSubmissionsEnabled && <div className="boCmsNotice" role="status">Public submissions are enabled.</div>}
    {canManage && enabled && <section className="boPanel boCmsListPanel">
      <div className="boCmsFilters"><label className="boCmsSearch"><Search size={15}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search form name or ID" aria-label="Search forms"/></label><label><span>Status</span><select value={status} onChange={event=>setStatus(event.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="paused">Paused</option><option value="archived">Archived</option><option value="protected">Protected integrations</option></select></label><label><span>Template</span><select value={template} onChange={event=>setTemplate(event.target.value)}><option value="all">All templates</option>{templates.map(item=><option value={item.template_key} key={item.template_key}>{item.name}</option>)}<option value="attendee_protected">Attendee protected</option><option value="volunteer_protected">Volunteer protected</option></select></label></div>
      {loading ? <div className="boCmsEmpty" role="status">Loading forms…</div> : forms.length ? <div className="boCmsTableWrap"><table className="boCmsTable"><thead><tr><th>Form name</th><th>Type</th><th>State</th><th>Responses</th><th>Last updated</th><th>Embedded pages</th><th>Actions</th></tr></thead><tbody>{forms.map(form=><tr key={form.id}><td><strong>{form.name}</strong><small>{form.kind==='protected'?'Code-owned integration':form.handle}</small></td><td>{form.kind==='protected'?'Protected':templates.find(item=>item.template_key===form.template_key)?.name||form.template_key}</td><td><span className={'boCmsStatus boCmsStatus--'+form.status}>{statusLabel(form.status)}</span></td><td>{form.response_count==null?'—':Number(form.response_count).toLocaleString('en-IN')}</td><td>{dateLabel(form.updated_at)}{form.updated_by&&<small>{form.updated_by}</small>}</td><td>{form.embedded_pages==null?'—':form.embedded_pages}</td><td>{form.kind==='protected'?<a className="cmsFormIntegrationLink" href={form.public_path} target="_blank" rel="noreferrer"><LockKeyhole size={13}/> View integration</a>:<span className="cmsFormNextAction">Form actions arrive in M2.6-B</span>}</td></tr>)}</tbody></table></div> : <div className="boCmsEmpty"><ClipboardList size={25}/><strong>{query||status!=='all'||template!=='all'?'No forms match these filters.':'No forms yet.'}</strong><span>{query||status!=='all'||template!=='all'?'Clear a filter to see other forms.':'Create a form from an approved template when the editor is available.'}</span>{!query&&status==='all'&&template==='all'&&<button className="boCmsPrimary" type="button" onClick={() => { setCreating(true); setSelectedTemplate(null); }}><FilePlus2 size={15}/> Create your first form</button>}</div>}
    </section>}
    <p className="cmsFormFlagNote">Public submissions are disabled. No form can collect responses until privacy purpose, retention, consent and security approvals are verified.</p>
  </div>;
}
