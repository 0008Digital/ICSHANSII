"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import { useGlassRuntime } from "@/vendor/open-glass-ui/dist/index.js";
import { shouldAnimateScene } from "@/app/theme-preference";
import type { CustomBackground } from "./custom-background";
export function CustomBackdrop({config,url,motion}:{config:CustomBackground;url:string|null;motion:boolean}) {
 const video=useRef<HTMLVideoElement>(null);
 const runtime=useGlassRuntime();
 const moving=shouldAnimateScene(motion,runtime.motion);
 useEffect(()=>{
  const element=video.current;
  const sync=()=>{if(element){element.playbackRate=config.speed;if(shouldAnimateScene(moving,"on",!document.hidden))void element.play().catch(()=>undefined);else element.pause();}};
  sync();document.addEventListener("visibilitychange",sync);
  return()=>{element?.pause();document.removeEventListener("visibilitychange",sync);};
 },[moving,url,config.speed,config.type]);
 const gradient=config.type==="gradient"||!url;
 const style={inset:config.blur?`-${config.blur*2}px`:0,"--custom-duration":`${30/config.speed}s`,backgroundImage:gradient?`linear-gradient(125deg,${config.colors.join(",")})`:config.type==="image"?`url("${url}")`:undefined,backgroundPosition:config.position,backgroundSize:gradient?"240% 240%":config.fit,filter:config.blur?`blur(${config.blur}px)`:undefined} as CSSProperties;
 return <div className="custom-backdrop" data-motion={moving?"on":"off"} aria-hidden="true">
  <div className={`custom-backdrop__paint ${gradient?"custom-backdrop__gradient":""}`} style={style}>
   {!gradient&&config.type==="video"&&<video ref={video} src={url!} muted loop playsInline preload="auto" style={{objectFit:config.fit,objectPosition:config.position}}/>}
  </div><span className="custom-backdrop__dim" style={{background:`rgb(0 0 0 / ${config.dim/100})`}}/>
 </div>;
}
