import { createClient } from '@supabase/supabase-js';
import HomePage from './HomePage';
import { createPageMetadata } from '../lib/seo';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../lib/supabase-browser';
import { HOMEPAGE_DEFAULT_DOCUMENT, HOMEPAGE_DEFAULT_SEO } from '../lib/homepage-content';

export const dynamic='force-dynamic';
export const revalidate=0;

async function getPublishedHomepage(){
  try{
    const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init={})=>fetch(input,{...init,cache:'no-store'})}});
    const {data,error}=await supabase.rpc('cms_public_get_homepage');
    if(error)return null;
    return data||null;
  }catch{return null}
}

export async function generateMetadata(){
  const published=await getPublishedHomepage();
  const seo=published?.seo||HOMEPAGE_DEFAULT_SEO;
  return createPageMetadata({
    path:'/', title:HOMEPAGE_DEFAULT_SEO.seo_title, description:HOMEPAGE_DEFAULT_SEO.meta_description,
    seo, defaultImage:{src:'/brand/weareailabs-home.webp',alt:'weareailabs — Explore Learn Create Together'},indexable:true,follow:true,
  });
}

export default async function Page(){
  const published=await getPublishedHomepage();
  const seo=published?.seo||HOMEPAGE_DEFAULT_SEO;
  const title=seo.seo_title||HOMEPAGE_DEFAULT_SEO.seo_title;
  const description=seo.meta_description||HOMEPAGE_DEFAULT_SEO.meta_description;
  const socialProfiles=['https://www.facebook.com/weareailabs','https://www.youtube.com/@weare_ailabs'];
  const jsonLd={'@context':'https://schema.org','@graph':[
    {'@type':'Organization','@id':'https://weareailabs.com/#organization',name:'weareailabs',url:'https://weareailabs.com/',logo:{'@type':'ImageObject',url:'https://weareailabs.com/brand/weareailabs-home.webp'},sameAs:socialProfiles},
    {'@type':'WebSite','@id':'https://weareailabs.com/#website',url:'https://weareailabs.com/',name:'weareailabs',inLanguage:'en-IN',publisher:{'@id':'https://weareailabs.com/#organization'}},
    {'@type':'WebPage','@id':'https://weareailabs.com/#webpage',url:'https://weareailabs.com/',name:title,description,isPartOf:{'@id':'https://weareailabs.com/#website'},about:{'@id':'https://weareailabs.com/#organization'},inLanguage:seo.locale||'en-IN'}
  ]};
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd).replace(/</g,'\\u003c')}}/><HomePage content={published?.document||HOMEPAGE_DEFAULT_DOCUMENT}/></>;
}
