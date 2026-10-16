import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
export async function createRenderedSectionChecks({tab,viewport,artifactDir}){
 await mkdir(artifactDir,{recursive:true});const results=[];
 const identities={teacher:'demo-teacher',studentA:'demo-student-a',studentB:'demo-student-b'};
 const titles={teacher:{'assigned-students':'Students','assigned-batches':'Assigned Batches',tests:'Tests & Results',homework:'Homework'},studentA:{batch:'Classes & Batch',attendance:'Attendance',results:'Tests & Results',fees:'Fees',profile:'Profile',homework:'Homework',updates:'ICS Updates'}};
 async function run(role,width){
  await viewport.set({width,height:900});const cb=tab.playwright.getByRole('combobox',{name:'Demo user preview',exact:true});
  if(await cb.evaluate(e=>e.value)!==identities[role]){await cb.selectOption(identities[role]);await tab.playwright.domSnapshot();}
  assert.equal(await cb.evaluate(e=>e.value),identities[role]);
  const path=role==='teacher'?'/teacher-dashboard':'/student-portal';await tab.goto('http://localhost:3000'+path);await tab.playwright.domSnapshot();
  for(const [id,title] of Object.entries(titles[role==='teacher'?'teacher':'studentA'])){
   const row={role,width,id,title};try{
    const href=role==='teacher'?path+'#'+id:'#'+id;
    const nav=tab.playwright.getByRole('navigation',{name:role==='teacher'?'Main navigation':'Student portal sections',exact:true});
    if(role==='teacher'&&width<768)await tab.goto('http://localhost:3000'+path+'#'+id);else await nav.locator(`a[href="${href}"]`).click();
    await tab.playwright.getByRole('main').getByRole('heading',{level:1,name:title,exact:true}).waitFor({state:'visible'});
    await tab.playwright.domSnapshot();
    row.actual=await tab.playwright.evaluate(()=>({title:document.querySelector('main h1').textContent,visible:[...document.querySelectorAll('[data-role-section]')].filter(e=>e.getClientRects().length).map(e=>e.id),overview:!!document.querySelector('.student-portal-overview')?.getClientRects().length,hash:location.hash}));
    assert.equal(row.actual.visible.join(','),id);assert.equal(row.actual.overview,false);assert.equal(row.actual.hash,'#'+id);row.status='passed';
   }catch(e){row.status='failed';row.error=String(e);}results.push(row);await writeFile(artifactDir+'/results.json',JSON.stringify(results,null,2));
  }
  return results.filter(r=>r.role===role&&r.width===width).map(({id,status,error})=>({id,status,error}));
 }
 return {run,results};
}

