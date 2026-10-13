import {readFileSync,writeFileSync} from 'node:fs';
import {CAPITAL_OVERRIDES,DISPUTED_CAPITAL_COUNTRIES} from '../src/content/capitals';

const data:unknown=JSON.parse(readFileSync('src/data/countries.json','utf8'));
if(!Array.isArray(data))throw new Error('Country records must be an array');
const accepted:Record<string,readonly string[]>={};
for(const country of data){
  if(!country||typeof country!=='object'||!('iso3' in country)||typeof country.iso3!=='string'||!('capital' in country)||typeof country.capital!=='string')throw new Error('Invalid country capital record');
  accepted[country.iso3]=DISPUTED_CAPITAL_COUNTRIES.includes(country.iso3)?[]:CAPITAL_OVERRIDES[country.iso3]?.accepted??(country.capital.trim()?[country.capital.trim()]:[]);
}
writeFileSync('src/data/capitals-accepted.json',JSON.stringify(accepted,null,2)+'\n');
console.log(`Built accepted capital arrays for ${Object.keys(accepted).length} country records from existing capitals plus cited overrides.`);
