import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"https://weareailabs.com","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type","Content-Type":"application/json","Cache-Control":"no-store"};
const response=(status:number,obj:unknown)=>new Response(JSON.stringify(obj),{status,headers:cors});
const types=["access","correction","deletion","withdrawal","other"];
const kinds=["attendee","volunteer","unknown"];
const states=["received","verifying","in_review","completed","rejected"];
const verifies=["pending","verified","not_verified"];
const permitted=['super_admin','operations'];
const clean=(value:unknown,max=1500)=>String(value||"").trim().slice(0,max);

Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="GET"&&req.method!=="POST")return response(405,{error:"Method not allowed"});
 try{
   const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),url=Deno.env.get("SUPABASE_URL");
   if(!key||!url)return response(503,{error:"Service unavailable"});
   const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
   if(!token)return response(401,{error:"Sign in required"});
   const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
   const {data:auth,error:authError}=await db.auth.getUser(token);
   if(authError||!auth?.user)return response(401,{error:"Invalid session"});
   const {data:admin,error:roleError}=await db.from("backoffice_users").select("role,is_active").eq("user_id",auth.user.id).maybeSingle();
   if(roleError||!admin?.is_active||!permitted.includes(admin.role))return response(403,{error:"Privacy administration access denied"});
   if(req.method==="GET"){
     const [requests,reports,drafts]=await Promise.all([
       db.from("privacy_requests").select("id,request_type,applicant_email,application_type,application_reference,status,verification_status,legal_hold,handling_note,resolution_note,created_by,assigned_to,created_at,updated_at,resolved_at").order("created_at",{ascending:false}).limit(200),
       db.from("privacy_retention_reports").select("id,report_month,generated_at,draft_overdue_30d,draft_total,orphan_photo_objects,photos_linked_to_overdue_drafts,open_privacy_requests").order("report_month",{ascending:false}).limit(24),
       db.from("volunteer_applications").select("id,updated_at,photo_path").eq("status","draft").lt("updated_at",new Date(Date.now()-30*24*60*60*1000).toISOString()).order("updated_at",{ascending:true}).limit(100)
     ]);
     if(requests.error||reports.error||drafts.error)throw requests.error||reports.error||drafts.error;
     return response(200,{requests:requests.data||[],reports:reports.data||[],overdue_drafts:(drafts.data||[]).map((x:any)=>({id:x.id,updated_at:x.updated_at,has_photo:!!x.photo_path})),is_admin:true});
   }
   const text=await req.text();
   if(text.length>12000)return response(413,{error:"Request too large"});
   const body=JSON.parse(text);
   if(body?.action==="create"){
     const email=clean(body.applicant_email,254).toLowerCase();
     if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return response(400,{error:"Enter a valid applicant email"});
     if(!types.includes(body.request_type)||!kinds.includes(body.application_type||"unknown"))return response(400,{error:"Select a valid request and application type"});
     const input={
       applicant_email:email,request_type:body.request_type,application_type:body.application_type||"unknown",
       application_reference:clean(body.application_reference,120)||null,
       handling_note:clean(body.handling_note),created_by:auth.user.id,updated_by:auth.user.id
     };
     const {data:created,error:insertError}=await db.from("privacy_requests").insert(input).select("id").single();
     if(insertError)throw insertError;
     const {error:auditError}=await db.from("backoffice_audit_log").insert({user_id:auth.user.id,action:"privacy_request_created",entity_type:"privacy_request",entity_id:created.id,workshop_key:"ai-lab-mumbai-2026",details:{type:input.request_type,application_type:input.application_type}});
     if(auditError)throw auditError;
     return response(200,{ok:true,id:created.id});
   }
   if(body?.action==="update"){
     const id=clean(body.id,50);
     if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id))return response(400,{error:"Invalid request"});
     const {data:old,error:oldErr}=await db.from("privacy_requests").select("id,status,request_type,verification_status").eq("id",id).maybeSingle();
     if(oldErr)throw oldErr;
     if(!old)return response(404,{error:"Privacy request not found"});
     if(["completed","rejected"].includes(old.status))return response(409,{error:"Resolved cases are read-only"});
     const status=clean(body.status,30),verification=clean(body.verification_status,30);
     if(!states.includes(status)||!verifies.includes(verification))return response(400,{error:"Invalid case state"});
     const resolution=clean(body.resolution_note);
     if(["completed","rejected"].includes(status)&&resolution.length<12)return response(400,{error:"Record an explanatory resolution of at least 12 characters"});
     if(status==="completed"&&verification!=="verified")return response(400,{error:"Verify applicant identity before completion"});
     if(status==="completed"&&old.request_type==="deletion"&&body.deletion_confirmed!==true)return response(400,{error:"Confirm that the approved data removal was separately verified; this register does not delete records"});
     if(status==="completed"&&body.legal_hold===true&&old.request_type==="deletion")return response(400,{error:"Resolve legal hold before marking deletion complete"});
     const patch={
       status,verification_status:verification,legal_hold:body.legal_hold===true,
       handling_note:clean(body.handling_note),resolution_note:resolution,
       updated_at:new Date().toISOString(),updated_by:auth.user.id,
       resolved_at:["completed","rejected"].includes(status)?new Date().toISOString():null
     };
     const {error:saveErr}=await db.from("privacy_requests").update(patch).eq("id",id);
     if(saveErr)throw saveErr;
     const {error:auditError}=await db.from("backoffice_audit_log").insert({user_id:auth.user.id,action:"privacy_request_updated",entity_type:"privacy_request",entity_id:id,workshop_key:"ai-lab-mumbai-2026",details:{from:old.status,to:status,verification,legal_hold:patch.legal_hold}});
     if(auditError)throw auditError;
     return response(200,{ok:true,id});
   }
   return response(400,{error:"Unknown action"});
 }catch(e){console.error("privacy-admin failed",e instanceof Error?e.message:"Unknown");return response(500,{error:"Could not process the privacy request"});}
});
