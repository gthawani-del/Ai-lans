'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Trash2, X } from 'lucide-react';

const EDITABLE = ['hero', 'rich_text', 'image_text', 'cta', 'faq'];
const makeId = () => globalThis.crypto?.randomUUID?.() || ('section-' + Date.now() + '-' + Math.random().toString(36).slice(2));
const defaults = {
  hero: { eyebrow: '', heading: '', body: '', cta_label: '', cta_href: '' },
  rich_text: { heading: '', body: '' },
  image_text: { heading: '', body: '', image_url: '', alt: '' },
  cta: { heading: '', body: '', label: '', href: '' },
  faq: { heading: '', items: [{ question: '', answer: '' }] },
};
const titleCase = value => value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

function sectionText(section) {
  const props = section.props || {};
  if (section.type === 'hero') return [props.eyebrow, props.heading, props.body, props.cta_label, props.cta_href].some(Boolean);
  if (section.type === 'rich_text') return Boolean(props.heading || props.body);
  if (section.type === 'image_text') return Boolean(props.heading || props.body || props.image_url || props.alt);
  if (section.type === 'cta') return Boolean(props.heading || props.body || props.label || props.href);
  if (section.type === 'faq') return Boolean(props.heading || (props.items || []).some(item => item.question || item.answer));
  return false;
}

export function PreviewSection({ section }) {
  if (section.visible === false) return null;
  const props = section.props || {};
  if (section.type === 'hero') return <section className="cmsLiveHero"><small>{props.eyebrow}</small><h1>{props.heading || 'Your page headline'}</h1><p>{props.body || 'Add a concise introduction for this page.'}</p>{props.cta_label && <a href={props.cta_href || '#'}>{props.cta_label}</a>}</section>;
  if (section.type === 'rich_text') return <section className="cmsLiveText">{props.heading && <h2>{props.heading}</h2>}<p>{props.body || 'Write your page content here.'}</p></section>;
  if (section.type === 'image_text') return <section className="cmsLiveImageText">{props.image_url && <img src={props.image_url} alt={props.alt || ''}/>}<div>{props.heading && <h2>{props.heading}</h2>}<p>{props.body || 'Add supporting copy for this image.'}</p></div></section>;
  if (section.type === 'cta') return <section className="cmsLiveCta">{props.heading && <h2>{props.heading}</h2>}{props.body && <p>{props.body}</p>}{props.label && <a href={props.href || '#'}>{props.label}</a>}</section>;
  if (section.type === 'faq') return <section className="cmsLiveFaq">{props.heading && <h2>{props.heading}</h2>}{(props.items || []).map((item, index) => <div key={index}><h3>{item.question || 'Question'}</h3><p>{item.answer || 'Answer'}</p></div>)}</section>;
  return null;
}

function Field({ label, value, onChange, multiline = false, placeholder = '' }) {
  return <label className="cmsEditField"><span>{label}</span>{multiline
    ? <textarea value={value || ''} onChange={event => onChange(event.target.value)} rows={4} placeholder={placeholder}/>
    : <input value={value || ''} onChange={event => onChange(event.target.value)} placeholder={placeholder}/>}</label>;
}

