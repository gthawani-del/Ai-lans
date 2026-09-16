'use client';

import {useEffect} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {getSupabaseBrowserClient} from '../lib/supabase-browser';

const ROUTES={
  'Dashboard':'/backoffice',
  'Attention Queue':'/backoffice/attention',
  'Analysis':'/backoffice/analysis',
  'Attendees':'/backoffice/attendees',
  'MVP Demand':'/backoffice/mvp-demand',
  'Table Allocation':'/backoffice/table-allocation',
  'Volunteers':'/backoffice/volunteers',
  'Payments':'/backoffice/payments',
  'MVP Options':'/backoffice/mvp-options',
  'Settings':'/backoffice/settings',
  'Data Quality':'/backoffice/data-quality',
  'Audit Log':'/backoffice/audit-log'
};

const SESSION_START_KEY='ai_lab_bo_session_start';
const LAST_ACTIVITY_KEY='ai_lab_bo_last_activity';
const INACTIVITY_MS=30*60*1000;
const ABSOLUTE_SESSION_MS=8*60*60*1000;

export default function BackofficeShellBehavior(){
  const pathname=usePathname();
  const router=useRouter();

  useEffect(()=>{
    if(!pathname?.startsWith('/backoffice')||pathname==='/backoffice/login')return;

    const supabase=getSupabaseBrowserClient();
    let signingOut=false;
    let lastWrite=0;

    Object.values(ROUTES).forEach(route=>router.prefetch(route));

    const clearMarkers=()=>{
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    };

    const expireSession=async()=>{
      if(signingOut)return;
      signingOut=true;
      clearMarkers();
      await supabase.auth.signOut();
      router.replace('/backoffice/login?reason=expired');
    };

    const sessionExpired=()=>{
      const now=Date.now();
      const started=Number(localStorage.getItem(SESSION_START_KEY)||0);
      const last=Number(localStorage.getItem(LAST_ACTIVITY_KEY)||0);
      if(!started||!last)return false;
      return now-last>=INACTIVITY_MS||now-started>=ABSOLUTE_SESSION_MS;
    };

    const initialiseSessionClock=async()=>{
      const {data}=await supabase.auth.getSession();
      if(!data.session)return;
      const now=Date.now();
      if(!localStorage.getItem(SESSION_START_KEY))localStorage.setItem(SESSION_START_KEY,String(now));
      if(!localStorage.getItem(LAST_ACTIVITY_KEY))localStorage.setItem(LAST_ACTIVITY_KEY,String(now));
      if(sessionExpired())expireSession();
    };

    const recordActivity=()=>{
      const now=Date.now();
      if(now-lastWrite<10000)return;
      lastWrite=now;
      localStorage.setItem(LAST_ACTIVITY_KEY,String(now));
    };

    const enhance=()=>{
      const brand=document.querySelector('a.boBrand');
      if(brand){
        brand.removeAttribute('href');
        brand.removeAttribute('target');
        brand.setAttribute('aria-label','AI Lab Back Office');
        brand.setAttribute('tabindex','-1');
      }

      document.querySelectorAll('.boSidebar .boNavItem').forEach(item=>{
        const label=item.querySelector('span')?.textContent?.trim();
        const href=ROUTES[label];
        if(!href)return;
        item.classList.remove('disabled');
        item.removeAttribute('aria-disabled');
        item.querySelector('small')?.remove();
        item.setAttribute('role','link');
        item.setAttribute('tabindex','0');
        item.style.cursor='pointer';
        item.onclick=e=>{e.preventDefault();recordActivity();router.push(href)};
        item.onmouseenter=()=>router.prefetch(href);
        item.onfocus=()=>router.prefetch(href);
        item.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();recordActivity();router.push(href)}};
      });
    };

    initialiseSessionClock();
    enhance();

    const observer=new MutationObserver(enhance);
    observer.observe(document.body,{subtree:true,childList:true});

    const activityEvents=['pointerdown','keydown','scroll','touchstart'];
    activityEvents.forEach(name=>window.addEventListener(name,recordActivity,{passive:true}));
    const timer=window.setInterval(()=>{if(sessionExpired())expireSession()},60000);
    const onVisibility=()=>{if(document.visibilityState==='visible'&&sessionExpired())expireSession()};
    document.addEventListener('visibilitychange',onVisibility);

    return()=>{
      observer.disconnect();
      activityEvents.forEach(name=>window.removeEventListener(name,recordActivity));
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange',onVisibility);
    };
  },[pathname,router]);

  return null;
}
