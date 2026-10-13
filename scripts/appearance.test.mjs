import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import vm from "node:vm";
import {createThemeStore,parseSettings,DEFAULT_SETTINGS,ACCENTS,APPEARANCE_STORAGE_KEY,shouldAnimateScene} from "../src/app/theme-preference.ts";
function host(){const values=new Map();const events=new Map();return {localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},addEventListener:(key,fn)=>events.set(key,fn),removeEventListener:key=>events.delete(key),events};}
test("every appearance setting persists alongside legacy theme",()=>{
 const browser=host(),store=createThemeStore(browser);
 const chosen={preference:"dark",scene:"topography",material:"frosted",accent:"teal",customAccent:"#123456",intensity:93,frost:58,motion:false};
 store.update(chosen);assert.deepEqual(createThemeStore(browser).getSettingsSnapshot(),{...DEFAULT_SETTINGS,...chosen});
 store.setPreference("light");assert.equal(store.getSettingsSnapshot().frost,58);
});
test("settings reject malformed storage and clamp numeric ranges",()=>{
 assert.deepEqual(parseSettings(null),DEFAULT_SETTINGS);
 const parsed=parseSettings({scene:"https://evil",accent:"url()",customAccent:"red;url()",material:"fake",intensity:Infinity,frost:500,motion:"false"});
 assert.equal(parsed.scene,"motion");assert.equal(parsed.accent,"neutral");assert.equal(parsed.customAccent,"");assert.equal(parsed.frost,100);assert.equal(parsed.intensity,78);assert.equal(parsed.motion,true);
 assert.equal(parseSettings({intensity:0,frost:-1}).intensity,35);
});
test("all requested sources, materials and original swatches are accepted",()=>{
 for(const scene of ["motion","photo","topography","chroma","custom"])assert.equal(parseSettings({scene}).scene,scene);
 for(const material of ["clear","regular","frosted"])assert.equal(parseSettings({material}).material,material);
 assert.deepEqual(ACCENTS.map(a=>a.color),["#f4f3ee","#7896ff","#43d6b0","#aa92ff","#ff8a76","#f1c75b","#7896ff"]);
});
test("visual settings synchronize across tabs with stable snapshots",()=>{
 const browser=host(),store=createThemeStore(browser);let changes=0;const stop=store.subscribe(()=>changes++);
 const before=store.getSettingsSnapshot();assert.equal(before,store.getSettingsSnapshot());
 browser.localStorage.setItem(APPEARANCE_STORAGE_KEY,JSON.stringify({scene:"photo",frost:90}));browser.events.get("storage")({key:APPEARANCE_STORAGE_KEY,storageArea:browser.localStorage});
 assert.equal(store.getSettingsSnapshot().scene,"photo");assert.equal(changes,1);stop();assert.equal(browser.events.size,0);
});
test("scene assets retain their recorded upstream hashes",()=>{
 const root=new URL("../public/open-glass-scenes/",import.meta.url);const manifest=JSON.parse(readFileSync(new URL("provenance.json",root),"utf8"));
 for(const [name,hash] of Object.entries(manifest.sha256))assert.equal(createHash("sha256").update(readFileSync(new URL(name,root))).digest("hex"),hash);
});

test("runtime reduced-motion and hidden documents cannot be overridden by a saved preference",()=>{
 assert.equal(shouldAnimateScene(true,"off"),false);
 assert.equal(shouldAnimateScene(false,"on"),false);
 assert.equal(shouldAnimateScene(true,"on",false),false);
 assert.equal(shouldAnimateScene(true,"on",true),true);
});

test("Scene Motion describes the enabled state and exposes its actual reduced-motion state",()=>{
 const source=readFileSync(new URL("../src/components/ics/appearance/customizer.tsx",import.meta.url),"utf8");
 assert.match(source,/label="Scene Motion"/);
 assert.match(source,/description=\{runtime\.capabilities\.reducedMotion\?"Paused by your device preference":"Enable background animations"\}/);
 assert.match(source,/checked=\{settings\.motion && !runtime\.capabilities\.reducedMotion\}/);
 assert.match(source,/disabled=\{runtime\.capabilities\.reducedMotion\}/);
});

test("Motion scene uses a first-frame poster and waits for native video readiness",()=>{
 const source=readFileSync(new URL("../src/components/ics/appearance/scene.tsx",import.meta.url),"utf8");
 const styles=readFileSync(new URL("../src/components/ics/appearance/upstream-scene.css",import.meta.url),"utf8");
 assert.match(source,/settings\.scene==="motion"&&<video className="landing-backdrop__video"/);
 assert.match(source,/poster="\/open-glass-scenes\/motion-poster\.png"/);
 assert.match(source,/preload=\{moving\?"auto":"metadata"\}/);
 assert.match(styles,/\.landing-backdrop__video\s*\{[\s\S]*?object-fit:\s*cover/);
});

test("selected Photo is rendered in the initially selected source layer with eager priority",()=>{
 const source=readFileSync(new URL("../src/components/ics/appearance/scene.tsx",import.meta.url),"utf8");
 assert.match(source,/settings\.scene==="photo"&&<Image[^>]+loading="eager" fetchPriority="high" decoding="sync"/);
 assert.match(source,/className=\{`landing-backdrop landing-backdrop--\$\{settings\.scene\}`\}/);
});

test("pre-paint bootstrap preloads the selected Motion poster or Photo image",async()=>{
 const {createThemeBootstrap}=await import('../src/app/theme-preference.ts');
 for(const [scene,expected] of [['motion','/open-glass-scenes/motion-poster.png'],['photo','/open-glass-scenes/architectural-contrast.jpg']]) {
  const browserHost=host();browserHost.localStorage.setItem(APPEARANCE_STORAGE_KEY,JSON.stringify({...DEFAULT_SETTINGS,preference:'dark',scene}));
  const links=[];const document={documentElement:{dataset:{},style:{}},head:{appendChild:link=>links.push(link)},createElement:()=>({}),querySelector:()=>null};
  vm.runInNewContext(createThemeBootstrap({settings:{...DEFAULT_SETTINGS,scene},resolved:'dark'}),{document,localStorage:browserHost.localStorage,matchMedia:()=>({matches:false})});
  assert.equal(links.length,1);assert.equal(links[0].rel,'preload');assert.equal(links[0].as,'image');assert.equal(links[0].href,expected);assert.equal(links[0].fetchPriority,'high');
 }
});
