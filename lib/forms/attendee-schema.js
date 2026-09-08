import {z} from 'zod';
import {aiLevels,aiTools,experienceRanges,functionalAreas,industries,roles} from './attendee-options';
import {phoneCountries,phoneValidationMessage} from './phone-country';

const allowed=(values,message)=>z.string().refine(value=>values.includes(value),message);
const countryNames=phoneCountries.map(item=>item.name);

const attendeeProfileBase=z.object({
  full_name:z.string().trim().min(2,'Enter your full name').max(120,'Keep your name under 120 characters'),
  email:z.string().trim().email('Enter a valid email address').max(254),
  phone_country_code:z.string().trim().regex(/^\+[0-9]{1,4}$/,'Select a valid country code'),
  phone:z.string().trim().regex(/^\d+$/,'Use numbers only').min(4,'Enter a valid phone number').max(15,'Phone number is too long'),
  city:z.string().trim().min(2,'Enter your city').max(120,'Keep your city under 120 characters'),
  country:allowed(countryNames,'Select a valid country'),
  career_role:allowed(roles,'Select your current role'),
  company_organisation:z.string().trim().min(1,'Enter your company or organisation').max(160,'Keep the company name under 160 characters'),
  industry:allowed(industries,'Select your industry'),
  years_experience:allowed(experienceRanges,'Select your experience range'),
  functional_area:allowed(functionalAreas,'Select your functional area'),
  age_band:z.string().trim().max(40).optional(),
});

function refinePhone(data,ctx){
  const message=phoneValidationMessage(data);
  if(message)ctx.addIssue({code:z.ZodIssueCode.custom,path:['phone'],message});
}

export const attendeeProfileSchema=attendeeProfileBase.superRefine(refinePhone);

const attendeeAiReadinessBase=z.object({
  ai_experience_level:allowed(aiLevels,'Select your AI experience level'),
  ai_tools:z.array(allowed(aiTools,'Select a valid AI tool')).max(20).default([]).refine(v=>new Set(v).size===v.length,'AI tools must be unique'),
  other_ai_tool:z.string().trim().max(120,'Keep the tool name under 120 characters').optional(),
});

export const attendeeAiReadinessSchema=attendeeAiReadinessBase.superRefine((data,ctx)=>{
  if(data.ai_tools.includes('Other')&&!data.other_ai_tool?.trim()){
    ctx.addIssue({code:z.ZodIssueCode.custom,path:['other_ai_tool'],message:'Tell us which other AI tool you use'});
  }
});

const attendeeBuildBase=z.object({
  mvp_preferences:z.array(z.string().trim().min(1)).min(1,'Choose at least one MVP').max(2,'Choose up to two MVPs').refine(v=>new Set(v).size===v.length,'MVP choices must be unique'),
  other_mvp_idea:z.string().trim().max(300,'Keep your idea under 300 characters').optional(),
});

export const attendeeBuildSchema=attendeeBuildBase.superRefine((data,ctx)=>{
  if(data.mvp_preferences.includes('something-else')&&(!data.other_mvp_idea||data.other_mvp_idea.trim().length<5)){
    ctx.addIssue({code:z.ZodIssueCode.custom,path:['other_mvp_idea'],message:'Briefly describe what you would like to build'});
  }
});

export const attendeeConsentSchema=z.object({
  consent:z.literal(true,{errorMap:()=>({message:'Consent is required to submit'})}),
});

export const attendeeSchema=z.object({
  ...attendeeProfileBase.shape,
  ...attendeeAiReadinessBase.shape,
  ...attendeeBuildBase.shape,
  ...attendeeConsentSchema.shape,
}).superRefine((data,ctx)=>{
  refinePhone(data,ctx);
  if(data.ai_tools.includes('Other')&&!data.other_ai_tool?.trim()){
    ctx.addIssue({code:z.ZodIssueCode.custom,path:['other_ai_tool'],message:'Tell us which other AI tool you use'});
  }
  if(data.mvp_preferences.includes('something-else')&&(!data.other_mvp_idea||data.other_mvp_idea.trim().length<5)){
    ctx.addIssue({code:z.ZodIssueCode.custom,path:['other_mvp_idea'],message:'Briefly describe what you would like to build'});
  }
});

export const attendeeModuleFields={
  profile:['full_name','email','phone_country_code','phone','city','country','career_role','company_organisation','industry','years_experience','functional_area'],
  readiness:['ai_experience_level','ai_tools','other_ai_tool'],
  build:['mvp_preferences','other_mvp_idea','consent'],
};

export const attendeeDefaultValues={
  full_name:'',email:'',phone_country_code:'+91',phone:'',city:'',country:'India',career_role:'',company_organisation:'',industry:'',years_experience:'',functional_area:'',age_band:'',ai_experience_level:'',ai_tools:[],other_ai_tool:'',mvp_preferences:[],other_mvp_idea:'',consent:false,
};
