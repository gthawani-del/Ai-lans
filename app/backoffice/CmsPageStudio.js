'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, Clock3, Copy, Eye, FileText, Pencil, Plus, RefreshCw, Search, ShieldCheck, X } from 'lucide-react';
import CmsPageEditor, { PreviewSection } from './CmsPageEditor';
import CmsPageHistory from './CmsPageHistory';

const STATUSES = ['all', 'draft', 'in_review', 'published', 'archived'];
const labelStatus = value => ({ in_review: 'In review', published: 'Published', archived: 'Archived', draft: 'Draft' }[value] || value);
const dateLabel = value => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const makeSlug = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9/ -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/\/+$/g, '').replace(/^\/+|\/+$/g, '').split('/').map(part => part.replace(/^-+|-+$/g, '')).filter(Boolean).join('/');

export default function CmsPageStudio({ session, profile, supabase }) {
  const [pages, setPages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialog, setDialog] = useState(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [preview, setPreview] = useState(null);
  const [editing, setEditing] = useState(null);
  const [history, setHistory] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const canManage = profile?.role === 'super_admin';

  const load = useCallback(async () => {
    if (!session || !canManage) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [templateResult, pageResult] = await Promise.all([
        supabase.rpc('cms_admin_list_templates'),
        supabase.rpc('cms_admin_list_pages', {
          p_status: statusFilter === 'all' ? null : statusFilter,
          p_template_id: templateFilter === 'all' ? null : templateFilter,
          p_search: query.trim() || null,
        }),
      ]);
      if (templateResult.error) throw templateResult.error;
      if (pageResult.error) throw pageResult.error;
      setTemplates(Array.isArray(templateResult.data) ? templateResult.data : []);
      setPages(Array.isArray(pageResult.data) ? pageResult.data : []);
    } catch (cause) {
      setError(cause?.message || 'Could not load Pages. Check that the CMS page-studio migration is deployed and your account has CMS access.');
    } finally { setLoading(false); }
  }, [session, canManage, statusFilter, templateFilter, query, supabase]);

  useEffect(() => { load(); }, [load]);

  const visiblePages = useMemo(() => pages, [pages]);
  function openCreate() {
    setTitle(''); setSlug(''); setSelectedTemplate(''); setSlugTouched(false); setDialog({ type: 'create' }); setError(''); setNotice('');
  }
  function openDuplicate(page) {
    const path = page.slug.includes('/') ? page.slug.slice(0, page.slug.lastIndexOf('/') + 1) + page.slug.slice(page.slug.lastIndexOf('/') + 1) + '-copy' : `${page.slug}-copy`;
    setTitle(`Copy of ${page.title}`); setSlug(path); setSelectedTemplate(page.template_id); setSlugTouched(true); setDialog({ type: 'duplicate', source: page }); setError(''); setNotice('');
  }
  async function savePage(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const args = dialog.type === 'duplicate'
        ? { p_page_id: dialog.source.id, p_new_title: title.trim(), p_new_slug: makeSlug(slug) }
        : { p_title: title.trim(), p_slug: makeSlug(slug), p_template_id: selectedTemplate };
      const { data, error: rpcError } = await supabase.rpc(dialog.type === 'duplicate' ? 'cms_admin_duplicate_page' : 'cms_admin_create_page', args);
      if (rpcError) throw rpcError;
      setDialog(null);
      setNotice(`${data?.page?.title || title} saved as a draft.`);
      await load();
    } catch (cause) { setError(cause?.message || 'The page could not be saved.'); }
    finally { setBusy(false); }
  }
  async function showPreview(page) {
    setError(''); setNotice(''); setBusy(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('cms_admin_get_page_preview', { p_page_id: page.id });
      if (rpcError) throw rpcError;
      setPreviewDevice('desktop');
      setPreview(data);
    } catch (cause) { setError(cause?.message || 'Could not open this draft preview.'); }
    finally { setBusy(false); }
  }
  async function showEditor(page) {
    setError(''); setNotice(''); setBusy(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('cms_admin_get_page_preview', { p_page_id: page.id });
      if (rpcError) throw rpcError;
      setEditing(data);
    } catch (cause) { setError(cause?.message || 'Could not open this page for editing.'); }
    finally { setBusy(false); }
  }
  async function showHistory(page) {
    setError(''); setNotice(''); setBusy(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('cms_admin_list_page_revisions', { p_page_id: page.id });
      if (rpcError) throw rpcError;
      setHistory({ page, revisions: Array.isArray(data) ? data : [] });
    } catch (cause) { setError(cause?.message || 'Could not load page history.'); }
    finally { setBusy(false); }
  }
  async function archivePage(page) {
    if (!window.confirm('Archive “' + page.title + '”? A published URL will stop resolving publicly. The page and its revisions will remain in the backoffice.')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { error: rpcError } = await supabase.rpc('cms_admin_archive_page', { p_page_id: page.id });
      if (rpcError) throw rpcError;
      setNotice('Page archived. Its history is retained.'); await load();
    } catch (cause) { setError(cause?.message || 'Could not archive this page.'); }
    finally { setBusy(false); }
  }

  return <div className="boCmsStudio">
    <section className="boPanel boCmsIntro">
      <div><span className="boCmsKicker">CONTENT · PHASE 2</span><h2>Pages</h2><p>Create pages, edit drafts, preview changes and publish approved content. Unpublished drafts stay private.</p></div>
      <div className="boCmsIntroActions"><button className="boCmsQuiet" type="button" onClick={load} disabled={loading}><RefreshCw size={15}/> Refresh</button>{canManage&&<button className="boCmsPrimary" type="button" onClick={openCreate}><Plus size={16}/> New page</button>}</div>
    </section>
    {!canManage&&<div className="boCmsAlert" role="alert">Page Studio access is restricted to active Super Admins. Your existing backoffice access is unchanged.</div>}
    {error&&<div className="boCmsAlert" role="alert">{error}<button type="button" onClick={load}>Retry</button></div>}
    {notice&&<div className="boCmsNotice" role="status">{notice}</div>}
    {canManage&&<section className="boPanel boCmsListPanel">
      <div className="boCmsFilters">
        <label className="boCmsSearch"><Search size={15}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search title or path" aria-label="Search pages"/></label>
        <label><span>Status</span><select value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}>{STATUSES.map(value=><option key={value} value={value}>{value==='all'?'All statuses':labelStatus(value)}</option>)}</select></label>
        <label><span>Template</span><select value={templateFilter} onChange={event=>setTemplateFilter(event.target.value)}><option value="all">All templates</option>{templates.map(item=><option value={item.template_id} key={item.template_id}>{item.name}</option>)}</select></label>
      </div>
      {loading?<div className="boCmsEmpty" role="status">Loading pages…</div>:visiblePages.length?<div className="boCmsTableWrap"><table className="boCmsTable"><thead><tr><th>Title / URL</th><th>Template</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{visiblePages.map(page=><tr key={page.id}>
        <td><strong>{page.title}</strong><small>/{page.slug}</small>{page.template_protected&&<em className="boCmsProtected"><ShieldCheck size={12}/> Protected content</em>}</td>
        <td>{page.template_name}<small>v{page.revision_number || 1}</small></td>
        <td><span className={`boCmsStatus boCmsStatus--${page.status}`}>{labelStatus(page.status)}</span></td>
        <td>{dateLabel(page.updated_at)}</td>
        <td><div className="boCmsRowActions">{canManage&&['draft','published'].includes(page.status)&&<button type="button" onClick={()=>showEditor(page)} disabled={busy}><Pencil size={14}/> Edit</button>}<button type="button" onClick={()=>showPreview(page)} disabled={busy}><Eye size={14}/> Preview</button>{canManage&&<button type="button" onClick={()=>showHistory(page)} disabled={busy}><Clock3 size={14}/> History</button>}{canManage&&<button type="button" onClick={()=>openDuplicate(page)}><Copy size={14}/> Duplicate</button>}{canManage&&page.status!=='archived'&&<button type="button" onClick={()=>archivePage(page)} disabled={busy}><Archive size={14}/> Archive</button>}</div>{page.has_unpublished_changes&&<small className="boCmsPendingEdits">Unpublished edits · live version unchanged</small>}</td>
      </tr>)}</tbody></table></div>:<div className="boCmsEmpty"><FileText size={25}/><strong>{query||statusFilter!=='all'||templateFilter!=='all'?'No pages match these filters.':'No CMS pages yet.'}</strong><span>{query||statusFilter!=='all'||templateFilter!=='all'?'Clear a filter to see other pages.':'Create your first page when you are ready. Existing public pages remain unchanged.'}</span>{canManage&&!query&&statusFilter==='all'&&templateFilter==='all'&&<button className="boCmsPrimary" type="button" onClick={openCreate}><Plus size={15}/> Create your first page</button>}</div>}
    </section>}

    {dialog&&<div className="boCmsOverlay" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)setDialog(null)}}><section className="boCmsDialog" role="dialog" aria-modal="true" aria-labelledby="boCmsDialogTitle">
      <button className="boCmsClose" type="button" onClick={()=>setDialog(null)} aria-label="Close"><X size={17}/></button>
      <span className="boCmsKicker">{dialog.type==='duplicate'?'DUPLICATE PAGE':'NEW PAGE'}</span><h2 id="boCmsDialogTitle">{dialog.type==='duplicate'?'Create a separate draft copy':'Choose a page template'}</h2>
      <form onSubmit={savePage}>
        {dialog.type==='create'&&<label><span>Template</span><select value={selectedTemplate} onChange={event=>setSelectedTemplate(event.target.value)} required><option value="" disabled>Select a template</option>{templates.map(item=><option key={item.template_id} value={item.template_id}>{item.name}{item.is_protected?' — protected':''}</option>)}</select></label>}
        {selectedTemplate&&templates.find(item=>item.template_id===selectedTemplate)?.is_protected&&<p className="boCmsLegalNote"><ShieldCheck size={15}/> Legal / trust drafts are protected. Publishing remains unavailable until a legal approval workflow is implemented.</p>}
        <label><span>Page title</span><input autoFocus value={title} maxLength={160} onChange={event=>{setTitle(event.target.value);if(!slugTouched)setSlug(makeSlug(event.target.value))}} required minLength={2} placeholder="e.g. About weareailabs"/></label>
        <label><span>URL path</span><div className="boCmsSlug"><b>/</b><input value={slug} maxLength={180} onChange={event=>{setSlug(event.target.value);setSlugTouched(true)}} required pattern="[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*" placeholder="about-weareailabs"/></div><small>Lowercase letters, numbers and hyphens. Existing and reserved paths are checked again on save.</small></label>
        {error&&<p className="boCmsInlineError" role="alert">{error}</p>}
        <div className="boCmsDialogActions"><button className="boCmsQuiet" type="button" onClick={()=>setDialog(null)} disabled={busy}>Cancel</button><button className="boCmsPrimary" type="submit" disabled={busy||!title.trim()||!slug.trim()||(dialog.type==='create'&&!selectedTemplate)}>{busy?'Saving draft…':dialog.type==='duplicate'?'Create duplicate draft':'Create draft'}</button></div>
      </form>
    </section></div>}

    {preview&&<div className="boCmsOverlay" onMouseDown={event=>{if(event.target===event.currentTarget)setPreview(null)}}><section className="boCmsPreviewDialog" role="dialog" aria-modal="true" aria-labelledby="boCmsPreviewTitle">
      <div className="boCmsPreviewBar"><div><span className="boCmsKicker">PAGE PREVIEW · NOINDEX</span><b>Responsive template preview</b></div><div className="boCmsPreviewTools"><div role="group" aria-label="Preview width"><button type="button" aria-pressed={previewDevice==='desktop'} onClick={()=>setPreviewDevice('desktop')}>Desktop</button><button type="button" aria-pressed={previewDevice==='mobile'} onClick={()=>setPreviewDevice('mobile')}>Mobile</button></div><button className="boCmsClose" type="button" onClick={()=>setPreview(null)} aria-label="Close preview"><X size={17}/></button></div></div>
      <div className={`boCmsViewport boCmsViewport--${previewDevice}`}><article className="boCmsPreviewPage"><small>{preview.template?.name} · Draft</small><h2 id="boCmsPreviewTitle">{preview.page?.title}</h2><p className="boCmsPreviewPath">/{preview.page?.slug}</p>{(preview.revision?.document?.sections||[]).length?<div className="cmsLiveSections">{preview.revision.document.sections.map((section,index)=><PreviewSection key={section.id||index} section={section}/>)}</div>:<p className="boCmsPreviewEmpty">This draft has no content sections yet. Select Edit to start writing. The live site is unchanged.</p>}</article></div>
    </section></div>}
    {editing&&<CmsPageEditor initial={editing} supabase={supabase} onClose={()=>setEditing(null)} onSaved={async data=>{await load();setNotice(data?.page?.status==='published'?'Draft saved. The current published page remains live until you publish these edits.':'Draft saved. The public page remains unchanged.');}} onPublished={async()=>{setEditing(null);await load();setNotice('Page published. Its public URL is now live.');}}/>}
    {history&&<CmsPageHistory entry={history} supabase={supabase} onClose={()=>setHistory(null)} onRestored={async()=>{const page=history.page;setHistory(null);await load();await showEditor(page);setNotice('A new draft was restored from the selected revision. The published version is unchanged until you publish it.');}}/>}
  </div>;
}
