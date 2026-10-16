import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
// Uses the existing documented browser tab, never launches a separate browser.
export async function developerSectionChecks(tab,viewport,dir){
 await mkdir(dir,{recursive:true});const results=[];
 const sections=[['','Developer Console','Sample count'],['bug-reports','Bug Reports','Developer notes'],['application-errors','Application Errors','No errors are being collected.'],['system-health','System Health','Website availability'],['release-updates','Release Updates','0.1.0'],['feedback','Feedback','No feedback available.'],['chat-moderation','Chatroom Moderation','Open Chat Permissions preview'],['centres','Centre Overview','Tenant metadata only.'],['developer-settings','Developer Settings','Automatic notifications'],['appearance','Settings','Appearance']];
 const href=id=>id==='appearance'?'/settings':'/developer'+(id?'#'+id:'');
 async function inspect(id,title,content){
  await tab.playwright.getByRole('main').getByRole('heading',{level:1,name:title,exact:true}).waitFor({state:'visible',timeoutMs:12000});await tab.playwright.domSnapshot();
  const actual=await tab.playwright.evaluate(()=>({url:location.pathname+location.hash,width:innerWidth,height:innerHeight,title:document.querySelector('main h1')?.textContent,sections:[...document.querySelectorAll('main [data-role-section]')].filter(e=>e.getClientRects().length).map(e=>e.id),text:document.querySelector('main')?.innerText,chart:!!document.querySelector('.developer-severity-chart')?.getClientRects().length}));
  assert.equal(actual.url,href(id));assert.equal(actual.title,title);assert.ok(actual.text.includes(content));
  if(id!=='appearance'){assert.equal(actual.sections.join(','),id||'overview');assert.equal(actual.chart,!id);}
  return actual;
 }
 async function record(name,action){try{results.push({name,status:'passed',evidence:await action()});}catch(e){results.push({name,status:'failed',error:String(e)});}await writeFile(dir+'/results.json',JSON.stringify(results,null,2));}
 async function click(id){let link=tab.playwright.locator(`nav a[href="${href(id)}"]`).filter({visible:true}).first();if(!await link.isVisible()){await tab.playwright.getByRole('button',{name:'More navigation',exact:true}).click();await tab.playwright.domSnapshot();link=tab.playwright.locator(`nav a[href="${href(id)}"]`).filter({visible:true}).first();}await link.click();}
 async function run(width){await viewport.set({width:width*.8,height:720});await tab.playwright.domSnapshot();
  for(const [id,title,text] of sections){
   await record(`${width}/click/${id||'console'}`,async()=>{await click(id);return inspect(id,title,text);});
   await record(`${width}/direct/${id||'console'}`,async()=>{await tab.goto('http://localhost:3000/settings');await tab.playwright.domSnapshot();await tab.goto('http://localhost:3000'+href(id));return inspect(id,title,text);});
   await record(`${width}/reload/${id||'console'}`,async()=>{await tab.reload();return inspect(id,title,text);});
  }
  await click('feedback');await inspect('feedback','Feedback','No feedback available.');await click('centres');await inspect('centres','Centre Overview','Tenant metadata only.');
  await record(`${width}/back`,async()=>{await tab.back();return inspect('feedback','Feedback','No feedback available.');});
  await record(`${width}/forward`,async()=>{await tab.forward();return inspect('centres','Centre Overview','Tenant metadata only.');});
  await record(`${width}/rapid-repeat`,async()=>{for(const id of ['feedback','centres','developer-settings','developer-settings']){await click(id);await tab.playwright.domSnapshot();}return inspect('developer-settings','Developer Settings','Automatic notifications');});
 }
 return {run,results};
}
