import test from 'node:test';
import assert from 'node:assert/strict';
import {navigateRoleSection,commitRoleSection,resetRoleSectionForIdentity,SECTION_LOCATION_CHANGE,subscribeSectionLocation} from '../src/components/ics/section-navigation.mjs';

function fixture(href='http://localhost:3000/student-portal') {
 const operations=[],nodes=[];
 const win={location:{href},Event,history:{pushState(_state,_unused,url){win.location.href=new URL(url,win.location.href).href;operations.push(['history',win.location.href]);},replaceState(_state,_unused,url){win.location.href=new URL(url,win.location.href).href;operations.push(['replace',win.location.href]);}},dispatchEvent(event){operations.push(['event',event.type]);},scrollTo(options){operations.push(['top',options.top]);}};
 const doc={querySelectorAll(){return nodes;}};
 const node=(id,visible=true)=>({id,getClientRects:()=>visible?[{}]:[],scrollIntoView(options){operations.push(['section',id,options.block]);}});
 const click=(href,overrides={})=>{const event={button:0,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...overrides};const anchor={href,target:'',hasAttribute:()=>false};return {event,handled:navigateRoleSection(event,anchor,win,doc,'/student-portal')};};
 return {win,doc,operations,nodes,node,click};
}
test('same-page section commits URL and notifies indicators before scrolling',()=>{
 const f=fixture();f.nodes.push(f.node('results'));assert.equal(f.click('#results').handled,true);
 assert.deepEqual(f.operations,[['history','http://localhost:3000/student-portal#results'],['event',SECTION_LOCATION_CHANGE],['section','results','start']]);
});
test('repeated activation rescrolls without a duplicate history entry',()=>{
 const f=fixture();f.nodes.push(f.node('results'));f.click('#results');f.click('#results');
 assert.equal(f.operations.filter(x=>x[0]==='history').length,1);assert.equal(f.operations.filter(x=>x[0]==='section').length,2);
});
test('rapid later section and Home intents supersede earlier section synchronously',()=>{
 const f=fixture();f.nodes.push(f.node('results'),f.node('profile'));f.click('#results');f.click('#profile');f.click('/student-portal');
 assert.equal(f.win.location.href,'http://localhost:3000/student-portal');assert.deepEqual(f.operations.at(-1),['top',0]);
});
test('missing section is consumed without leaving a URL or pending request',()=>{
 const f=fixture();const result=f.click('#missing');assert.equal(result.event.defaultPrevented,true);assert.equal(result.handled,true);
 f.nodes.push(f.node('missing'));assert.deepEqual(f.operations,[]);assert.equal(f.win.location.href,'http://localhost:3000/student-portal');
});
test('hidden cached route target cannot intercept the active section',()=>{
 const f=fixture();const hidden=f.node('results',false);hidden.scrollIntoView=()=>assert.fail('Inactive page scrolled');f.nodes.push(hidden,f.node('results'));f.click('#results');assert.deepEqual(f.operations.at(-1),['section','results','start']);
});
test('cross-route, external, modified and already-handled navigation stays untouched',()=>{
 for(const [href,overrides] of [['/settings',{}],['https://example.com/student-portal#results',{}],['#results',{ctrlKey:true}],['#results',{button:1}],['#results',{defaultPrevented:true}]]) {
  const f=fixture();f.nodes.push(f.node('results'));assert.equal(f.click(href,overrides).handled,false);assert.deepEqual(f.operations,[]);
 }
 const f=fixture('http://localhost:3000/settings');assert.equal(f.click('/student-portal#results').handled,false);
});
test('hash, history traversal and section commits notify and clean up subscriptions',()=>{
 const previous=globalThis.window;const events=new EventTarget();globalThis.window=events;
 try{let count=0;const unsubscribe=subscribeSectionLocation(()=>count++);for(const name of ['hashchange','popstate',SECTION_LOCATION_CHANGE])events.dispatchEvent(new Event(name));assert.equal(count,3);unsubscribe();events.dispatchEvent(new Event(SECTION_LOCATION_CHANGE));assert.equal(count,3);}finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
});
test('command-palette section intent uses the same synchronous commit',()=>{
 const f=fixture();f.nodes.push(f.node('results'));assert.equal(commitRoleSection('/student-portal#results',f.win,f.doc,'/student-portal'),true);assert.equal(f.win.location.href,'http://localhost:3000/student-portal#results');assert.deepEqual(f.operations.at(-1),['section','results','start']);
});
test('identity switch clears a same-path old section without pushing history',()=>{
 const f=fixture('http://localhost:3000/student-portal#profile');assert.equal(resetRoleSectionForIdentity(f.win,'/student-portal'),true);assert.deepEqual(f.operations,[['replace','http://localhost:3000/student-portal'],['event',SECTION_LOCATION_CHANGE],['top',0]]);assert.equal(resetRoleSectionForIdentity(f.win,'/teacher-dashboard'),false);
});
