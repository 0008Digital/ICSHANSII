import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
// Uses UI previews only; never saves appearance or publishes records.
export async function createStates({tab,viewport,artifactDir}) {
 const results=[];
 await mkdir(artifactDir,{recursive:true});
 const button=name=>tab.playwright.getByRole('button',{name,exact:true});
 async function record(name,action){
  try {results.push({name,status:'passed',evidence:await action()});}
  catch(error){results.push({name,status:'failed',error:String(error)});}
  await writeFile(`${artifactDir}/results.json`,JSON.stringify(results,null,2));
 }
 async function identity(role){
  const id={admin:'demo-centre-admin',developer:'demo-platform-owner',teacher:'demo-teacher',studentA:'demo-student-a',studentB:'demo-student-b'}[role];
  const combo=tab.playwright.getByRole('combobox',{name:'Demo user preview',exact:true});
  if(await combo.evaluate(e=>e.value)!==id)await tab.playwright.expectNavigation(()=>combo.selectOption(id),{url:`http://localhost:3000${role==='developer'?'/developer':role==='teacher'?'/teacher-dashboard':role.startsWith('student')?'/student-portal':'/'}`});
  assert.equal(await combo.evaluate(e=>e.value),id);
 }
 async function themeCases(role,width){
  await identity(role);await viewport.set({width,height:width<768?740:900});
  for(const theme of ['Light','Dark'])for(const material of ['Clear','Regular','Frosted'])await record(`${role}/${width}/${theme}/${material}`,async()=>{
   if(new URL(await tab.url()).pathname==='/settings')await tab.reload();else await tab.goto('http://localhost:3000/settings');
   await button(theme).click();await button(material).click();
   if(role==='admin'&&width<768){await button('More navigation').click();await tab.playwright.getByRole('navigation',{name:'More destinations',exact:true}).getByRole('link',{name:'Tests & Results',exact:true}).click();}
   else await tab.playwright.getByRole('link',{name:role==='admin'?'Tests & Results':'Developer Console',exact:true}).filter({visible:true}).first().click();
   await tab.playwright.getByRole('main').getByRole('heading',{name:role==='admin'?'Tests & Results':'Developer Console',exact:true}).waitFor({state:'visible'});
   if(role==='admin')await button('Review results').press('Enter');
   const evidence=await tab.playwright.evaluate(()=>({width:innerWidth,theme:document.documentElement.dataset.appearance,documentWidth:document.documentElement.scrollWidth,primary:Array.from(document.querySelectorAll('.form-actions>button.primary-link')).map(e=>({border:getComputedStyle(e).borderStyle,focus:e.matches(':focus-visible'),outline:getComputedStyle(e).outlineStyle})),fields:Array.from(document.querySelectorAll('.academic-assessment .academic-fields .picker-trigger,.academic-assessment .academic-fields > label > input')).map(e=>{const r=e.getBoundingClientRect();return {top:r.top,height:r.height};})}));
   assert.equal(evidence.width,width);assert.equal(evidence.theme,theme.toLowerCase());assert.ok(evidence.documentWidth<=width);
   for(const p of evidence.primary){assert.equal(p.border,'solid');if(p.focus)assert.equal(p.outline,'solid');}
   if(width>=768&&evidence.fields.length){assert.ok(Math.max(...evidence.fields.map(e=>e.top))-Math.min(...evidence.fields.map(e=>e.top))<1);}
   if(material==='Regular')await writeFile(`${artifactDir}/${role}-${width}-${theme}.jpg`,await tab.screenshot({fullPage:true}));
   // Hard navigation discards the provider-only preview; nothing is applied.
   await tab.goto('http://localhost:3000/settings');if(await button('Discard preview').isEnabled())await button('Discard preview').click();
   return evidence;
  });
 }
 async function sections(role,width){
  await identity(role);await viewport.set({width,height:width<768?740:900});
  const route=role==='developer'?'/developer':role==='teacher'?'/teacher-dashboard':'/student-portal';
  await tab.goto(`http://localhost:3000${route}`);await tab.playwright.getByRole('main').getByRole('heading').first().waitFor({state:'visible'});
  const selector=role==='developer'?'.developer-section-nav':role==='teacher'?'.teacher-preview-links':'.student-portal-nav';
  const links=await tab.playwright.locator(`${selector} a`).evaluateAll(items=>items.map(e=>({name:e.textContent.trim(),href:e.getAttribute('href')})));
  for(const link of links)await record(`${role}/${width}/section/${link.name}`,async()=>{
   if(new URL(await tab.url()).pathname!==route)await tab.goto(`http://localhost:3000${route}`);
   await tab.playwright.locator(selector).getByRole('link',{name:link.name,exact:true}).press('Enter');
   await tab.playwright.domSnapshot();
   const target=new URL(link.href,`http://localhost:3000${route}`);
   await tab.playwright.waitForURL(target.href);
   return {url:await tab.url(),width:await tab.playwright.evaluate(()=>innerWidth)};
  });
 }
 return {themeCases,sections,results};
}
