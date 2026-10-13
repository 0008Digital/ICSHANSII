export type CustomBackground = {
 type:"gradient"|"image"|"video"; mediaId:string; colors:[string,string,string];
 speed:number; dim:number; blur:number; fit:"cover"|"contain"; position:"center"|"top"|"bottom";
};
export const DEFAULT_CUSTOM:CustomBackground={type:"gradient",mediaId:"",colors:["#214b68","#72345b","#218076"],speed:1,dim:25,blur:0,fit:"cover",position:"center"};
export function parseCustomBackground(value:unknown):CustomBackground {
 const input=value&&typeof value==="object"?value as Record<string,unknown>:{};
 const number=(key:string,min:number,max:number,fallback:number)=>typeof input[key]==="number"&&Number.isFinite(input[key])?Math.max(min,Math.min(max,input[key] as number)):fallback;
 const colors=DEFAULT_CUSTOM.colors.map((fallback,index)=>Array.isArray(input.colors)&&typeof input.colors[index]==="string"&&/^#[a-f0-9]{6}$/i.test(input.colors[index])?input.colors[index]:fallback) as CustomBackground["colors"];
 return {type:input.type==="image"||input.type==="video"?input.type:"gradient",mediaId:typeof input.mediaId==="string"&&/^[a-f0-9-]{36}$/i.test(input.mediaId)?input.mediaId:"",colors,speed:number("speed",0.25,2,1),dim:number("dim",0,80,25),blur:number("blur",0,20,0),fit:input.fit==="contain"?"contain":"cover",position:input.position==="top"||input.position==="bottom"?input.position:"center"};
}
export async function validateWallpaper(file:Blob):Promise<"image"|"video"> {
 const image=["image/jpeg","image/png","image/webp"].includes(file.type);
 const video=["video/mp4","video/webm"].includes(file.type);
 if(!image&&!video)throw new Error("Choose a JPG, PNG, WebP, MP4 or WebM file.");
 if(!file.size||file.size>(image?20:60)*1024*1024)throw new Error(image?"Images must be between 1 byte and 20 MB.":"Videos must be between 1 byte and 60 MB.");
 const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
 const text=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));
 const matches=file.type==="image/jpeg"?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:file.type==="image/png"?[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v):file.type==="image/webp"?text(0,4)==="RIFF"&&text(8,12)==="WEBP":file.type==="video/mp4"?text(4,8)==="ftyp":[26,69,223,163].every((v,i)=>bytes[i]===v);
 if(!matches)throw new Error("The file contents do not match the selected media format.");
 return image?"image":"video";
}
export function storageMessage(error:unknown) {
 return error instanceof Error&&error.name==="QuotaExceededError"?"Browser storage is full. Choose a smaller file or remove the saved wallpaper.":"Browser storage is unavailable. Your previous saved wallpaper has been kept.";
}
