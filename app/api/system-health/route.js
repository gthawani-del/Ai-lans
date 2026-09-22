export const dynamic='force-dynamic';

function resultBase(id,group,service,source){
  return {id,group,service,source,checked_at:new Date().toISOString()};
}

async function checked(id,group,service,source,fn){
  const started=performance.now();
  try{
    const payload=await fn();
    return {...resultBase(id,group,service,source),...payload,latency_ms:Number((performance.now()-started).toFixed(1))};
  }catch(error){
    return {...resultBase(id,group,service,source),status:'down',detail:error?.message||'Health check failed',latency_ms:Number((performance.now()-started).toFixed(1))};
  }
}

function observed(id,group,service,source,status,detail,meta={}){
  return {...resultBase(id,group,service,source),status,detail,meta,latency_ms:null};
}

async function fetchWithTimeout(url,init={},timeout=8000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try{
    return await fetch(url,{...init,signal:controller.signal,cache:'no-store',redirect:'follow'});
  }finally{
    clearTimeout(timer);
  }
}

export async function GET(request){
  const requestOrigin=new URL(request.url).origin;
  const productionHost=process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL||'';
  const appOrigin=productionHost?('https://'+productionHost.replace(/^https?:\/\//,'')):requestOrigin;
  const owner=process.env.VERCEL_GIT_REPO_OWNER||'';
  const repo=process.env.VERCEL_GIT_REPO_SLUG||'';
  const ref=process.env.VERCEL_GIT_COMMIT_REF||'';
  const deployedSha=process.env.VERCEL_GIT_COMMIT_SHA||'';
  const githubToken=process.env.GITHUB_TOKEN||'';
  const ghHeaders={Accept:'application/vnd.github+json','User-Agent':'ai-lab-system-health'};
  if(githubToken)ghHeaders.Authorization='Bearer '+githubToken;

  let homeHtml='';

  const vercel=await checked(
    'vercel-runtime',
    'Infrastructure',
    'Vercel',
    'HTTPS GET '+appOrigin+'/',
    async()=>{
      const response=await fetchWithTimeout(appOrigin+'/',{},8000);
      if(!response.ok)throw new Error('Production origin HTTP '+response.status);
      const vercelId=response.headers.get('x-vercel-id');
      if(!vercelId){
        return {
          status:'warning',
          detail:'Production origin responded, but no x-vercel-id header was present.',
          meta:{http_status:response.status,environment:process.env.VERCEL_ENV||null,region:process.env.VERCEL_REGION||null,deployment_url:process.env.VERCEL_URL||null,production_url:process.env.VERCEL_PROJECT_PRODUCTION_URL||null,commit_sha:deployedSha||null,commit_ref:ref||null}
        };
      }
      return {
        status:'healthy',
        detail:'Production request was served by Vercel.',
        meta:{http_status:response.status,vercel_id:vercelId,environment:process.env.VERCEL_ENV||null,region:process.env.VERCEL_REGION||null,deployment_url:process.env.VERCEL_URL||null,production_url:process.env.VERCEL_PROJECT_PRODUCTION_URL||null,commit_sha:deployedSha||null,commit_ref:ref||null}
      };
    }
  );

  const github=owner&&repo&&ref
    ? await checked(
        'github-main',
        'Infrastructure',
        'GitHub',
        'GitHub REST commits API',
        async()=>{
          const response=await fetchWithTimeout('https://api.github.com/repos/'+owner+'/'+repo+'/commits/'+encodeURIComponent(ref),{headers:ghHeaders});
          if(!response.ok){
            if(!githubToken&&[401,403,404].includes(response.status)){
              return {status:'warning',detail:'Repository metadata is configured, but the GitHub API could not be read anonymously from this deployment.',meta:{repository:owner+'/'+repo,branch:ref,http_status:response.status,token_configured:false}};
            }
            throw new Error('GitHub API HTTP '+response.status);
          }
          const body=await response.json();
          const headSha=String(body.sha||'');
          const matches=deployedSha&&headSha?deployedSha===headSha:null;
          return {
            status:matches===false?'warning':'healthy',
            detail:matches===false?'Deployed commit differs from the current '+ref+' head.':'Repository branch read succeeded'+(headSha?' · '+headSha.slice(0,7):''),
            meta:{repository:owner+'/'+repo,branch:ref,head_sha:headSha||null,deployed_sha:deployedSha||null,commit_message:String(body.commit?.message||'').split('\n')[0]||null,committed_at:body.commit?.committer?.date||null,url:body.html_url||null,token_configured:!!githubToken}
          };
        }
      )
    : observed('github-main','Infrastructure','GitHub','Vercel Git repository environment','warning','Repository owner, slug, or commit ref is not available from the deployment environment.',{owner:owner||null,repo:repo||null,branch:ref||null});

  const publicSite=await checked(
    'public-site',
    'Application Flows',
    'Public website',
    'HTTPS GET '+appOrigin+'/',
    async()=>{
      const response=await fetchWithTimeout(appOrigin+'/',{},8000);
      if(!response.ok)throw new Error('HTTP '+response.status);
      homeHtml=await response.text();
      return {status:'healthy',detail:'Production homepage responded successfully.',meta:{url:appOrigin+'/',http_status:response.status,vercel_id:response.headers.get('x-vercel-id'),html_bytes:homeHtml.length}};
    }
  );

  const admin=checked(
    'backoffice-login',
    'Application Flows',
    'Admin / Backoffice',
    'HTTPS GET '+appOrigin+'/backoffice/login',
    async()=>{
      const response=await fetchWithTimeout(appOrigin+'/backoffice/login',{},8000);
      if(!response.ok)throw new Error('HTTP '+response.status);
      return {status:'healthy',detail:'Backoffice login route responded successfully.',meta:{url:appOrigin+'/backoffice/login',http_status:response.status,vercel_id:response.headers.get('x-vercel-id')}};
    }
  );

  const volunteer=checked(
    'volunteer-application',
    'Application Flows',
    'Volunteer application',
    'HTTPS GET '+appOrigin+'/volunteer/apply',
    async()=>{
      const response=await fetchWithTimeout(appOrigin+'/volunteer/apply',{},8000);
      if(!response.ok)throw new Error('HTTP '+response.status);
      return {status:'healthy',detail:'Volunteer application route responded successfully.',meta:{url:appOrigin+'/volunteer/apply',http_status:response.status,vercel_id:response.headers.get('x-vercel-id')}};
    }
  );

  const nextRuntime=checked(
    'next-runtime',
    'Application Flows',
    'Next.js runtime',
    'Discovered /_next/static JavaScript asset',
    async()=>{
      if(!homeHtml){
        const response=await fetchWithTimeout(appOrigin+'/',{},8000);
        if(!response.ok)throw new Error('Homepage HTTP '+response.status);
        homeHtml=await response.text();
      }
      const asset=homeHtml.match(/\/_next\/static\/[^"' ]+\.js/)?.[0];
      if(!asset)return {status:'warning',detail:'Homepage responded, but no Next.js JavaScript asset could be discovered in its HTML.',meta:{origin:appOrigin}};
      const response=await fetchWithTimeout(appOrigin+asset,{},8000);
      if(!response.ok)throw new Error('Next.js asset HTTP '+response.status);
      return {status:'healthy',detail:'A live Next.js static runtime asset responded successfully.',meta:{asset,url:appOrigin+asset,http_status:response.status}};
    }
  );

  const results=await Promise.all([Promise.resolve(vercel),Promise.resolve(github),Promise.resolve(publicSite),admin,volunteer,nextRuntime]);
  return Response.json({checked_at:new Date().toISOString(),contract_version:2,origin:appOrigin,results},{headers:{'Cache-Control':'no-store'}});
}
