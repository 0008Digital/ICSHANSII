// Decode only local object URLs. Reject corrupt/unsupported media before persistence.
export function decodeWallpaper(url:string,kind:"image"|"video"):Promise<void> {
 return new Promise((resolve,reject)=>{
  const element=kind==="image"?document.createElement("img"):document.createElement("video");
  const video=element instanceof HTMLVideoElement?element:null;
  const finish=(error?:Error)=>{clearTimeout(timer);element.onload=null;element.onerror=null;if(video){video.onloadedmetadata=null;video.onloadeddata=null;video.pause();video.removeAttribute("src");video.load();}else element.removeAttribute("src");if(error)reject(error);else resolve();};
  const timer=setTimeout(()=>finish(new Error("Media could not be decoded. Try a smaller file or a supported codec.")),10000);
  element.onerror=()=>finish(new Error("This media is damaged or its codec is not supported by this browser."));
  if(video){video.preload="auto";video.muted=true;video.onloadedmetadata=()=>{if(!video.videoWidth||!video.videoHeight||video.videoWidth*video.videoHeight>1920*1080||!Number.isFinite(video.duration)||video.duration>600)finish(new Error("Use a video up to Full HD (1920 × 1080 pixels), no longer than 10 minutes."));};video.onloadeddata=()=>finish();}
  else element.onload=()=>{const image=element as HTMLImageElement;finish(!image.naturalWidth||image.naturalWidth*image.naturalHeight>24000000?new Error("Use an image up to 24 megapixels."):undefined);};
  element.src=url;
 });
}
