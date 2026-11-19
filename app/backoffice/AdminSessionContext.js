'use client';

import {createContext,useContext,useEffect,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {getSupabaseBrowserClient} from '../../lib/supabase-browser';
import {adminSessionClockValid,clearAdminSessionClock,endAdminSession} from '../../lib/backoffice-session';

const AdminSessionContext=createContext(null);

export function AdminSessionProvider({children}){
  const router=useRouter();
  const pathname=usePathname();
  const isLogin=pathname==='/backoffice/login';
  const supabase=getSupabaseBrowserClient();
  const [session,setSession]=useState(null);
  const [profile,setProfile]=useState(null);
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    let live=true;
    setReady(false);
    (async()=>{
      try{
        const {data,error}=await supabase.auth.getSession();
        if(!live)return;
        if(error||!data?.session){
          setSession(null);setProfile(null);setReady(true);
          if(!isLogin)router.replace('/backoffice/login');
          return;
        }
        if(!adminSessionClockValid()){
          await endAdminSession(supabase);
          if(!live)return;
          setSession(null);setProfile(null);setReady(true);
          if(!isLogin)router.replace('/backoffice/login?reason=expired');
          return;
        }
        const {data:admin,error:profileError}=await supabase.from('backoffice_users')
          .select('email,role,is_active').eq('user_id',data.session.user.id).maybeSingle();
        if(!live)return;
        if(profileError||!admin?.is_active){
          await endAdminSession(supabase);
          if(!live)return;
          setSession(null);setProfile(null);setReady(true);
          if(!isLogin)router.replace('/backoffice/login');
          return;
        }
        setSession(data.session);setProfile(admin);setReady(true);
        if(isLogin)router.replace('/backoffice');
      }catch{
        if(!live)return;
        // Fail closed if auth or role validation cannot complete.
        setSession(null);setProfile(null);setReady(true);
        if(!isLogin)router.replace('/backoffice/login');
      }
    })();
    return()=>{live=false};
  },[isLogin,pathname,router,supabase]);

  useEffect(()=>{
    if(!ready||!session||!profile?.is_active||isLogin)return;
    const parts=(pathname||'').split('/').filter(Boolean);
    const section=parts[1]||'dashboard';
    const module=['pages','media','forms','configuration','system','attendees','volunteers','workshop'].includes(section)?section:'dashboard';
    supabase.rpc('cms_admin_record_activity',{p_action:'admin_accessed',p_module:module,p_route:pathname||'/backoffice'}).then(({error})=>{if(error)console.warn('Admin access activity could not be recorded.');});
  },[isLogin,pathname,profile?.is_active,ready,session,supabase]);

  useEffect(()=>{
    const {data:listener}=supabase.auth.onAuthStateChange((event,next)=>{
      if(event==='SIGNED_OUT'){
        clearAdminSessionClock();
        setSession(null);setProfile(null);
        if(window.location.pathname!=='/backoffice/login')router.replace('/backoffice/login');
      }else if(event==='TOKEN_REFRESHED'&&next){
        // Token refresh must never extend the admin's absolute or inactivity limits.
        if(adminSessionClockValid())setSession(next);
      }
    });
    return()=>listener.subscription.unsubscribe();
  },[router,supabase]);

  return <AdminSessionContext.Provider value={{session,profile,ready,supabase}}>
    {isLogin?children:(ready&&session&&profile?children:<main className="boBoot" role="status">Checking administrator access…</main>)}
  </AdminSessionContext.Provider>;
}

export function useAdminSession(){return useContext(AdminSessionContext)}
