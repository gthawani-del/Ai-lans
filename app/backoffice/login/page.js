'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {LockKeyhole,Mail,ShieldCheck,Eye,EyeOff} from 'lucide-react';
import {useAdminSession} from '../AdminSessionContext';
import {startAdminSessionClock,endAdminSession} from '../../../lib/backoffice-session';

export default function BackofficeLogin(){
  const router=useRouter();
  const {supabase,ready,session}=useAdminSession();
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  async function submit(event){
    event.preventDefault();
    if(busy)return;
    setBusy(true);setError('');
    try{
      const {data,error:signInError}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
      if(signInError)throw new Error('Invalid email or password.');
      const {data:profile,error:profileError}=await supabase.from('backoffice_users').select('role,is_active').eq('user_id',data.user.id).maybeSingle();
      if(profileError||!profile?.is_active){await endAdminSession(supabase);throw new Error('This account does not have back-office access.');}
      startAdminSessionClock();
      router.replace('/backoffice');
    }catch(err){setError(err instanceof Error?err.message:'Could not sign in.');}
    finally{setBusy(false)}
  }

  if(!ready||session)return <main className="boBoot" role="status">Checking administrator access…</main>;

  return <main className="boLoginPage"><section className="boLoginCard"><div className="boLoginBrand"><img src="/brand/weareailabs-home.webp" alt="weareailabs"/><span>Organiser Back Office</span></div><div className="boLoginIntro"><span className="boLoginIcon"><ShieldCheck size={22}/></span><div><h1>Super Admin</h1><p>Sign in to manage attendees, analysis, allocations and workshop operations.</p></div></div><form onSubmit={submit}><label htmlFor="admin-email">Email</label><div className="boLoginField"><Mail size={17}/><input id="admin-email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div><label htmlFor="admin-password">Password</label><div className="boLoginField"><LockKeyhole size={17}/><input id="admin-password" type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" className="boPasswordToggle" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'} aria-pressed={showPassword} title={showPassword?'Hide password':'Show password'}>{showPassword?<EyeOff size={19} aria-hidden="true"/>:<Eye size={19} aria-hidden="true"/>}</button></div>{error&&<p className="boLoginError" role="alert">{error}</p>}<button type="submit" disabled={busy}>{busy?'Signing in…':'Sign in'}</button></form><small>For security, sessions expire after 30 minutes of inactivity or 8 hours maximum.</small></section></main>;
}
