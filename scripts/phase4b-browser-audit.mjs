// Local browser audit. Browser/viewport handles are injected from the documented CUA API.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pages as existingPages} from './phase3-ui-audit.mjs';
const pages={...existingPages,developer:['/developer','/chatrooms','/settings']};
const identities={admin:'demo-centre-admin',manager:'demo-manager',developer:'demo-platform-owner',teacher:'demo-teacher',studentA:'demo-student-a',studentB:'demo-student-b'};
const landings={admin:'/',manager:'/',developer:'/developer',teacher:'/teacher-dashboard',studentA:'/student-portal',studentB:'/student-portal'};
export async function createCopyAudit({tab,viewport,artifactDir}){
 assert.equal(new URL(await tab.url()).origin,'http://localhost:3000');
 await mkdir(artifactDir,{recursive:true});const rows=[],themes={};
 const save=()=>writeFile(`${artifactDir}/results.json`,JSON.stringify({rows,themes},null,2));
 async function scan(role,width,theme=null,routes=pages[role]){
  await viewport.set({width,height:width<768?740:900});
  const combo=tab.playwright.getByRole('combobox',{name:'Demo user preview',exact:true});
  if(await combo.evaluate(e=>e.value)!==identities[role])await tab.playwright.expectNavigation(()=>combo.selectOption(identities[role]),{url:`http://localhost:3000${landings[role]}`});
  if(theme){
   if(new URL(await tab.url()).pathname!=='/settings')await tab.goto('http://localhost:3000/settings');
   const group=tab.playwright.getByRole('group',{name:'Appearance',exact:true});await group.waitFor({state:'visible'});
   if(!themes[role])themes[role]=await group.locator('button[aria-pressed="true"]').textContent();
   const priorTheme=(await group.locator('button[aria-pressed="true"]').textContent()).trim();
   await group.getByRole('button',{name:theme,exact:true}).click();
   const apply=tab.playwright.getByRole('button',{name:'Apply appearance',exact:true});
   if(priorTheme!==theme)await apply.and(tab.playwright.locator(':enabled')).waitFor({state:'visible'});
   if(await apply.isEnabled())await apply.click();
   await tab.playwright.locator(`html[data-appearance="${theme.toLowerCase()}"]`).waitFor({state:'attached'});
   await apply.and(tab.playwright.locator(':disabled')).waitFor({state:'visible'});
  }
  for(const route of routes){
   const row={role,route,requestedWidth:width,requestedTheme:theme};
   try{
    if(new URL(await tab.url()).pathname===route)await tab.reload();else await tab.goto(`http://localhost:3000${route}`);
    await tab.playwright.getByRole('main').getByRole('heading').first().waitFor({state:'visible'});
    await tab.playwright.getByRole('navigation',{name:width<768?(role.startsWith('student')?'Student portal navigation':'Mobile navigation'):'Main navigation',exact:true}).waitFor({state:'visible'});
    Object.assign(row,await tab.playwright.evaluate(()=>({
     width:innerWidth,documentWidth:document.documentElement.scrollWidth,theme:document.documentElement.dataset.appearance,
     title:document.querySelector('main h1')?.textContent,
     copy:Array.from(document.querySelectorAll('main p,main small,main .demo-banner')).filter(e=>e.getClientRects().length).map(e=>e.textContent.trim()),
     header:document.querySelector('.global-workspace-header')?.getBoundingClientRect().toJSON(),
     headings:Array.from(document.querySelectorAll('main h1,main h2')).filter(e=>e.getClientRects().length).map(e=>({text:e.textContent,top:e.getBoundingClientRect().top})),
    })));
    if(width===768)assert.ok([767,768,769].includes(row.width));else assert.equal(row.width,width);
    assert.ok(row.documentWidth<=row.width+1,'No document horizontal overflow');
    if(theme)assert.equal(row.theme,theme.toLowerCase());
    await tab.playwright.getByRole('main').press('PageDown');
    row.scrolled=await tab.playwright.evaluate(()=>({scrollY,header:document.querySelector('.global-workspace-header')?.getBoundingClientRect().toJSON(),settings:document.querySelector('.settings-heading')?.getBoundingClientRect().toJSON(),behindHeader:Array.from(document.querySelectorAll('main h1,main h2,main p,main input')).filter(e=>{const r=e.getBoundingClientRect(),h=document.querySelector('.global-workspace-header').getBoundingClientRect();return e.getClientRects().length&&r.top<h.bottom&&r.bottom>0;}).map(e=>({text:(e.textContent||e.getAttribute('aria-label')||e.tagName).slice(0,100),rect:e.getBoundingClientRect().toJSON()}))}));
    assert.ok(Math.abs(row.scrolled.header.top)<=1,'Header remains fixed');
    assert.ok(Math.abs(row.scrolled.header.height-row.header.height)<=1,'No header height shift');
    if(row.scrolled.settings)assert.ok(row.scrolled.settings.top>=row.scrolled.header.bottom-1,'Settings bar clears workspace header');
    row.status=row.width===width?'passed':'approximate-viewport';
    if((route===landings[role]||route==='/settings')&&(width===320||width===1440)){
     await tab.playwright.getByRole('main').press('Control+Home');
     row.screenshot=`${role}-${width}-${theme||'original'}-${route.replace(/[^a-z0-9]+/gi,'-')||'dashboard'}.jpg`;
     await writeFile(`${artifactDir}/${row.screenshot}`,await tab.screenshot({fullPage:true}));
    }
   }catch(error){row.status='failed';row.error=String(error);}
   rows.push(row);await save();
  }
  return rows.filter(r=>r.role===role&&r.requestedWidth===width&&r.requestedTheme===theme).map(({route,status,width,error})=>({route,status,width,error}));
 }
 async function restoreThemes(){
  for(const [role,theme] of Object.entries(themes)){
   const combo=tab.playwright.getByRole('combobox',{name:'Demo user preview',exact:true});
   if(await combo.evaluate(e=>e.value)!==identities[role])await tab.playwright.expectNavigation(()=>combo.selectOption(identities[role]),{url:`http://localhost:3000${landings[role]}`});
   if(new URL(await tab.url()).pathname!=='/settings')await tab.goto('http://localhost:3000/settings');
   const group=tab.playwright.getByRole('group',{name:'Appearance',exact:true});
   const priorTheme=(await group.locator('button[aria-pressed="true"]').textContent()).trim();
   await group.getByRole('button',{name:theme,exact:true}).click();
   const apply=tab.playwright.getByRole('button',{name:'Apply appearance',exact:true});
   if(priorTheme!==theme)await apply.and(tab.playwright.locator(':enabled')).waitFor({state:'visible'});
   if(await apply.isEnabled())await apply.click();
   await apply.and(tab.playwright.locator(':disabled')).waitFor({state:'visible'});
  }
 }
 return {scan,restoreThemes,rows,themes};
}

