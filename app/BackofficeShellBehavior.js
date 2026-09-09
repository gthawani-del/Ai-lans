'use client';

import {useEffect} from 'react';
import {usePathname} from 'next/navigation';

export default function BackofficeShellBehavior(){
  const pathname=usePathname();

  useEffect(()=>{
    if(!pathname?.startsWith('/backoffice'))return;

    const neutralizeBrand=()=>{
      const brand=document.querySelector('a.boBrand');
      if(!brand)return;
      brand.removeAttribute('href');
      brand.removeAttribute('target');
      brand.setAttribute('aria-label','AI Lab Back Office');
      brand.setAttribute('tabindex','-1');
    };

    neutralizeBrand();
    const observer=new MutationObserver(neutralizeBrand);
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['href']});
    return()=>observer.disconnect();
  },[pathname]);

  return null;
}
