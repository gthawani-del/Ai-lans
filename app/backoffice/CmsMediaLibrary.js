'use client';

import { useCallback, useEffect, useState } from 'react';
import { ImagePlus, RefreshCw, Search, Archive, Check } from 'lucide-react';

export default function CmsMediaLibrary({ supabase }) {
  const [items,setItems]=useState([]),[query,setQuery]=useState(''),[status,setStatus]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const load=useCallback(async()=>{setLoading(true);setError('');const {data,error}=await supabase.rpc('cms_admin_list_media',{p_query:query||null,p_status:status||null,p_tag:null});if(error)setError(error.message);else setItems(Array.isArray(data)?data:[]);setLoading(false)},[supabase,query,status]);
  useEffect(()=>{load()},[load]);
  async function upload(file,replaces=null){
    if(!file)return;
    if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)||file.size>10*1024*1024){setError('Choose a JPG, PNG, WebP or AVIF image up to 10 MB.');return}
    setBusy(true);setError('');setNotice('');let path='';
    try{
      const {data:{user}}=await supabase.auth.getUser();if(!user)throw Error('Sign in again to upload media.');
      const id=crypto.randomUUID();path=`${user.id}/${id}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-').slice(-150)}`;
      const up=await supabase.storage.from('cms-media-private').upload(path,file,{contentType:file.type,upsert:false});if(up.error)throw up.error;
      if(replaces){
        const current=items.find(item=>item.id===replaces);if(!current)throw Error('Refresh the library and try replacing this asset again.');
        if(current.status==='approved'&&current.public_path){
          const put=await supabase.storage.from('cms-media-public').upload(current.public_path,file,{contentType:file.type,upsert:true});
          if(put.error)throw put.error;
        }
        const {error}=await supabase.rpc('cms_admin_replace_media',{p_id:current.id,p_storage_path:path,p_file_name:file.name,p_mime_type:file.type,p_file_size:file.size,p_width:null,p_height:null});
        if(error){
          if(current.status==='approved'&&current.public_path){const old=await supabase.storage.from('cms-media-private').download(current.storage_path);if(!old.error)await supabase.storage.from('cms-media-public').upload(current.public_path,old.data,{contentType:current.mime_type,upsert:true});}
          throw error;
        }
        setNotice('Asset replaced. Existing page and social image references remain connected.');
      }else{
        const {error}=await supabase.rpc('cms_admin_register_media',{p_storage_path:path,p_file_name:file.name,p_mime_type:file.type,p_file_size:file.size,p_width:null,p_height:null,p_alt:'',p_caption:'',p_source_url:'',p_rights_notes:'',p_tags:[],p_replaces:null});
        if(error)throw error;
        setNotice('Uploaded privately. Add alt text and rights notes, then approve before public use.');
      }
      await load();
    }catch(e){if(path)await supabase.storage.from('cms-media-private').remove([path]);setError(e.message||'Upload failed.')}finally{setBusy(false)}
  }
  async function update(item,patch){setBusy(true);setError('');try{let publicPath=item.public_path;if(patch.status==='approved'&&!publicPath){publicPath=`${item.id}/${item.file_name.replace(/[^a-zA-Z0-9._-]/g,'-')}`;const copy=await supabase.storage.from('cms-media-private').download(item.storage_path);if(copy.error)throw copy.error;const put=await supabase.storage.from('cms-media-public').upload(publicPath,copy.data,{contentType:item.mime_type,upsert:false});if(put.error)throw put.error}const {error}=await supabase.rpc('cms_admin_update_media',{p_id:item.id,p_alt:patch.alt_text??item.alt_text,p_caption:patch.caption??item.caption,p_source_url:patch.source_url??item.source_url,p_rights_notes:patch.rights_notes??item.rights_notes,p_tags:patch.tags??item.tags,p_status:patch.status||null,p_public_path:publicPath});if(error)throw error;if(patch.status==='archived'&&item.public_path){const removed=await supabase.storage.from('cms-media-public').remove([item.public_path]);if(removed.error)throw Error('Asset archived, but public file cleanup failed: '+removed.error.message)}setNotice(patch.status==='approved'?'Asset approved and available publicly.':patch.status==='archived'?'Asset archived and removed from public storage.':'Asset updated.');await load()}catch(e){setError(e.message||'Could not update this asset.')}finally{setBusy(false)}}
  return <div className="boCmsStudio cmsMediaLibrary"><section className="boPanel boCmsIntro"><div><span className="boCmsKicker">CONTENT · PHASE 2</span><h2>Media Library</h2><p>Private uploads stay private until an administrator records rights and approves them for public use.</p></div><label className="boCmsPrimary cmsMediaUpload"><ImagePlus size={16}/> {busy?'Working…':'Upload media'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={e=>{upload(e.target.files?.[0]);e.target.value=''}}/></label></section>
    {error&&<div className="boCmsAlert" role="alert">{error}</div>}{notice&&<div className="boCmsNotice" role="status">{notice}</div>}
    <section className="boPanel boCmsListPanel"><div className="boCmsFilters"><label className="boCmsSearch"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search file name or alt text"/></label><label><span>Status</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option><option value="draft">Private draft</option><option value="approved">Approved</option><option value="archived">Archived</option></select></label><button className="boCmsQuiet" type="button" onClick={load}><RefreshCw size={15}/> Refresh</button></div>
      {loading?<div className="boCmsEmpty">Loading media…</div>:items.length?<div className="cmsMediaGrid">{items.map(item=><article className="boPanel cmsMediaCard" key={item.id}><div className="cmsMediaThumb">{item.status==='approved'&&item.public_path?<img src={supabase.storage.from('cms-media-public').getPublicUrl(item.public_path).data.publicUrl} alt=""/>:<span>PRIVATE</span>}</div><b title={item.file_name}>{item.file_name}</b><small>{item.mime_type} · {(item.file_size/1024).toFixed(0)} KB · {item.usage_count||0} page uses{Number(item.usage_count)>0?' · in use':''}</small><label>Alt text<input defaultValue={item.alt_text} maxLength={300} onBlur={e=>e.target.value!==item.alt_text&&update(item,{alt_text:e.target.value})}/></label><label>Caption<input defaultValue={item.caption} maxLength={1000} onBlur={e=>e.target.value!==item.caption&&update(item,{caption:e.target.value})}/></label><label>Source / licence URL<input defaultValue={item.source_url} maxLength={1000} onBlur={e=>e.target.value!==item.source_url&&update(item,{source_url:e.target.value})}/></label><label>Rights / consent notes<textarea defaultValue={item.rights_notes} rows={2} onBlur={e=>e.target.value!==item.rights_notes&&update(item,{rights_notes:e.target.value})}/></label><label>Tags<input defaultValue={(item.tags||[]).join(', ')} onBlur={e=>{const tags=e.target.value.split(',').map(x=>x.trim()).filter(Boolean);if(JSON.stringify(tags)!==JSON.stringify(item.tags||[]))update(item,{tags})}}/></label><div className="cmsMediaActions"><span className={'boCmsStatus boCmsStatus--'+item.status}>{item.status}</span>{item.status==='draft'&&<button type="button" onClick={()=>update(item,{status:'approved'})} disabled={busy||!item.alt_text||!item.rights_notes}><Check size={14}/> Approve</button>}{item.status!=='archived'&&<button type="button" onClick={()=>update(item,{status:'archived'})} disabled={busy||Number(item.usage_count)>0} title={Number(item.usage_count)>0?'This asset is referenced by a page revision. Replace its use before archiving.':''}><Archive size={14}/> Archive</button>}<label className="cmsMediaReplace">Replace<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>{upload(e.target.files?.[0],item.id);e.target.value=''}}/></label></div></article>)}</div>:<div className="boCmsEmpty">No media assets match this view.</div>}</section></div>
}