export async function createChromeChecks({tab,viewport,artifactDir}){
 await mkdir(artifactDir,{recursive:true});const results=[];
 const button=name=>tab.playwright.getByRole('button',{name,exact:true});
 const box=control=>control.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {rect:r.toJSON(),width:innerWidth,height:innerHeight,hit:hit===e||e.contains(hit)};});
 async function check(name,action){
  try{results.push({name,status:'passed',evidence:await action()});}
  catch(error){const file=`${name.replace(/[^a-z0-9]+/gi,'-')}.jpg`;await writeFile(`${artifactDir}/${file}`,await tab.screenshot({fullPage:false}));results.push({name,status:'failed',error:String(error),screenshot:file});}
  await writeFile(`${artifactDir}/results.json`,JSON.stringify(results,null,2));
 }
 async function run(role,width){
  await viewport.set({width,height:width<768?740:900});
  const combo=tab.playwright.getByRole('combobox',{name:'Demo user preview',exact:true});
  if(await combo.evaluate(e=>e.value)!==identities[role])await tab.playwright.expectNavigation(()=>combo.selectOption(identities[role]),{url:`http://localhost:3000${landings[role]}`});
  if(new URL(await tab.url()).pathname!=='/settings')await tab.goto('http://localhost:3000/settings');else await tab.reload();
  await tab.playwright.getByRole('main').getByRole('heading',{name:'Settings',exact:true}).waitFor({state:'visible'});
  for(const label of role==='admin'?['Branding','Appearance']:['Appearance'])await check(`${role}/${width}: Settings ${label} anchor clears both headers`,async()=>{
   await tab.playwright.getByRole('navigation',{name:'Settings sections',exact:true}).getByRole('link',{name:label,exact:true}).click();
   const state=await tab.playwright.evaluate(id=>({target:document.getElementById(id).getBoundingClientRect().toJSON(),header:document.querySelector('.global-workspace-header').getBoundingClientRect().toJSON(),settings:document.querySelector('.settings-heading').getBoundingClientRect().toJSON(),height:innerHeight}),`${label.toLowerCase()}-title`);
   assert.ok(state.target.top>=state.settings.bottom-1,'Target heading must clear Settings bar');assert.ok(state.target.top<state.height,'Target heading must be in view');assert.ok(state.settings.top>=state.header.bottom-1);return state;
  });
  await check(`${role}/${width}: Quick actions menu bounds and pointer reachability`,async()=>{
   await button('Quick actions').click();const menu=tab.playwright.getByRole('menu',{name:'Quick actions',exact:true});await menu.waitFor({state:'visible'});
   const state=await box(menu);assert.ok(state.rect.left>=0&&state.rect.right<=state.width+1&&state.rect.top>=0&&state.rect.bottom<=state.height+1);assert.equal(state.hit,true);await menu.getByRole('menuitem').first().press('Escape');await menu.waitFor({state:'hidden'});return state;
  });
  await check(`${role}/${width}: palette field is reachable above sticky surfaces`,async()=>{
   await button('Search pages and actions').click();const dialog=tab.playwright.getByRole('dialog',{name:'Search workspace',exact:true});await dialog.waitFor({state:'visible'});
   const input=tab.playwright.getByRole('combobox',{name:'Search pages and actions Esc',exact:true});const state=await box(input);assert.equal(state.hit,true);assert.ok(state.rect.top>=0&&state.rect.bottom<=state.height);await input.fill('Settings');await input.press('Escape');await dialog.waitFor({state:'hidden'});return state;
  });
  await check(`${role}/${width}: floating lens pointer and keyboard remain usable`,async()=>{
   await tab.playwright.locator('.appearance-advanced > summary').click();const lens=button('Hold floating glass lens');
   await lens.click();assert.equal(await lens.getAttribute('aria-pressed'),'true');await lens.click();assert.equal(await lens.getAttribute('aria-pressed'),'false');
   await lens.press('Space');assert.equal(await lens.getAttribute('aria-pressed'),'true');await lens.press('Space');assert.equal(await lens.getAttribute('aria-pressed'),'false');return box(lens);
  });
  return results.filter(r=>r.name.startsWith(`${role}/${width}:`));
 }
 return {run,results};
}
