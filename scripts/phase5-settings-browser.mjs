// Browser handles are injected from the documented CUA API. No app/storage injection.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const ids={admin:'demo-centre-admin',manager:'demo-manager',developer:'demo-platform-owner',teacher:'demo-teacher',studentA:'demo-student-a',studentB:'demo-student-b'};
const landings={admin:'/',manager:'/',developer:'/developer',teacher:'/teacher-dashboard',studentA:'/student-portal',studentB:'/student-portal'};
export async function createSettingsVerification({tab,viewport,artifactDir,scenarioFilter=null}){
 await mkdir(artifactDir,{recursive:true});const results=[],originals={};
 const button=name=>tab.playwright.getByRole('button',{name,exact:true});
 const slider=name=>tab.playwright.getByRole('slider',{name,exact:true});
 const value=async name=>Number(await slider(name).evaluate(e=>e.value));
 const save=()=>writeFile(`${artifactDir}/results.json`,JSON.stringify({results,originals,scenarioFilter},null,2));
 async function check(name,action){
  if(scenarioFilter&&!scenarioFilter.includes(name))return;
  try{results.push({name,status:'passed',evidence:await action()});}
  catch(error){const file=`${name.replace(/[^a-z0-9]+/gi,'-')}.jpg`;await writeFile(`${artifactDir}/${file}`,await tab.screenshot({fullPage:false}));results.push({name,status:'failed',error:String(error),screenshot:file});}
  await save();
 }
 async function expanded(selector){if(!await tab.playwright.locator(selector).evaluate(e=>e.open))await tab.playwright.locator(`${selector} > summary`).press('Enter');}
 async function ready(){
  await tab.playwright.getByRole('main').getByRole('heading',{name:'Settings',exact:true}).waitFor({state:'visible'});
  await expanded('.appearance-animation-options');await expanded('.appearance-advanced');
  await slider('Optical intensity').waitFor({state:'visible'});
 }
 async function state(){
  const pressed=async name=>(await tab.playwright.getByRole('group',{name,exact:true}).locator('button[aria-pressed="true"]').textContent()).trim();
  return {theme:await pressed('Appearance'),source:await pressed('Background source'),material:await pressed('Glass material'),mode:await pressed('Interface animation preference'),motion:await tab.playwright.getByRole('switch',{name:'Scene Motion',exact:true}).evaluate(e=>e.checked),intensity:await value('Optical intensity'),frost:await value('Frost'),...await tab.playwright.evaluate(()=>({resolvedTheme:document.documentElement.dataset.appearance,osReduced:matchMedia('(prefers-reduced-motion: reduce)').matches}))};
 }
 async function effects(){return tab.playwright.evaluate(()=>{
  const surface=selector=>{const e=document.querySelector(selector);if(!e)return null;const s=getComputedStyle(e);return {filter:s.backdropFilter,shadow:s.boxShadow,background:s.backgroundColor,clip:s.clipPath,rim:getComputedStyle(e,'::after').backgroundImage};};
  const lens=document.querySelector('.landing-shape--spectral'),ls=lens?getComputedStyle(lens):null;
  return {width:innerWidth,mode:document.documentElement.dataset.userMotion,osReduced:matchMedia('(prefers-reduced-motion: reduce)').matches,header:surface('.smart-workspace-header'),pane:surface('.appearance-preview-pane'),comparison:surface('.comparison-frosted'),clear:surface('.comparison-clear'),scene:document.querySelector('.application-scene')?.getAttribute('data-source'),sceneMotion:document.querySelector('.application-scene')?.getAttribute('data-motion'),backdrop:document.querySelector('.application-scene .landing-backdrop')?getComputedStyle(document.querySelector('.application-scene .landing-backdrop')).backgroundImage:null,image:document.querySelector('.application-scene img')?{loaded:document.querySelector('.application-scene img').complete,filter:getComputedStyle(document.querySelector('.application-scene img')).filter}:null,media:Array.from(document.querySelectorAll('.application-scene video,.appearance-preview video')).map(v=>({time:v.currentTime,paused:v.paused,ready:v.readyState})),lens:ls?{animation:ls.animationName,state:ls.animationPlayState,radius:ls.borderRadius,transform:ls.transform,pressed:lens.getAttribute('aria-pressed')}:null,decorative:document.querySelector('.landing-shape--clear')?{pointer:getComputedStyle(document.querySelector('.landing-shape--clear')).pointerEvents,state:getComputedStyle(document.querySelector('.landing-shape--clear')).animationPlayState}:null};
 });}
 async function discard(){if(await button('Discard preview').isEnabled())await button('Discard preview').click();}
 async function photoReady(){
  for(let attempt=0;attempt<10;attempt++){
   if(await tab.playwright.locator('.application-scene img').evaluate(e=>e.complete&&e.naturalWidth>0))return;
   await tab.playwright.domSnapshot();
  }
  assert.fail('Photo must finish loading with nonzero dimensions');
 }
 async function apply(){const control=button('Apply appearance');await tab.playwright.domSnapshot();if(await control.isEnabled()){await control.click();await control.and(tab.playwright.locator(':disabled')).waitFor({state:'visible'});}}
 async function setRange(name,target){
  const control=slider(name),bounds=await control.evaluate(e=>({min:Number(e.min),max:Number(e.max)}));
  if(await value(name)===target)return;
  await control.press(target-bounds.min<=bounds.max-target?'Home':'End');
  for(let attempts=0;attempts<110;attempts++){
   const current=await value(name);if(current===target)return;
   const distance=Math.abs(target-current),page=Math.ceil((bounds.max-bounds.min)/10);
   await control.press(distance>page?(current<target?'PageUp':'PageDown'):(current<target?'ArrowRight':'ArrowLeft'));
  }
  assert.fail(`Could not restore ${name} to ${target}`);
 }
 async function setMotion(wanted){
  const control=tab.playwright.getByRole('switch',{name:'Scene Motion',exact:true});
  if(await control.isEnabled()&&(await control.evaluate(e=>e.checked))!==wanted)await control.click();
  const mode=(await tab.playwright.getByRole('group',{name:'Interface animation preference',exact:true}).locator('button[aria-pressed="true"]').textContent()).trim().toLowerCase();
  await tab.playwright.locator(`html[data-user-motion="${mode}"]`).waitFor({state:'attached'});
  const os=await tab.playwright.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const moving=wanted&&mode==='full'&&!os;
  await tab.playwright.locator(`.application-scene[data-motion="${moving?'on':'off'}"]`).waitFor({state:'attached'});
 }
 async function setup(role,width,theme){
  await viewport.set({width,height:width<768?740:900});
  const combo=tab.playwright.getByRole('combobox',{name:'Demo user preview',exact:true});
  if(await combo.evaluate(e=>e.value)!==ids[role])await tab.playwright.expectNavigation(()=>combo.selectOption(ids[role]),{url:`http://localhost:3000${landings[role]}`});
  if(new URL(await tab.url()).pathname!=='/settings')await tab.goto('http://localhost:3000/settings');else await tab.reload();
  await ready();assert.equal(await tab.playwright.evaluate(()=>innerWidth),width);
  if(!originals[role]){originals[role]=await state();await save();}
  await button(theme).click();await button('Full').click();await button('Motion').click();await setMotion(true);await apply();await ready();
 }
 async function restore(role){
  if(new URL(await tab.url()).pathname!=='/settings')await tab.goto('http://localhost:3000/settings');
  await ready();await discard();const original=originals[role];
  await button(original.theme).click();await button(original.source).click();await button(original.material).click();await button(original.mode).click();await setMotion(original.motion);
  await setRange('Optical intensity',original.intensity);await setRange('Frost',original.frost);await apply();await tab.reload();await ready();
  const restored=await state();for(const key of ['theme','source','material','mode','motion','intensity','frost'])assert.equal(restored[key],original[key],`${role}: restore ${key}`);return restored;
 }
 async function advanced(role,width,theme){
  await setup(role,width,theme);const prefix=`${role}/${width}/${theme}`;
  try{
   await check(`${prefix}: theme renders in live workspace`,async()=>{const s=await state(),e=await effects();assert.equal(s.resolvedTheme,theme.toLowerCase());return {state:s,effects:e};});
   await check(`${prefix}: Clear Regular Frosted change live materials`,async()=>{
    const evidence=[];for(const name of ['Clear','Regular','Frosted']){await button(name).click();evidence.push({material:name,effects:await effects()});await discard();}
    assert.equal(new Set(evidence.map(e=>e.effects.header.filter)).size,3);assert.equal(new Set(evidence.map(e=>e.effects.pane.filter)).size,3);return evidence;
   });
   await check(`${prefix}: Optical intensity changes live optics then discards`,async()=>{
    const initial=await value('Optical intensity'),before=await effects();await slider('Optical intensity').press(initial===35?'End':'Home');const after=await effects();assert.notEqual(after.header.shadow,before.header.shadow);assert.notEqual(after.pane.shadow,before.pane.shadow);await discard();assert.equal(await value('Optical intensity'),initial);assert.equal((await effects()).header.shadow,before.header.shadow);return {initial,changed:initial===35?100:35,before,after};
   });
   await check(`${prefix}: Frost changes workspace blur and preserves explicit specimen`,async()=>{
    const initial=await value('Frost'),before=await effects();await slider('Frost').press(initial===100?'Home':'End');const after=await effects();assert.notEqual(after.header.filter,before.header.filter);assert.notEqual(after.pane.filter,before.pane.filter);assert.equal(after.comparison.filter,before.comparison.filter);await discard();assert.equal(await value('Frost'),initial);return {initial,before,after};
   });
   await check(`${prefix}: Compare Frosted Regular affects specimen only`,async()=>{
    const before=await effects();await button('Compare Frosted').click();const after=await effects();assert.notEqual(after.comparison.filter,before.comparison.filter);assert.equal(after.header.filter,before.header.filter);assert.equal(await button('Apply appearance').isEnabled(),false);await button('Compare Regular').click();assert.equal((await effects()).comparison.filter,before.comparison.filter);return {initial:'Regular',changed:'Frosted',before,after};
   });
   for(const [name,property] of [['Material comparison','clip'],['Lighting angle','rim'],['Lighting spread','rim']])await check(`${prefix}: ${name} has a rendered preview-only effect`,async()=>{
    const initial=await value(name),before=await effects();await slider(name).press('ArrowRight');const changed=await value(name),after=await effects();assert.notEqual(after.comparison[property],before.comparison[property]);assert.deepEqual(after.header,before.header);assert.equal(await button('Apply appearance').isEnabled(),false);await slider(name).press('ArrowLeft');assert.equal(await value(name),initial);assert.equal((await effects()).comparison[property],before.comparison[property]);return {initial,changed,before,after};
   });
   await check(`${prefix}: Scene disclosure and floating lens pointer keyboard`,async()=>{
    const lens=button('Hold floating glass lens');await tab.playwright.locator('.appearance-scene-disclosure > summary').click();await lens.waitFor({state:'hidden'});await tab.playwright.locator('.appearance-scene-disclosure > summary').click();await lens.waitFor({state:'visible'});
    const initial=await effects();await lens.click();const held=await effects();assert.equal(held.lens.pressed,'true');assert.equal(held.lens.state,'paused');assert.equal(held.decorative.pointer,'none');
    if(!held.osReduced)assert.equal(held.decorative.state,'running');await lens.press('Space');assert.equal(await lens.getAttribute('aria-pressed'),'false');await lens.press('Space');assert.equal(await lens.getAttribute('aria-pressed'),'true');await lens.click();assert.equal(await lens.getAttribute('aria-pressed'),'false');return {initial,held,released:await effects()};
   });
   await check(`${prefix}: comparison values reset after reload without dirtying preferences`,async()=>{
    await slider('Material comparison').press('ArrowRight');await slider('Lighting angle').press('ArrowRight');await slider('Lighting spread').press('ArrowRight');await button('Compare Frosted').click();assert.equal(await button('Apply appearance').isEnabled(),false);await tab.reload();await ready();assert.equal(await value('Material comparison'),50);assert.equal(await value('Lighting angle'),30);assert.equal(await value('Lighting spread'),90);assert.equal(await button('Compare Regular').getAttribute('aria-pressed'),'true');return {split:50,angle:30,spread:90,material:'Regular',persisted:false};
   });
  }finally{await restore(role);}
 }
 async function motion(role,width,theme,{persist=false}={}){
  await setup(role,width,theme);const prefix=`${role}/${width}/${theme}`;
  try{
   for(const mode of ['Full','Reduced','Off'])await check(`${prefix}: ${mode} changes actual motion and keeps actions usable`,async()=>{
    await button(mode).click();const first=await effects(),samples=[first];let second=first;
    for(let sample=0;sample<(mode==='Full'?8:1);sample++){
     await tab.playwright.waitForTimeout(120);second=await effects();samples.push(second);
     if(mode!=='Full'||(second.media.some((m,i)=>!m.paused&&m.time!==first.media[i]?.time)&&second.lens.radius!==first.lens.radius))break;
    }
    if(!second.osReduced&&mode==='Full'){assert.equal(second.sceneMotion,'on');assert.equal(second.lens.state,'running');assert.ok(second.media.some((m,i)=>!m.paused&&m.time!==first.media[i]?.time),'Video time must change, including across a loop');assert.notEqual(second.lens.radius,first.lens.radius,'Morph shape must change');}
    else{assert.equal(second.sceneMotion,'off');assert.ok(second.media.every(m=>m.paused));assert.ok(second.lens.state==='paused'||second.lens.animation==='none');}
    if(mode==='Off')assert.equal(second.lens.animation,'none');
    await button('Quick actions').click();const menu=tab.playwright.getByRole('menu',{name:'Quick actions',exact:true});await menu.waitFor({state:'visible'});
    const menuState=await tab.playwright.evaluate(()=>({button:getComputedStyle(document.querySelector('.workspace-action-trigger')).transform,menu:getComputedStyle(document.querySelector('.workspace-action-menu')).transform,opacity:getComputedStyle(document.querySelector('.workspace-action-menu')).opacity,transition:getComputedStyle(document.querySelector('.workspace-action-trigger')).transitionDuration}));
    if(mode==='Off'){assert.equal(menuState.transition,'0s');assert.equal(menuState.menu,'none');}
    await menu.getByRole('menuitem').first().press('Escape');await menu.waitFor({state:'hidden'});return {first,second,samples,menuState,saved:false};
   });
   await check(`${prefix}: unsaved animation reload restores saved Full`,async()=>{await tab.reload();await ready();assert.equal((await state()).mode,'Full');return effects();});
   await check(`${prefix}: Scene Motion stops and resumes rendered media independently`,async()=>{
    const initial=await effects();await setMotion(false);const paused=await effects();await tab.playwright.waitForTimeout(120);const pausedLater=await effects();assert.ok(pausedLater.media.every((m,i)=>m.paused&&m.time===paused.media[i].time));assert.equal(pausedLater.lens.state,'paused');
    await button('Search pages and actions').click();const input=tab.playwright.getByRole('combobox',{name:'Search pages and actions Esc',exact:true});await input.fill('Settings');assert.equal(await input.evaluate(e=>e.value),'Settings');await input.press('Escape');await tab.playwright.getByRole('dialog',{name:'Search workspace',exact:true}).waitFor({state:'hidden'});await setMotion(true);const resumed=await effects();await tab.playwright.waitForTimeout(120);const resumedLater=await effects();assert.equal(resumedLater.sceneMotion,initial.sceneMotion);if(!resumedLater.osReduced)assert.ok(resumedLater.media.some((m,i)=>!m.paused&&m.time!==resumed.media[i]?.time));return {initial,paused,pausedLater,resumed,resumedLater,sampleIntervalMs:120};
   });
   await check(`${prefix}: Motion Photo Topo Chroma Custom render distinct sources`,async()=>{
    const evidence=[];for(const name of ['Motion','Photo','Topo','Chroma','Custom']){await button(name).click();if(name==='Photo')await photoReady();const e=await effects();evidence.push({name,effects:e});if(name==='Photo')assert.equal(e.image.loaded,true);if(name==='Topo'||name==='Chroma')assert.notEqual(e.backdrop,'none');if(name==='Custom')assert.equal(await tab.playwright.locator('.application-scene .custom-backdrop').count(),1);}
    assert.equal(new Set(evidence.map(e=>e.effects.scene)).size,5);await discard();return evidence;
   });
   await check(`${prefix}: custom gradient draft changes only its preview without Apply Remove`,async()=>{
    await button('Custom').click();await expanded('.appearance-custom-options');await button('Gradient').click();await expanded('.custom-advanced');
    const initial=await value('Background blur');const before=await tab.playwright.evaluate(()=>({draft:getComputedStyle(document.querySelector('.custom-draft-scene .custom-backdrop__paint')).filter,live:getComputedStyle(document.querySelector('.application-scene .custom-backdrop__paint')).filter}));
    await slider('Background blur').press(initial===20?'Home':'End');const after=await tab.playwright.evaluate(()=>({draft:getComputedStyle(document.querySelector('.custom-draft-scene .custom-backdrop__paint')).filter,live:getComputedStyle(document.querySelector('.application-scene .custom-backdrop__paint')).filter}));assert.notEqual(after.draft,before.draft);assert.equal(after.live,before.live);await button('Reset background').click();await discard();return {initial,before,after,applyRemoveExecuted:false};
   });
   await check(`${prefix}: Reset to Default previews defaults and Discard restores saved state`,async()=>{
    const before=await state();await button('Off').click();await button('Reset to Default').click();const reset=await state();assert.equal(reset.theme,'System');assert.equal(reset.source,'Motion');assert.equal(reset.material,'Clear');assert.equal(reset.mode,'Full');assert.equal(reset.intensity,78);assert.equal(reset.frost,4);await discard();const restored=await state();for(const key of ['theme','source','material','mode','motion','intensity','frost'])assert.equal(restored[key],before[key]);return {before,reset,restored,resetSaved:false};
   });
   if(persist)await check(`${prefix}: live optical motion theme and source save then survive reload`,async()=>{
    await button('Dark').click();await button('Chroma').click();await button('Frosted').click();await slider('Optical intensity').press('Home');await slider('Frost').press('End');await button('Reduced').click();await setMotion(false);await apply();const saved=await state(),before=await effects();await tab.reload();await ready();const reloaded=await state(),after=await effects();for(const key of ['theme','source','material','mode','motion','intensity','frost'])assert.equal(reloaded[key],saved[key]);assert.deepEqual(after.header,before.header);assert.equal(after.sceneMotion,'off');return {saved,reloaded,before,after};
   });
  }finally{await restore(role);}
 }
 async function workspaceModes(role,width,theme){
  await setup(role,width,theme);const prefix=`${role}/${width}/${theme}`;
  const destinations=role==='admin'||role==='manager'?['/students','/batches']:role==='developer'?['/developer#bug-reports','/developer#system-health']:role==='teacher'?['/teacher-dashboard#assigned-students','/teacher-dashboard#homework']:['/student-portal#batch','/student-portal#results'];
  const link=href=>tab.playwright.locator(`${width<768?'.ics-mobile-dock':'.desktop-navigation'} a[href="${href}"]`).filter({visible:true});
  const read=()=>tab.playwright.evaluate(()=>({mode:document.documentElement.dataset.userMotion,active:Array.from(document.querySelectorAll('nav a[aria-current]')).map(e=>e.getAttribute('href')),indicators:Array.from(document.querySelectorAll('.sidebar-active-capsule,.ics-dock-selection')).filter(e=>e.getClientRects().length).map(e=>({transform:getComputedStyle(e).transform,transition:getComputedStyle(e).transitionDuration})),chartTransforms:Array.from(document.querySelectorAll('.dashboard-chart-track i,.developer-severity-track i,.student-progress-track > span')).map(e=>getComputedStyle(e).transform)}));
  try{
   for(const mode of ['Full','Reduced','Off'])await check(`${prefix}: saved ${mode} workspace navigation and indicator behavior`,async()=>{
    if(new URL(await tab.url()).pathname!=='/settings')await tab.goto('http://localhost:3000/settings');await ready();await button(mode).click();await apply();await tab.reload();await ready();assert.equal((await state()).mode,mode);
    await link(landings[role]).click();await tab.playwright.waitForURL(`http://localhost:3000${landings[role]}`);await tab.playwright.getByRole('main').getByRole('heading',{name:role==='developer'?'Developer Console':role==='teacher'?'Teacher Dashboard':role.startsWith('student')?'Student Home':'Dashboard',exact:true}).waitFor({state:'visible'});const entrance=await read();
    await link(destinations[0]).click();await tab.playwright.waitForURL(`http://localhost:3000${destinations[0]}`);const first=await read();
    await link(destinations[1]).click();await tab.playwright.waitForURL(`http://localhost:3000${destinations[1]}`);const second=await read();await tab.playwright.domSnapshot();const settled=await read();
    assert.equal(settled.mode,mode.toLowerCase());assert.ok(settled.active.includes(destinations[1]));assert.ok(settled.indicators.length>0);
    await button('Search pages and actions').click();const input=tab.playwright.getByRole('combobox',{name:'Search pages and actions Esc',exact:true});await input.fill('Settings');assert.equal(await input.evaluate(e=>e.value),'Settings');await input.press('Escape');await tab.playwright.getByRole('dialog',{name:'Search workspace',exact:true}).waitFor({state:'hidden'});return {entrance,first,second,settled};
   });
  }finally{await restore(role);}
 }
 async function backgroundPersistence(role,width,theme){
  await setup(role,width,theme);
  try{
   for(const source of ['Motion','Photo','Topo','Chroma'])await check(`${role}/${width}/${theme}: saved ${source} source survives reload`,async()=>{
    await button(source).click();if(source==='Photo')await photoReady();await apply();const before=await effects();await tab.reload();await ready();if(source==='Photo')await photoReady();const reloaded=await state(),after=await effects();assert.equal(reloaded.source,source);assert.equal(after.scene,before.scene);
    if(source==='Photo')assert.equal(after.image.loaded,true);if(source==='Motion')assert.ok(after.media.some(m=>m.ready>=2));if(source==='Topo'||source==='Chroma')assert.equal(after.backdrop,before.backdrop);return {before,reloaded,after};
   });
  }finally{await restore(role);}
 }
 return {advanced,motion,workspaceModes,backgroundPersistence,restore,results,originals,state,effects};
}
