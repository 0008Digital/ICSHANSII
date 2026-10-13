"use client";
import { useState, type ReactNode, type CSSProperties } from "react";
import { SegmentedControl, Slider } from "@/vendor/open-glass-ui/dist/index.js";
import { GlassSurface } from "../glass";
export function MaterialComparison({liveControls,scenePreview}:{liveControls?:ReactNode;scenePreview?:ReactNode}) {
 const [split,setSplit]=useState(50);
 const [angle,setAngle]=useState(30);
 const [spread,setSpread]=useState(90);
 const [material,setMaterial]=useState<"regular"|"frosted">("regular");
 return <section className="material-comparison" aria-label="OpenGlass material comparison" style={{"--comparison-split":`${split}%`} as CSSProperties}>
  <div className="comparison-controls">{liveControls}<h3>Preview-only controls</h3><SegmentedControl aria-label="Comparison material" value={material} onValueChange={setMaterial} items={[{value:"regular",label:"Compare Regular"},{value:"frosted",label:"Compare Frosted"}]}/><Slider label="Material comparison" min={0} max={100} value={split} unit="% Clear" onInput={event=>setSplit(Number(event.currentTarget.value))}/><div className="lighting-controls"><Slider label="Lighting angle" min={0} max={360} value={angle} unit="°" onInput={event=>setAngle(Number(event.currentTarget.value))}/><Slider label="Lighting spread" min={1} max={170} value={spread} unit="°" onInput={event=>setSpread(Number(event.currentTarget.value))}/></div></div><aside className="comparison-preview-workspace" aria-label="Live preview workspace">  <div className="comparison-sample compact-comparison">
   <div aria-hidden="true" className="comparison-materials"><GlassSurface material={material} className="comparison-glass comparison-frosted" look={{lightAngle:angle,lightSpread:spread}}/><GlassSurface material="clear" className="comparison-glass comparison-clear" look={{lightAngle:angle,lightSpread:spread}}/></div>
   <div className="comparison-content"><div className="comparison-labels"><span>Clear</span><span>{material==="regular"?"Regular":"Frosted"}</span></div><span className="comparison-caption">OpenGlass materials · Preview only</span></div>
  </div>
{scenePreview}</aside>
 </section>;
}
