export const dynamic='force-dynamic';

async function timed(group,service,fn){
  const started=Date.now();
  try{
    const out=await fn();
    return {group,service,latency_ms:Date.now()-started,...out};
  }catch(error){
    return {group,service,status:'down',detail:error?.message||'Health check failed',latency_ms:Date.now()-started};
  }
}

async function fetchWithTimeout(url,init={},timeout=8000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try{return await fetch(url,{...init,signal:controller.signal,cache:'no-store',redirect:'follow'});}
  finally{clearTimeout(timer);}
}

export async function GET(request){
  const requestOrigin=new URL(request.url).origin;
  const productionHost=process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL||'';
  const appOrigin=productionHost?('https://'+productionHost.replace(/^https?:\/\//,'')):requestOrigin;
  const owner=process.env.VERCEL_GIT_REPO_OWNER||'';
  const repo=process.env.VERCEL_GIT_REPO_SLUG||'';
  const ref=process.env.VERCEL_GIT_COMMIT_REF||'main';
  const deployedSha=process.env.VERCEL_GIT_COMMIT_SHA||'';
  const githubToken=process.env.GITHUB_TOKEN||'';
  const ghHeaders={Accept:'application/vnd.github+json','User-Agent':'ai-lab-system-health'};
  if(githubToken)ghHeaders.Authorization='Bearer '+githubToken;

  let homeHtml='';
  const vercel=await timed('Infrastructure','Vercel',async()=>({
    status:process.env.VERCEL==='1'?'healthy':'warning',
    detail:process.env.VERCEL==='1'?'Current Vercel deployment is serving this health request':'Vercel runtime variables are not present in this environment',
    meta:{
      environment:process.env.VERCEL_ENV||null,
      region:process.env.VERCEL_REGION||null,
      deployment_url:process.env.VERCEL_URL||null,
      production_url:process.env.VERCEL_PROJECT_PRODUCTION_URL||null,
      commit_sha:deployedSha||null,
      commit_ref:ref||null
    }
  }));

  const github=await timed('Infrastructure','GitHub',async()=>{
    if(!owner||!repo)return {status:'warning',detail:'GitHub repository metadata is not available from the deployment environment',meta:{owner:owner||null,repo:repo||null}};
    const r=await fetchWithTimeout('https://api.github.com/repos/'+owner+'/'+repo+'/commits/'+encodeURIComponent(ref),{headers:ghHeaders});
    if(!r.ok)throw new Error('GitHub API HTTP '+r.status);
    const j=await r.json();
    const headSha=String(j.sha||'');
    const matches=!deployedSha||!headSha?null:deployedSha===headSha;
    return {
      status:matches===false?'warning':'healthy',
      detail:matches===false?'Production deployment is not on the latest '+ref+' commit':'Repository reachable'+(headSha?' · '+headSha.slice(0,7):''),
      meta:{repository:owner+'/'+repo,branch:ref,head_sha:headSha||null,deployed_sha:deployedSha||null,commit_message:String(j.commit?.message||'').split('\n')[0]||null,committed_at:j.commit?.committer?.date||null,url:j.html_url||null}
    };
  });

  const publicSite=await timed('Application Flows','Public website',async()=>{
    const r=await fetchWithTimeout(appOrigin+'/');
    if(!r.ok)throw new Error('HTTP '+r.status);
    homeHtml=await r.text();
    return {status:'healthy',detail:'Production homepage responding',meta:{url:appOrigin+'/',http_status:r.status,vercel_id:r.headers.get('x-vercel-id')}};
  });

  const admin=timed('Application Flows','Admin / Backoffice',async()=>{
    const r=await fetchWithTimeout(appOrigin+'/backoffice/login');
    if(!r.ok)throw new Error('HTTP '+r.status);
    return {status:'healthy',detail:'Backoffice login route responding',meta:{url:appOrigin+'/backoffice/login',http_status:r.status,vercel_id:r.headers.get('x-vercel-id')}};
  });

  const volunteer=timed('Application Flows','Volunteer application',async()=>{
    const r=await fetchWithTimeout(appOrigin+'/volunteer/apply');
    if(!r.ok)throw new Error('HTTP '+r.status);
    return {status:'healthy',detail:'Volunteer application route responding',meta:{url:appOrigin+'/volunteer/apply',http_status:r.status}};
  });

  const nextRuntime=timed('Application Flows','Next.js runtime',async()=>{
    if(!homeHtml){
      const r=await fetchWithTimeout(appOrigin+'/');
      if(!r.ok)throw new Error('Homepage HTTP '+r.status);
      homeHtml=await r.text();
    }
    const asset=homeHtml.match(/\/_next\/static\/[^"' ]+\.js/)?.[0];
    if(!asset)return {status:'warning',detail:'App responds, but no Next.js JavaScript asset was discovered in the rendered HTML'};
    const r=await fetchWithTimeout(appOrigin+asset);
    if(!r.ok)throw new Error('Next.js asset HTTP '+r.status);
    return {status:'healthy',detail:'Next.js page and static runtime asset responding',meta:{asset,http_status:r.status}};
  });

  const results=await Promise.all([Promise.resolve(vercel),Promise.resolve(github),Promise.resolve(publicSite),admin,volunteer,nextRuntime]);
  return Response.json({checked_at:new Date().toISOString(),origin:appOrigin,results},{headers:{'Cache-Control':'no-store'}});
}
