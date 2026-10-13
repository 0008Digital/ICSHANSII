import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { createThemeStore, parsePreference, THEME_STORAGE_KEY, themeBootstrap,appearanceProjection,readAppearanceCookie,APPEARANCE_STORAGE_KEY,DEFAULT_SETTINGS,userPreferencesStorageKey,DEMO_IDENTITY_STORAGE_KEY } from "../src/app/theme-preference.ts";

function browser(initial, blocked = false) {
  const values = new Map(initial == null ? [] : [[THEME_STORAGE_KEY, initial]]);
  const events = new Map();
  return { values,
    localStorage: {
      getItem: (key) => { if (blocked) throw Error("denied"); return values.get(key) ?? null; },
      setItem: (key, value) => { if (blocked) throw Error("denied"); values.set(key, value); },
    },
    addEventListener: (name, handler) => events.set(name, handler),
    removeEventListener: (name) => events.delete(name),
    events,
  };
}
test("validates stored preferences", () => {
  for (const value of [null, "invalid", "<script>", "system"]) assert.equal(parsePreference(value), "system");
  assert.equal(parsePreference("dark"), "dark");
  assert.equal(parsePreference("light"), "light");
});
test("all selections survive a new store/browser session", () => {
  const host = browser();
  for (const value of ["light", "dark", "system"]) {
    createThemeStore(host).setPreference(value);
    assert.equal(createThemeStore(host).getSnapshot(), value);
  }
});
test("notifies current controls and other-tab changes, with cleanup", () => {
  const host = browser("dark"); const store = createThemeStore(host); let calls = 0;
  const stop = store.subscribe(() => calls++);
  store.setPreference("light"); assert.equal(calls, 1);
  const key=userPreferencesStorageKey("demo-centre-admin");const saved=JSON.parse(host.localStorage.getItem(key));saved.appearance={...saved.appearance,preference:"system"};host.localStorage.setItem(key,JSON.stringify(saved));
  host.events.get("storage")({ key, storageArea: host.localStorage });
  assert.equal(store.getSnapshot(), "system"); assert.equal(calls, 2);
  stop(); assert.equal(host.events.size, 0);
});
test("blocked storage retains a usable in-memory preference", () => {
  const store = createThemeStore(browser(null, true));
  assert.equal(store.getSnapshot(), "system"); store.setPreference("dark");
  assert.equal(store.getSnapshot(), "dark");
});
test("pre-paint bootstrap resolves saved and system appearance safely", () => {
  for (const [saved, lightOS, expected] of [["dark",true,"dark"],["light",false,"light"],["system",true,"light"],["system",false,"dark"],["invalid",true,"light"]]) {
    const root = { dataset: {}, style: {} };
    vm.runInNewContext(themeBootstrap, { localStorage: browser(saved).localStorage, matchMedia: () => ({ matches: lightOS }), document: { documentElement: root } });
    assert.equal(root.dataset.appearance, expected); assert.equal(root.style.colorScheme, expected);
  }
});

test("pre-paint bootstrap selects the current demo user's scoped appearance",()=>{
 const host=browser();host.localStorage.setItem(DEMO_IDENTITY_STORAGE_KEY,"demo-student-b");
 host.localStorage.setItem(userPreferencesStorageKey("demo-student-b"),JSON.stringify({schemaVersion:1,tenantId:"demo-centre-hansi",userId:"demo-student-b",appearance:{...DEFAULT_SETTINGS,preference:"dark",scene:"custom",accent:"coral",animationPreference:"reduced"}}));
 const root={dataset:{},style:{}};const document={documentElement:root};
 vm.runInNewContext(themeBootstrap,{document,localStorage:host.localStorage,matchMedia:()=>({matches:false})});
 assert.equal(root.dataset.appearance,"dark");assert.equal(root.dataset.userMotion,"reduced");
 const parsed=readAppearanceCookie(document.cookie.split(";")[0].split("=").slice(1).join("="));
 assert.equal(parsed.userId,"demo-student-b");assert.equal(parsed.settings.scene,"custom");assert.equal(parsed.settings.accent,"coral");
});

