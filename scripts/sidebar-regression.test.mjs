import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sidebarLayoutIssues} from './sidebar-regression.mjs';

const desktopState=(overrides={})=>({
 documentWidth:1280,viewportWidth:1280,viewportHeight:900,
 navbar:{top:0,bottom:70,left:0,right:1280},navbarPosition:'fixed',
 sidebar:{top:70,bottom:900,right:240,width:240},
 nav:{top:84,bottom:850,overflows:false},footer:{top:850,bottom:900},workspace:{left:240},contentTop:96,
 sidebarPosition:'fixed',sidebarOverflowY:'auto',navOverflowY:'auto',scrollbarWidth:'none',sidebarDisplay:'flex',
 ...overrides,
});

test('global navbar spans the viewport while the sidebar and content start below it',()=>{
 assert.deepEqual(sidebarLayoutIssues(desktopState()),[]);
 assert.deepEqual(sidebarLayoutIssues(desktopState({navbar:{top:0,bottom:70,left:20,right:1280}})),['global navbar is not full-width and fixed']);
 assert.deepEqual(sidebarLayoutIssues(desktopState({sidebar:{top:0,bottom:900,right:240,width:240},contentTop:0})),['sidebar not fixed beneath navbar','workspace content overlaps global navbar']);
});

test('overflowing desktop navigation must remain keyboard and wheel scrollable',()=>{
 assert.deepEqual(sidebarLayoutIssues(desktopState({nav:{top:84,bottom:850,overflows:true},navOverflowY:'hidden'})),['overflowing sidebar is not scrollable']);
 assert.deepEqual(sidebarLayoutIssues(desktopState({nav:{top:84,bottom:850,overflows:true}})),[]);
});

test('short desktop windows use the fixed sidebar as the single hidden-track scroll host',()=>{
 const state=desktopState({viewportHeight:400,navbar:{top:0,bottom:70,left:0,right:1280},sidebar:{top:70,bottom:400,right:240,width:240},nav:{top:84,bottom:380,overflows:true},footer:{top:380,bottom:430},sidebarOverflowY:'auto'});
 assert.deepEqual(sidebarLayoutIssues(state),[]);
 assert.deepEqual(sidebarLayoutIssues({...state,sidebarOverflowY:'hidden'}),['overflowing sidebar is not scrollable']);
});

test('mobile hides the desktop sidebar and rejects document overflow',()=>{
 const mobile={...desktopState(),viewportWidth:390,documentWidth:390,sidebarDisplay:'none'};
 assert.deepEqual(sidebarLayoutIssues(mobile),[]);
 assert.deepEqual(sidebarLayoutIssues({...mobile,documentWidth:392}),['horizontal overflow']);
 assert.deepEqual(sidebarLayoutIssues({...mobile,sidebarDisplay:'flex'}),['mobile sidebar visible']);
});

test('narrow mobile dock labels override global navigation typography',async()=>{
 const css=await readFile(new URL('../src/components/ics/workspace-bar.css',import.meta.url),'utf8');
 assert.match(css,/@media\s*\(max-width:\s*340px\)[\s\S]*?\.ics-mobile-dock > a,[\s\S]*?\.ics-mobile-dock \.mobile-more-trigger\s*\{\s*font-size:\s*9px;/);
 assert.doesNotMatch(css,/@media\s*\(max-width:\s*340px\)[\s\S]*?\.ics-shell \.ics-mobile-dock/);
});
