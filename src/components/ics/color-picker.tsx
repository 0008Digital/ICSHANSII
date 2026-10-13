"use client";
import { useId, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Icon } from "./icon";
import { PickerOverlay } from "./picker-overlay";
import { normalizeHexColor } from "./color-picker-model.mjs";

const swatches=["#7896ff","#9166df","#e56c8a","#ed9c54","#35a88c","#39a5c6","#202b43","#f4f6fb"];
export function ColorPicker({label,value,onChange,description}:{label:string;value:string;onChange:(color:string)=>void;description?:string}){
 const id=useId(),trigger=useRef<HTMLButtonElement>(null);const [open,setOpen]=useState(false);const [draft,setDraft]=useState(value);const [error,setError]=useState("");
 function apply(next:string){const color=normalizeHexColor(next);if(!color){setError("Enter a 6-digit hex color, such as #7896ff.");return;}setError("");setDraft(color);onChange(color);}
 return <div className="ics-color-picker"><span id={`${id}-label`} className="ics-color-picker-label">{label}</span>{description&&<small>{description}</small>}<button ref={trigger} type="button" className="ics-color-picker-trigger" aria-labelledby={`${id}-label`} aria-haspopup="dialog" aria-expanded={open} onClick={()=>{if(!open){setDraft(value);setError("");}setOpen(value=>!value);}}><i style={{background:normalizeHexColor(value)??"#7896ff"}} aria-hidden="true"/><span>{(normalizeHexColor(value)??"#7896ff").toUpperCase()}</span><Icon name="chevron-down"/></button>
 <AnimatePresence>{open&&<PickerOverlay label={`${label} color selection`} title={label} anchor={trigger} onClose={()=>setOpen(false)} className="color-picker-overlay"><div className="ics-color-picker-popover"><label htmlFor={`${id}-hex`}>Hex color</label><div className="ics-color-picker-entry"><input data-autofocus="" id={`${id}-hex`} value={draft} maxLength={7} onChange={event=>{setDraft(event.target.value);setError("");}} onBlur={()=>{if(draft!==value)apply(draft);}} onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();apply(draft);}}}/><button type="button" aria-label="Apply hex color" onClick={()=>apply(draft)}>Apply</button></div>{error&&<p role="alert">{error}</p>}<div className="ics-color-swatches" role="group" aria-label="Preset colors">{swatches.map(color=><button key={color} type="button" aria-label={`Use ${color}`} aria-pressed={normalizeHexColor(value)===color} onClick={()=>{apply(color);setOpen(false);}}><i style={{background:color}}/></button>)}</div></div></PickerOverlay>}</AnimatePresence>
 </div>;
}
