'use client';

import {useEffect} from 'react';
import {usePathname} from 'next/navigation';

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

  useEffect(()=>{
    if(!pathname?.startsWith('/backoffice'))return;

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
        item.onclick=()=>{window.location.href=href};
        item.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();window.location.href=href}};
      });
    };

    enhance();
    const observer=new MutationObserver(enhance);
    observer.observe(document.body,{subtree:true,childList:true});
    return()=>observer.disconnect();
  },[pathname]);

  return null;
}
