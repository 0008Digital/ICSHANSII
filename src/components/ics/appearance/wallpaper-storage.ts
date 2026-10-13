const DATABASE="ics-hansi-wallpaper";
const STORE="media";
export function wallpaperTransaction<T>(mode:IDBTransactionMode,action:(store:IDBObjectStore)=>IDBRequest<T>,factory?:IDBFactory):Promise<T> {
 return new Promise((resolve,reject)=>{
  try{factory??=globalThis.indexedDB;}catch(error){reject(error);return;}
  if(!factory){reject(new Error("IndexedDB is unavailable"));return;}
  let settled=false;
  let active:IDBTransaction|undefined,database:IDBDatabase|undefined;
  const fail=(error:unknown)=>{if(!settled){settled=true;clearTimeout(timeout);try{active?.abort();}catch{}database?.close();reject(error);}};
  const timeout=setTimeout(()=>fail(new Error("Browser storage did not respond")),5000);
  let request:IDBOpenDBRequest;
  try{request=factory.open(DATABASE,1);}catch(error){fail(error);return;}
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
  request.onerror=()=>fail(request.error);
  request.onblocked=()=>fail(new Error("Browser storage is blocked by another tab"));
  request.onsuccess=()=>{
   const db=request.result;database=db;
   if(settled){db.close();return;}
   db.onversionchange=()=>db.close();
   try{
    const transaction=db.transaction(STORE,mode);active=transaction;
    const result=action(transaction.objectStore(STORE));
    transaction.oncomplete=()=>{db.close();clearTimeout(timeout);if(!settled){settled=true;resolve(result.result);}};
    transaction.onabort=transaction.onerror=()=>{db.close();fail(transaction.error??new Error("Browser storage failed"));};
   }catch(error){db.close();fail(error);}
  };
 });
}
export const saveWallpaper=(id:string,blob:Blob)=>wallpaperTransaction("readwrite",store=>store.put(blob,id));
export const readWallpaper=(id:string)=>wallpaperTransaction<Blob|undefined>("readonly",store=>store.get(id));
export const deleteWallpaper=(id:string)=>wallpaperTransaction("readwrite",store=>store.delete(id));
export const pruneWallpapers=(keep:string)=>wallpaperTransaction("readwrite",store=>{
 const cursor=store.openCursor();
 cursor.onsuccess=()=>{const entry=cursor.result;if(entry){if(entry.key!==keep)entry.delete();entry.continue();}};
 return cursor;
});
