import {z} from 'zod';

export const attendeeProfileSchema=z.object({
  full_name:z.string().trim().min(2,'Enter your full name').max(120),
  email:z.string().trim().email('Enter a valid email address').max(254),
  phone_country_code:z.string().trim().regex(/^\+?[0-9]{1,4}$/,'Enter a valid dial code'),
  phone:z.string().trim().min(6,'Enter a valid phone number').max(32),
  city:z.string().trim().min(2,'Enter your city').max(120),
  country:z.string().trim().min(2,'Select your country').max(120),
  career_role:z.string().min(1,'Select your current role'),
  company_organisation:z.string().trim().min(1,'Enter your company or organisation').max(160),
  industry:z.string().min(1,'Select your industry'),
  years_experience:z.string().min(1,'Select your experience range'),
  functional_area:z.string().min(1,'Select your functional area'),
  age_band:z.string().optional(),
});

export const attendeeAiSchema=z.object({
  ai_experience_level:z.string().min(1,'Select your AI experience level'),
  ai_tools:z.array(z.string()).max(20).default([]),
  mvp_preferences:z.array(z.string()).min(1,'Choose at least one MVP').max(2,'Choose up to two MVPs').refine(v=>new Set(v).size===v.length,'MVP choices must be unique'),
  other_mvp_idea:z.string().trim().max(300,'Keep your idea under 300 characters').optional(),
});

export const attendeeReviewSchema=z.object({
  consent:z.literal(true,{errorMap:()=>({message:'Consent is required to submit'})}),
});

export const attendeeSchema=attendeeProfileSchema.merge(attendeeAiSchema).merge(attendeeReviewSchema);

export const attendeeStepFields={
  1:['full_name','email','phone_country_code','phone','city','country','career_role','company_organisation','industry','years_experience','functional_area'],
  2:['ai_experience_level','ai_tools','mvp_preferences','other_mvp_idea'],
  3:['consent'],
};

export const attendeeDefaultValues={
  full_name:'',email:'',phone_country_code:'+91',phone:'',city:'',country:'India',career_role:'',company_organisation:'',industry:'',years_experience:'',functional_area:'',age_band:'',ai_experience_level:'',ai_tools:[],mvp_preferences:[],other_mvp_idea:'',consent:false,
};
