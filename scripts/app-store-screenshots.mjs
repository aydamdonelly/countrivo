import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';

// Captures the visible native Simulator screen without altering the app or its data.
// It never fabricates outcomes, changes status bars, resizes images, or uploads to Apple.
const [command,...args]=process.argv.slice(2);
const env={...process.env,DEVELOPER_DIR:process.env.DEVELOPER_DIR??'/Applications/Xcode.app/Contents/Developer'};
const run=(binary,argv)=>execFileSync(binary,argv,{env,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const sim=argv=>run('/usr/bin/xcrun',['simctl',...argv]);
const official='https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/';
const slots={
 'iphone-medium':[[1179,2556],[1206,2622]],
 'iphone-large':[[1260,2736],[1290,2796],[1320,2868]],
 'ipad-13':[[2064,2752],[2048,2732]],
};
function inspect(file){
 const output=run('/usr/bin/sips',['-g','pixelWidth','-g','pixelHeight','-g','hasAlpha','-g','format',file]);
 const get=key=>output.match(new RegExp(`\\s${key}: ([^\\n]+)`))?.[1];
 const width=Number(get('pixelWidth')),height=Number(get('pixelHeight'));
 return{file:path.resolve(file),width,height,hasAlpha:get('hasAlpha')==='yes',format:get('format'),bytes:readFileSync(file).length,sha256:createHash('sha256').update(readFileSync(file)).digest('hex'),acceptedSlots:Object.entries(slots).filter(([,sizes])=>sizes.some(([w,h])=>width===w&&height===h||width===h&&height===w)).map(([slot])=>slot)};
}
function save(file,value){writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});}
if(command==='audit'){
 const directory=path.resolve(args[0]??'resources/app-store-current');
 const images=readdirSync(directory).filter(file=>/^(iphone|ipad)-.*\.(png|jpe?g)$/i.test(file)).map(file=>inspect(path.join(directory,file)));
 const requiredSlots=['iphone-medium','ipad-13'];
 const report={checkedAt:new Date().toISOString(),officialSpecifications:official,dimensionAndAlphaOnly:true,visualAccuracyNotEstablishedByThisCommand:true,requiredSlots,missingOpaqueRequiredSlots:requiredSlots.filter(slot=>!images.some(image=>!image.hasAlpha&&image.acceptedSlots.includes(slot))),images};
 if(args[1])save(path.resolve(args[1]),report);else console.log(JSON.stringify(report,null,2));
}else if(command==='capture'){
 const [device,slot,scene,directory]=args;
 if(!device||!slots[slot]||!scene||!directory||!/^[a-z0-9-]+$/.test(scene))throw new Error('Usage: node scripts/app-store-screenshots.mjs capture DEVICE iphone-medium|iphone-large|ipad-13 SCENE OUTPUT_DIRECTORY');
 const devices=JSON.parse(sim(['list','devices','booted','-j']));
 const info=Object.values(devices.devices).flat().find(entry=>entry.udid===device);
 if(!info)throw new Error('Specify an explicitly booted simulator UUID.');
 const app=sim(['get_app_container',device,'com.countrivo.app','app']);
 const plist=JSON.parse(run('/usr/bin/plutil',['-convert','json','-o','-',path.join(app,'Info.plist')]));
 const configBytes=readFileSync(path.join(app,'capacitor.config.json')),config=JSON.parse(configBytes);
 const out=path.resolve(directory);mkdirSync(out,{recursive:true});
 const stem=`${slot}-${scene}`,raw=path.join(out,`${stem}.raw.png`),image=path.join(out,`${stem}.jpg`),metadata=path.join(out,`${stem}.json`);
 for(const file of [raw,image,metadata])if(existsSync(file))throw new Error(`Refusing to overwrite evidence: ${file}`);
 sim(['io',device,'screenshot','--type=png',raw]);
 // JPEG export retains native pixel dimensions and guarantees no alpha channel.
 run('/usr/bin/sips',['-s','format','jpeg','-s','formatOptions','95',raw,'--out',image]);
 const original=inspect(raw),exported=inspect(image);
 const metadataValue={capturedAt:new Date().toISOString(),source:'Actual native iOS Simulator framebuffer',device:{name:info.name,udid:device,runtime:Object.entries(devices.devices).find(([,entries])=>entries.some(entry=>entry.udid===device))?.[0]},app:{bundleId:plist.CFBundleIdentifier,version:plist.CFBundleShortVersionString,build:plist.CFBundleVersion,installedPath:app,nativeConfigSha256:createHash('sha256').update(configBytes).digest('hex'),liveOrigin:config.server?.url,launchSplash:config.plugins?.SplashScreen,distribution:'Local simulator build; not an uploaded TestFlight/App Store build'},expectedScene:scene,requestedSlot:slot,officialSpecifications:official,raw:original,exported,checks:{nativeDimensionsPreserved:original.width===exported.width&&original.height===exported.height,slotDimensionsAccepted:exported.acceptedSlots.includes(slot),noAlpha:!exported.hasAlpha},needsVisualReview:true,appleUploadPerformed:false,physicalDeviceEvidence:false};
 save(metadata,metadataValue);
 if(Object.values(metadataValue.checks).some(value=>!value))throw new Error(`Capture retained but not upload-ready: inspect ${metadata}`);
 console.log(JSON.stringify({image,metadata,dimensions:`${exported.width}x${exported.height}`,needsVisualReview:true},null,2));
}else if(command==='export-xctest'){
 const [result,directory]=args;
 if(!result||!directory)throw new Error('Usage: node scripts/app-store-screenshots.mjs export-xctest RESULT.xcresult NEW_OUTPUT_DIRECTORY');
 const out=path.resolve(directory);
 if(existsSync(out))throw new Error(`Refusing to overwrite evidence: ${out}`);
 mkdirSync(out,{recursive:true});
 const rawDirectory=path.join(out,'original-attachments');
 run('/usr/bin/xcrun',['xcresulttool','export','attachments','--path',path.resolve(result),'--output-path',rawDirectory]);
 const groups=JSON.parse(readFileSync(path.join(rawDirectory,'manifest.json'),'utf8')),images=[];
 for(const group of groups){
  for(const attachment of group.attachments){
   const scene=attachment.suggestedHumanReadableName.match(/^([0-9]{2}-[a-z0-9-]+)_/)?.[1];
   if(!scene||attachment.isAssociatedWithFailure)continue;
   const original=inspect(path.join(rawDirectory,attachment.exportedFileName)),slot=original.acceptedSlots[0];
   if(!slot)continue;
   const image=path.join(out,`${slot}-${scene}.jpg`);
   if(existsSync(image))throw new Error(`Duplicate capture scene; originals retained: ${image}`);
   run('/usr/bin/sips',['-s','format','jpeg','-s','formatOptions','95',original.file,'--out',image]);
   const exported=inspect(image);
   images.push({scene,slot,deviceName:attachment.deviceName,deviceId:attachment.deviceId,capturedAt:new Date(attachment.timestamp*1000).toISOString(),testIdentifier:group.testIdentifier,original,exported,needsVisualReview:true});
  }
 }
 const manifest={source:'Actual native XCUITest screenshot attachments; no injected app state or generated scenes',sourceResult:path.resolve(result),officialSpecifications:official,images,appleUploadPerformed:false,physicalDeviceEvidence:false};
 save(path.join(out,'manifest.json'),manifest);
 console.log(JSON.stringify({directory:out,images:images.length,needsVisualReview:true},null,2));
}else{
 console.log('Read-only audit: node scripts/app-store-screenshots.mjs audit [IMAGE_DIRECTORY] [NEW_REPORT_JSON]\nCapture already visible native app: node scripts/app-store-screenshots.mjs capture DEVICE SLOT SCENE NEW_OUTPUT_DIRECTORY\nPackage real test attachments: node scripts/app-store-screenshots.mjs export-xctest RESULT.xcresult NEW_OUTPUT_DIRECTORY\nSlots: iphone-medium, iphone-large, ipad-13. Capture never launches/navigates, plays, modifies or uploads. Review every screenshot visually before using it.');
}
