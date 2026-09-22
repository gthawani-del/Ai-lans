export const dynamic='force-dynamic';

function decodeHeader(value){
  if(!value)return '';
  try{return decodeURIComponent(value);}catch{return value}
}

export async function GET(request){
  try{
    const {searchParams}=new URL(request.url);
    const text=(searchParams.get('q')||'').trim();
    if(text.length<3)return Response.json({suggestions:[]},{headers:{'Cache-Control':'no-store'}});

    const apiKey=process.env.GEOAPIFY_API_KEY;
    if(!apiKey)return Response.json({error:'Address autocomplete is not configured.'},{status:503,headers:{'Cache-Control':'no-store'}});

    const h=request.headers;
    const latitude=Number(h.get('x-vercel-ip-latitude'));
    const longitude=Number(h.get('x-vercel-ip-longitude'));
    const approximateCity=decodeHeader(h.get('x-vercel-ip-city'));
    const approximateRegion=decodeHeader(h.get('x-vercel-ip-country-region'));

    const url=new URL('https://api.geoapify.com/v1/geocode/autocomplete');
    url.searchParams.set('text',text);
    url.searchParams.set('format','json');
    url.searchParams.set('filter','countrycode:in');
    url.searchParams.set('lang','en');
    url.searchParams.set('limit','6');
    if(Number.isFinite(latitude)&&Number.isFinite(longitude)){
      url.searchParams.set('bias',`proximity:${longitude},${latitude}`);
    }
    url.searchParams.set('apiKey',apiKey);

    const response=await fetch(url,{cache:'no-store'});
    if(!response.ok)return Response.json({error:'Address lookup failed.'},{status:502,headers:{'Cache-Control':'no-store'}});

    const body=await response.json();
    const results=Array.isArray(body?.results)?body.results:[];
    const suggestions=results.map((p,index)=>{
      const locality=p.suburb||p.quarter||p.city_district||p.district||'';
      const street=p.street||p.name||'';
      const streetArea=[...new Set([street,locality].filter(Boolean))].join(', ')||p.address_line1||p.formatted||'';
      const city=p.city||p.town||p.village||p.municipality||p.county||'';
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

    return Response.json({
      suggestions,
      bias:{
        applied:Number.isFinite(latitude)&&Number.isFinite(longitude),
        city:approximateCity||null,
        region:approximateRegion||null
      }
    },{headers:{'Cache-Control':'no-store'}});
  }catch{
    return Response.json({error:'Address lookup failed.'},{status:500,headers:{'Cache-Control':'no-store'}});
  }
}
