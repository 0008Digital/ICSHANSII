"use client";
import { motion } from "motion/react";
import type { CSSProperties } from "react";
import { chartFraction, dashboardPreview } from "./analytics-model.mjs";
import { useAppMotionReduced, useAppearance } from "@/app/providers";
import type { WorkspaceRole } from "./workspace-roles";

type Tone="blue"|"violet"|"teal"|"green"|"amber"|"red";
type Point={label:string;value:number;tone?:Tone};
const asPoints=(items:readonly {label:string;value:number;tone?:string}[]):Point[]=>items.map(item=>({...item,tone:item.tone as Tone|undefined}));
const toneStyle=(tone:Tone|undefined)=>({"--chart-color":`var(--chart-${tone??"blue"})`} as CSSProperties);
function Chart({title,points,unit="",maxValue}: {title:string;points:readonly Point[];unit?:string;maxValue?:number}){
 const reduced=useAppMotionReduced();const {settings}=useAppearance();const off=settings.animationPreference==="off";const max=Math.max(1,maxValue??Math.max(...points.map(item=>item.value)));
 const duration=off?0:(reduced||settings.animationPreference==="reduced"?0.16:0.55);
 return <article className="dashboard-chart"><header><h2>{title}</h2><span>SIMULATED</span></header><ul>{points.map((item,index)=><li key={item.label}><span>{item.label}</span><span className="dashboard-chart-track"><motion.i data-tone={item.tone??"blue"} style={{...toneStyle(item.tone),width:"100%",transformOrigin:"left center"}} initial={off||reduced||settings.animationPreference!=="full"?false:{scaleX:0}} animate={{scaleX:chartFraction(item.value,max)}} transition={{duration,delay:off||reduced?0:settings.animationPreference==="full"?index*.04:0}}/></span><strong>{unit==="%"?`${item.value}%`:`${unit}${item.value.toLocaleString("en-IN")}${unit===""&&title.toLowerCase().includes("attendance")?"%":""}`}</strong></li>)}</ul><p>Fictional preview values. No live operational data is connected.</p></article>;
}
function FinancialChart({rows}:{rows:readonly {label:string;income:number;expenses:number;outstanding:number}[]}){
 const reduced=useAppMotionReduced();const {settings}=useAppearance();const animate=settings.animationPreference==="full"&&!reduced;const duration=settings.animationPreference==="off"?0:(animate?0.55:0.16);
 const series=[{key:"income" as const,label:"Collections",tone:"green" as const},{key:"expenses" as const,label:"Expenses",tone:"red" as const},{key:"outstanding" as const,label:"Outstanding fees",tone:"amber" as const}];
 const max=Math.max(1,...rows.flatMap(row=>series.map(item=>row[item.key])));
 return <article className="dashboard-chart"><header><h2>Financial overview</h2><span>SIMULATED</span></header><div className="financial-series-legend">{series.map(item=><span key={item.key} style={toneStyle(item.tone)}><i aria-hidden="true"/>{item.label}</span>)}</div><ul>{rows.map(row=><li className="financial-chart-row" key={row.label}><span>{row.label}</span><span className="financial-bar-stack" role="img" aria-label={`${row.label}: collections ₹${row.income.toLocaleString("en-IN")}; expenses ₹${row.expenses.toLocaleString("en-IN")}; outstanding fees ₹${row.outstanding.toLocaleString("en-IN")}`}>{series.map(item=><motion.i key={item.key} style={{...toneStyle(item.tone),width:"100%",transformOrigin:"left center"}} initial={animate?{scaleX:0}:false} animate={{scaleX:chartFraction(row[item.key],max)}} transition={{duration}}/>)}</span><span className="sr-only">Collections ₹{row.income}; expenses ₹{row.expenses}; outstanding fees ₹{row.outstanding}</span></li>)}</ul><p>Fictional preview; collections are not verified income and expenses are not ledger records.</p></article>;
}
export function DashboardCharts({role}:{role:WorkspaceRole}){
 if(role==="admin"){const data=dashboardPreview.admin;return <section className="dashboard-charts" aria-label="Simulated dashboard charts"><Chart title="Admissions trend" points={asPoints(data.enrollment)}/><Chart title="Attendance trend" points={asPoints(data.attendance)} maxValue={100} unit="%"/><FinancialChart rows={data.financial}/></section>;}
 if(role==="manager"){const data=dashboardPreview.manager;return <section className="dashboard-charts" aria-label="Simulated manager charts"><Chart title="Daily admissions" points={asPoints(data.admissions)}/><Chart title="Renewal queue preview" points={asPoints(data.renewals)}/></section>;}
 if(role==="teacher"){const data=dashboardPreview.teacher;return <section className="dashboard-charts" aria-label="Teacher data availability"><article className="dashboard-chart"><header><h2>Assigned batch attendance</h2><span>NOT CONNECTED</span></header><p>Verified teacher assignments and attendance records are unavailable.</p></article><Chart title="Generic homework preview" points={asPoints(data.homework)}/><Chart title="Sample assessment performance" points={asPoints(data.performance)} maxValue={100} unit="%"/></section>;}
 return null;
}
