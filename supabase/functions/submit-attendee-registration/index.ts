import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "jsr:@supabase/supabase-js@2";
import {z} from "npm:zod@3.24.1";
import {getCountries,getCountryCallingCode,isValidPhoneNumber} from "npm:libphonenumber-js@1.11.20";

const WORKSHOP_KEY='ai-lab-mumbai-2026';
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const headers={...cors,"Content-Type":"application/json"};
const roles=['CXO / Executive','Founder / Co-founder','Senior Professional','Entrepreneur','Consultant','Other'];
const aiTools=['ChatGPT','Claude','Gemini','Copilot','Notion AI','Midjourney','DALL-E','Other'];
const aiLevels=['Beginner','Intermediate','Advanced','Expert'];
const industries=['Technology','Financial Services','Professional Services','Retail / Consumer','Healthcare','Manufacturing','Media / Marketing','Education','Real Estate','Hospitality / Travel','Sports / Gaming','Government / Public Sector','Non-profit','Other'];
const functionalAreas=['Leadership / Strategy','Sales / Business Development','Marketing','Finance','Operations','HR / People','Technology / Product','Legal / Compliance','Consulting','Other'];
const experienceRanges=['0–2','3–5','6–10','11–15','15+','16+'];
const allowed=(values:string[])=>z.string().refine(v=>values.includes(v));

const regionNames=new Intl.DisplayNames(['en'],{type:'region'});
const countryByName=new Map<string,string>();
for(const code of getCountries()){
  const name=regionNames.of(code);
  if(name)countryByName.set(name,code);
}
const aliases:Record<string,string>={
  'United States':'US','United Kingdom':'GB','Russia':'RU','South Korea':'KR','North Korea':'KP','Taiwan':'TW','Vietnam':'VN','Laos':'LA','Moldova':'MD','Bolivia':'BO','Venezuela':'VE','Tanzania':'TZ','Palestine':'PS','Brunei':'BN','Micronesia':'FM','Syria':'SY','Iran':'IR','Ivory Coast':'CI','Czechia':'CZ'
};
function countryCodeFor(name:string){return countryByName.get(name)||aliases[name]||null;}
function digitsOnly(value:string){return value.replace(/\D/g,'');}
function normaliseDial(value:string){const d=digitsOnly(value);return d?`+${d}`:'';}

