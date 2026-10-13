"use client";
import { useEffect } from "react";
// Viewport geometry only: no theme state and no dependency on the scrolling app shell.
export function useMobileViewport(enabled:boolean) {
 useEffect(()=>{
  if(!enabled)return;
  const root=document.documentElement,viewport=window.visualViewport;
  const names=["--ics-visual-width","--ics-visual-height","--ics-visual-left","--ics-visual-top","--ics-keyboard-inset","--ics-menu-left"];
  const sync=()=>{
   const width=Math.min(viewport?.width??window.innerWidth,root.clientWidth),height=viewport?.height??window.innerHeight,left=viewport?.offsetLeft??0,top=viewport?.offsetTop??0;
   const dockWidth=Math.min(430,Math.max(0,width-24)),menuWidth=Math.min(264,Math.max(0,width-24));
   const values=[width,height,left,top,Math.max(0,window.innerHeight-height-top),left+(width+dockWidth)/2-menuWidth];
   names.forEach((name,index)=>root.style.setProperty(name,`${values[index]}px`));
  };
  sync();window.addEventListener("resize",sync);viewport?.addEventListener("resize",sync);viewport?.addEventListener("scroll",sync);
  return()=>{window.removeEventListener("resize",sync);viewport?.removeEventListener("resize",sync);viewport?.removeEventListener("scroll",sync);names.forEach(name=>root.style.removeProperty(name));};
 },[enabled]);
}
