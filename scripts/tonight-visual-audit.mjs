import {writeFile,mkdir} from 'node:fs/promises';
import {pages} from './phase3-ui-audit.mjs';
export async function createVisualAudit({tab,copy,artifactDir}) {
 await mkdir(artifactDir,{recursive:true});const rows=[];
 async function scan(role,width,theme,routes=role==='developer'?['/developer','/chatrooms','/settings']:pages[role]){
  await copy.scan(role,width,theme,[]);
  for(const route of routes){
   const row={role,route,width,theme};
   try{
    await tab.goto('http://localhost:3000'+route);await tab.playwright.getByRole('main').getByRole('heading').first().waitFor({state:'visible'});
    await tab.playwright.getByRole('main').press('Control+Home');
    row.geometry=await tab.playwright.evaluate(()=>{
     const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
     const data=e=>{const s=getComputedStyle(e);return {tag:e.tagName,class:e.className,text:(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,75),rect:e.getBoundingClientRect().toJSON(),font:s.fontSize,lineHeight:s.lineHeight,gap:s.gap,padding:s.padding,overflow:s.overflow,z:s.zIndex,position:s.position};};
     const es=Array.from(document.querySelectorAll('main h1,main h2,main section,main article,main input,main button,main select,main summary,main nav')).filter(visible);
     return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,header:data(document.querySelector('header')),sidebar:document.querySelector('aside')?data(document.querySelector('aside')):null,main:data(document.querySelector('main')),elements:es.map(data),outliers:es.filter(e=>{const r=e.getBoundingClientRect();return r.left< -2||r.right>innerWidth+2;}).map(data)};
    });
    row.screenshot=`${role}-${width}-${theme}-${route.replace(/[^a-z0-9]+/gi,'-')||'home'}.jpg`;
    await writeFile(`${artifactDir}/${row.screenshot}`,await tab.screenshot({fullPage:true}));row.status=row.geometry.width===width?'captured':'viewport-mismatch';
   }catch(e){row.status='failed';row.error=String(e);}
   rows.push(row);await writeFile(`${artifactDir}/matrix.json`,JSON.stringify(rows,null,2));
  }
  return rows.filter(r=>r.role===role&&r.width===width&&r.theme===theme).map(r=>({route:r.route,status:r.status,overflow:r.geometry?.documentWidth-r.geometry?.width,outliers:r.geometry?.outliers.length}));
 }
 return {scan,rows};
}
