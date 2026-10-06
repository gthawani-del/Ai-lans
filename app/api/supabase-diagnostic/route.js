export const runtime='nodejs';
export const dynamic='force-dynamic';

async function probe(name,url,init={}){
  const started=Date.now();
  try{
    const r=await fetch(url,{...init,cache:'no-store',signal:AbortSignal.timeout(8000)});
    const text=await r.text();
    return {name,ok:r.ok,status:r.status,latency_ms:Date.now()-started,body:text.slice(0,300)};
  }catch(error){
    return {
      name,
      ok:false,
      status:null,
      latency_ms:Date.now()-started,
      error:error?.message||String(error),
      cause:error?.cause?{name:error.cause.name||null,code:error.cause.code||null,message:error.cause.message||String(error.cause)}:null
    };
  }
}

export async function GET(){
  const base='https://zvmmgkspdgbfcqmnizga.supabase.co';
  const results=await Promise.all([
    probe('auth-health',base+'/auth/v1/health'),
    probe('rest-root',base+'/rest/v1/'),
    probe('storage-version',base+'/storage/v1/version')
  ]);
  return Response.json({
    checked_at:new Date().toISOString(),
    runtime:process.version,
    vercel:{region:process.env.VERCEL_REGION||null,environment:process.env.VERCEL_ENV||null},
    supabase_host:'zvmmgkspdgbfcqmnizga.supabase.co',
    results
  },{headers:{'Cache-Control':'no-store'}});
}
