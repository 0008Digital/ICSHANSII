"use client";
import {useId, type CSSProperties} from "react";
import {motion} from "motion/react";
import {DisclosureSummary} from "../disclosure-summary";
import { SegmentedControl, Slider, Switch, getMaterialPreset, useGlassRuntime, type MaterialPresetName } from "@/vendor/open-glass-ui/dist/index.js";
import { useAppMotionReduced, useAppearance } from "@/app/providers";
import { ACCENTS, DEFAULT_SETTINGS } from "@/app/theme-preference";
import { GlassSurface } from "../glass";
import { ThemeControl } from "../theme-control";
import { CustomEditor } from "./custom-editor";
import { MaterialComparison } from "./material-comparison";
import { AppearanceScene } from "./scene";
import { ColorPicker } from "../color-picker";
function BackgroundSource() {
 const {settings,previewSettings}=useAppearance();const id=useId();const reduced=useAppMotionReduced();
 return <div className="appearance-source-segments" role="group" aria-label="Background source">{([{value:"motion",label:"Motion"},{value:"photo",label:"Photo"},{value:"topography",label:"Topo"},{value:"chroma",label:"Chroma"},{value:"custom",label:"Custom"}] as const).map((option,index)=><button type="button" key={option.value} aria-pressed={settings.scene===option.value} tabIndex={settings.scene===option.value?0:-1} onKeyDown={event=>{
 const buttons=Array.from(event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>("button"));
 const delta=event.key==="ArrowRight"||event.key==="ArrowDown"?1:event.key==="ArrowLeft"||event.key==="ArrowUp"?-1:0;
 const next=event.key==="Home"?0:event.key==="End"?buttons.length-1:delta?(index+delta+buttons.length)%buttons.length:-1;
 if(next<0)return;event.preventDefault();buttons[next].click();buttons[next].focus({preventScroll:true});
 }} onClick={()=>previewSettings({scene:option.value})}>{settings.scene===option.value&&<motion.span className="appearance-source-capsule" layoutId={`${id}-source`} transition={reduced?{duration:0}:{type:"spring",stiffness:520,damping:44,mass:.8}}/>}<span>{option.label}</span></button>)}</div>;
}
export function AppearanceCustomizer() {
 const {settings,persistedSettings,previewSettings,applyPreview,discardPreview,previewDirty,userId}=useAppearance();
 const runtime=useGlassRuntime();
 return <section className="appearance-settings" aria-labelledby="appearance-title"><h2 id="appearance-title">Appearance</h2>
 <div className="appearance-editor"><GlassSurface className="appearance-controls" style={{ color: "var(--text)" }} look={{ shadow: 0.35, lensing: 0.7 }}>
 <div className="appearance-background-group"><div className="appearance-field"><h3>Theme</h3><ThemeControl/></div>
 <div className="appearance-field appearance-source"><h3>Background source</h3><BackgroundSource/></div>
 </div><div className="appearance-glass-group"><div className="appearance-field"><h3>Glass material</h3><SegmentedControl aria-label="Glass material" value={settings.material} onValueChange={(material:MaterialPresetName)=>previewSettings({material,frost:Math.round(getMaterialPreset(material).frost*100)})} items={[{value:"clear",label:"Clear"},{value:"regular",label:"Regular"},{value:"frosted",label:"Frosted"}]}/></div>
 <fieldset className="appearance-field accent-field"><legend>Accent</legend><div className="accent-swatches">{ACCENTS.map(option=><button key={option.id} type="button" aria-label={`${option.label} accent`} aria-pressed={!settings.customAccent&&settings.accent===option.id} onClick={()=>previewSettings({accent:option.id,customAccent:""})} style={{"--swatch":option.color} as CSSProperties}><i aria-hidden="true"/></button>)}<ColorPicker label="Custom accent" value={settings.customAccent||"#7896ff"} onChange={customAccent=>previewSettings({customAccent})}/></div></fieldset>
 <Switch label="Scene Motion" description={runtime.capabilities.reducedMotion?"Paused by your device preference":"Enable background animations"} checked={settings.motion && !runtime.capabilities.reducedMotion} disabled={runtime.capabilities.reducedMotion} onCheckedChange={motion=>previewSettings({motion})}/>
 <div className="appearance-field"><h3>Interface animation</h3><SegmentedControl aria-label="Interface animation preference" value={settings.animationPreference} onValueChange={(animationPreference:"full"|"reduced"|"off")=>previewSettings({animationPreference})} items={[{value:"full",label:"Full"},{value:"reduced",label:"Reduced"},{value:"off",label:"Off"}]}/><p className="appearance-scope">Full respects your device preference. Reduced limits transitions; Off disables decorative motion.</p></div>
 <div className="appearance-preference-actions"><button type="button" className="secondary-button" onClick={()=>previewSettings(DEFAULT_SETTINGS)}>Reset to Default</button><button type="button" className="primary-link" disabled={!previewDirty} onClick={()=>{if(!applyPreview())return;}}>Apply appearance</button><button type="button" className="secondary-button" disabled={!previewDirty} onClick={discardPreview}>Discard preview</button><span role="status">{previewDirty?"Previewing changes for this demo user; changes are not saved yet.":`Applied for this demo user. Centre branding is separate. ${persistedSettings.animationPreference.toUpperCase()} motion.`}</span></div>
 </div>{settings.scene==="custom"&&<CustomEditor key={userId}/>}</GlassSurface><details className="appearance-preview-disclosure appearance-advanced"><DisclosureSummary>Advanced Glass Settings</DisclosureSummary>
 <div className="appearance-advanced-body">
 <section className="appearance-comparison-section" aria-labelledby="material-preview-title"><h3 id="material-preview-title">Material &amp; scene preview</h3><p className="appearance-scope">Comparison material, split and lighting affect these specimens only. They are not saved or applied to the workspace.</p><MaterialComparison liveControls={<section className="appearance-live-controls" aria-labelledby="live-glass-title"><h3 id="live-glass-title">Live application settings</h3><p className="appearance-scope">Preview updates the workspace. Apply appearance to save for this demo user.</p><div className="appearance-live-sliders"> <Slider label="Optical intensity" min={35} max={100} value={settings.intensity} unit="%" onInput={event=>previewSettings({intensity:Number(event.currentTarget.value)})}/>
 <Slider label="Frost" min={0} max={100} value={settings.frost} unit="%" onInput={event=>previewSettings({frost:Number(event.currentTarget.value)})}/>
</div></section>} scenePreview={<details className="appearance-scene-disclosure" open><DisclosureSummary>Scene interaction preview</DisclosureSummary><p className="appearance-scope">Reflects your live background and glass settings. Holding the floating lens pauses that lens only.</p><AppearanceScene preview/></details>}/></section>

 </div></details></div>
 </section>;
}
