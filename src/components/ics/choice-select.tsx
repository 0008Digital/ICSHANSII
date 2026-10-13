"use client";
import {AnimatePresence} from "motion/react";
import {Icon} from "./icon";
import {useId,useRef,useState,type KeyboardEvent} from "react";
import {PickerOverlay} from "./picker-overlay";
import { edgeEnabledIndex, findEnabledPrefix, nextEnabledIndex } from "./choice-select-model.mjs";
type Option={value:string;label:string;disabled?:boolean};
export function ChoiceSelect({label,value,onChange,options,id,error,description,required=false,disabled=false}:{label:string;value:string;onChange:(value:string)=>void;options:Option[];id?:string;error?:string;description?:string;required?:boolean;disabled?:boolean}){
 const generated=useId(),controlId=id??generated;
 const trigger=useRef<HTMLButtonElement>(null),items=useRef<(HTMLButtonElement|null)[]>([]);
 const [open,setOpen]=useState(false); const selected=Math.max(0,options.findIndex(option=>option.value===value));
 const [active,setActive]=useState(selected),typed=useRef({text:"",at:0});
 function keyboard(event:KeyboardEvent<HTMLDivElement>){
  let next=active;
  if(event.key==="ArrowDown")next=nextEnabledIndex(options,active,1);
  else if(event.key==="ArrowUp")next=nextEnabledIndex(options,active,-1);
  else if(event.key==="Home")next=edgeEnabledIndex(options,"start");else if(event.key==="End")next=edgeEnabledIndex(options,"end");
  else if(event.key.length===1&&!event.ctrlKey&&!event.metaKey){const now=Date.now();typed.current={text:(now-typed.current.at<700?typed.current.text:"")+event.key.toLowerCase(),at:now};const found=findEnabledPrefix(options,typed.current.text);if(found<0)return;next=found;}
  else return;
  event.preventDefault();setActive(next);items.current[next]?.focus();items.current[next]?.scrollIntoView({block:"nearest"});
 }
 return <div className="ics-choice"><label id={`${controlId}-label`} htmlFor={controlId}>{label}{required&&<span className="required-mark" aria-hidden="true"> *</span>}</label><button ref={trigger} type="button" id={controlId} className="picker-trigger" disabled={disabled} aria-labelledby={`${controlId}-label ${controlId}-value`} aria-haspopup="dialog" aria-expanded={open} data-invalid={error?"true":undefined} aria-describedby={error?`${controlId}-error`:description?`${controlId}-help`:undefined} onClick={()=>{if(disabled)return;setActive(selected);setOpen(true);}} onKeyDown={event=>{if(!disabled&&(event.key==="ArrowDown"||event.key==="ArrowUp")){event.preventDefault();setActive(selected);setOpen(true);}}}><span id={`${controlId}-value`}>{options.find(option=>option.value===value)?.label??"Choose an option"}</span><Icon name="chevron-down"/></button>{description&&<p className="section-footnote" id={`${controlId}-help`}>{description}</p>}{error&&<p className="field-error" id={`${controlId}-error`}>{error}</p>}
 <AnimatePresence>{open&&<PickerOverlay label={label} anchor={trigger} onClose={()=>setOpen(false)} className="choice-overlay"><div role="listbox" aria-label={label} aria-required={required||undefined} onKeyDown={keyboard} className="choice-options">{options.map((option,index)=><button key={option.value} ref={element=>{items.current[index]=element;}} type="button" role="option" aria-selected={option.value===value} aria-disabled={option.disabled||undefined} disabled={option.disabled} tabIndex={active===index?0:-1} data-autofocus={index===selected?"":undefined} onFocus={()=>setActive(index)} onClick={()=>{if(option.disabled)return;onChange(option.value);setOpen(false);}}>{option.label}<span aria-hidden="true">{option.value===value?"✓":""}</span></button>)}</div></PickerOverlay>}</AnimatePresence>
 </div>;
}
