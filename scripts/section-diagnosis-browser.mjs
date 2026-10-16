import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

// Inject the documented local-browser tab; never launches a separate browser.
export async function createSectionDiagnosis({tab,viewport,artifactDir}) {
 await mkdir(artifactDir,{recursive:true});const results=[];
 const identities={teacher:'demo-teacher',studentA:'demo-student-a',studentB:'demo-student-b',developer:'demo-platform-owner',admin:'demo-centre-admin',manager:'demo-manager'};
 const teacher=[['Teacher Dashboard','/teacher-dashboard','Teacher Dashboard'],['Assigned Students','/teacher-dashboard#assigned-students','Students'],['Assigned Batches','/teacher-dashboard#assigned-batches','Assigned Batches'],['Rapid Attendance','/attendance','Attendance'],['Tests & Results','/teacher-dashboard#tests','Tests & Results'],['Homework','/teacher-dashboard#homework','Homework'],['Chatrooms','/chatrooms','Chatrooms']];
 const students=[['Home','/student-portal','Student Home'],['Classes / Batch','/student-portal#batch','Classes & Batch'],['Attendance','/student-portal#attendance','Attendance'],['Results','/student-portal#results','Tests & Results'],...['Fees','Profile','Homework','ICS Updates'].map((name,i)=>[name,'/student-portal#'+['fees','profile','homework','updates'][i],name]),['Chatrooms','/chatrooms','Chatrooms']];
 async function record(name,action){const row={name};try{row.evidence=await action();row.status='passed';}catch(e){row.status='failed';row.error=String(e);}results.push(row);await writeFile(artifactDir+'/results.json',JSON.stringify(results,null,2));}
 async function select(role){await tab.playwright.getByRole('combobox',{name:'Demo user preview',exact:true}).selectOption(identities[role]);const landing=role==='teacher'?'/teacher-dashboard':role.startsWith('student')?'/student-portal':role==='developer'?'/developer':'/';await tab.playwright.waitForURL('http://localhost:3000'+landing);await tab.playwright.domSnapshot();assert.equal(await tab.playwright.getByRole('combobox',{name:'Demo user preview',exact:true}).evaluate(e=>e.value),identities[role]);}
 async function inspect(href,title){
  await tab.playwright.getByRole('main').locator('h1').waitFor({state:'visible'});
  // Fresh accessibility reads avoid accepting the pre-hydration overview.
  for(let attempt=0;attempt<8;attempt++){await tab.playwright.domSnapshot();if(await tab.playwright.getByRole('main').locator('h1').innerText()===title)break;}
  const main=tab.playwright.getByRole('main');const text=await main.innerText();
  assert.equal(await main.locator('h1').innerText(),title);
  const evidence=await tab.playwright.evaluate(()=>({url:location.pathname+location.hash,active:[...document.querySelectorAll('nav a[aria-current="page"]')].filter(e=>e.getClientRects().length).map(e=>e.getAttribute('href')),moreActive:!!document.querySelector('.mobile-more-trigger[data-active="true"]'),sections:[...document.querySelectorAll('main [data-role-section]')].filter(e=>e.getClientRects().length).map(e=>e.id)}));
  assert.equal(evidence.url,href);const hash=href.split('#')[1];if(hash){assert.equal(evidence.sections.join(','),hash);assert.ok(!text.includes('Welcome back'));}return {...evidence,text};
 }
 async function click(href,width,role){let link=tab.playwright.locator(`nav a[href="${href}"]`).filter({visible:true}).first();if(!await link.isVisible()&&width<768){await tab.playwright.getByRole('button',{name:role.startsWith('student')?'More student sections':'More navigation',exact:true}).click();await tab.playwright.domSnapshot();link=tab.playwright.locator(`nav a[href="${href}"]`).filter({visible:true}).first();}await link.click();}
 async function run(role,width){await viewport.set({width,height:900});await select(role);const sequence=role==='teacher'?teacher:students;
  for(const [label,href,title] of sequence)await record(`${role}/${width}/click ${label}`,async()=>{await click(href,width,role);const evidence=await inspect(href,title);assert.ok(evidence.active.includes(href)||(width<768&&evidence.moreActive),'Active navigation must match rendered view');return evidence;});
  const pair=sequence.slice(1,3);
  for(const [,href,title] of pair)await record(`${role}/${width}/direct ${href}`,async()=>{await tab.goto('http://localhost:3000'+href);return inspect(href,title);});
  await record(`${role}/${width}/reload`,async()=>{await tab.reload();return inspect(pair[1][1],pair[1][2]);});
  await record(`${role}/${width}/back`,async()=>{await tab.back();return inspect(pair[0][1],pair[0][2]);});
  await record(`${role}/${width}/forward`,async()=>{await tab.forward();return inspect(pair[1][1],pair[1][2]);});
  await record(`${role}/${width}/rapid and repeat`,async()=>{for(const [,href] of [...pair,...pair,pair[1]])await click(href,width,role);return inspect(pair[1][1],pair[1][2]);});
 }
 async function switches(width){await viewport.set({width,height:900});for(const role of Object.keys(identities))await record(`switch/${width}/${role}`,async()=>{await select(role);await tab.playwright.domSnapshot();return {identity:identities[role],text:await tab.playwright.getByRole('main').innerText()};});}
 return {run,switches,results};
}
