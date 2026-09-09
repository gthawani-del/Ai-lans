import {createClient} from '@supabase/supabase-js';

export const SUPABASE_URL='https://zvmmgkspdgbfcqmnizga.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY='sb_publishable_d2UjpVEYOLgDiWeCYQ9d5Q_KahUzvoW';

let client;

export function getSupabaseBrowserClient(){
  if(!client){
    client=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    });
  }
  return client;
}