export default function CmsPageEditor({ initial, supabase, onClose, onSaved }) {
  const [pageTitle, setPageTitle] = useState(initial.page?.title || '');
  const [sections, setSections] = useState((initial.revision?.document?.sections || []).map(section => ({ ...section, props: { ...(section.props || {}) }, visible: section.visible !== false })));
  const [selectedId, setSelectedId] = useState(sections[0]?.id || '');
  const [device, setDevice] = useState('desktop');
  const [mobileTab, setMobileTab] = useState('edit');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revisionNumber, setRevisionNumber] = useState(Number(initial.revision?.revision_number || 1));
  const supported = useMemo(() => (initial.template?.allowed_sections || []).filter(type => EDITABLE.includes(type)), [initial.template]);
  const selected = sections.find(section => section.id === selectedId) || null;
  const canEdit = initial.page?.status === 'draft';

  function addSection(type) {
    const section = { id: makeId(), type, schema_version: 1, props: { ...defaults[type] }, order: sections.length, visible: true };
    setSections(current => [...current, section]); setSelectedId(section.id); setNotice('');
  }
  function patchSection(id, patch) { setSections(current => current.map(section => section.id === id ? { ...section, ...patch } : section)); }
  function patchProps(id, key, value) { setSections(current => current.map(section => section.id === id ? { ...section, props: { ...section.props, [key]: value } } : section)); }
  function moveSection(index, offset) {
    const next = [...sections], target = index + offset;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next.map((section, order) => ({ ...section, order })));
  }
  async function saveDraft() {
    setBusy(true); setError(''); setNotice('');
    try {
      const document = { ...(initial.revision?.document || {}), version: 1, sections: sections.map((section, order) => ({ ...section, order })) };
      const { data, error: rpcError } = await supabase.rpc('cms_admin_save_page_draft', {
        p_page_id: initial.page.id,
        p_expected_revision: revisionNumber,
        p_title: pageTitle.trim(),
        p_document: document,
      });
      if (rpcError) throw rpcError;
      const nextRevision = Number(data?.revision?.revision_number || revisionNumber + 1);
      setRevisionNumber(nextRevision);
      setNotice('Draft saved as revision ' + nextRevision + '. It is still private and unpublished.');
      onSaved?.(data);
    } catch (cause) {
      setError(cause?.message || 'Could not save this draft. Reload it to check for a newer revision.');
    } finally { setBusy(false); }
  }
  function updateFaq(index, key, value) {
    const items = [...(selected?.props?.items || [])]; items[index] = { ...items[index], [key]: value }; patchProps(selected.id, 'items', items);
  }

  return <div className="boCmsOverlay boCmsEditorOverlay" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section className="boCmsEditorDialog" role="dialog" aria-modal="true" aria-labelledby="cmsEditorTitle">
      <header className="boCmsEditorHeader"><div><span className="boCmsKicker">PAGE EDITOR · PRIVATE DRAFT</span><strong id="cmsEditorTitle">{pageTitle || 'Untitled page'}</strong><small>Revision {revisionNumber} · {initial.template?.name}</small></div><div className="boCmsEditorHeaderActions"><button type="button" className="boCmsQuiet" onClick={saveDraft} disabled={busy || !canEdit || pageTitle.trim().length < 2}><Save size={15}/>{busy ? 'Saving…' : 'Save draft'}</button><button className="boCmsClose" type="button" onClick={onClose} aria-label="Close editor" disabled={busy}><X size={17}/></button></div></header>
      {!canEdit && <div className="boCmsAlert">This page is {initial.page?.status}. Editing is currently limited to draft pages.</div>}
      {error && <div className="boCmsAlert" role="alert">{error}</div>}{notice && <div className="boCmsNotice" role="status">{notice}</div>}
      <div className="cmsEditorMobileTabs"><button type="button" aria-pressed={mobileTab === 'edit'} onClick={() => setMobileTab('edit')}>Edit</button><button type="button" aria-pressed={mobileTab === 'preview'} onClick={() => setMobileTab('preview')}>Preview</button></div>
      <div className="boCmsEditorBody">
        <div className={'boCmsEditorControls ' + (mobileTab === 'preview' ? 'cmsMobileHidden' : '')}>
          <label className="cmsEditField"><span>Page title</span><input value={pageTitle} maxLength={160} onChange={event => setPageTitle(event.target.value)}/></label>
          <div className="cmsSectionHeading"><div><b>Sections</b><small>Arrange and edit the visible content blocks.</small></div><span>{sections.length}</span></div>
          <div className="cmsSectionList">{sections.map((section, index) => <div className={'cmsSectionItem ' + (section.id === selectedId ? 'isSelected' : '')} key={section.id}>
            <button className="cmsSectionSelect" type="button" onClick={() => setSelectedId(section.id)}><b>{titleCase(section.type)}</b><small>{sectionText(section) ? 'Content added' : 'Needs content'} · {section.visible === false ? 'Hidden' : 'Visible'}</small></button>
            <div className="cmsSectionActions"><button type="button" aria-label="Move section up" title="Move up" disabled={index === 0} onClick={() => moveSection(index, -1)}><ArrowUp size={14}/></button><button type="button" aria-label="Move section down" title="Move down" disabled={index === sections.length - 1} onClick={() => moveSection(index, 1)}><ArrowDown size={14}/></button><button type="button" aria-label={section.visible === false ? 'Show section' : 'Hide section'} title={section.visible === false ? 'Show section' : 'Hide section'} onClick={() => patchSection(section.id, { visible: section.visible === false })}>{section.visible === false ? <Eye size={14}/> : <EyeOff size={14}/>}</button><button type="button" aria-label="Delete section" title="Delete section" onClick={() => {const next = sections.filter(item => item.id !== section.id);setSections(next);setSelectedId(next[0]?.id || '');}}><Trash2 size={14}/></button></div>
          </div>)}</div>
          <label className="cmsAddSection"><span>Add section</span><select value="" onChange={event => {if (event.target.value) addSection(event.target.value);}} disabled={!canEdit}><option value="">Choose a section type…</option>{supported.map(type => <option key={type} value={type}>{titleCase(type)}</option>)}</select></label>
          {selected && <div className="cmsSectionFields"><div className="cmsSectionFieldsHeader"><b>Edit {titleCase(selected.type)}</b><small>Text is rendered as plain text; no HTML or scripts are accepted.</small></div>
            {selected.type === 'hero' && <><Field label="Eyebrow" value={selected.props.eyebrow} onChange={value => patchProps(selected.id, 'eyebrow', value)}/><Field label="Heading" value={selected.props.heading} onChange={value => patchProps(selected.id, 'heading', value)}/><Field label="Introduction" value={selected.props.body} multiline onChange={value => patchProps(selected.id, 'body', value)}/><Field label="Button label" value={selected.props.cta_label} onChange={value => patchProps(selected.id, 'cta_label', value)}/><Field label="Button URL" value={selected.props.cta_href} onChange={value => patchProps(selected.id, 'cta_href', value)} placeholder="/register or https://…"/></>}
            {selected.type === 'rich_text' && <><Field label="Section heading" value={selected.props.heading} onChange={value => patchProps(selected.id, 'heading', value)}/><Field label="Content" value={selected.props.body} multiline onChange={value => patchProps(selected.id, 'body', value)} placeholder="Write your page content…"/></>}
            {selected.type === 'image_text' && <><Field label="Heading" value={selected.props.heading} onChange={value => patchProps(selected.id, 'heading', value)}/><Field label="Content" value={selected.props.body} multiline onChange={value => patchProps(selected.id, 'body', value)}/><Field label="Image path" value={selected.props.image_url} onChange={value => patchProps(selected.id, 'image_url', value)} placeholder="/images/approved-image.webp"/><Field label="Image alt text" value={selected.props.alt} onChange={value => patchProps(selected.id, 'alt', value)}/><small>Use a site asset path starting with one slash. Media Library selection comes in M2.5.</small></>}
            {selected.type === 'cta' && <><Field label="Heading" value={selected.props.heading} onChange={value => patchProps(selected.id, 'heading', value)}/><Field label="Supporting text" value={selected.props.body} multiline onChange={value => patchProps(selected.id, 'body', value)}/><Field label="Button label" value={selected.props.label} onChange={value => patchProps(selected.id, 'label', value)}/><Field label="Button URL" value={selected.props.href} onChange={value => patchProps(selected.id, 'href', value)} placeholder="/register or https://…"/></>}
            {selected.type === 'faq' && <><Field label="Section heading" value={selected.props.heading} onChange={value => patchProps(selected.id, 'heading', value)}/>{(selected.props.items || []).map((item, index) => <div className="cmsFaqFields" key={index}><b>Question {index + 1}</b><Field label="Question" value={item.question} onChange={value => updateFaq(index, 'question', value)}/><Field label="Answer" value={item.answer} multiline onChange={value => updateFaq(index, 'answer', value)}/><button className="cmsTextButton" type="button" onClick={() => patchProps(selected.id, 'items', selected.props.items.filter((_, itemIndex) => itemIndex !== index))}>Remove question</button></div>)}<button className="boCmsQuiet" type="button" onClick={() => patchProps(selected.id, 'items', [...(selected.props.items || []), { question: '', answer: '' }])}><Plus size={14}/> Add question</button></>}
          </div>}
          {!selected && <p className="cmsNoSection">Select a section to edit it, or add one above.</p>}
        </div>
        <div className={'boCmsEditorPreview ' + (mobileTab === 'edit' ? 'cmsMobileHidden' : '')}>
          <div className="cmsPreviewToolbar"><span>Preview · unsaved changes appear here</span><div role="group" aria-label="Preview size"><button type="button" aria-pressed={device === 'desktop'} onClick={() => setDevice('desktop')}>Desktop</button><button type="button" aria-pressed={device === 'mobile'} onClick={() => setDevice('mobile')}>Mobile</button></div></div>
          <div className={'cmsLiveCanvas cmsLiveCanvas--' + device}><div className="cmsLivePage"><header><small>{initial.template?.name}</small></header><h1 className="cmsLivePageTitle">{pageTitle || 'Untitled page'}</h1>{sections.filter(section => section.visible !== false).map(section => <PreviewSection key={section.id} section={section}/>)}{!sections.filter(section => section.visible !== false).length && <p className="cmsLiveEmpty">Add a section to begin writing this page.</p>}</div></div>
        </div>
      </div>
      <footer className="boCmsEditorFooter"><span>Draft pages are private. Saving does not change the public website.</span><button type="button" className="boCmsPrimary" onClick={saveDraft} disabled={busy || !canEdit || pageTitle.trim().length < 2}><Save size={15}/>{busy ? 'Saving…' : 'Save draft'}</button></footer>
    </section>
  </div>;
}
