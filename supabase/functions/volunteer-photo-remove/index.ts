import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2";

const allowedOrigins=new Set(["https://weareailabs.com","https://www.weareailabs.com"]);
const headersFor=(origin:string|null)=>({
  "Access-Control-Allow-Origin":origin&&allowedOrigins.has(origin)?origin:"https://weareailabs.com",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Access-Control-Allow-Headers":"content-type, apikey, authorization",
  "Vary":"Origin",
  "Cache-Control":"no-store",
  "Content-Type":"application/json"
});
function response(status:number,body:unknown,origin:string|null){
  return new Response(JSON.stringify(body),{status,headers:headersFor(origin)});
}
function equalHex(a:string,b:string){
  if(a.length!==b.length)return false;
  let diff=0;
  for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
Deno.serve(async request=>{
  const origin=request.headers.get("origin"),headers=headersFor(origin);
  if(request.method==="OPTIONS")return new Response("ok",{headers});
  if(request.method!=="POST")return response(405,{error:"Method not allowed"},origin);
  try{
    const raw=await request.text();
    if(raw.length>1024)return response(413,{error:"Request too large"},origin);
    const body=JSON.parse(raw);
    const id=String(body?.id||""),token=String(body?.token||"");
    if(!/^[0-9a-f-]{36}$/i.test(id)||!/^[0-9a-f]{64}$/i.test(token)){
      return response(400,{error:"Invalid application session"},origin);
    }
    const url=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if(!url||!serviceKey)return response(503,{error:"Photo removal unavailable"},origin);
    const supabase=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:app,error:lookupError}=await supabase.from("volunteer_applications")
      .select("id,status,resume_token_hash,photo_path").eq("id",id).maybeSingle();
    if(lookupError)throw lookupError;
    const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token));
    const hash=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,"0")).join("");
    if(!app||!equalHex(hash,String(app.resume_token_hash||""))){
      return response(403,{error:"Invalid application session"},origin);
    }
    if(app.status!=="draft")return response(409,{error:"Photo changes are unavailable after submission"},origin);
    if(body?.operation==="cleanup_previous"){
      const previous=String(body?.previous_path||"");
      if(!/^pending\/[0-9a-f-]{36}-[0-9a-f]{32}\.webp$/i.test(previous)||!previous.startsWith("pending/"+id+"-")){
        return response(400,{error:"Invalid previous photo path"},origin);
      }
      if(previous===app.photo_path)return response(409,{error:"Current photo cannot be cleaned up"},origin);
      const {error:cleanupError}=await supabase.storage.from("volunteer-photos").remove([previous]);
      if(cleanupError)throw cleanupError;
      return response(200,{ok:true},origin);
    }
    if(body?.operation&&body.operation!=="remove")return response(400,{error:"Invalid operation"},origin);
    if(app.photo_path){
      if(!String(app.photo_path).startsWith("pending/"+id+"-")){
        return response(409,{error:"Photo location requires manual review"},origin);
      }
      const {error:storageError}=await supabase.storage.from("volunteer-photos").remove([app.photo_path]);
      if(storageError)throw storageError;
    }
    const {error:removeError}=await supabase.rpc("remove_volunteer_photo",{p_id:id,p_token:token});
    if(removeError)throw removeError;
    return response(200,{ok:true},origin);
  }catch(error){
    console.error("volunteer-photo-remove failed",error instanceof Error?error.message:"Unknown");
    return response(500,{error:"Could not remove photo. Please retry or contact the workshop team."},origin);
  }
});
