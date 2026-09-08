import {getCountries,getCountryCallingCode,isValidPhoneNumber} from 'react-phone-number-input';
import labels from 'react-phone-number-input/locale/en';

function flagEmoji(code){
  return code
    .toUpperCase()
    .replace(/./g,char=>String.fromCodePoint(127397+char.charCodeAt()));
}

export const phoneCountries=getCountries()
  .map(code=>({
    code,
    name:labels[code]||code,
    dial:`+${getCountryCallingCode(code)}`,
    flag:flagEmoji(code),
  }))
  .sort((a,b)=>a.name.localeCompare(b.name));

const countryByName=new Map(phoneCountries.map(item=>[item.name,item]));
const aliases={
  'Ivory Coast':'CI',
  'Czechia':'CZ',
  'Russia':'RU',
  'South Korea':'KR',
  'North Korea':'KP',
  'Taiwan':'TW',
  'Vietnam':'VN',
  'Laos':'LA',
  'Moldova':'MD',
  'Bolivia':'BO',
  'Venezuela':'VE',
  'Tanzania':'TZ',
  'Palestine':'PS',
  'Brunei':'BN',
  'Micronesia':'FM',
  'Syria':'SY',
  'Iran':'IR',
};
const countryByCode=new Map(phoneCountries.map(item=>[item.code,item]));

export function getPhoneCountry(name){
  if(!name)return countryByCode.get('IN');
  return countryByName.get(name)||countryByCode.get(aliases[name])||countryByCode.get('IN');
}

export function normalizeNationalPhone(value,countryName){
  const digits=String(value||'').replace(/\D/g,'');
  const meta=getPhoneCountry(countryName);
  return digits.slice(0,meta.code==='IN'?10:15);
}

export function phoneValidationMessage({phone,country,phone_country_code}){
  const meta=getPhoneCountry(country);
  const digits=String(phone||'').replace(/\D/g,'');
  if(!digits)return 'Enter your phone number';
  if(String(phone_country_code||'')!==meta.dial)return `Use ${meta.dial} for ${meta.name}`;
  if(meta.code==='IN'){
    if(digits.length!==10)return 'Enter a 10-digit Indian mobile number';
    if(!/^[6-9]/.test(digits))return 'Indian mobile numbers must start with 6, 7, 8 or 9';
    return '';
  }
  try{
    return isValidPhoneNumber(digits,meta.code)?'':`Enter a valid ${meta.name} phone number`;
  }catch{
    return `Enter a valid ${meta.name} phone number`;
  }
}

export function isPhoneValid(values){
  return !phoneValidationMessage(values);
}