test("SSR appearance projection restores user-scoped preferences without sending local media identifiers",()=>{
 const saved={...DEFAULT_SETTINGS,preference:"light",scene:"custom",material:"frosted",frost:80,custom:{...DEFAULT_SETTINGS.custom,type:"image",mediaId:"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}};
 const projection=appearanceProjection(saved,"light","demo-student-a");
 assert.equal(projection.custom.mediaId,"");
 const restored=readAppearanceCookie(encodeURIComponent(JSON.stringify(projection)));
 assert.equal(restored.settings.scene,"custom");assert.equal(restored.settings.material,"frosted");assert.equal(restored.resolved,"light");assert.equal(restored.userId,"demo-student-a");
 assert.equal(restored.settings.custom.type,"image");assert.equal(restored.settings.custom.mediaId,"");
 assert.deepEqual(readAppearanceCookie("invalid").settings,DEFAULT_SETTINGS);
});

test("demo users keep appearance preferences in isolated tenant/user records",()=>{
 const host=browser();
 const studentA=createThemeStore(host,DEFAULT_SETTINGS,"demo-student-a");
 studentA.update({preference:"dark",accent:"teal",scene:"photo",animationPreference:"off"});
 const studentB=createThemeStore(host,DEFAULT_SETTINGS,"demo-student-b");
 assert.deepEqual(studentB.getSettingsSnapshot(),DEFAULT_SETTINGS);
 studentB.update({preference:"light",scene:"topography",accent:"violet"});
 const restoredA=createThemeStore(host,DEFAULT_SETTINGS,"demo-student-a");
 assert.equal(restoredA.getSettingsSnapshot().preference,"dark");assert.equal(restoredA.getSettingsSnapshot().scene,"photo");assert.equal(restoredA.getSettingsSnapshot().accent,"teal");assert.equal(restoredA.getSettingsSnapshot().animationPreference,"off");
 const record=JSON.parse(host.localStorage.getItem(userPreferencesStorageKey("demo-student-a")));
 assert.equal(record.tenantId,"demo-centre-hansi");assert.equal(record.userId,"demo-student-a");assert.equal(record.schemaVersion,1);
});
test("Developer, Admin, Manager and Teacher appearance records are independent",()=>{
 const host=browser();
 createThemeStore(host,DEFAULT_SETTINGS,"demo-platform-owner").update({preference:"dark",accent:"coral"});
 createThemeStore(host,DEFAULT_SETTINGS,"demo-centre-admin").update({preference:"light",accent:"teal"});
 createThemeStore(host,DEFAULT_SETTINGS,"demo-manager").update({scene:"topography"});
 createThemeStore(host,DEFAULT_SETTINGS,"demo-teacher").update({scene:"chroma",animationPreference:"reduced"});
 assert.deepEqual(["demo-platform-owner","demo-centre-admin","demo-manager","demo-teacher"].map(id=>createThemeStore(host,DEFAULT_SETTINGS,id).getSettingsSnapshot()),[
  {...DEFAULT_SETTINGS,preference:"dark",accent:"coral"},
  {...DEFAULT_SETTINGS,preference:"light",accent:"teal"},
  {...DEFAULT_SETTINGS,scene:"topography"},
  {...DEFAULT_SETTINGS,scene:"chroma",animationPreference:"reduced"},
 ]);
});

test("role appearance edits do not overwrite the legacy Admin mirror",()=>{
 const host=browser("dark");host.localStorage.setItem(APPEARANCE_STORAGE_KEY,JSON.stringify({...DEFAULT_SETTINGS,scene:"chroma"}));
 createThemeStore(host,DEFAULT_SETTINGS,"demo-manager").update({preference:"light",scene:"photo"});
 assert.equal(host.localStorage.getItem(THEME_STORAGE_KEY),"dark");assert.equal(JSON.parse(host.localStorage.getItem(APPEARANCE_STORAGE_KEY)).scene,"chroma");
});
test("bootstrap migrates local visual settings into SSR mirror, excludes blob identifier",()=>{
 const host=browser("dark");host.localStorage.setItem(APPEARANCE_STORAGE_KEY,JSON.stringify({scene:"custom",custom:{type:"video",mediaId:"private-local-id"}}));
 const document={documentElement:{dataset:{},style:{}}};
 vm.runInNewContext(themeBootstrap,{document,localStorage:host.localStorage,matchMedia:()=>({matches:false})});
 const cookie=document.cookie.split(";")[0].split("=").slice(1).join("=");const parsed=JSON.parse(decodeURIComponent(cookie));
 assert.equal(parsed.scene,"custom");assert.equal(parsed.custom.type,"video");assert.equal(parsed.custom.mediaId,"");
});

test("pre-body reconciliation requests correct SSR once for a stale mirror, then stops",async()=>{
 const {createThemeBootstrap}=await import('../src/app/theme-preference.ts');
 const saved={...DEFAULT_SETTINGS,preference:'dark',scene:'photo'};
 const host=browser('dark');host.localStorage.setItem(APPEARANCE_STORAGE_KEY,JSON.stringify(saved));
 const document={documentElement:{dataset:{},style:{}}};const guards=new Map();let reloads=0;
 const context={document,localStorage:host.localStorage,matchMedia:()=>({matches:true}),location:{protocol:'http:',href:'http://localhost/settings',replace:()=>reloads++},sessionStorage:{getItem:key=>guards.get(key),setItem:(key,value)=>guards.set(key,value),removeItem:key=>guards.delete(key)}};
 vm.runInNewContext(createThemeBootstrap({settings:DEFAULT_SETTINGS,resolved:'light'}),context);
 assert.equal(reloads,1);assert.equal(document.documentElement.dataset.appearance,'dark');
 const restored=readAppearanceCookie(document.cookie.split(';')[0].split('=').slice(1).join('='));
 assert.equal(restored.settings.scene,'photo');assert.equal(restored.resolved,'dark');
 vm.runInNewContext(createThemeBootstrap(restored),context);assert.equal(reloads,1);
 vm.runInNewContext(createThemeBootstrap({settings:DEFAULT_SETTINGS,resolved:'light'}),context);assert.equal(reloads,2);
});

test("matching SSR settings never require reconciliation navigation",async()=>{
 const {createThemeBootstrap}=await import('../src/app/theme-preference.ts');
 for(const [preference,scene,lightOS] of [['dark','photo',true],['light','chroma',false],['system','topography',true],['dark','custom',false]]) {
  const saved={...DEFAULT_SETTINGS,preference,scene};const host=browser(preference);host.localStorage.setItem(APPEARANCE_STORAGE_KEY,JSON.stringify(saved));let navigated=false;
  const resolved=preference==='system'?(lightOS?'light':'dark'):preference;
  const document={documentElement:{dataset:{},style:{}}};
  vm.runInNewContext(createThemeBootstrap({settings:saved,resolved}),{document,localStorage:host.localStorage,matchMedia:()=>({matches:lightOS}),location:{replace:()=>navigated=true}});
  assert.equal(navigated,false);assert.equal(document.documentElement.dataset.appearance,resolved);
 }
});

test("blocked cookies do not trigger reconciliation loops",async()=>{
 const {createThemeBootstrap}=await import('../src/app/theme-preference.ts');
 const document={documentElement:{dataset:{},style:{}}};Object.defineProperty(document,'cookie',{get:()=>'',set:()=>{}});let reloads=0;
 vm.runInNewContext(createThemeBootstrap({settings:DEFAULT_SETTINGS,resolved:'light'}),{document,localStorage:browser('dark').localStorage,matchMedia:()=>({matches:true}),location:{replace:()=>reloads++}});
 assert.equal(reloads,0);
});

test("cookie changes synchronously and explicit themes override OS resolution",()=>{
 const host=browser();host.document={cookie:''};host.location={protocol:'https:'};host.matchMedia=()=>({matches:true});const store=createThemeStore(host);
 store.update({preference:'dark',scene:'photo'});
 const read=()=>readAppearanceCookie(host.document.cookie.split(';')[0].split('=').slice(1).join('='));
 assert.equal(read().resolved,'dark');assert.equal(read().settings.scene,'photo');assert.ok(host.document.cookie.includes('; Secure'));
 const stop=store.subscribe(()=>{});const key=userPreferencesStorageKey("demo-centre-admin");const record=JSON.parse(host.localStorage.getItem(key));record.appearance={...record.appearance,scene:'chroma'};host.localStorage.setItem(key,JSON.stringify(record));host.events.get('storage')({key,storageArea:host.localStorage});assert.equal(read().settings.scene,'chroma');stop();
});

test("missing or denied localStorage preserves the server snapshot instead of System/Motion",()=>{
 const initial={...DEFAULT_SETTINGS,preference:'dark',scene:'custom',material:'frosted'};
 for(const host of [browser(),browser(null,true)])assert.deepEqual(createThemeStore(host,initial).getSettingsSnapshot(),initial);
});

test('every theme/source pair bootstraps matching saved appearance without navigation',async()=>{
 const {createThemeBootstrap}=await import('../src/app/theme-preference.ts');
 for(const preference of ['light','dark','system'])for(const scene of ['motion','photo','topography','chroma','custom'])for(const lightOS of [true,false]) {
  const saved={...DEFAULT_SETTINGS,preference,scene,custom:{...DEFAULT_SETTINGS.custom,type:scene==='custom'?'video':'gradient'}};
  const host=browser(preference);host.localStorage.setItem(APPEARANCE_STORAGE_KEY,JSON.stringify(saved));let navigations=0;
  const resolved=preference==='system'?(lightOS?'light':'dark'):preference;
  const document={documentElement:{dataset:{},style:{}}};
  vm.runInNewContext(createThemeBootstrap({settings:saved,resolved}),{document,localStorage:host.localStorage,matchMedia:()=>({matches:lightOS}),location:{protocol:'http:',replace:()=>navigations++}});
  assert.equal(navigations,0);assert.equal(document.documentElement.dataset.appearance,resolved);
  const projection=readAppearanceCookie(document.cookie.split(';')[0].split('=').slice(1).join('='));assert.equal(projection.settings.scene,scene);
 }
});
