"use client";
import {useId,useRef,useState,useLayoutEffect,type KeyboardEvent,type ReactNode} from "react";
import {AnimatePresence,motion,useIsPresent} from "motion/react";
import { useAppMotionReduced } from "@/app/providers";
import {Icon} from "./icon";
import {DisclosureSummary} from "./disclosure-summary";
import {PickerOverlay} from "./picker-overlay";
import {addDays,addMonths,allowedDate,calendarMonthDate,dateString,daysInMonth,displayDate,monthWeekCount,localToday,MONTHS,monthGrid,parseDateOnly,utcDate} from "./date-only.mjs";

type Props={label:string;value:string;onChange:(value:string)=>void;min?:string;max?:string;allowClear?:boolean;showToday?:boolean;id?:string;error?:string;required?:boolean;disabled?:boolean};
function CalendarPanel({children,reduced}:{children:ReactNode;reduced:boolean}) {
 const present=useIsPresent();
 return <motion.div className="calendar-view-panel" inert={!present} aria-hidden={!present||undefined} initial={{opacity:reduced?1:0,x:reduced?0:8}} animate={{opacity:1,x:0}} exit={{opacity:reduced?1:0,x:reduced?0:-8}} transition={{duration:reduced?0:0.14}}>{children}</motion.div>;
}
export function DatePicker({label,value,onChange,min="1900-01-01",max="2100-12-31",allowClear=true,showToday=true,id,error,required=false,disabled=false}:Props){
 const reduced=useAppMotionReduced();
 const generated=useId(),controlId=id??generated;
 const trigger=useRef<HTMLButtonElement>(null),calendar=useRef<HTMLDivElement>(null);
 const monthButton=useRef<HTMLButtonElement>(null),yearButton=useRef<HTMLButtonElement>(null),years=useRef<HTMLDivElement>(null);
 const yearFocus=useRef(0);
 const [open,setOpen]=useState(false),[cursor,setCursor]=useState(min),[today,setToday]=useState(""),[yearDraft,setYearDraft]=useState("");
 const [view,setView]=useState<"days"|"months"|"years">("days");
 if(!parseDateOnly(min)||!parseDateOnly(max)||min>max)throw Error("DatePicker requires valid ordered date-only bounds");
 const clamp=(date:string)=>!parseDateOnly(date)?(date.startsWith("-")||date.startsWith("0000")?min:max):date<min?min:date>max?max:date;
 const current=parseDateOnly(cursor)??parseDateOnly(min)!;
 const minYear=parseDateOnly(min)!.year,maxYear=parseDateOnly(max)!.year;
 const first=dateString(current.year,current.month,1),nextMonth=addMonths(first,1);
 const cells=monthGrid(first),weeks=monthWeekCount(first);
 const invalid=error||(value&&!allowedDate(value,min,max)?"Choose a valid date within the permitted range.":undefined);
 useLayoutEffect(()=>{
  if(!open)return;
  if(view==="years"){
   const option=years.current?.querySelector<HTMLButtonElement>(`[data-year="${current.year}"]`);
   option?.scrollIntoView({block:"center"});option?.focus({preventScroll:true});yearFocus.current=current.year;
  }
  if(view==="months")calendar.current?.querySelector<HTMLButtonElement>(`.calendar-view-panel:not([inert]) [data-month="${current.month}"]`)?.focus({preventScroll:true});
 },[view,open,current.year,current.month]);
 function move(next:string,focus=false){
  const date=clamp(next);setCursor(date);setYearDraft(String(parseDateOnly(date)!.year));
  if(focus)requestAnimationFrame(()=>calendar.current?.querySelector<HTMLButtonElement>(`.calendar-view-panel:not([inert]) [data-date="${date}"]`)?.focus());
 }
 function show(){const now=localToday();setToday(now);setView("days");move(allowedDate(value,min,max)?value:clamp(now));setOpen(true);}
 function choose(date:string){if(date)move(date);onChange(date);setOpen(false);}
 function returnToDays(control:"month"|"year"){setView("days");requestAnimationFrame(()=>(control==="month"?monthButton:yearButton).current?.focus({preventScroll:true}));}
 function focusYear(year:number){
  const bounded=Math.min(maxYear,Math.max(minYear,year));yearFocus.current=bounded;
  const option=years.current?.querySelector<HTMLButtonElement>(`[data-year="${bounded}"]`);option?.focus({preventScroll:true});option?.scrollIntoView({block:"nearest"});
 }
 function yearKeys(event:KeyboardEvent<HTMLButtonElement>,year:number){
  const delta:Record<string,number>={ArrowRight:1,ArrowLeft:-1,ArrowDown:4,ArrowUp:-4,PageDown:20,PageUp:-20};
  if(event.key in delta){event.preventDefault();focusYear(year+delta[event.key]);}
  else if(event.key==="Home"||event.key==="End"){event.preventDefault();focusYear(event.key==="Home"?minYear:maxYear);}
 }
 function keyboard(event:KeyboardEvent<HTMLButtonElement>,date:string){
  let next:string;
  if(event.key==="ArrowRight")next=addDays(date,1);else if(event.key==="ArrowLeft")next=addDays(date,-1);
  else if(event.key==="ArrowDown")next=addDays(date,7);else if(event.key==="ArrowUp")next=addDays(date,-7);
  else if(event.key==="Home")next=addDays(date,-utcDate(date).getUTCDay());else if(event.key==="End")next=addDays(date,6-utcDate(date).getUTCDay());
  else if(event.key==="PageUp")next=addMonths(date,event.shiftKey?-12:-1);else if(event.key==="PageDown")next=addMonths(date,event.shiftKey?12:1);else return;
  event.preventDefault();move(next,true);
 }
 return <div className="ics-date-field"><label id={`${controlId}-label`} htmlFor={controlId}>{label}{required&&<span className="required-mark" aria-hidden="true"> *</span>}</label><button ref={trigger} id={controlId} type="button" className="picker-trigger" disabled={disabled} aria-labelledby={`${controlId}-label ${controlId}-value`} aria-haspopup="dialog" aria-expanded={open} data-invalid={invalid?"true":undefined} aria-describedby={invalid?`${controlId}-error`:undefined} onClick={()=>{if(!disabled)show();}}><span id={`${controlId}-value`}>{displayDate(value)||"Choose date"}</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 5h18v16H3z M7 3v4 M17 3v4 M3 10h18"/></svg></button><input type="hidden" name={controlId} value={value}/>{invalid&&<p id={`${controlId}-error`} className="field-error">{invalid}</p>}
 <AnimatePresence>{open&&<PickerOverlay key="calendar" label={label} anchor={trigger} onClose={()=>setOpen(false)} className="calendar-overlay" title="Choose date"><div ref={calendar} className="ics-calendar">
 <span className="sr-only" aria-live="polite">{MONTHS[current.month-1]} {current.year}</span>
 <div className="calendar-controls"><button type="button" aria-label="Previous month" disabled={addDays(first,-1)<min} onClick={()=>{setView("days");move(addMonths(cursor,-1));}}><Icon name="chevron-left"/></button><button ref={monthButton} className="calendar-period-control" type="button" aria-label={`Select month, ${MONTHS[current.month-1]}`} aria-expanded={view==="months"} onClick={()=>view==="months"?returnToDays("month"):setView("months")}><span>{MONTHS[current.month-1]}</span><Icon name="chevron-down"/></button><button ref={yearButton} className="calendar-period-control" type="button" aria-label={`Select year, ${current.year}`} aria-expanded={view==="years"} onClick={()=>view==="years"?returnToDays("year"):setView("years")}><span>{current.year}</span><Icon name="chevron-down"/></button><button type="button" aria-label="Next month" disabled={!parseDateOnly(nextMonth)||nextMonth>max} onClick={()=>{setView("days");move(addMonths(cursor,1));}}><Icon name="chevron-right"/></button></div>
 <div className="calendar-view" onKeyDown={event=>{if(event.key==="Escape"&&view!=="days"){event.preventDefault();event.stopPropagation();returnToDays(view==="years"?"year":"month");}}}>
 <AnimatePresence initial={false}><CalendarPanel key={view==="days"?first:view} reduced={!!reduced}>
 {view==="months"?<div role="group" aria-label="Choose month" className="calendar-month-options">{MONTHS.map((month,index)=>{
  const start=dateString(current.year,index+1,1),end=dateString(current.year,index+1,daysInMonth(current.year,index+1));
  return <button key={month} type="button" data-month={index+1} aria-pressed={current.month===index+1} disabled={end<min||start>max} onClick={()=>{move(calendarMonthDate(cursor,current.year,index+1,min,max));returnToDays("month");}} onKeyDown={event=>{
   const delta:Record<string,number>={ArrowRight:1,ArrowLeft:-1,ArrowDown:3,ArrowUp:-3};
   if(event.key in delta){event.preventDefault();const next=Math.min(12,Math.max(1,index+1+delta[event.key]));calendar.current?.querySelector<HTMLButtonElement>(`.calendar-view-panel:not([inert]) [data-month="${next}"]:not(:disabled)`)?.focus();}
  }}>{month.slice(0,3)}</button>;
 })}</div>:view==="years"?<><div className="calendar-year-jumps"><button type="button" onClick={()=>focusYear(yearFocus.current-20)}>−20 years</button><span>{minYear}–{maxYear}</span><button type="button" onClick={()=>focusYear(yearFocus.current+20)}>+20 years</button></div><div ref={years} role="listbox" aria-label="Choose year" className="calendar-year-options">{Array.from({length:maxYear-minYear+1},(_,index)=>minYear+index).map(year=><button type="button" role="option" key={year} data-year={year} aria-selected={year===current.year} tabIndex={year===current.year?0:-1} onFocus={()=>{yearFocus.current=year;}} onKeyDown={event=>yearKeys(event,year)} onClick={()=>{move(calendarMonthDate(cursor,year,current.month,min,max));returnToDays("year");}}>{year}</button>)}</div><details className="calendar-year-direct"><DisclosureSummary>Jump to year</DisclosureSummary><label>Year<input type="number" min={minYear} max={maxYear} value={yearDraft} onChange={event=>setYearDraft(event.target.value)}/></label><button type="button" disabled={!/^\d{1,4}$/.test(yearDraft)||Number(yearDraft)<minYear||Number(yearDraft)>maxYear} onClick={()=>focusYear(Number(yearDraft))}>Find year</button></details></>:(<>
 <div role="grid" aria-label={`${MONTHS[current.month-1]} ${current.year}`} className="calendar-grid" aria-describedby={`${controlId}-keys`}><div role="row" className="calendar-week">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=><span role="columnheader" key={day}>{day}</span>)}</div>{Array.from({length:weeks},(_,week)=><div role="row" key={week} className="calendar-week">{cells.slice(week*7,week*7+7).map((date,index)=>date?<div role="gridcell" key={date} aria-selected={value===date}><button type="button" data-date={date} data-autofocus={cursor===date?"":undefined} data-outside={parseDateOnly(date)!.month!==current.month?"true":undefined} aria-label={displayDate(date)} aria-current={today===date?"date":undefined} disabled={!allowedDate(date,min,max)} tabIndex={date===cursor?0:-1} onKeyDown={event=>keyboard(event,date)} onClick={()=>choose(date)}>{cursor===date&&<motion.span className="calendar-day-highlight" layoutId={`${controlId}-day`} transition={reduced?{duration:0}:{type:"spring",stiffness:600,damping:42}} aria-hidden="true"/>}{value===date&&<motion.span className="calendar-date-selection" layoutId={`${controlId}-selection`} initial={{opacity:reduced?1:0,scale:reduced?1:0.96}} animate={{opacity:1,scale:1}} transition={reduced?{duration:0}:{type:"spring",stiffness:600,damping:42}} aria-hidden="true"/>}<span className="calendar-day-number">{parseDateOnly(date)!.day}</span></button></div>:<div key={`empty-${index}`} role="gridcell" aria-disabled="true"/>)}</div>)}</div>
 </>)}
 </CalendarPanel></AnimatePresence></div>
 <p className="sr-only" id={`${controlId}-keys`}>Arrow keys move by day or week. Page Up/Down changes month; hold Shift to change year.</p>
 <div className="calendar-actions">{allowClear&&<button type="button" onClick={()=>choose("")}>Clear date</button>}{showToday&&<button type="button" disabled={!allowedDate(today,min,max)} onClick={()=>choose(today)}>Today</button>}</div>
 </div></PickerOverlay>}</AnimatePresence>
 </div>;
}
