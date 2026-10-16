import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const roles={
 developer:{id:'demo-platform-owner',path:'/developer',title:'Developer Console',primary:['Bug Reports','System Health'],more:'Feedback',hash:'feedback',tabs:'Developer Console sections',tab:'Bug Reports',tabHash:'bug-reports'},
 teacher:{id:'demo-teacher',path:'/teacher-dashboard',title:'Teacher Dashboard',primary:['Assigned Students','Homework'],more:'Tests & Results',hash:'tests'},
 studentA:{id:'demo-student-a',path:'/student-portal',title:'Student Home',primary:['Classes / Batch','Results'],more:'Profile',hash:'profile',tabs:'Student portal sections',tab:'Homework',tabHash:'homework'},
 studentB:{id:'demo-student-b',path:'/student-portal',title:'Student Home',primary:['Classes / Batch','Results'],more:'Profile',hash:'profile',tabs:'Student portal sections',tab:'Homework',tabHash:'homework'},
};
export async function createNavigationChecks({tab,viewport,artifactDir}) {
 const results=[];await mkdir(artifactDir,{recursive:true});
 const button=name=>tab.playwright.getByRole('button',{name,exact:true});
 async function check(name,action){
  try{results.push({name,status:'passed',evidence:await action()});}
  catch(error){const nameFile=name.replace(/[^a-z0-9]+/gi,'-');await writeFile(`${artifactDir}/${nameFile}.jpg`,await tab.screenshot({fullPage:false}));results.push({name,status:'failed',error:String(error),screenshot:`${nameFile}.jpg`});}
  await writeFile(`${artifactDir}/results.json`,JSON.stringify(results,null,2));
 }
 async function snapshot(){return tab.playwright.evaluate(()=>({url:location.href,width:innerWidth,scrollY,active:Array.from(document.querySelectorAll('nav a[aria-current]')).map(e=>e.getAttribute('href')),target:document.getElementById(location.hash.slice(1))?.getBoundingClientRect().toJSON(),header:document.querySelector('.global-workspace-header')?.getBoundingClientRect().toJSON()}));}
 async function run(role,width){
  const r=roles[role],student=role.startsWith('student'),mobile=width<768;
  await viewport.set({width,height:mobile?740:900});
  const combo=tab.playwright.getByRole('combobox',{name:'Demo user preview',exact:true});
  if(await combo.evaluate(e=>e.value)!==r.id)await tab.playwright.expectNavigation(()=>combo.selectOption(r.id),{url:`http://localhost:3000${r.path}`});
  await tab.goto(`http://localhost:3000${r.path}`);
  const nav=tab.playwright.getByRole('navigation',{name:mobile?(student?'Student portal navigation':'Mobile navigation'):'Main navigation',exact:true});
  await nav.waitFor({state:'visible'});
  assert.equal(await combo.evaluate(e=>e.value),r.id);assert.equal(await tab.playwright.evaluate(()=>innerWidth),width);
  const moreButton=()=>button(student?'More student sections':'More navigation');
  const menu=()=>tab.playwright.getByRole('navigation',{name:student?'More student sections':'More destinations',exact:true});
  async function moreOpen(){if(await moreButton().getAttribute('aria-expanded')!=='true')await moreButton().click();await menu().waitFor({state:'visible',timeoutMs:2000});}
  async function active(href){await tab.playwright.locator(`.desktop-navigation a[href="${href}"]`).and(tab.playwright.locator('[aria-current="page"]')).waitFor({state:'attached',timeoutMs:2000});if(mobile){const dockLink=tab.playwright.locator(`.ics-mobile-dock > a[href="${href}"]`);if(await dockLink.count())assert.equal(await dockLink.getAttribute('aria-current'),'page');else assert.equal(await moreButton().getAttribute('data-active'),'true');}}
  await check(`${role}/${width}: first section pointer click and active indicator`,async()=>{
   const link=nav.getByRole('link',{name:r.primary[0],exact:true});const href=await link.getAttribute('href');
   const hit=await link.evaluate(e=>{const b=e.getBoundingClientRect(),h=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return h===e||e.contains(h);});assert.equal(hit,true,'A transparent overlay must not intercept the link');
   await link.click();await tab.playwright.waitForURL(`http://localhost:3000${href}`);await active(href);return snapshot();
  });
  if(mobile)await check(`${role}/${width}: More opens on first click after section change`,async()=>{await moreOpen();return {expanded:await moreButton().getAttribute('aria-expanded')};});
  await check(`${role}/${width}: secondary section opens and menu closes`,async()=>{
   if(mobile)await moreOpen();await (mobile?menu():nav).getByRole('link',{name:r.more,exact:true}).click();await tab.playwright.waitForURL(`http://localhost:3000${r.path}#${r.hash}`);await active(`${r.path}#${r.hash}`);if(mobile)await menu().waitFor({state:'hidden'});return snapshot();
  });
  await check(`${role}/${width}: rapid consecutive sections latest click wins`,async()=>{
   for(const name of [r.primary[0],r.primary[1],r.primary[0],r.primary[1]])await nav.getByRole('link',{name,exact:true}).click();
   const href=await nav.getByRole('link',{name:r.primary[1],exact:true}).getAttribute('href');await tab.playwright.waitForURL(`http://localhost:3000${href}`);await active(href);
   await tab.playwright.domSnapshot();assert.equal(await tab.url(),`http://localhost:3000${href}`);return snapshot();
  });
  await check(`${role}/${width}: repeated keyboard activation and browser Back/Forward`,async()=>{
   const first=nav.getByRole('link',{name:r.primary[0],exact:true}),last=nav.getByRole('link',{name:r.primary[1],exact:true});
   const firstHref=await first.getAttribute('href'),lastHref=await last.getAttribute('href');
   await first.press('Enter');await first.press('Enter');await tab.playwright.waitForURL(`http://localhost:3000${firstHref}`);
   await last.press('Enter');await tab.playwright.waitForURL(`http://localhost:3000${lastHref}`);await tab.back();await tab.playwright.waitForURL(`http://localhost:3000${firstHref}`);await active(firstHref);
   await tab.forward();await tab.playwright.waitForURL(`http://localhost:3000${lastHref}`);await active(lastHref);return snapshot();
  });
  if(r.tabs)await check(`${role}/${width}: role section tab and active sidebar/dock`,async()=>{await tab.playwright.getByRole('navigation',{name:r.tabs,exact:true}).getByRole('link',{name:r.tab,exact:true}).click();await tab.playwright.waitForURL(`http://localhost:3000${r.path}#${r.tabHash}`);await active(`${r.path}#${r.tabHash}`);return snapshot();});
  await check(`${role}/${width}: cross-route section, later Home and no replay`,async()=>{
   if(mobile){await moreOpen();await menu().getByRole('link',{name:role==='developer'?'Appearance Settings':'Settings',exact:true}).click();}
   else await tab.playwright.getByRole('navigation',{name:'Workspace settings',exact:true}).getByRole('link',{name:role==='developer'?'Appearance Settings':'Settings',exact:true}).click();
   await tab.playwright.getByRole('main').getByRole('heading',{name:'Settings',exact:true}).waitFor({state:'visible'});
   const destination=await nav.getByRole('link',{name:r.primary[1],exact:true}).getAttribute('href');await nav.getByRole('link',{name:r.primary[1],exact:true}).click();await tab.playwright.getByRole('main').getByRole('heading',{name:r.title,exact:true}).waitFor({state:'visible'});await tab.playwright.waitForURL(`http://localhost:3000${destination}`);await active(destination);
   const home=tab.playwright.locator(`${mobile?'.ics-mobile-dock':'.desktop-navigation'} > a[href="${r.path}"]`).filter({visible:true});
   // Desktop links sit inside a navigation group, so use the observed base href there.
   const homeLink=mobile?home:nav.locator(`a[href="${r.path}"]`);await homeLink.click();await tab.playwright.waitForURL(`http://localhost:3000${r.path}`);await active(r.path);
   await tab.playwright.domSnapshot();await writeFile(`${artifactDir}/${role}-${width}-home.jpg`,await tab.screenshot({fullPage:false}));assert.equal(await tab.url(),`http://localhost:3000${r.path}`);const state=await snapshot();assert.ok(Math.abs(state.scrollY)<=1,'An old section must not replay after Home');return state;
  });
  await check(`${role}/${width}: command-palette keyboard section navigation`,async()=>{
   const href=await nav.getByRole('link',{name:r.primary[1],exact:true}).getAttribute('href');
   await button('Search pages and actions').click();await tab.playwright.getByRole('dialog',{name:'Search workspace',exact:true}).waitFor({state:'visible'});
   const input=tab.playwright.getByRole('combobox',{name:'Search pages and actions Esc',exact:true});await input.fill(r.primary[1]);await input.press('Enter');
   await tab.playwright.getByRole('dialog',{name:'Search workspace',exact:true}).waitFor({state:'hidden'});await tab.playwright.waitForURL(`http://localhost:3000${href}`);await active(href);return snapshot();
  });
  await check(`${role}/${width}: direct section URL and reload`,async()=>{await tab.goto(`http://localhost:3000${r.path}#${r.hash}`);await nav.waitFor({state:'visible'});await active(`${r.path}#${r.hash}`);await tab.reload();await nav.waitFor({state:'visible'});await active(`${r.path}#${r.hash}`);return snapshot();});
  return results.filter(row=>row.name.startsWith(`${role}/${width}`));
 }
 async function roleSwitches(width){
  await viewport.set({width,height:width<768?740:900});
  const combo=tab.playwright.getByRole('combobox',{name:'Demo user preview',exact:true});
  if(await combo.evaluate(e=>e.value)!=='demo-student-a')await tab.playwright.expectNavigation(()=>combo.selectOption('demo-student-a'),{url:'http://localhost:3000/student-portal'});
  await tab.goto('http://localhost:3000/student-portal#profile');
  await tab.playwright.getByRole('navigation',{name:width<768?'Student portal navigation':'Main navigation',exact:true}).waitFor({state:'visible'});
  await check(`roles/${width}: rapid switching cancels old sections and selects Student B Home`,async()=>{
   for(const id of ['demo-platform-owner','demo-teacher','demo-student-a','demo-student-b'])await combo.selectOption(id);
   await tab.playwright.waitForURL('http://localhost:3000/student-portal');await tab.playwright.domSnapshot();
   assert.equal(await combo.evaluate(e=>e.value),'demo-student-b');
   await writeFile(`${artifactDir}/roles-${width}-final.jpg`,await tab.screenshot({fullPage:false}));
   const state=await snapshot();assert.ok(Math.abs(state.scrollY)<=1);assert.equal(state.url,'http://localhost:3000/student-portal');assert.ok(state.active.length>0);assert.ok(state.active.every(href=>href==='/student-portal'));return state;
  });
 }
 async function destinations(role,width){
  const r=roles[role],mobile=width<768,student=role.startsWith('student');
  await viewport.set({width,height:mobile?740:900});
  const combo=tab.playwright.getByRole('combobox',{name:'Demo user preview',exact:true});
  if(await combo.evaluate(e=>e.value)!==r.id)await tab.playwright.expectNavigation(()=>combo.selectOption(r.id),{url:`http://localhost:3000${r.path}`});
  await tab.goto(`http://localhost:3000${r.path}`);
  const nav=tab.playwright.getByRole('navigation',{name:mobile?(student?'Student portal navigation':'Mobile navigation'):'Main navigation',exact:true});
  await nav.waitFor({state:'visible'});assert.equal(await tab.playwright.evaluate(()=>innerWidth),width);
  const hrefs=await tab.playwright.locator('.desktop-navigation a[href]').evaluateAll(elements=>[...new Set(elements.map(e=>e.getAttribute('href')))]);
  const trace=[];
  for(const href of hrefs)await check(`${role}/${width}: destination ${href}`,async()=>{
   let link=tab.playwright.locator(`.desktop-navigation a[href="${href}"]`).filter({visible:true});
   if(mobile){
    link=nav.locator(`a[href="${href}"]`);
    if(!await link.count()){
     const trigger=button(student?'More student sections':'More navigation');
     const expanded=await trigger.getAttribute('aria-expanded');
     trace.push({href,expanded,url:await tab.url(),menu:await tab.playwright.getByRole('navigation',{name:student?'More student sections':'More destinations',exact:true}).count()});
     await writeFile(`${artifactDir}/${role}-${width}-menu-trace.json`,JSON.stringify(trace,null,2));
     if(expanded!=='true')await trigger.click();
     const menu=tab.playwright.getByRole('navigation',{name:student?'More student sections':'More destinations',exact:true});
     await menu.waitFor({state:'visible'});link=menu.locator(`a[href="${href}"]`);
    }
   }
   await link.click();await tab.playwright.waitForURL(`http://localhost:3000${href}`);
   await tab.playwright.locator(`.desktop-navigation a[href="${href}"][aria-current="page"]`).waitFor({state:'attached',timeoutMs:2000});
   if(mobile){
    const primary=nav.locator(`a[href="${href}"]`);
    if(await primary.count())assert.equal(await primary.getAttribute('aria-current'),'page');
    else assert.equal(await button(student?'More student sections':'More navigation').getAttribute('data-active'),'true');
   }
   const state=await snapshot();
   if(href.includes('#')){assert.ok(state.target,'Destination section exists');assert.ok(state.target.top< (mobile?740:900)&&state.target.bottom>(state.header?.bottom??0),'Destination section is in view');}
   else {
    // Next can expose the destination URL/indicator before the old main unmounts.
    // Wait for destination content before starting the next page's interaction.
    const heading=href==='/settings'?'Settings':href==='/chatrooms'?'Chatrooms':href==='/attendance'?'Attendance':r.title;
    await tab.playwright.getByRole('main').getByRole('heading',{name:heading,exact:true}).waitFor({state:'visible'});
   }
   return state;
  });
 }
 return {run,roleSwitches,destinations,results,snapshot};
}
