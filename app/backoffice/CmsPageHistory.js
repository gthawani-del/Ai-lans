'use client';

import { useState } from 'react';
import { Clock3, RotateCcw, X } from 'lucide-react';

const formatDate = value => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function CmsPageHistory({ entry, supabase, onClose, onRestored }) {
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  async function restore(revision) {
    if (!window.confirm('Restore revision ' + revision.revision_number + ' as a new draft? Existing revisions will be kept.')) return;
    setBusyId(revision.id); setError('');
    try {
      const { error: rpcError } = await supabase.rpc('cms_admin_restore_page_revision', {
        p_page_id: entry.page.id,
        p_revision_id: revision.id,
        p_expected_revision: Number(entry.page.revision_number || 1),
      });
      if (rpcError) throw rpcError;
      await onRestored?.(revision);
    } catch (cause) { setError(cause?.message || 'Could not restore this revision.'); }
    finally { setBusyId(''); }
  }
  return <div className="boCmsOverlay" onMouseDown={event => { if (event.target === event.currentTarget && !busyId) onClose(); }}>
    <section className="boCmsHistoryDialog" role="dialog" aria-modal="true" aria-labelledby="cmsHistoryTitle">
      <header><div><span className="boCmsKicker">PAGE HISTORY</span><h2 id="cmsHistoryTitle">{entry.page.title}</h2><p>Each save creates a new revision. Restore makes a new draft; it never rewrites history.</p></div><button className="boCmsClose" type="button" onClick={onClose} aria-label="Close history" disabled={!!busyId}><X size={17}/></button></header>
      {error && <div className="boCmsAlert" role="alert">{error}</div>}
      <ol className="boCmsHistoryList">{entry.revisions.map(revision => <li key={revision.id}>
        <div className="boCmsHistoryDot" aria-hidden="true"/><div className="boCmsHistoryCopy"><strong>Revision {revision.revision_number}</strong><span>{revision.change_summary || 'Saved page content'}</span><small>{formatDate(revision.created_at)} · {revision.created_by}</small><div className="boCmsHistoryBadges">{revision.is_published&&<em>Published</em>}{revision.is_draft&&<em>Current draft</em>}</div></div>
        {!revision.is_draft&&<button className="boCmsQuiet" type="button" onClick={()=>restore(revision)} disabled={!!busyId}><RotateCcw size={14}/>{busyId===revision.id?'Restoring…':'Restore to draft'}</button>}
      </li>)}</ol>
    </section>
  </div>;
}
