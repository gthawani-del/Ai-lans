import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from '../../../../lib/supabase-browser';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function fail(message,status=500){return Response.json({error:message},{status,headers:{'Cache-Control':'no-store'}})}

export async function POST(request){
  try{
    const form=await request.formData();
    const file=form.get('file');
    const suppliedId=String(form.get('id')||'').trim();
    const resumeToken=String(form.get('token')||'').trim();
    if(!resumeToken)return fail('Upload session token is missing.',400);
    if(!file||typeof file.arrayBuffer!=='function')return fail('No photo was received.',400);
    if(file.size>5*1024*1024)return fail('Maximum upload size is 5 MB.',400);

    let payload={};
    try{payload=JSON.parse(String(form.get('payload')||'{}'))}catch{return fail('Invalid application payload.',400)}

    const sb=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    let appId=suppliedId;

    if(!appId){
      const {data,error}=await sb.rpc('start_volunteer_application',{p_payload:payload,p_token:resumeToken});
      if(error)return fail('Could not start the application: '+error.message,502);
      appId=data?.id||'';
      if(!appId)return fail('Could not start the application.',502);
    }

    const bytes=Buffer.from(await file.arrayBuffer());
    const nonce=crypto.randomUUID().replaceAll('-','');
    const path='pending/'+appId+'-'+nonce+'.webp';

    const {error:uploadError}=await sb.storage.from('volunteer-photos').upload(path,bytes,{contentType:'image/webp',upsert:false});
    if(uploadError)return fail('Photo storage failed: '+uploadError.message,502);

    const {error:registerError}=await sb.rpc('register_volunteer_photo_upload',{
      p_id:appId,
      p_token:resumeToken,
      p_path:path,
      p_moderation:{clientSanitized:true,model:'trusted_backoffice_review'}
    });
    if(registerError)return fail('Photo registration failed: '+registerError.message,502);

    return Response.json({ok:true,id:appId,token:resumeToken,path},{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    return fail(error?.message||'Photo upload failed.',500);
  }
}
