'use client';

import {createContext,useContext,useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {getSupabaseBrowserClient} from '../../lib/supabase-browser';

const AdminSessionContext=createContext(null);

export function AdminSessionProvider({children}){
 const router=useRouter();
 const supabase=getSupabaseBrowserClient();
 const [session,setSession]=useState(null);
 const [profile,setProfile]=useState(null);
 const [ready,setReady]=useState(false);
 useEffect(()=>{let live=true;(async()=>{const {data:s}=await supabase.auth.getSession();if(!live)return;if(!s.session){setReady(true);router.replace('/backoffice/login');return}const {data:a}=await supabase.from('backoffice_users').select('email,role,is_active').eq('user_id',s.session.user.id).maybeSingle();if(!live)return;if(!a?.is_active){await supabase.auth.signOut();setReady(true);router.replace('/backoffice/login');return}setSession(s.session);setProfile(a);setReady(true)})();const {data:listener}=supabase.auth.onAuthStateChange((_e,next)=>{if(!next){setSession(null);setProfile(null);router.replace('/backoffice/login')}else setSession(next)});return()=>{live=false;listener.subscription.unsubscribe()}},[router,supabase]);
 return <AdminSessionContext.Provider value={{session,profile,ready,supabase}}>{children}</AdminSessionContext.Provider>
}
export function useAdminSession(){return useContext(AdminSessionContext)}
