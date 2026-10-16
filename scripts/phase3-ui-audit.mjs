// Local-only browser geometry audit, driven through the documented Codex browser API.
import {mkdir, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
export const pages = {
 admin:['/','/students','/students/new','/students/DEMO-001','/students/DEMO-001/edit','/batches','/attendance','/tests-results','/homework','/fees','/ledger','/staff','/audit-logs','/ics-updates','/chatrooms','/settings'],
 manager:['/','/students','/students/new','/students/DEMO-001','/students/DEMO-001/edit','/batches','/attendance','/tests-results','/homework','/fees','/staff','/ics-updates','/chatrooms','/settings'],
 developer:['/developer','/settings'],
 teacher:['/teacher-dashboard','/attendance','/tests-results','/homework','/chatrooms','/settings'],
 studentA:['/student-portal','/chatrooms','/settings'],
 studentB:['/student-portal','/chatrooms','/settings'],
};
const ids={admin:'demo-centre-admin',manager:'demo-manager',developer:'demo-platform-owner',teacher:'demo-teacher',studentA:'demo-student-a',studentB:'demo-student-b'};
export async function createAudit({tab,viewport,artifactDir}) {
 assert.equal(new URL(await tab.url()).origin,'http://localhost:3000');
 const rows=[];
 await mkdir(artifactDir,{recursive:true});
 async function scan(role,width,routes=pages[role]) {
  await viewport.set({width,height:width<768?740:900});
  await tab.playwright.getByRole('combobox',{name:'Demo user preview',exact:true}).selectOption(ids[role]);
  for(const route of routes) {
   try {
    if(new URL(await tab.url()).pathname===route)await tab.reload();else await tab.goto(`http://localhost:3000${route}`);
    await tab.playwright.getByRole('main').getByRole('heading').first().waitFor({state:'visible'});
    await tab.playwright.getByRole('navigation',{name:width<768?(role.startsWith('student')?'Student portal navigation':'Mobile navigation'):'Main navigation',exact:true}).waitFor({state:'visible',timeoutMs:10000});
    assert.equal(await tab.playwright.getByRole('combobox',{name:'Demo user preview',exact:true}).evaluate(e=>e.value),ids[role]);
    const data=await tab.playwright.evaluate(()=>{
     const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
     const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
     const short=e=>(e.getAttribute('aria-label')||e.textContent||e.tagName).trim().slice(0,75);
     const controls=Array.from(document.querySelectorAll('main button,main input:not([type=hidden]),main select,main summary')).filter(visible);
     const outliers=Array.from(document.querySelectorAll('main *')).filter(e=>visible(e)&&!e.closest('table,.table-scroll,.history-table,.ogui-sr-only,.sr-only')&&getComputedStyle(e).position!=='absolute'&&getComputedStyle(e).position!=='fixed').filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+2||r.left< -2);}).slice(0,15).map(e=>({tag:e.tagName,class:e.className,text:short(e),rect:rect(e)}));
     const actionRows=Array.from(document.querySelectorAll('main .form-actions')).map(e=>({rect:rect(e),buttons:Array.from(e.querySelectorAll('button')).map(b=>{const s=getComputedStyle(b);return {label:short(b),rect:rect(b),border:s.border,outline:s.outline,shadow:s.boxShadow,radius:s.borderRadius};})}));
     const academicFields=Array.from(document.querySelectorAll('.academic-fields input,.academic-fields button')).filter(visible).map(e=>({label:e.getAttribute('aria-label')||e.closest('label')?.textContent||e.textContent,rect:rect(e)}));
     return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,title:document.querySelector('main h1')?.textContent,theme:document.documentElement.dataset.appearance,outliers,actionRows,academicFields,smallControls:controls.filter(e=>rect(e).height<24||rect(e).width<24).map(e=>({label:short(e),type:e.getAttribute('type'),rect:rect(e)})).slice(0,20),settingsPresent:!!document.querySelector('.appearance-settings--compact'),advancedOpen:document.querySelector('.appearance-advanced')?.open};
    });
    if(width===768)assert.ok([767,768,769].includes(data.width),'Bracket the tablet breakpoint when browser scaling prevents exact 768');
    else assert.equal(data.width,width,'Actual CSS width must match the requested audit width');
    const row={role,route,requestedWidth:width,status:data.width===width?'observed':'approximate-viewport',...data};rows.push(row);
    if(width===320||width===1440||data.documentWidth>width+1) {
     const name=`${role}-${width}-${route.replace(/[^a-z0-9]+/gi,'-')||'dashboard'}.jpg`;
     await writeFile(`${artifactDir}/${name}`,await tab.screenshot({fullPage:true}));row.screenshot=name;
    }
   }catch(error){rows.push({role,route,requestedWidth:width,status:'failed',error:String(error)});}
  }
  await writeFile(`${artifactDir}/matrix.json`,JSON.stringify(rows,null,2));
  return rows.filter(r=>r.role===role&&r.requestedWidth===width).map(({route,status,width,documentWidth,outliers,error})=>({route,status,width,documentWidth,outliers:outliers?.length,error}));
 }
 return {scan,rows};
}
