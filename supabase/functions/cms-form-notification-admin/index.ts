import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const API_KEY = Deno.env.get("SUPABASE_ANON_KEY") || SERVICE_KEY;
const origins = new Set(["https://weareailabs.com", "https://www.weareailabs.com"]);
const admin = createClient(URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const headers = (origin: string | null): Record<string,string> => {
  const value: Record<string,string> = { "Content-Type":"application/json", "Cache-Control":"no-store", "Vary":"Origin" };
  if (origin && origins.has(origin)) { value["Access-Control-Allow-Origin"] = origin; value["Access-Control-Allow-Methods"] = "POST, OPTIONS"; value["Access-Control-Allow-Headers"] = "authorization, apikey, content-type"; }
  return value;
};
const reply = (status:number, body:unknown, origin:string|null) => new Response(JSON.stringify(body), { status, headers:headers(origin) });

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin");
  if(req.method==="OPTIONS")return new Response("ok",{headers:headers(origin)});
  if(req.method!=="POST")return reply(405,{error:"Method not allowed."},origin);
  if(!origin||!origins.has(origin))return reply(403,{error:"Origin not allowed."},null);
  const authorization=req.headers.get("authorization")||"";
  const token=authorization.replace(/^Bearer\s+/i,"");
  if(!token)return reply(401,{error:"Sign in to the backoffice first."},origin);
  const {data:userData,error:userError}=await admin.auth.getUser(token);
  if(userError||!userData.user)return reply(401,{error:"Your backoffice session is no longer valid."},origin);
  const {data:staff,error:staffError}=await admin.from("backoffice_users").select("role,is_active").eq("user_id",userData.user.id).maybeSingle();
  if(staffError||!staff?.is_active||staff.role!=="super_admin")return reply(403,{error:"You do not have permission to retry form notifications."},origin);
  let body:Record<string,unknown>;
  try{const raw=await req.text();if(new TextEncoder().encode(raw).length>2000)throw new Error("large");body=JSON.parse(raw);if(!body||typeof body!=="object"||Array.isArray(body))throw new Error("invalid");}catch{return reply(400,{error:"Invalid retry request."},origin);}
  const submissionId=typeof body.submission_id==="string"?body.submission_id:"";
  if(!/^[0-9a-f-]{36}$/i.test(submissionId))return reply(400,{error:"Invalid retry request."},origin);
  const userClient=createClient(URL,API_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
  const {data:prepared,error:prepareError}=await userClient.rpc("cms_admin_retry_form_notification",{p_submission_id:submissionId});
  if(prepareError||!prepared?.outbox_id)return reply(409,{error:prepareError?.message||"Notification is not ready to retry."},origin);
  const outboxId=prepared.outbox_id;
  const apiKey=Deno.env.get("RESEND_API_KEY");
  const sender=Deno.env.get("FORM_NOTIFICATION_FROM");
  if(!apiKey||!sender){await admin.rpc("cms_service_mark_form_notification",{p_outbox_id:outboxId,p_status:"disabled",p_error_code:"provider_not_configured",p_provider_message_id:null});return reply(503,{error:"Email provider is not configured. The response is safely stored; notification remains disabled."},origin);}
  const {data:details,error:detailsError}=await admin.rpc("cms_service_get_form_notification",{p_outbox_id:outboxId});
  if(detailsError||!details?.recipient_email){await admin.rpc("cms_service_mark_form_notification",{p_outbox_id:outboxId,p_status:"disabled",p_error_code:"recipient_not_configured",p_provider_message_id:null});return reply(409,{error:"No approved notification destination is available."},origin);}
  try{
    const sent=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json","Idempotency-Key":outboxId},body:JSON.stringify({from:sender,to:[details.recipient_email],subject:`New response: ${details.form_name}`,text:`A response was submitted to ${details.form_name}.\nReference: ${details.submission_id}\nOpen the private backoffice inbox to review it.\nhttps://weareailabs.com/backoffice/forms`})});
    const provider=await sent.json().catch(()=>({}));
    if(!sent.ok)throw new Error(`provider_${sent.status}`);
    await admin.rpc("cms_service_mark_form_notification",{p_outbox_id:outboxId,p_status:"sent",p_error_code:null,p_provider_message_id:provider?.id||null});
    return reply(200,{ok:true,status:"sent"},origin);
  }catch(error){
    await admin.rpc("cms_service_mark_form_notification",{p_outbox_id:outboxId,p_status:"retry",p_error_code:error instanceof Error?error.message.slice(0,80):"provider_error",p_provider_message_id:null});
    return reply(503,{error:"Notification delivery failed. The response remains safely stored and can be retried."},origin);
  }
});
