"use client";
import { useEffect, useRef, useState } from "react";
import { Slider } from "@/vendor/open-glass-ui/dist/index.js";
import { useAppearance } from "@/app/providers";
import {DisclosureSummary} from "../disclosure-summary";
import { ChoiceSelect } from "../choice-select";
import { CustomBackdrop } from "./custom-backdrop";
import { DEFAULT_CUSTOM, parseCustomBackground, storageMessage, validateWallpaper, type CustomBackground } from "./custom-background";
import { decodeWallpaper } from "./decode-wallpaper";
import { saveWallpaper, deleteWallpaper, pruneWallpapers } from "./wallpaper-storage";
import { ColorPicker } from "../color-picker";
export function CustomEditor() {
 const {settings,updateSettings,customMedia}=useAppearance();
 const [draft,setDraft]=useState(settings.custom);
 const [upload,setUpload]=useState<{file:File;url:string}|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const input=useRef<HTMLInputElement>(null);
 const currentURL=useRef<string|null>(null);
 const sequence=useRef(0);
 useEffect(()=>()=>{sequence.current++;if(currentURL.current)URL.revokeObjectURL(currentURL.current);},[]);
 const patch=(value:Partial<CustomBackground>)=>setDraft(previous=>parseCustomBackground({...previous,...value}));
 function clearUpload(){if(currentURL.current)URL.revokeObjectURL(currentURL.current);currentURL.current=null;setUpload(null);}
 async function choose(file:File){
  const task=++sequence.current;setBusy(true);setMessage("");let url:string|undefined;
  try{const type=await validateWallpaper(file);url=URL.createObjectURL(file);await decodeWallpaper(url,type);if(task!==sequence.current){URL.revokeObjectURL(url);return;}clearUpload();currentURL.current=url;setUpload({file,url});patch({type});setMessage("Preview ready. Apply to save on this device.");}
  catch(error){if(url)URL.revokeObjectURL(url);if(task===sequence.current)setMessage(error instanceof Error?error.message:"Media could not be opened.");}
  finally{if(task===sequence.current)setBusy(false);}
 }
 async function apply(){
  setBusy(true);setMessage("");let newId="";
  try{
   let next=parseCustomBackground(draft);
   if(next.type!=="gradient"){
    if(upload){newId=crypto.randomUUID();await saveWallpaper(newId,upload.file);next={...next,mediaId:newId};}
    else if(!next.mediaId||customMedia.error)throw new Error("Choose an image or video first, or select Gradient.");
   }else next={...next,mediaId:""};
   if(!updateSettings({scene:"custom",custom:next})){
    updateSettings({scene:settings.scene,custom:settings.custom});
    if(newId)await deleteWallpaper(newId);
    throw new Error("Appearance settings could not be saved. Previous settings were retained.");
   }
   setDraft(next);clearUpload();
   try{await pruneWallpapers(next.mediaId);setMessage("Applied locally. Media never leaves this browser.");}
   catch{setMessage("Applied locally. Old media cleanup failed; use Remove to retry cleanup.");}
  }catch(error){setMessage(newId||error instanceof Error&&error.name==="QuotaExceededError"?storageMessage(error):error instanceof Error?error.message:storageMessage(error));}
  finally{setBusy(false);}
 }
 async function remove(){
  setBusy(true);setMessage("");
  try{
   if(!updateSettings({custom:DEFAULT_CUSTOM})){
    updateSettings({scene:settings.scene,custom:settings.custom});throw new Error("Removal could not be saved. The existing wallpaper was retained.");
   }
   clearUpload();setDraft(DEFAULT_CUSTOM);
   await pruneWallpapers("");setMessage("Uploaded media removed. Default gradient restored.");
  }catch(error){setMessage(error instanceof Error?error.message:storageMessage(error));}
  finally{setBusy(false);}
 }
 return <section className="custom-editor" aria-labelledby="custom-title">
  <div className="custom-editor-controls"><h3 id="custom-title">Custom background</h3>
   <details className="custom-limits"><DisclosureSummary>Local media limits</DisclosureSummary><p className="section-footnote">Images: 20 MB / 24 MP. Videos: 60 MB / Full HD / 10 minutes. Stored only on this device; browser storage may be cleared or evicted.</p></details>
   <div className="custom-actions"><button type="button" aria-pressed={draft.type==="gradient"} disabled={busy} onClick={()=>patch({type:"gradient"})}>Gradient</button><button type="button" disabled={busy} onClick={()=>input.current?.click()}>Choose image or video</button></div>
   <input ref={input} className="sr-only" tabIndex={-1} type="file" aria-label="Custom wallpaper file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" disabled={busy} onChange={event=>{const file=event.currentTarget.files?.[0];event.currentTarget.value="";if(file)void choose(file);}}/>
   {upload&&<p className="custom-filename">{upload.file.name}</p>}
   {draft.type==="gradient"?<div className="gradient-colors">{draft.colors.map((color,index)=><ColorPicker key={index} label={`Color ${index+1}`} value={color} onChange={next=>{const colors=[...draft.colors] as CustomBackground["colors"];colors[index]=next;patch({colors});}}/>)}</div>:<div className="custom-position"><ChoiceSelect label="Background fit" value={draft.fit} onChange={fit=>patch({fit:fit as CustomBackground["fit"]})} options={[{value:"cover",label:"Fill workspace"},{value:"contain",label:"Fit entire media"}]}/><ChoiceSelect label="Background position" value={draft.position} onChange={position=>patch({position:position as CustomBackground["position"]})} options={[{value:"center",label:"Centre"},{value:"top",label:"Top"},{value:"bottom",label:"Bottom"}]}/></div>}
   <details className="custom-advanced"><DisclosureSummary>Animation &amp; finishing</DisclosureSummary><div><Slider label="Animation speed" min={0.25} max={2} step={0.25} value={draft.speed} unit="×" onInput={event=>patch({speed:Number(event.currentTarget.value)})}/>
   <Slider label="Background dimming" min={0} max={80} value={draft.dim} unit="%" onInput={event=>patch({dim:Number(event.currentTarget.value)})}/>
   <Slider label="Background blur" min={0} max={20} value={draft.blur} unit="px" onInput={event=>patch({blur:Number(event.currentTarget.value)})}/>
   </div></details><div className="custom-actions"><button type="button" disabled={busy} onClick={()=>void apply()}>Apply background</button><button type="button" disabled={busy} onClick={()=>{clearUpload();setDraft(DEFAULT_CUSTOM);setMessage("Defaults previewed. Apply to save.");}}>Reset background</button><button type="button" disabled={busy} onClick={()=>void remove()}>Remove background</button></div>
   <p className="custom-status" role="status">{busy?"Checking local media…":message||customMedia.error|| (customMedia.loading?"Restoring saved media…":"Changes are previewed here until you apply them.")}</p>
  </div><div className="custom-editor-preview"><span>Draft preview</span><div className="custom-draft-scene"><CustomBackdrop config={draft} url={upload?.url??customMedia.url} motion={settings.motion}/></div><p className="section-footnote">Scene Motion also controls this preview. Reduced motion takes priority.</p></div>
 </section>;
}
