'use client';

import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {LockKeyhole,Mail,ShieldCheck} from 'lucide-react';
import {getSupabaseBrowserClient} from '../../../lib/supabase-browser';

export default function BackofficeLogin(){
  const router=useRouter();
  const supabase=getSupabaseBrowserClient();
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{
    let mounted=true;
    supabase.auth.getSession().then(async({data})=>{
      const session=data.session;
      if(!mounted||!session)return;
      const {data:profile}=await supabase.from('backoffice_users').select('role,is_active').eq('user_id',session.user.id).maybeSingle();
      if(profile?.is_active)router.replace('/backoffice');
    });
    return()=>{mounted=false};
  },[router,supabase]);

  async function submit(event){
    event.preventDefault();
    if(busy)return;
    setBusy(true);setError('');
    try{
      const {data,error:signInError}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
      if(signInError)throw new Error('Invalid email or password.');
      const {data:profile,error:profileError}=await supabase.from('backoffice_users').select('role,is_active').eq('user_id',data.user.id).maybeSingle();
      if(profileError||!profile?.is_active){await supabase.auth.signOut();throw new Error('This account does not have back-office access.');}
      router.replace('/backoffice');
    }catch(err){setError(err instanceof Error?err.message:'Could not sign in.');}
    finally{setBusy(false)}
  }

  return <main className="boLoginPage"><section className="boLoginCard"><div className="boLoginBrand"><img src="https://zvmmgkspdgbfcqmnizga.supabase.co/storage/v1/object/public/ai-lab-ui/logo/AI_LAB_primary_logo_transparent.png" alt="AI Lab"/><span>Organiser Back Office</span></div><div className="boLoginIntro"><span className="boLoginIcon"><ShieldCheck size={22}/></span><div><h1>Super Admin</h1><p>Sign in to manage attendees, analysis, allocations and workshop operations.</p></div></div><form onSubmit={submit}><label htmlFor="admin-email">Email</label><div className="boLoginField"><Mail size={17}/><input id="admin-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div><label htmlFor="admin-password">Password</label><div className="boLoginField"><LockKeyhole size={17}/><input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></div>{error&&<p className="boLoginError" role="alert">{error}</p>}<button type="submit" disabled={busy}>{busy?'Signing in…':'Sign in'}</button></form><small>Access is restricted to authorised AI Lab administrators.</small></section></main>;
}
