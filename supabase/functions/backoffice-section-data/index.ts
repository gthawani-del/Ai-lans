import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"GET, PATCH, POST, OPTIONS"};
const headers={...cors,"Content-Type":"application/json"};
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 try{
  const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
  if(!token)return new Response(JSON.stringify({error:'Authentication required'}),{status:401,headers});
  const s=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {data:userData,error:userError}=await s.auth.getUser(token); const user=userData?.user;
  if(userError||!user)return new Response(JSON.stringify({error:'Invalid session'}),{status:401,headers});
  const {data:admin}=await s.from('backoffice_users').select('role,is_active').eq('user_id',user.id).maybeSingle();
  if(!admin?.is_active)return new Response(JSON.stringify({error:'Back-office access denied'}),{status:403,headers});
  const url=new URL(req.url); const workshopKey=url.searchParams.get('workshop_key')||'ai-lab-mumbai-2026';
  if(req.method==='POST'){
   if(!['super_admin','operations'].includes(admin.role))return new Response(JSON.stringify({error:'Admin write access denied'}),{status:403,headers});
   const body=await req.json();
   if(body?.action==='update_attendee_region'){
      const id=String(body.attendee_id||'');
      const region=String(body.state_region||'').trim();
      if(!/^[0-9a-f-]{36}$/i.test(id))return new Response(JSON.stringify({error:'Invalid attendee ID'}),{status:400,headers});
      const {data:person,error:personError}=await s.from('attendee_registrations').select('id,city,country,state_region,state_mapping_status').eq('id',id).eq('workshop_key',workshopKey).maybeSingle();
      if(personError)throw personError;
      if(!person)return new Response(JSON.stringify({error:'Attendee not found'}),{status:404,headers});
      if(region&&String(person.country).toLowerCase()!=='india')return new Response(JSON.stringify({error:'Manual state selection is currently available for Indian attendees only'}),{status:400,headers});
      let patch:any;
      if(region){
        const {data:known,error:referenceError}=await s.from('attendee_city_region_reference').select('state_region').eq('state_region',region).limit(1);
        if(referenceError)throw referenceError;
        if(!known?.length)return new Response(JSON.stringify({error:'Choose a recognized Indian state or UT'}),{status:400,headers});
        patch={state_region:region,state_mapping_status:'manual',state_mapping_source:'admin'};
      }else{
        patch={city:person.city,state_mapping_status:'not_mapped',state_mapping_source:'reference'};
      }
      const {data:updated,error:updateError}=await s.from('attendee_registrations').update(patch).eq('id',id).select('id,city,country,state_region,state_mapping_status,state_mapping_source').single();
      if(updateError)throw updateError;
      const {error:auditError}=await s.from('backoffice_audit_log').insert({user_id:user.id,action:region?'set_attendee_state':'reset_attendee_state',entity_type:'attendee',entity_id:id,workshop_key:workshopKey,details:{before:person.state_region,after:updated.state_region,source:updated.state_mapping_source}});
      if(auditError)throw auditError;
      return new Response(JSON.stringify({attendee:updated}),{headers});
   }
   if(body?.action==='create_mvp_option'){
    const title=String(body.title||'').trim(),description=String(body.description||'').trim();if(title.length<2||title.length>120)return new Response(JSON.stringify({error:'MVP title must be 2–120 characters'}),{status:400,headers});if(description.length>600)return new Response(JSON.stringify({error:'Description must be 600 characters or fewer'}),{status:400,headers});
    const base=title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'mvp';let slug=base,suffix=2;while(true){const{data:hit}=await s.from('mvp_options').select('id').eq('slug',slug).maybeSingle();if(!hit)break;slug=base+'-'+suffix++}
    const{data:last}=await s.from('mvp_options').select('display_order').order('display_order',{ascending:false}).limit(1).maybeSingle();const{data:created,error:createError}=await s.from('mvp_options').insert({slug,title,description:description||null,is_active:body.is_active!==false,display_order:Number(last?.display_order||0)+1}).select('id,slug,title,description,is_active,display_order').single();if(createError)throw createError;
    await s.from('backoffice_audit_log').insert({user_id:user.id,action:'create_mvp_option',entity_type:'mvp_option',entity_id:created.id,workshop_key:workshopKey,details:{title:created.title,slug:created.slug}});
    return new Response(JSON.stringify({option:created}),{headers});
   }
   if(body?.action==='update_mvp_option'){
    const id=String(body.id||'');if(!id)return new Response(JSON.stringify({error:'MVP option id required'}),{status:400,headers});const patch:any={};if(Object.prototype.hasOwnProperty.call(body,'title')){const title=String(body.title||'').trim();if(title.length<2||title.length>120)return new Response(JSON.stringify({error:'MVP title must be 2–120 characters'}),{status:400,headers});patch.title=title}if(Object.prototype.hasOwnProperty.call(body,'description')){const description=String(body.description||'').trim();if(description.length>600)return new Response(JSON.stringify({error:'Description must be 600 characters or fewer'}),{status:400,headers});patch.description=description||null}if(Object.prototype.hasOwnProperty.call(body,'is_active'))patch.is_active=!!body.is_active;
    const{data:updated,error:updateOptionError}=await s.from('mvp_options').update(patch).eq('id',id).select('id,slug,title,description,is_active,display_order').single();if(updateOptionError)throw updateOptionError;
    await s.from('backoffice_audit_log').insert({user_id:user.id,action:'update_mvp_option',entity_type:'mvp_option',entity_id:id,workshop_key:workshopKey,details:patch});
    return new Response(JSON.stringify({option:updated}),{headers});
   }
   if(body?.action==='reorder_mvp_options'){
    const ids=Array.isArray(body.ids)?body.ids.map(String):[];if(!ids.length)return new Response(JSON.stringify({error:'MVP option order required'}),{status:400,headers});const{data:existingOptions,error:existingError}=await s.from('mvp_options').select('id');if(existingError)throw existingError;const known=new Set((existingOptions||[]).map((x:any)=>x.id));if(ids.some((id:string)=>!known.has(id))||ids.length!==known.size)return new Response(JSON.stringify({error:'MVP option order is incomplete'}),{status:400,headers});await Promise.all(ids.map((id:string,index:number)=>s.from('mvp_options').update({display_order:index+1}).eq('id',id)));
    await s.from('backoffice_audit_log').insert({user_id:user.id,action:'reorder_mvp_options',entity_type:'mvp_option',entity_id:null,workshop_key:workshopKey,details:{ids}});
    return new Response(JSON.stringify({ok:true}),{headers});
   }
   if(body?.action!=='generate_allocation')return new Response(JSON.stringify({error:'Unknown action'}),{status:400,headers});
   const [{data:settings},{data:tables},{data:attendees},{data:prefs},{data:existing}]=await Promise.all([
    s.from('workshop_settings').select('*').eq('workshop_key',workshopKey).single(),
    s.from('workshop_tables').select('id,table_number,mvp_option_id,label,status').eq('workshop_key',workshopKey).order('table_number'),
    s.from('attendee_registrations').select('id,full_name,functional_area,years_experience,ai_experience_level,payment_status,status').eq('workshop_key',workshopKey),
    s.from('attendee_mvp_preferences').select('attendee_id,preference_rank,mvp_options(id)').eq('attendee_registrations.workshop_key',workshopKey),
    s.from('table_attendees').select('table_id,attendee_id,assignment_source,allocation_score,allocation_reason')
   ]);
   const capacity=Number(settings?.max_attendees_per_table||5),weights={mvp_preference:50,ai_readiness:20,functional_diversity:15,experience_diversity:15,...(settings?.assignment_weights||{})};
   const tableIds=new Set((tables||[]).map((t:any)=>t.id)),existingHere=(existing||[]).filter((x:any)=>tableIds.has(x.table_id));const assigned=new Set(existingHere.map((x:any)=>x.attendee_id));
   const prefMap=new Map<string,any[]>();for(const p of prefs||[]){const a=prefMap.get(p.attendee_id)||[];a.push({rank:p.preference_rank,id:(p as any).mvp_options?.id});prefMap.set(p.attendee_id,a)}
   const members=new Map<string,any[]>((tables||[]).map((t:any)=>[t.id,[]]));for(const x of existingHere){const a=(attendees||[]).find((z:any)=>z.id===x.attendee_id);if(a)members.get(x.table_id)?.push(a)}
   const eligible=(attendees||[]).filter((a:any)=>a.payment_status==='paid'&&!assigned.has(a.id)).sort((a:any,b:any)=>String(a.id).localeCompare(String(b.id)));
   const diversity=(arr:any[],key:string,val:any)=>!val?0:(arr.length?Math.max(0,1-arr.filter(x=>x[key]===val).length/arr.length):1);
   const score=(a:any,t:any)=>{const ps=prefMap.get(a.id)||[],rank=ps.find((p:any)=>p.id===t.mvp_option_id)?.rank;const mvp=rank===1?1:rank===2?.6:0;const ms=members.get(t.id)||[];const ai=diversity(ms,'ai_experience_level',a.ai_experience_level),fn=diversity(ms,'functional_area',a.functional_area),ex=diversity(ms,'years_experience',a.years_experience);const total=mvp*Number(weights.mvp_preference)+ai*Number(weights.ai_readiness)+fn*Number(weights.functional_diversity)+ex*Number(weights.experience_diversity);return{total:Number(total.toFixed(2)),reason:{mvp_preference:Number((mvp*Number(weights.mvp_preference)).toFixed(2)),ai_readiness:Number((ai*Number(weights.ai_readiness)).toFixed(2)),functional_diversity:Number((fn*Number(weights.functional_diversity)).toFixed(2)),experience_diversity:Number((ex*Number(weights.experience_diversity)).toFixed(2)),preference_rank:rank||null,weights}}};
   const inserts:any[]=[];while(eligible.length){let best:any=null;for(let ai=0;ai<eligible.length;ai++){const a=eligible[ai];for(const t of tables||[]){if((members.get(t.id)?.length||0)>=capacity)continue;const q=score(a,t);if(!best||q.total>best.q.total||(q.total===best.q.total&&(t.table_number<best.t.table_number||(t.table_number===best.t.table_number&&String(a.id)<String(best.a.id)))))best={ai,a,t,q}}}if(!best)break;eligible.splice(best.ai,1);members.get(best.t.id)?.push(best.a);inserts.push({table_id:best.t.id,attendee_id:best.a.id,allocation_score:best.q.total,allocation_reason:best.q.reason,assignment_source:'automatic'})}
   if(inserts.length){const{error}=await s.from('table_attendees').insert(inserts);if(error)throw error}await s.from('backoffice_audit_log').insert({user_id:user.id,action:'generate_table_allocation',entity_type:'workshop',entity_id:null,workshop_key:workshopKey,details:{assigned:inserts.length,weights,capacity}});
   return new Response(JSON.stringify({assigned:inserts.length,remaining:eligible.length}),{headers});
  }
  if(req.method==='PATCH'){
   if(!['super_admin','operations'].includes(admin.role))return new Response(JSON.stringify({error:'Settings access denied'}),{status:403,headers});
   const body=await req.json(); const allowed=['max_attendees_per_table','volunteers_per_table','mvp_first_choice_weight','mvp_second_choice_weight','use_ai_balance','use_functional_diversity','use_experience_diversity','assignment_weights']; const patch:any={updated_at:new Date().toISOString()};
   for(const k of allowed)if(Object.prototype.hasOwnProperty.call(body,k))patch[k]=body[k];
   if(patch.assignment_weights){const total=Object.values(patch.assignment_weights).reduce((a:any,b:any)=>Number(a)+Number(b||0),0);if(total!==100)return new Response(JSON.stringify({error:'Assignment weights must total 100'}),{status:400,headers});}
   const {data:updated,error:updateError}=await s.from('workshop_settings').update(patch).eq('workshop_key',workshopKey).select('*').single();if(updateError)throw updateError;
   return new Response(JSON.stringify({settings:updated}),{headers});
  }
  if(req.method!=='GET')return new Response(JSON.stringify({error:'Method not allowed'}),{status:405,headers});
  const [{data:attendees,error:aerr},{data:prefs,error:perr},{data:options,error:oerr},{data:settings,error:serr},{data:tables,error:terr},{data:assignments,error:aserr},{data:audit,error:auerr},{data:admins,error:aderr}]=await Promise.all([
   s.from('attendee_registrations').select('id,full_name,email,phone,phone_country_code,city,country,state_region,state_mapping_status,state_mapping_source,current_title,business_problem,target_user,data_sources,success_outcome,success_detail,attendance_availability,career_role,company_organisation,industry,years_experience,functional_area,ai_experience_level,ai_tools,status,payment_status,payment_reference,submitted_at,paid_at,workshop_key').eq('workshop_key',workshopKey).order('submitted_at',{ascending:false}),
   s.from('attendee_mvp_preferences').select('attendee_id,preference_rank,mvp_options(slug,title),attendee_registrations!inner(workshop_key)').eq('attendee_registrations.workshop_key',workshopKey),
   s.from('mvp_options').select('id,slug,title,description,is_active,display_order').order('display_order',{ascending:true}),
   s.from('workshop_settings').select('*').eq('workshop_key',workshopKey).maybeSingle(),
   s.from('workshop_tables').select('id,table_number,label,status,mvp_option_id,workshop_key,mvp_options(title)').eq('workshop_key',workshopKey).order('table_number',{ascending:true}),
   s.from('table_attendees').select('table_id,attendee_id,allocation_score,allocation_reason,assignment_source'),
   s.from('backoffice_audit_log').select('id,user_id,action,entity_type,entity_id,workshop_key,details,created_at').eq('workshop_key',workshopKey).order('created_at',{ascending:false}).limit(250),
   s.from('backoffice_users').select('user_id,email,role')
  ]);
  for(const e of [aerr,perr,oerr,serr,terr,aserr,auerr,aderr])if(e)throw e;
  const prefMap=new Map<string,any[]>();
  for(const p of prefs||[]){const a=prefMap.get(p.attendee_id)||[];a.push({rank:p.preference_rank,slug:(p as any).mvp_options?.slug,title:(p as any).mvp_options?.title});prefMap.set(p.attendee_id,a)}
  const tableMap=new Map((tables||[]).map((t:any)=>[t.id,t])); const attendeeTable=new Map<string,any>();
  for(const x of assignments||[]){const t=tableMap.get(x.table_id);if(t)attendeeTable.set(x.attendee_id,{id:t.id,table_number:t.table_number,label:t.label,status:t.status,mvp_title:(t as any).mvp_options?.title||null,allocation_score:x.allocation_score,allocation_reason:x.allocation_reason,assignment_source:x.assignment_source})}
  const attendeeRows=(attendees||[]).map((a:any)=>({...a,mvp_preferences:(prefMap.get(a.id)||[]).sort((x,y)=>x.rank-y.rank),table:attendeeTable.get(a.id)||null}));
  const optionCounts=new Map<string,{total:number,first:number,second:number}>();for(const p of prefs||[]){const slug=(p as any).mvp_options?.slug;if(!slug)continue;const x=optionCounts.get(slug)||{total:0,first:0,second:0};x.total++;if(p.preference_rank===1)x.first++;if(p.preference_rank===2)x.second++;optionCounts.set(slug,x)}
  const optionRows=(options||[]).map((o:any)=>({...o,selection_count:optionCounts.get(o.slug)?.total||0,first_choice_count:optionCounts.get(o.slug)?.first||0,second_choice_count:optionCounts.get(o.slug)?.second||0}));
  const adminMap=new Map((admins||[]).map((a:any)=>[a.user_id,a]));const auditRows=(audit||[]).map((x:any)=>({...x,actor_email:adminMap.get(x.user_id)?.email||null,actor_role:adminMap.get(x.user_id)?.role||null}));
  const dataQuality={missing_company:attendeeRows.filter((a:any)=>!a.company_organisation).length,missing_function:a=>0,unpaid:attendeeRows.filter((a:any)=>a.payment_status!=='paid').length,unallocated_paid:attendeeRows.filter((a:any)=>a.payment_status==='paid'&&!a.table).length};
  return new Response(JSON.stringify({role:admin.role,workshop_key:workshopKey,attendees:attendeeRows,mvp_options:optionRows,settings:settings||{},tables:tables||[],assignments:assignments||[],audit:auditRows,data_quality:{missing_company:dataQuality.missing_company,missing_function:attendeeRows.filter((a:any)=>!a.functional_area).length,unpaid:dataQuality.unpaid,unallocated_paid:dataQuality.unallocated_paid},last_updated:new Date().toISOString()}),{headers});
 }catch(e){console.error(e);return new Response(JSON.stringify({error:'Could not load back-office section data'}),{status:500,headers});}
});