const schema=z.object({
 full_name:z.string().trim().min(2,"Name is required").max(120),
 email:z.string().trim().email("Enter a valid email").max(254),
 phone:z.string().trim().min(4,"Enter a valid phone number").max(32),
 phone_country_code:z.string().trim().regex(/^\+?[0-9]{1,4}$/,"Invalid phone country code"),
 city:z.string().trim().min(2,"City is required").max(120),
 country:z.string().trim().min(2).max(120),
 age_band:z.string().trim().max(40).optional().nullable(),
 career_role:allowed(roles),
 company_organisation:z.string().trim().min(1,"Company / organisation is required").max(160),
 industry:allowed(industries),
 years_experience:allowed(experienceRanges),
 functional_area:allowed(functionalAreas),
 ai_experience_level:allowed(aiLevels),
 ai_tools:z.array(allowed(aiTools)).max(20).default([]).refine(v=>new Set(v).size===v.length,"AI tools must be unique"),
 other_ai_tool:z.string().trim().max(120).optional().nullable(),
 mvp_preferences:z.array(z.string().trim().min(1).max(100)).min(1).max(2).refine(v=>new Set(v).size===v.length,"MVP preferences must be unique"),
 other_mvp_idea:z.string().trim().max(300).optional().nullable(),
 consent:z.literal(true),
 form_version:z.string().trim().max(40).optional(),
 _website:z.string().max(0).optional()
}).superRefine((d,ctx)=>{
 const countryCode=countryCodeFor(d.country);
 if(!countryCode){ctx.addIssue({code:z.ZodIssueCode.custom,path:['country'],message:'Select a valid country'});return;}
 const expectedDial=`+${getCountryCallingCode(countryCode as any)}`;
 if(normaliseDial(d.phone_country_code)!==expectedDial)ctx.addIssue({code:z.ZodIssueCode.custom,path:['phone_country_code'],message:`Use ${expectedDial} for ${d.country}`});
 const phone=digitsOnly(d.phone);
 if(countryCode==='IN'){
   if(!/^[6-9]\d{9}$/.test(phone))ctx.addIssue({code:z.ZodIssueCode.custom,path:['phone'],message:'Enter a valid 10-digit Indian mobile number'});
 }else{
   try{if(!isValidPhoneNumber(phone,countryCode as any))ctx.addIssue({code:z.ZodIssueCode.custom,path:['phone'],message:`Enter a valid ${d.country} phone number`});}
   catch{ctx.addIssue({code:z.ZodIssueCode.custom,path:['phone'],message:`Enter a valid ${d.country} phone number`});}
 }
 if(d.form_version?.startsWith('one_page')){
  if(d.ai_tools.includes('Other')&&!d.other_ai_tool?.trim())ctx.addIssue({code:z.ZodIssueCode.custom,path:['other_ai_tool'],message:'Tell us which other AI tool you use'});
  if(d.mvp_preferences.includes('something-else')&&(!d.other_mvp_idea||d.other_mvp_idea.trim().length<5))ctx.addIssue({code:z.ZodIssueCode.custom,path:['other_mvp_idea'],message:'Briefly describe what you would like to build'});
 }
});

Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return new Response(JSON.stringify({ok:false,error:'Method not allowed'}),{status:405,headers});
 try{
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success)return new Response(JSON.stringify({ok:false,error:parsed.error.issues[0]?.message||'Invalid registration'}),{status:422,headers});
  const b=parsed.data;
  const s=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const {data:opts,error:oe}=await s.from('mvp_options').select('id,slug').in('slug',b.mvp_preferences).eq('is_active',true);
  if(oe)throw oe;
  if(!opts||opts.length!==b.mvp_preferences.length)return new Response(JSON.stringify({ok:false,error:'One or more selected MVP options are unavailable'}),{status:422,headers});
  const email=b.email.toLowerCase();
  const now=new Date().toISOString();
  const paymentFlow=b.form_version==='one_page_v2'||b.form_version==='one_page_v3';
  const {data:existing,error:ee}=await s.from('attendee_registrations').select('id,payment_status,status,payment_reference').eq('workshop_key',WORKSHOP_KEY).ilike('email',email).maybeSingle();
  if(ee)throw ee;
  if(existing?.payment_status==='paid')return new Response(JSON.stringify({ok:true,id:existing.id,already_paid:true,payment_reference:existing.payment_reference}),{headers});
  const payload:any={workshop_key:WORKSHOP_KEY,full_name:b.full_name,email,phone:digitsOnly(b.phone),phone_country_code:normaliseDial(b.phone_country_code),city:b.city,country:b.country,age_band:b.age_band||null,career_role:b.career_role,company_organisation:b.company_organisation,industry:b.industry,years_experience:b.years_experience,functional_area:b.functional_area,ai_experience_level:b.ai_experience_level,ai_tools:b.ai_tools,other_ai_tool:b.other_ai_tool||null,other_mvp_idea:b.other_mvp_idea||null,form_version:b.form_version||(paymentFlow?'one_page_v3':'legacy_v1'),status:paymentFlow?'application_complete':'submitted',consent:true,submitted_at:now,updated_at:now};
  if(paymentFlow){payload.application_completed_at=now;payload.reviewed_at=now;payload.payment_status='not_started';}
  let attendee:any;
  if(existing?.id){const {data,error}=await s.from('attendee_registrations').update(payload).eq('id',existing.id).select('id').single();if(error)throw error;attendee=data;}
  else{const {data,error}=await s.from('attendee_registrations').insert(payload).select('id').single();if(error)throw error;attendee=data;}
  await s.from('attendee_mvp_preferences').delete().eq('attendee_id',attendee.id);
  const rows=b.mvp_preferences.map((slug,i)=>({attendee_id:attendee.id,mvp_option_id:opts.find((o:any)=>o.slug===slug)!.id,preference_rank:i+1}));
  const {error:pe}=await s.from('attendee_mvp_preferences').insert(rows);if(pe)throw pe;
  return new Response(JSON.stringify({ok:true,id:attendee.id,status:paymentFlow?'application_complete':'submitted'}),{headers});
 }catch(e){console.error(e);return new Response(JSON.stringify({ok:false,error:"We couldn't save your application. Please try again."}),{status:500,headers});}
});
