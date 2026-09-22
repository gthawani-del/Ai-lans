export const dynamic='force-dynamic';

export async function GET(request){
  try{
    const {searchParams}=new URL(request.url);
    const text=(searchParams.get('q')||'').trim();
    if(text.length<3)return Response.json({suggestions:[]},{headers:{'Cache-Control':'no-store'}});

    const apiKey=process.env.GEOAPIFY_API_KEY;
    if(!apiKey)return Response.json({error:'Address autocomplete is not configured.'},{status:503,headers:{'Cache-Control':'no-store'}});

    const url=new URL('https://api.geoapify.com/v1/geocode/autocomplete');
    url.searchParams.set('text',text);
    url.searchParams.set('format','json');
    url.searchParams.set('filter','countrycode:in');
    url.searchParams.set('lang','en');
    url.searchParams.set('limit','6');
    url.searchParams.set('apiKey',apiKey);

    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok)return Response.json({error:'Address lookup failed.'},{status:502,headers:{'Cache-Control':'no-store'}});

    const body=await response.json();
    const results=Array.isArray(body?.results)?body.results:[];
    const suggestions=results.map((p,index)=>{
      const streetParts=[p.street,p.suburb||p.district].filter(Boolean);
      const streetArea=[...new Set(streetParts)].join(', ')||p.address_line1||p.name||p.formatted||'';
      const city=p.city||p.town||p.village||p.district||p.county||'';
      const postcode=p.postcode||'';
      return {
        id:p.place_id||p.datasource?.raw?.place_id||String(index),
        label:p.formatted||[streetArea,city,postcode].filter(Boolean).join(', '),
        street_area:streetArea,
        city,
        postcode,
        city_postcode:[city,postcode].filter(Boolean).join(', '),
        state:p.state||'',
        country_code:(p.country_code||'in').toLowerCase(),
        latitude:Number.isFinite(Number(p.lat))?Number(p.lat):null,
        longitude:Number.isFinite(Number(p.lon))?Number(p.lon):null,
        formatted:p.formatted||'',
        place_id:p.place_id||null
      };
    }).filter(x=>x.label);

    return Response.json({suggestions},{headers:{'Cache-Control':'no-store'}});
  }catch{
    return Response.json({error:'Address lookup failed.'},{status:500,headers:{'Cache-Control':'no-store'}});
  }
}
