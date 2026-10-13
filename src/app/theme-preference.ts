import { initializeAppearance } from "./appearance-bootstrap.mjs";
import { DEFAULT_CUSTOM, parseCustomBackground, type CustomBackground } from "../components/ics/appearance/custom-background.ts";
import { parseDemoIdentity, type DemoIdentityId } from "../components/ics/workspace-role-model.ts";
export type ThemePreference = "light" | "dark" | "system";
export type AnimationPreference = "full" | "reduced" | "off";
export const THEME_STORAGE_KEY = "ics-hansi.theme";
export const APPEARANCE_STORAGE_KEY = "ics-hansi.appearance.v1";
export const DEMO_IDENTITY_STORAGE_KEY = "ics-hansi.demo-identity.v1";
export const DEMO_TENANT_ID = "demo-centre-hansi";
export const USER_PREFERENCES_PREFIX = "ics-hansi.demo-user-preferences.v1";
export function userPreferencesStorageKey(userId:DemoIdentityId,tenantId=DEMO_TENANT_ID) {
 return `${USER_PREFERENCES_PREFIX}.${tenantId}.${userId}`;
}
export const ACCENTS = [
 {id:"neutral",label:"Neutral",color:"#f4f3ee"}, {id:"cobalt",label:"Blue",color:"#7896ff"},
 {id:"teal",label:"Teal",color:"#43d6b0"}, {id:"violet",label:"Purple",color:"#aa92ff"},
 {id:"coral",label:"Coral",color:"#ff8a76"}, {id:"amber",label:"Yellow",color:"#f1c75b"},
 {id:"periwinkle",label:"Periwinkle",color:"#7896ff"},
] as const;
export type AppearanceSettings = {
 preference:ThemePreference; scene:"motion"|"photo"|"topography"|"chroma"|"custom"; custom:CustomBackground;
 accent:typeof ACCENTS[number]["id"]; customAccent:string;
 material:"clear"|"regular"|"frosted"; intensity:number; frost:number; motion:boolean; animationPreference:AnimationPreference;
};
export const DEFAULT_SETTINGS:AppearanceSettings = {preference:"system",scene:"motion",custom:DEFAULT_CUSTOM,accent:"neutral",customAccent:"",material:"clear",intensity:78,frost:4,motion:true,animationPreference:"full"};
export function parsePreference(value: unknown): ThemePreference { return value === "light" || value === "dark" ? value : "system"; }
export function parseSettings(value:unknown):AppearanceSettings {
 const input = value && typeof value === "object" ? value as Record<string,unknown> : {};
 const number = (key:string,min:number,max:number,fallback:number) => typeof input[key]==="number" && Number.isFinite(input[key]) ? Math.min(max,Math.max(min,input[key] as number)) : fallback;
 return {
 preference:parsePreference(input.preference),
 scene:["motion","photo","topography","chroma","custom"].includes(String(input.scene))?input.scene as AppearanceSettings["scene"]:"motion",
 custom:parseCustomBackground(input.custom),
 accent:ACCENTS.some(a=>a.id===input.accent)?input.accent as AppearanceSettings["accent"]:"neutral",
 customAccent:typeof input.customAccent==="string" && /^#[0-9a-f]{6}$/i.test(input.customAccent)?input.customAccent:"",
 material:["clear","regular","frosted"].includes(String(input.material))?input.material as AppearanceSettings["material"]:"clear",
 intensity:number("intensity",35,100,78),frost:number("frost",0,100,4),motion:typeof input.motion==="boolean"?input.motion:true,
 animationPreference:["full","reduced","off"].includes(String(input.animationPreference))?input.animationPreference as AnimationPreference:"full",
 };
}
// Non-sensitive SSR projection. Blob bytes and local media identifiers never leave IndexedDB/localStorage.
export const APPEARANCE_COOKIE="ics-hansi-appearance";
export function appearanceProjection(settings:AppearanceSettings,resolved:ThemePreference="dark",userId:DemoIdentityId="demo-centre-admin") {
 return {...settings,custom:{...settings.custom,mediaId:""},resolved:resolved==="light"?"light":"dark",userId};
}
export function readAppearanceCookie(value?:string) {
 try {const raw=JSON.parse(decodeURIComponent(value??""));return {settings:parseSettings(raw),resolved:raw.preference==="light"||raw.preference==="dark"?raw.preference:raw.resolved==="light"?"light" as const:"dark" as const,userId:parseDemoIdentity(raw.userId)??"demo-centre-admin" as const};}
 catch{return {settings:DEFAULT_SETTINGS,resolved:"dark" as const,userId:"demo-centre-admin" as const};}
}
export function syncAppearanceCookie(browser:Window,settings:AppearanceSettings,resolved?:ThemePreference,userId:DemoIdentityId="demo-centre-admin") {
 try {const system=settings.preference!=="system"?settings.preference:resolved??(browser.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");
 browser.document.cookie=`${APPEARANCE_COOKIE}=${encodeURIComponent(JSON.stringify(appearanceProjection(settings,system,userId)))}; Path=/; Max-Age=31536000; SameSite=Lax${browser.location.protocol==="https:"?"; Secure":""}`;}catch{}
}
export function readUserAppearance(browser:Pick<Window,"localStorage">,userId:DemoIdentityId,fallback:AppearanceSettings=DEFAULT_SETTINGS,tenantId=DEMO_TENANT_ID) {
 try {
  const raw=browser.localStorage.getItem(userPreferencesStorageKey(userId,tenantId));
  if(raw!==null){const parsed=JSON.parse(raw);return parseSettings(parsed?.appearance??parsed);}
 } catch {}
 if(userId==="demo-centre-admin") {
  try {const rawVisual=browser.localStorage.getItem(APPEARANCE_STORAGE_KEY);const rawTheme=browser.localStorage.getItem(THEME_STORAGE_KEY);if(rawVisual!==null||rawTheme!==null){const visual=JSON.parse(rawVisual??"{}");const preference=parsePreference(rawTheme??fallback.preference);return parseSettings({...visual,preference});}}catch{}
 }
 return parseSettings(fallback);
}
// One canonical preference store, with compatible migration from the existing theme key.
export function createThemeStore(browser: Window, fallback:AppearanceSettings=DEFAULT_SETTINGS,userId:DemoIdentityId="demo-centre-admin") {
 const read = () => readUserAppearance(browser,userId,fallback);
 let settings=read();
 const listeners=new Set<()=>void>();
 const notify=()=>listeners.forEach(listener=>listener());
 const onStorage=(event:StorageEvent)=>{
  if(event.key!==THEME_STORAGE_KEY && event.key!==APPEARANCE_STORAGE_KEY && event.key!==userPreferencesStorageKey(userId) && event.key!==null)return;
  try { if(event.storageArea && event.storageArea!==browser.localStorage)return; settings=read(); syncAppearanceCookie(browser,settings); notify(); } catch {}
 };
 const update=(patch:Partial<AppearanceSettings>)=>{
  settings=parseSettings({...settings,...patch});
  try {
   const {preference,...visual}=settings;
   // Commit visual metadata last: a failed earlier write cannot replace its media reference.
   browser.localStorage.setItem(userPreferencesStorageKey(userId),JSON.stringify({schemaVersion:1,tenantId:DEMO_TENANT_ID,userId,appearance:settings,updatedAt:new Date().toISOString()}));
   // Preserve the established keys as an Admin compatibility mirror only. Other demo identities never read or overwrite them.
   if(userId==="demo-centre-admin"){browser.localStorage.setItem(THEME_STORAGE_KEY,preference);browser.localStorage.setItem(APPEARANCE_STORAGE_KEY,JSON.stringify(visual));}
  } catch { notify(); return false; }
  syncAppearanceCookie(browser,settings,undefined,userId); notify(); return true;
 };
 return {
  getSnapshot:()=>settings.preference, getSettingsSnapshot:()=>settings,
  subscribe(listener:()=>void){if(!listeners.size)browser.addEventListener("storage",onStorage);listeners.add(listener);return()=>{listeners.delete(listener);if(!listeners.size)browser.removeEventListener("storage",onStorage);};},
  setPreference(value:ThemePreference){update({preference:value});}, update,
 };
}
export function createThemeBootstrap(server?:ReturnType<typeof readAppearanceCookie>) {
 const config={defaults:DEFAULT_SETTINGS,server,themeKey:THEME_STORAGE_KEY,visualKey:APPEARANCE_STORAGE_KEY,identityKey:DEMO_IDENTITY_STORAGE_KEY,preferencesPrefix:USER_PREFERENCES_PREFIX,tenantId:DEMO_TENANT_ID,cookieKey:APPEARANCE_COOKIE,accents:ACCENTS.map(a=>a.id)};
 return `(${initializeAppearance.toString()})(${JSON.stringify(config).replace(/</g,"\\u003c")},{document,localStorage,matchMedia,location:typeof location!=="undefined"?location:undefined,sessionStorage:typeof sessionStorage!=="undefined"?sessionStorage:undefined})`;
}
export const themeBootstrap=createThemeBootstrap();
export function shouldAnimateScene(requested:boolean,runtimeMotion:"on"|"off",visible=true) {
 return requested && runtimeMotion==="on" && visible;
}
