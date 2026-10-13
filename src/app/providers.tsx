"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { GlassSystemProvider, useGlassTheme, type GlassAppearancePreference } from "@/vendor/open-glass-ui/dist/index.js";
import { MotionConfig, useReducedMotion } from "motion/react";
import { useCustomMedia } from "@/components/ics/appearance/use-custom-media";
import { createThemeStore, DEFAULT_SETTINGS, syncAppearanceCookie, type AppearanceSettings } from "./theme-preference";
import { BrandingProvider } from "@/components/ics/branding/branding-provider";
import { WorkspaceRolePreviewProvider, useWorkspaceRolePreview } from "@/components/ics/workspace-role-preview";
import type { DemoIdentityId } from "@/components/ics/workspace-role-model";

const noSubscribe=()=>()=>{};
const appearanceSnapshot=(settings:AppearanceSettings)=>JSON.stringify(settings);
function DocumentAppearance({settings,userId,motionPreference}:{settings:AppearanceSettings;userId:DemoIdentityId;motionPreference:AppearanceSettings["animationPreference"]}) {
 const { appearance, hydrated, palette } = useGlassTheme();
 useEffect(() => {
  document.documentElement.dataset.userMotion=motionPreference;
  if (!hydrated) return;
  syncAppearanceCookie(window,settings,undefined,userId);
  document.documentElement.dataset.appearance = appearance;
  document.documentElement.style.colorScheme = appearance;
  document.documentElement.style.setProperty("--accent", palette.accent);
  document.documentElement.style.setProperty("--accent-ink", palette.accentInk);
  document.documentElement.style.setProperty("--wash", palette.accentSoft);
  document.documentElement.style.setProperty("--ics-focus", palette.focus);
 }, [appearance, hydrated, palette,settings,userId,motionPreference]);
 return null;
}

type AppearanceContextValue={
 appearance:GlassAppearancePreference; setAppearance:(value:GlassAppearancePreference)=>void;
 settings:AppearanceSettings; persistedSettings:AppearanceSettings;
 updateSettings:(patch:Partial<AppearanceSettings>)=>boolean;
 previewSettings:(patch:Partial<AppearanceSettings>)=>void; applyPreview:()=>boolean; discardPreview:()=>void; previewDirty:boolean;
 customMedia:ReturnType<typeof useCustomMedia>; userId:DemoIdentityId;
};
const AppearanceContext=createContext<AppearanceContextValue|null>(null);

function UserAppearanceProvider({children,initialSettings,initialUserId,defaultAppearance}:{children:ReactNode;initialSettings:AppearanceSettings;initialUserId:DemoIdentityId;defaultAppearance:"light"|"dark"}) {
 const {userId}=useWorkspaceRolePreview();
 const fallback=userId===initialUserId?initialSettings:DEFAULT_SETTINGS;
 const store=useMemo(()=>typeof window==="undefined"?null:createThemeStore(window,fallback,userId),[fallback,userId]);
 const persistedSettings=useSyncExternalStore(store?.subscribe??noSubscribe,store?.getSettingsSnapshot??(()=>fallback),()=>fallback);
 const [preview,setPreview]=useState<{userId:DemoIdentityId;settings:AppearanceSettings}|null>(null);
 const previewSettings=preview?.userId===userId?preview.settings:null;
 const settings=previewSettings??persistedSettings;
 const customMedia=useCustomMedia(settings.custom.mediaId);
 const previewSettingsPatch=(patch:Partial<AppearanceSettings>)=>setPreview(current=>({userId,settings:{...parseSettingsSnapshot(current?.userId===userId?current.settings:persistedSettings),...patch}}));
 const updateSettings=(patch:Partial<AppearanceSettings>)=>{
  const saved=store?.update(patch)??false;
  if(saved)setPreview(current=>current?.userId===userId?{userId,settings:parseSettingsSnapshot({...current.settings,...patch} as AppearanceSettings)}:current);
  return saved;
 };
 const applyPreview=()=>{
  if(!previewSettings)return true;
  const applied=store?.update(previewSettings)??false;
  if(applied)setPreview(null);
  return applied;
 };
 const motionMode=settings.animationPreference==="full"?"user":"always";
 const appearance=settings.preference;
 return <AppearanceContext.Provider value={{appearance,setAppearance:value=>previewSettingsPatch({preference:value}),settings,persistedSettings,updateSettings,previewSettings:previewSettingsPatch,applyPreview,discardPreview:()=>setPreview(null),previewDirty:!!previewSettings&&appearanceSnapshot(previewSettings)!==appearanceSnapshot(persistedSettings),customMedia,userId}}>
  <MotionConfig reducedMotion={motionMode} transition={settings.animationPreference==="off"?{duration:0}:{duration:.18}}>
   <GlassSystemProvider design="liquid" renderer="auto" motion={settings.motion&&settings.animationPreference==="full"?"system":"off"}
    theme={{appearance,defaultAppearance,className:"app-theme",theme:{preset:settings.accent==="periwinkle"?"cobalt":settings.accent,contrast:"high",...(settings.customAccent?{accent:settings.customAccent}:{}),glass:{blur:.6+settings.frost/100,lensing:settings.intensity/78,highlight:settings.intensity/78}}}}>
    <BrandingProvider><DocumentAppearance settings={persistedSettings} userId={userId} motionPreference={settings.animationPreference}/>{children}</BrandingProvider>
   </GlassSystemProvider>
  </MotionConfig>
 </AppearanceContext.Provider>;
}

// Avoid trusting serialized storage values as typed data when merging an unsaved preview.
function parseSettingsSnapshot(value:AppearanceSettings):AppearanceSettings { return {...DEFAULT_SETTINGS,...value,custom:{...DEFAULT_SETTINGS.custom,...value.custom,colors:[...value.custom.colors] as AppearanceSettings["custom"]["colors"]}}; }

export function Providers({children,initialSettings=DEFAULT_SETTINGS,initialUserId="demo-centre-admin",defaultAppearance="dark"}:{children:ReactNode;initialSettings?:AppearanceSettings;initialUserId?:DemoIdentityId;defaultAppearance?:"light"|"dark"}) {
 return <WorkspaceRolePreviewProvider initialUserId={initialUserId}><UserAppearanceProvider initialSettings={initialSettings} initialUserId={initialUserId} defaultAppearance={defaultAppearance}>{children}</UserAppearanceProvider></WorkspaceRolePreviewProvider>;
}

export function useAppearance() {
 const context=useContext(AppearanceContext);
 if(!context)throw new Error("useAppearance requires Providers");
 return context;
}

export function useAppMotionReduced() {
 const {settings}=useAppearance();
 const systemReduced=useReducedMotion();
 return settings.animationPreference!=="full"||systemReduced;
}
