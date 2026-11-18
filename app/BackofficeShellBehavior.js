'use client';

import {useEffect} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {getSupabaseBrowserClient} from '../lib/supabase-browser';
import {adminSessionClockValid,recordAdminActivity,endAdminSession,SESSION_START_KEY,LAST_ACTIVITY_KEY} from '../lib/backoffice-session';

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

export default function BackofficeShellBehavior(){
  const pathname=usePathname();
  const router=useRouter();

  useEffect(()=>{
    if(!pathname?.startsWith('/backoffice')||pathname==='/backoffice/login')return;

    const supabase=getSupabaseBrowserClient();
    let signingOut=false;
    let lastWrite=0;

    Object.values(ROUTES).forEach(route=>router.prefetch(route));

    const expireSession=async()=>{
      if(signingOut)return;
      signingOut=true;
      try{await endAdminSession(supabase)}
      finally{router.replace('/backoffice/login?reason=expired')}
    };

    const validateSessionClock=async()=>{
      const {data}=await supabase.auth.getSession();
      if(data.session&&!adminSessionClockValid())await expireSession();
    };

    const recordActivity=()=>{
      if(signingOut)return;
      const now=Date.now();
      if(!adminSessionClockValid(now)){void expireSession();return}
      if(now-lastWrite<10000)return;
      lastWrite=now;
      recordAdminActivity(now);
    };

    const enhance=()=>{
      const brand=document.querySelector('a.boBrand');
      if(brand){
        brand.removeAttribute('href');
        brand.removeAttribute('target');
        brand.setAttribute('aria-label','weareailabs Back Office');
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

    validateSessionClock();
    enhance();

    const observer=new MutationObserver(enhance);
    observer.observe(document.body,{subtree:true,childList:true});

    const activityEvents=['pointerdown','keydown','scroll','touchstart'];
    activityEvents.forEach(name=>window.addEventListener(name,recordActivity,{passive:true}));
    const timer=window.setInterval(()=>{if(!adminSessionClockValid())void expireSession()},60000);
    const onVisibility=()=>{if(document.visibilityState==='visible')void validateSessionClock()};
    document.addEventListener('visibilitychange',onVisibility);
    const onStorage=event=>{
      if((event.key===SESSION_START_KEY||event.key===LAST_ACTIVITY_KEY)&&!adminSessionClockValid())void expireSession();
    };
    window.addEventListener('storage',onStorage);

    return()=>{
      observer.disconnect();
      activityEvents.forEach(name=>window.removeEventListener(name,recordActivity));
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange',onVisibility);
      window.removeEventListener('storage',onStorage);
    };
  },[pathname,router]);

  return null;
}
