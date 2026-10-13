"use client";
import {motion,useIsPresent} from "motion/react";
import { useAppMotionReduced } from "@/app/providers";
import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import {useGlassTheme} from "@/vendor/open-glass-ui/dist/index.js";
import {GlassSurface} from "./glass";
import { positionPicker } from "./picker-position.mjs";
import { createPortal } from "react-dom";
import { lockDocumentScroll } from "./document-scroll-lock.mjs";
export function PickerOverlay({label,anchor,onClose,children,className="",title}:{title?:string;label:string;anchor:RefObject<HTMLButtonElement|null>;onClose:()=>void;children:ReactNode;className?:string}) {
 const {tokens}=useGlassTheme();
 const reduced=useAppMotionReduced();
 const present=useIsPresent();
 const dialog=useRef<HTMLDialogElement>(null);
 const close=useRef(onClose);
 useLayoutEffect(()=>{close.current=onClose;},[onClose]);
 const choice=className.split(" ").includes("choice-overlay");
 useLayoutEffect(()=>{
  const element=dialog.current;if(!element)return;
  const trigger=anchor.current;
  // Measure the open dialog before exposing it; native initial placement is never painted.
  element.style.visibility="hidden";
  // A native top-layer dialog keeps nested dropdowns above surrounding modal surfaces.
  // Choice focus is managed explicitly after measuring, avoiding browser auto-scroll.
  element.showModal();const unlock=choice?()=>{}:lockDocumentScroll(document,window);
  const position=()=>{
   const viewport=window.visualViewport;
   const width=viewport?.width??document.documentElement.clientWidth,height=viewport?.height??window.innerHeight,left=viewport?.offsetLeft??0,top=viewport?.offsetTop??0;
   const mobile=window.matchMedia("(max-width: 767px)").matches;
   const dock=mobile?document.querySelector(".ics-mobile-dock"):null;
   const dockTop=dock?.getBoundingClientRect().top;
   const lower=dockTop===undefined?top+height-12:Math.min(top+height-12,dockTop-10);
   const available=Math.max(40,lower-top-12);
   element.style.setProperty("--picker-viewport-height",`${available+24}px`);
   element.style.maxHeight=`${available}px`;
   element.style.maxWidth=`${Math.max(0,width-24)}px`;
   element.style.inset="auto";
   if(choice){element.style.width=`${Math.min(mobile?330:Math.max(240,Math.min(trigger?.getBoundingClientRect().width??280,360)),width-24)}px`;element.style.setProperty("--choice-list-height",`${Math.max(44,available-70)}px`);}
   const r=element.getBoundingClientRect(),a=trigger?.getBoundingClientRect();
   const main=document.querySelector(".workspace-main")?.getBoundingClientRect();
   const position=positionPicker({viewportLeft:left,viewportTop:top,viewportWidth:width,viewportHeight:height,pickerWidth:r.width,pickerHeight:r.height,trigger:a?{top:a.top,bottom:a.bottom}:undefined,mainLeft:main?.left,mainRight:main?.right,mobile,dockTop});
   element.style.left=`${position.left}px`;element.style.top=`${position.top}px`;

  };
  const outside=(event:PointerEvent)=>{if(choice&&!element.contains(event.target as Node)&&!trigger?.contains(event.target as Node))close.current();};
  const focusOutside=(event:FocusEvent)=>{if(choice&&!element.contains(event.target as Node)&&!trigger?.contains(event.target as Node))close.current();};
  const escape=(event:globalThis.KeyboardEvent)=>{if(choice&&event.key==="Escape"){event.preventDefault();close.current();}};
  if(choice){document.addEventListener("pointerdown",outside,true);document.addEventListener("focusin",focusOutside);element.addEventListener("keydown",escape);}
  position();element.style.visibility="visible";const observer=new ResizeObserver(position);observer.observe(element);element.querySelector<HTMLElement>("[data-autofocus]")?.focus({preventScroll:true});
  window.addEventListener("resize",position);window.visualViewport?.addEventListener("resize",position);window.visualViewport?.addEventListener("scroll",position);
  if(choice)window.addEventListener("scroll",position,true);
  return()=>{observer.disconnect();window.removeEventListener("resize",position);window.removeEventListener("scroll",position,true);window.visualViewport?.removeEventListener("resize",position);window.visualViewport?.removeEventListener("scroll",position);unlock();
   document.removeEventListener("pointerdown",outside,true);document.removeEventListener("focusin",focusOutside);element.removeEventListener("keydown",escape);const restore=!choice||element.contains(document.activeElement)||document.activeElement===document.body;element.close();if(restore&&trigger?.isConnected)trigger.focus({preventScroll:true});};
 },[anchor,choice]);
 return createPortal(<dialog ref={dialog} inert={!present} aria-hidden={!present||undefined} className={`ics-picker-overlay ${className}`} aria-label={label} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientY<r.top||event.clientX>r.right||event.clientY>r.bottom)onClose();}}}><motion.div initial={{opacity:reduced?1:0}} animate={{opacity:1}} exit={{opacity:reduced?1:0}} transition={{duration:reduced?0:0.12}}><GlassSurface className="picker-frame" style={{...tokens,background:"var(--picker-fill)",color:"var(--text)"}}><div className="picker-title"><strong>{title??label}</strong><button type="button" onClick={onClose} aria-label={`Close ${label}`}>×</button></div>{children}</GlassSurface></motion.div></dialog>,document.body);
}
