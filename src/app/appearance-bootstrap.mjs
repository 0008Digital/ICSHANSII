// Runs synchronously in <head>, before any application body is parsed.
// Self-contained so the exact same implementation can be tested and serialized.
export function initializeAppearance(config, host) {
 const {defaults,server,themeKey,visualKey,identityKey,preferencesPrefix,tenantId,cookieKey,accents}=config;
 const {document,localStorage,matchMedia,location,sessionStorage}=host;
 let settings=server?.settings??defaults;
 let userId=server?.userId??'demo-centre-admin';
 try {
  let selected=identityKey?localStorage.getItem(identityKey):null;
  if(!selected) {
   const legacyRole=localStorage.getItem('ics-hansi-demo-workspace-role-v1');
   selected=({ 'platform-owner':'demo-platform-owner',admin:'demo-centre-admin',manager:'demo-manager',teacher:'demo-teacher',student:'demo-student-a' })[legacyRole]??'demo-centre-admin';
  }
  userId=/^demo-(platform-owner|centre-admin|manager|teacher|student-a|student-b)$/.test(selected)?selected:'demo-centre-admin';
  const scopedKey=`${preferencesPrefix}.${tenantId}.${userId}`;
  const scoped=localStorage.getItem(scopedKey);
  let record=scoped?JSON.parse(scoped):null;
  let raw=record?.appearance??record;
  let theme=raw?.preference;
  let visual=raw;
  if(!scoped&&userId==='demo-centre-admin') {
   theme=localStorage.getItem(themeKey);
   const legacyVisual=localStorage.getItem(visualKey);
   visual=legacyVisual===null?null:JSON.parse(legacyVisual||'{}')||{};
   raw=visual??{};
  } else if(!scoped&&server?.userId!==userId) {
   settings=defaults;raw=defaults;theme=defaults.preference;visual=defaults;
  }
  if(scoped||theme!==null||visual!==null) {
   const choice=(value,allowed,fallback)=>allowed.includes(value)?value:fallback;
   const bounded=(value,min,max,fallback)=>typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
   const custom=raw?.custom&&typeof raw.custom==='object'?raw.custom:{};
   settings={preference:choice(theme,['light','dark','system'],defaults.preference),
    scene:choice(raw.scene,['motion','photo','topography','chroma','custom'],defaults.scene),
    material:choice(raw.material,['clear','regular','frosted'],defaults.material),
    accent:choice(raw.accent,accents,defaults.accent),customAccent:typeof raw.customAccent==='string'&&/^#[0-9a-f]{6}$/i.test(raw.customAccent)?raw.customAccent:'',
    intensity:bounded(raw.intensity,35,100,defaults.intensity),frost:bounded(raw.frost,0,100,defaults.frost),motion:typeof raw.motion==='boolean'?raw.motion:defaults.motion,
    animationPreference:choice(raw.animationPreference,['full','reduced','off'],defaults.animationPreference),
    custom:{type:choice(custom.type,['gradient','image','video'],'gradient'),mediaId:'',
     colors:defaults.custom.colors.map((fallback,index)=>Array.isArray(custom.colors)&&/^#[0-9a-f]{6}$/i.test(custom.colors[index])?custom.colors[index]:fallback),
     speed:bounded(custom.speed,.25,2,1),dim:bounded(custom.dim,0,80,25),blur:bounded(custom.blur,0,20,0),fit:choice(custom.fit,['cover','contain'],'cover'),position:choice(custom.position,['center','top','bottom'],'center')}};
  }
 }catch {}
 const resolved=settings.preference==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):settings.preference;
 // Start fetching the selected raster before body parsing/hydration so the scene
 // component can paint its final image as soon as it mounts. These are same-origin
 // presentation assets; no media or preference data is sent to a server endpoint.
 const sceneAsset=settings.scene==='photo'?'/open-glass-scenes/architectural-contrast.jpg':settings.scene==='motion'?'/open-glass-scenes/motion-poster.png':null;
 try {
  if(sceneAsset&&document.head?.appendChild&&document.createElement&&!document.querySelector?.(`link[rel="preload"][href="${sceneAsset}"]`)) {
   const link=document.createElement('link');link.rel='preload';link.as='image';link.href=sceneAsset;link.fetchPriority='high';document.head.appendChild(link);
  }
 }catch{}
 const projection={...settings,custom:{...settings.custom,mediaId:''},resolved,userId};
 const encoded=encodeURIComponent(JSON.stringify(projection));
 document.documentElement.dataset.appearance=resolved;
 document.documentElement.dataset.userMotion=settings.animationPreference;
 document.documentElement.style.colorScheme=resolved;
 try {
  document.cookie=cookieKey+'='+encoded+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location?.protocol==='https:'?'; Secure':'');
  const expected=server&&{...server.settings,custom:{...server.settings.custom,mediaId:''},resolved:server.resolved,userId:server.userId??'demo-centre-admin'};
  const same=(a,b)=>a===b||(a&&b&&typeof a==="object"&&typeof b==="object"&&Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(key=>same(a[key],b[key])));
  const guard="ics-hansi.appearance-reconciled";
  if(server&&same(expected,projection))sessionStorage?.removeItem?.(guard);
  // Cookie acceptance and a session guard prevent navigation loops when storage is blocked.
  if(server&&!same(expected,projection)&&document.cookie.split('; ').some(c=>c===cookieKey+'='+encoded)) {
   if(sessionStorage?.getItem(guard)!==encoded) {
    sessionStorage.setItem(guard,encoded);
    location.replace(location.href);
   }
  }
 }catch {}
}
