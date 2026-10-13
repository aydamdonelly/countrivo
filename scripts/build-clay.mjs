import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const { assets } = JSON.parse(readFileSync('docs/concept/clay-manifest.json', 'utf8'));
const aliases = {'CL-01':'country-draft','CL-02':'geo-wordle','CL-03':'pinpoint','CL-04':'higher-or-lower','CL-05':'flag-quiz','CL-06':'stat-guesser','CL-07':'blind-pick','CL-08':'speed-flags','CL-10':'chair','CL-11':'field','CL-12':'purse','CL-13':'voice','CL-14':'desk','CL-20':'trophy','CL-24':'globe'};
const records=[];
for (const asset of assets) {
  const folder=`public/clay/${asset.id.toLowerCase()}`;
  mkdirSync(folder,{recursive:true});
  const output=`${folder}/${asset.state}.webp`;
  const encode=spawnSync('cwebp',['-quiet','-q','86','-resize','480','480',asset.file,'-o',output]);
  if (encode.status!==0) throw new Error(`Clay encode failed: ${asset.file}`);
  if (aliases[asset.id]) {
    const name=aliases[asset.id];
    const first=asset.state==='rest'||(asset.id==='CL-08'&&asset.state==='full')||(asset.id==='CL-24'&&asset.state==='americas');
    if(first||asset.state==='squash'||(asset.id==='CL-01'&&asset.state==='coins')) {
      const suffix=asset.state==='squash'?'-squash':asset.state==='coins'?'-done':'';
      const png=spawnSync('sips',['-Z','384',asset.file,'--out',`public/clay/${name}${suffix}.png`]);
      if(png.status!==0)throw new Error(`PNG encode failed ${name}`);
    }
  }
  records.push({id:asset.id,state:asset.state,source:asset.file,output,sourceSha256:createHash('sha256').update(readFileSync(asset.file)).digest('hex'),outputSha256:createHash('sha256').update(readFileSync(output)).digest('hex')});
}
writeFileSync('docs/concept/clay-web-provenance.json',JSON.stringify(records,null,2)+'\n');
console.log(`Prepared ${records.length} clay states`);
