"use client";
import { useEffect, useState } from "react";
import { readWallpaper } from "./wallpaper-storage";
import { decodeWallpaper } from "./decode-wallpaper";
import { validateWallpaper } from "./custom-background";
export function useCustomMedia(id:string) {
 const [media,setMedia]=useState<{id:string;url:string|null;error:string|null}>({id:"",url:null,error:null});
 useEffect(()=>{
  if(!id)return;
  let cancelled=false,url:string|undefined;
  void readWallpaper(id).then(async blob=>{
   if(!blob)throw new Error("Saved wallpaper is missing");
   const kind=await validateWallpaper(blob);
   if(cancelled)return;
   url=URL.createObjectURL(blob);await decodeWallpaper(url,kind);
   if(cancelled){URL.revokeObjectURL(url);return;}
   setMedia({id,url,error:null});
  }).catch(()=>{if(url)URL.revokeObjectURL(url);if(!cancelled)setMedia({id,url:null,error:"Saved media could not be restored. A gradient is shown; choose a file or apply a gradient."});});
  return()=>{cancelled=true;if(url)URL.revokeObjectURL(url);};
 },[id]);
 return {url:media.id===id?media.url:null,error:media.id===id?media.error:null,loading:Boolean(id&&media.id!==id)};
}
