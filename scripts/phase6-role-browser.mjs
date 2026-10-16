// Local QA via injected documented CUA browser handles; no storage or app-state injection.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const identities={developer:'demo-platform-owner',teacher:'demo-teacher',studentA:'demo-student-a',studentB:'demo-student-b'};
const landings={developer:'/developer',teacher:'/teacher-dashboard',studentA:'/student-portal',studentB:'/student-portal'};
export async function createRoleAudit({tab,artifactDir}){
 await mkdir(artifactDir,{recursive:true});const results=[];
 const button=name=>tab.playwright.getByRole('button',{name,exact:true});
 const field=name=>tab.playwright.getByRole('textbox',{name,exact:true});
 const select=name=>tab.playwright.getByRole('combobox',{name,exact:true});
 const main=()=>tab.playwright.getByRole('main');
 const enter=async(control,value)=>{await control.press('Control+A');await control.pressSequentially(value);assert.equal(await control.evaluate(e=>e.value),value);};
 const save=()=>writeFile(`${artifactDir}/results.json`,JSON.stringify(results,null,2));
 async function check(name,action){try{results.push({name,status:'passed',evidence:await action()});}catch(error){const file=name.replace(/[^a-z0-9]+/gi,'-')+'.jpg';await writeFile(`${artifactDir}/${file}`,await tab.screenshot({fullPage:false}));results.push({name,status:'failed',error:String(error),screenshot:file});}await save();}
 async function open(path){if(await tab.url()===`http://localhost:3000${path}`)await tab.reload();else await tab.goto(`http://localhost:3000${path}`);await main().getByRole('heading').first().waitFor({state:'visible'});await tab.playwright.domSnapshot();}
 async function choose(label,value,region=null){const scope=region?tab.playwright.getByRole('region',{name:region,exact:true}):tab.playwright;await scope.getByRole('button',{name:new RegExp(`^${label} `)}).press('Enter');const dialog=tab.playwright.getByRole('dialog',{name:label,exact:true});await dialog.waitFor({state:'visible'});await dialog.getByRole('option',{name:value,exact:true}).press('Enter');await dialog.waitFor({state:'hidden'});}
 async function run(role,width,theme,{bugsOnly=false}={}){
  const prefix=`${role}/${width}/${theme}`;
  assert.equal(await select('Demo user preview').evaluate(e=>e.value),identities[role]);
  assert.equal(await tab.playwright.evaluate(()=>innerWidth),width);
  await open(landings[role]);
  if(role==='developer'){
   await check(`${prefix}: notes belong to selected report`,async()=>{
    await field('Developer notes').fill('QA note for report 001');await tab.playwright.locator('.developer-report-list button').nth(1).press('Enter');assert.equal(await field('Developer notes').evaluate(e=>e.value),'');await field('Developer notes').fill('QA note for report 002');await tab.playwright.locator('.developer-report-list button').nth(0).click();assert.equal(await field('Developer notes').evaluate(e=>e.value),'QA note for report 001');await tab.playwright.locator('.developer-report-list button').nth(1).click();assert.equal(await field('Developer notes').evaluate(e=>e.value),'QA note for report 002');return {independentDrafts:true};
   });
   if(bugsOnly)return results;
   await check(`${prefix}: all report filters and empty search`,async()=>{
    await enter(field('Search'),'DEMO-BUG-002');await tab.playwright.domSnapshot();assert.equal(await tab.playwright.locator('.developer-report-list button').count(),1);await enter(field('Search'),'qa-no-match');await tab.playwright.domSnapshot();assert.match(await tab.playwright.locator('.developer-report-list').innerText(),/No matching fictional reports/);await field('Search').press('Control+A');await field('Search').press('Backspace');
    for(const [label,value,count] of [['Status','New',1],['Severity','Critical',0],['Role','Teacher',1],['Centre','Demo centre',2]]){await select(label).selectOption(value);await tab.playwright.domSnapshot();assert.equal(await tab.playwright.locator('.developer-report-list button').count(),count);await select(label).selectOption('');}
    return {filters:5,emptyState:true,dateAutomation:'Native fill does not commit React date state; not verified'};
   });
   await check(`${prefix}: report status updates list and metrics but is unsaved`,async()=>{
    await tab.playwright.locator('.developer-report-list button').nth(0).click();for(const status of ['Investigating','In Progress','Fixed','Closed','Duplicate','New']){await select('Report status').selectOption(status);assert.match(await tab.playwright.locator('.developer-report-list button').nth(0).innerText(),new RegExp(status));if(status==='Fixed')assert.match(await tab.playwright.locator('#overview').innerText(),/Resolved reports\s*1/);}
    await select('Report status').selectOption('Fixed');await tab.reload();await field('Developer notes').waitFor({state:'visible'});assert.equal(await select('Report status').evaluate(e=>e.value),'New');assert.equal(await field('Developer notes').evaluate(e=>e.value),'');return {reloadClearsDrafts:true};
   });
   await check(`${prefix}: notifications remain unavailable`,async()=>{assert.equal(await tab.playwright.getByRole('checkbox',{name:/Automatic notifications/}).isEnabled(),false);assert.match(await main().innerText(),/Service status is unavailable/);return {backend:'disconnected'};});
  }else if(role.startsWith('student')){
   await check(`${prefix}: greeting matches selected demo identity`,async()=>{const text=await tab.playwright.locator('.student-portal-welcome').innerText();assert.match(text,new RegExp(role==='studentA'?'Student A':'Student B'));return {identity:identities[role],welcome:text};});
   if(bugsOnly)return results;
   await check(`${prefix}: all student section tabs and homework action`,async()=>{
    const nav=tab.playwright.getByRole('navigation',{name:'Student portal sections',exact:true});const hrefs=await nav.locator('a[href^="#"]').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
    for(const href of hrefs){await nav.locator(`a[href="${href}"]`).press('Enter');await tab.playwright.waitForURL(`http://localhost:3000/student-portal${href}`);assert.equal(await tab.playwright.locator(href).count(),1);}
    await tab.playwright.getByRole('link',{name:'View homework',exact:true}).click();await tab.playwright.waitForURL('http://localhost:3000/student-portal#homework');assert.match(await main().innerText(),/Your private records are not connected/);return {tabs:hrefs};
   });
  }else{
   if(bugsOnly)return results;
   await check(`${prefix}: Teacher tools links and unavailable assignments`,async()=>{const tools=tab.playwright.getByRole('navigation',{name:'Teacher tools',exact:true});const hrefs=await tools.getByRole('link').evaluateAll(es=>es.map(e=>e.getAttribute('href')));assert.equal(hrefs.length,4);for(const href of hrefs){await open('/teacher-dashboard');await main().press('Control+End');await tab.playwright.domSnapshot();await tab.playwright.getByRole('navigation',{name:'Teacher tools',exact:true}).locator(`a[href="${href}"]`).click();await tab.playwright.waitForURL(`http://localhost:3000${href}`);await main().getByRole('heading').first().waitFor({state:'visible'});}await open('/attendance');assert.match(await main().innerText(),/verified batch assignment/);assert.equal(await field('Roll number or student name').count(),0);await open('/homework');assert.match(await main().innerText(),/unavailable until batch assignments are connected/);return {tools:hrefs,unavailableControlsAbsent:true};});
   await check(`${prefix}: assessment validation preview reset and batch isolation`,async()=>{
    await open('/tests-results');await button('Review results').press('Enter');assert.match(await main().innerText(),/Complete the subject, date/);await enter(field(/^Subject/),'QA Mathematics');await enter(field('Marks for Aarav Example'),'101');await button('Review results').click();assert.match(await main().innerText(),/Enter a valid score from 0 to 100/);
    await button('Test date Choose date').press('Enter');await button('15 October 2026').press('Enter');await tab.playwright.getByRole('dialog',{name:'Test date',exact:true}).waitFor({state:'hidden'});await enter(field('Marks for Aarav Example'),'75');await button('Review results').press('Enter');assert.match(await main().innerText(),/75\.00%/);await button('Preview publication').click();assert.match(await main().innerText(),/Results remain unpublished/);await button('Reset').click();assert.equal(await field(/^Subject/).evaluate(e=>e.value),'');
    await choose('Batch','Old General','Create test preview');assert.equal(await field('Marks for Aarav Example').count(),0);await choose('Batch','New General','Create test preview');assert.equal(await field('Marks for Aarav Example').evaluate(e=>e.value),'');await tab.playwright.getByRole('checkbox',{name:'Absent',exact:true}).check();await enter(field(/^Subject/),'QA Absent');await tab.playwright.getByRole('button',{name:/^Test date /}).click();await button('15 October 2026').click();await button('Review results').click();assert.match(await main().innerText(),/No scored students/);await button('Reset').click();return {validation:true,unpublished:true,reset:true,batchIsolation:true,absence:true};
   });
   await check(`${prefix}: leaderboard dropdowns calendar and empty statuses`,async()=>{
    await choose('Batch','Old General','Batch leaderboard');await choose('Batch','New General','Weekly leaderboard');await button('Published test No published tests connected').press('Enter');const dialog=tab.playwright.getByRole('dialog',{name:'Published test',exact:true});await dialog.waitFor({state:'visible'});assert.equal(await dialog.getByRole('option').isEnabled(),false);await dialog.getByRole('button',{name:'Close Published test',exact:true}).press('Escape');await dialog.waitFor({state:'hidden'});await button('Week starting Choose date').press('Enter');await button('15 October 2026').press('Enter');assert.match(await main().innerText(),/No published results are connected/);return {emptyLeaderboards:true};
   });
  }
  await check(`${prefix}: chat denies content and sending consistently`,async()=>{
   await open('/chatrooms');assert.match(await main().innerText(),/No rooms are enabled/);assert.match(await main().innerText(),/Room unavailable/);assert.equal(await field('Message preview').count(),0);await field('Search messages').fill('qa-no-match');assert.match(await main().innerText(),/Room unavailable/);await field('Search messages').fill('');return {composerAbsent:true,disconnected:true};
  });
  await check(`${prefix}: Quick actions and search keyboard navigation`,async()=>{
   await button('Quick actions').click();const menu=tab.playwright.getByRole('menu',{name:'Quick actions',exact:true});await menu.waitFor({state:'visible'});const items=await menu.getByRole('menuitem').allTextContents({});await menu.getByRole('menuitem').first().press('ArrowDown');await menu.getByRole('menuitem').first().press('Escape');await menu.waitFor({state:'hidden'});
   await button('Search pages and actions').click();const input=select('Search pages and actions Esc');await input.fill('qa-no-match-6789');assert.match(await tab.playwright.getByRole('dialog',{name:'Search workspace',exact:true}).innerText(),/No matching/);await input.fill('Settings');await input.press('ArrowDown');await input.press('Enter');await main().getByRole('heading',{name:'Settings',exact:true}).waitFor({state:'visible'});return {menuItems:items,searchNavigated:true};
  });
  return results.filter(r=>r.name.startsWith(prefix));
 }
 return {run,results};
}
