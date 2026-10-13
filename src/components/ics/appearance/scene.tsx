"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Glass, useGlassRuntime } from "@/vendor/open-glass-ui/dist/index.js";
import { shouldAnimateScene } from "@/app/theme-preference";
import { CustomBackdrop } from "./custom-backdrop";
import { useAppearance } from "@/app/providers";
// Backdrop composition adapted from upstream LandingBackdrop (MIT, Moe Luker 2026).
export function AppearanceScene({ preview=false }: { preview?:boolean }) {
 const {settings,customMedia}=useAppearance();
 const runtime=useGlassRuntime();
 const video=useRef<HTMLVideoElement>(null);
 const [held,setHeld]=useState(false);
 const moving=shouldAnimateScene(settings.motion,runtime.motion);
 useEffect(()=>{
  const element=video.current;
  if(!element)return;
  const sync=()=>{if(shouldAnimateScene(moving,"on",!document.hidden))void element.play().catch(()=>undefined);else element.pause();};
  sync();document.addEventListener("visibilitychange",sync);
  return()=>{element.pause();document.removeEventListener("visibilitychange",sync);};
 },[moving,settings.scene]);
 return <div className={`appearance-scene ${preview?"appearance-preview":"application-scene"}`} data-source={settings.scene} data-motion={moving?"on":"off"} style={{"--landing-intensity":settings.intensity/100} as CSSProperties} aria-hidden={preview?undefined:true}>
  <div className={`landing-backdrop landing-backdrop--${settings.scene}`} aria-hidden="true">
   {settings.scene==="motion"&&<video className="landing-backdrop__video" ref={video} muted loop playsInline preload={moving?"auto":"metadata"} poster="/open-glass-scenes/motion-poster.png" width={960} height={540}><source src="/open-glass-scenes/motion-source.mp4" type="video/mp4"/></video>}
   {settings.scene==="custom"&&<CustomBackdrop config={settings.custom} url={customMedia.url} motion={settings.motion}/>}
   {settings.scene==="photo"&&<Image src="/open-glass-scenes/architectural-contrast.jpg" width={960} height={540} alt="" unoptimized loading="eager" fetchPriority="high" decoding="sync"/>}
   <span className="landing-backdrop__grid"/><span className="landing-backdrop__glow landing-backdrop__glow--a"/><span className="landing-backdrop__glow landing-backdrop__glow--b"/><span className="landing-backdrop__contours"/>
  </div>
  {preview&&<><button type="button" className="landing-shape landing-shape--spectral" aria-label="Hold floating glass lens" aria-pressed={held} onClick={()=>setHeld(value=>!value)} style={held?{animationPlayState:"paused"}:undefined}><i aria-hidden="true"/></button><span className="landing-shape landing-shape--clear" aria-hidden="true"><i/></span>
  <Glass as="section" material={settings.material} optics={{frost:settings.frost/100}} look={{lensing:settings.intensity/78,highlight:settings.intensity/78}} interactive className="appearance-preview-pane" aria-label="Live appearance preview"><span className="preview-accent">{settings.material[0].toUpperCase()+settings.material.slice(1)} glass</span></Glass>
  </>}
 </div>;
}
