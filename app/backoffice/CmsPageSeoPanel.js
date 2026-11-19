'use client';

import { useEffect, useMemo, useState } from 'react';
import { inspectAeoSignals, SEO_IMAGE_ASSETS, validateCmsSeo } from '../../lib/seo';

function CounterField({ label, value, onChange, maxLength, multiline = false, hint }) {
  const Control = multiline ? 'textarea' : 'input';
  return <label className="cmsEditField cmsSeoField"><span>{label}</span><Control value={value || ''} maxLength={maxLength} rows={multiline ? 4 : undefined} onChange={event => onChange(event.target.value)} /><small>{hint}<b>{(value || '').length}/{maxLength}</b></small></label>;
}

export default function CmsPageSeoPanel({ seo, onChange, pageTitle, slug, templateId, sections, supabase }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [mediaError, setMediaError] = useState('');
  useEffect(() => {
    let active = true;
    supabase.rpc('cms_admin_list_media', { p_query: null, p_status: 'approved', p_tag: null }).then(({ data, error }) => {
      if (!active) return;
      if (error) setMediaError('Approved Media Library images could not be loaded.');
      else setMediaAssets((Array.isArray(data) ? data : []).filter(item => item.public_path).map(item => ({ ...item, publicUrl: supabase.storage.from('cms-media-public').getPublicUrl(item.public_path).data.publicUrl })));
    });
    return () => { active = false; };
  }, [supabase]);
  const selectedMedia = mediaAssets.find(item => item.id === seo.og_image_asset_id);
  const asset = SEO_IMAGE_ASSETS[seo.og_image_asset_id] || (selectedMedia ? { src: selectedMedia.publicUrl, alt: selectedMedia.alt_text || 'Approved media library image', label: selectedMedia.file_name } : SEO_IMAGE_ASSETS.brand_home);
  const signals = useMemo(() => inspectAeoSignals({ pageTitle, sections, seo, templateId }), [pageTitle, sections, seo, templateId]);
  const validation = useMemo(() => validateCmsSeo(seo, { title: pageTitle, slug, templateId }), [seo, pageTitle, slug, templateId]);
  const metaTitle = seo.seo_title || pageTitle;
  const metaDescription = seo.meta_description || 'Add a search description to preview it here.';
  const canonical = seo.canonical_path || `/${slug}`;
  const update = (key, value) => onChange({ ...seo, [key]: value });

  return <div className="cmsSeoWorkspace">
    <div className="cmsSeoFields">
      <div className="cmsSeoHeading"><span className="boCmsKicker">SEARCH + SOCIAL</span><h3>Page metadata</h3><p>Counts are editing guidance. Search engines may rewrite titles and snippets.</p></div>
      {validation.errors.length > 0 && <div className="boCmsAlert cmsSeoValidation" role="status"><b>Fix before enabling indexing or publishing:</b><ul>{validation.errors.map((message,index)=><li key={index}>{message}</li>)}</ul></div>}
      <CounterField label="SEO title" value={seo.seo_title} onChange={value => update('seo_title', value)} maxLength={160} hint="Shown as the preferred search title. " />
      <CounterField label="Meta description" value={seo.meta_description} onChange={value => update('meta_description', value)} maxLength={320} multiline hint="A concise page summary. " />
      <label className="cmsEditField cmsSeoField"><span>Canonical path</span><input value={seo.canonical_path || ''} onChange={event => update('canonical_path', event.target.value)} placeholder={`/${slug}`} /><small>Internal path on weareailabs.com. Leave blank to use /{slug}.</small></label>
      <div className="cmsSeoSwitches">
        <label><input type="checkbox" checked={seo.indexable === true} onChange={event => update('indexable', event.target.checked)} /><span><b>Allow indexing</b><small>Published, canonical pages marked indexable enter the sitemap.</small></span></label>
        <label><input type="checkbox" checked={seo.follow_links !== false} onChange={event => update('follow_links', event.target.checked)} /><span><b>Allow following links</b><small>Controls the page's robots follow directive.</small></span></label>
      </div>
      <div className="cmsSeoHeading cmsSeoHeading--spaced"><span className="boCmsKicker">SOCIAL CARDS</span><h3>Open Graph and sharing</h3></div>
      <CounterField label="Social title" value={seo.og_title} onChange={value => update('og_title', value)} maxLength={160} hint="Falls back to the SEO title. " />
      <CounterField label="Social description" value={seo.og_description} onChange={value => update('og_description', value)} maxLength={320} multiline hint="Falls back to the meta description. " />
      <label className="cmsEditField cmsSeoField"><span>Social image</span><select value={seo.og_image_asset_id || 'brand_home'} onChange={event => {const id=event.target.value;const item=mediaAssets.find(asset=>asset.id===id);setImageFailed(false);setFallbackFailed(false);onChange({ ...seo, og_image_asset_id:id, og_image_url:item?.publicUrl || '', social_image_alt:seo.social_image_alt || item?.alt_text || '' });}}>{Object.entries(SEO_IMAGE_ASSETS).map(([id, item]) => <option value={id} key={id}>{item.label}</option>)}{mediaAssets.length>0&&<optgroup label="Approved Media Library">{mediaAssets.map(item=><option value={item.id} key={item.id}>{item.file_name}</option>)}</optgroup>}</select><small>{mediaError || (mediaAssets.length ? 'Only approved, rights-cleared library images are listed.' : 'No approved Media Library images are available yet.')}</small></label>
      <label className="cmsEditField cmsSeoField"><span>Social image alt text</span><input value={seo.social_image_alt || ''} maxLength={300} onChange={event => update('social_image_alt', event.target.value)} placeholder={asset.alt} /></label>
      <label className="cmsEditField cmsSeoField"><span>Locale</span><input value={seo.locale || 'en-IN'} maxLength={20} onChange={event => update('locale', event.target.value)} placeholder="en-IN" /></label>
      <label className="cmsEditField cmsSeoField"><span>Structured data</span><select value={seo.structured_data_type || 'WebPage'} onChange={event => update('structured_data_type', event.target.value)}><option value="WebPage">Web page</option>{templateId === 'editorial_article' && <option value="Article">Article</option>}</select><small>Options depend on the page template. FAQ rich-result markup is not generated.</small></label>
      <label className="cmsEditField cmsSeoField"><span>Open Graph type</span><select value={seo.og_type || 'website'} onChange={event => update('og_type', event.target.value)}><option value="website">Website</option>{templateId === 'editorial_article' && <option value="article">Article</option>}</select></label>
      {templateId === 'editorial_article' && <>
        {seo.structured_data_type === 'Article' && <label className="cmsEditField cmsSeoField"><span>Author</span><input value={seo.author_name || ''} maxLength={120} onChange={event => update('author_name', event.target.value)} placeholder="Author name" /></label>}
        <label className="cmsEditField cmsSeoField"><span>References</span><textarea value={(seo.references || []).join('\n')} rows={4} onChange={event => update('references', event.target.value.split('\n').map(value => value.trim()).filter(Boolean))} placeholder="One HTTPS source URL per line" /><small>References are emitted as Article citations. Use HTTPS links.</small></label>
      </>}
    </div>
    <aside className="cmsSeoPreviews">
      <section className="cmsSeoPreviewCard"><span className="boCmsKicker">SEARCH RESULT PREVIEW</span><div className="cmsSearchResult"><div className="cmsSearchBrand"><img src="/favicon.ico" alt=""/><span>weareailabs.com</span></div><b>{metaTitle}</b><small>https://weareailabs.com{canonical}</small><p>{metaDescription}</p></div><small className="cmsSeoDisclaimer">Preview only. Google may generate its own title or snippet.</small></section>
      <section className="cmsSeoPreviewCard"><span className="boCmsKicker">SOCIAL CARD PREVIEW</span><div className="cmsSocialCard">{!fallbackFailed ? <img src={imageFailed ? SEO_IMAGE_ASSETS.brand_home.src : (seo.og_image_url || asset.src)} alt={imageFailed ? SEO_IMAGE_ASSETS.brand_home.alt : (seo.social_image_alt || asset.alt)} onError={() => imageFailed ? setFallbackFailed(true) : setImageFailed(true)} /> : <div className="cmsSocialCardFallback">Brand fallback image unavailable</div>}{imageFailed&&!fallbackFailed&&<small className="cmsSeoImageWarning">Selected image unavailable · using approved weareailabs brand image</small>}<div><b>{seo.og_title || metaTitle}</b><p>{seo.og_description || metaDescription}</p><small>weareailabs.com</small></div></div></section>
      <section className="cmsSeoPreviewCard"><span className="boCmsKicker">BASIC AEO CHECKS</span><p className="cmsAeoNote">Editorial signals only; this is not a score or a citation guarantee.</p><ul className="cmsAeoList">{signals.map((signal, index) => <li className={signal.pass ? 'isPass' : ''} key={index}><span aria-hidden="true">{signal.pass ? '✓' : '○'}</span><div><b>{signal.label}</b><small>{signal.detail}</small></div></li>)}</ul></section>
    </aside>
  </div>;
}
