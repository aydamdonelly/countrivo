import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercise the real bootstrap with isolated Capacitor modules; no device/network writes.
const modules={
 '@capacitor/core':'export const Capacitor={isNativePlatform:()=>globalThis.qa.native};',
 '@/hooks/use-juice':'export const registerHapticDriver=driver=>{globalThis.qa.driver=driver;globalThis.qa.calls.push("driver");};',
 '@capacitor/splash-screen':'export const SplashScreen={hide:options=>globalThis.qa.invoke("splash.hide",options)};',
 '@capacitor/status-bar':'export const Style={Light:"LIGHT"};export const StatusBar={setStyle:options=>globalThis.qa.invoke("status.style",options)};',
 '@capacitor/app':'export const App={addListener:(event,callback)=>globalThis.qa.listen("app.listener",event,callback),getLaunchUrl:()=>globalThis.qa.invoke("app.launch")};',
 '@capacitor/network':'export const Network={addListener:(event,callback)=>globalThis.qa.listen("network.listener",event,callback),getStatus:()=>globalThis.qa.invoke("network.status")};',
 '@capacitor/haptics':'export const ImpactStyle={Light:"LIGHT",Medium:"MEDIUM",Heavy:"HEAVY"},NotificationType={Success:"SUCCESS",Warning:"WARNING",Error:"ERROR"};export const Haptics={impact:options=>globalThis.qa.invoke("haptic.impact",options),selectionChanged:()=>globalThis.qa.invoke("haptic.selection"),notification:options=>globalThis.qa.invoke("haptic.notification",options)};',
};
const compiled=await build({entryPoints:['src/lib/native/bootstrap.ts'],bundle:true,write:false,platform:'node',format:'cjs',plugins:[{name:'isolated-native-modules',setup(api){
 api.onResolve({filter:/^(@capacitor\/|@\/hooks\/use-juice$)/},args=>({path:args.path,namespace:'native-fixture'}));
 api.onLoad({filter:/.*/,namespace:'native-fixture'},args=>({contents:`if(globalThis.qa.importFailure===${JSON.stringify(args.path)})throw new Error("Unavailable native module");${modules[args.path]??(()=>{throw new Error(`Unexpected dependency ${args.path}`);})()}`,loader:'js'}));
}}]});
let checks=0;const results=[];
function check(value,label){assert(value,label);checks++;}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture({native=true,hung=[],rejected=[],importFailure}={}){
 const qa={native,importFailure,calls:[],options:{},listeners:{},offline:[],navigations:[],driver:null};
 qa.invoke=(name,options)=>{
  qa.calls.push(name);qa.options[name]=options;
  if(hung.includes(name))return new Promise(()=>{});
  if(rejected.includes(name))return Promise.reject(new Error('Native service unavailable'));
  return Promise.resolve(name==='app.launch'?{url:'com.countrivo.app://games/geo-wordle/play?mode=practice'}:name==='network.status'?{connected:true}:{});
 };
 qa.listen=(name,event,callback)=>{qa.listeners[event]=callback;return qa.invoke(name);};
 const context={qa,module:{exports:{}},navigator:{onLine:false},window:{location:{href:'https://countrivo.com/',assign:target=>qa.navigations.push(target)}},URL,console};
 vm.runInNewContext(compiled.outputFiles[0].text,context);
 const {bootstrapNative,nativeLinkTarget}=context.module.exports;
 check(bootstrapNative(offline=>qa.offline.push(offline))===undefined,'Bootstrap never waits for native-service promises');
 await settle();
 const count=qa.calls.length;bootstrapNative();await settle();
 check(qa.calls.length===count,'Repeated initialization does not register native services twice');
 return{qa,nativeLinkTarget};
}
const web=await fixture({native:false});check(web.qa.calls.length===0,'Plain website initializes no native services');
const healthy=await fixture();
check(healthy.qa.calls.includes('splash.hide'),'Interactive bootstrap dismisses splash');
check(healthy.qa.options['splash.hide'].fadeOutDuration===0,'Interactive page is revealed without an artificial fade delay');
check(healthy.qa.offline[0]===false,'Initial network status is delivered');
check(healthy.qa.navigations[0]==='/games/geo-wordle/play?mode=practice','Valid cold-launch game link is retained');
healthy.qa.listeners.appUrlOpen({url:'https://countrivo.com/games/flag-quiz/play?mode=practice'});
check(healthy.qa.navigations.at(-1)==='https://countrivo.com/games/flag-quiz/play?mode=practice','Warm game link is retained');
healthy.qa.listeners.networkStatusChange({connected:false});check(healthy.qa.offline.at(-1)===true,'Network change listener still works');
healthy.qa.driver('success');await settle();check(healthy.qa.calls.includes('haptic.notification'),'Haptic driver remains functional');
for(const service of ['status.style','app.listener','app.launch','network.listener','network.status']){
 for(const behavior of ['hung','rejected']){
  const {qa}=await fixture({[behavior]:[service]});
  check(qa.calls.includes('splash.hide'),`${behavior} ${service} never blocks splash dismissal`);
  check(qa.calls.includes('app.launch')&&qa.calls.includes('app.listener'),`${behavior} ${service} does not gate independent link setup`);
  check(qa.calls.includes('network.status')&&qa.calls.includes('network.listener'),`${behavior} ${service} does not gate independent network setup`);
  check(qa.calls.includes('driver'),`${behavior} ${service} does not gate haptics`);
  results.push({service,behavior,splashDismissalRequested:true});
 }
}
for(const importFailure of ['@capacitor/haptics','@capacitor/status-bar','@capacitor/app','@capacitor/network']){
 const {qa}=await fixture({importFailure});check(qa.calls.includes('splash.hide'),`${importFailure} import failure never traps splash`);
}
const splashFailed=await fixture({rejected:['splash.hide']});
check(splashFailed.qa.calls.includes('app.launch')&&splashFailed.qa.calls.includes('network.status'),'Failed splash bridge does not prevent native setup');
const allHung=await fixture({hung:['splash.hide','status.style','app.launch','app.listener','network.status','network.listener']});
check(allHung.qa.calls.includes('splash.hide')&&allHung.qa.calls.includes('network.status'),'All native calls are started independently even when no promise settles');
const configBuild=await build({entryPoints:['capacitor.config.ts'],bundle:true,write:false,platform:'node',format:'cjs'});
const configContext={module:{exports:{}}};vm.runInNewContext(configBuild.outputFiles[0].text,configContext);
const splash=configContext.module.exports.default.plugins.SplashScreen;
check(splash.launchAutoHide===true,'Native auto-hide fallback works without any page JavaScript');
check(Number.isFinite(splash.launchShowDuration)&&splash.launchShowDuration>0&&splash.launchShowDuration<=1000,'Native fallback duration is explicitly bounded');
check(splash.showSpinner===false,'Fallback does not add an endless loading spinner');
const plugin=readFileSync('node_modules/@capacitor/splash-screen/ios/Sources/SplashScreenPlugin/SplashScreenPlugin.swift','utf8');
check(plugin.includes('getBoolean("launchAutoHide"')&&plugin.includes('getInt("launchShowDuration"'),'Installed iOS plugin reads the configured fallback keys');
console.log(`Native bootstrap: ${checks} checks passed; hung/rejected/missing services, web no-op, links, network, haptics and native fallback. No device writes.`);
