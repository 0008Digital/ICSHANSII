import {test} from "node:test";
import assert from "node:assert/strict";
import {canAccessChat,defaultChatPermissions,moderateMessage,permissionFor} from "../src/components/ics/chat-model.mjs";
import {readFile} from "node:fs/promises";
const batch={id:"new-general",permissionKey:"batchRooms",type:"batch",assignedPreview:true};
test("chat access defaults deny non-admins and room overrides are explicit",()=>{
 assert.equal(canAccessChat("student",batch),false);assert.equal(canAccessChat("teacher",batch),false);
 const enabled={...defaultChatPermissions,access:{...defaultChatPermissions.access,student:true,teacher:true},features:{...defaultChatPermissions.features,studentRead:true,studentSend:true,teacherRead:true,teacherSend:true}};
 assert.equal(canAccessChat("student",batch,enabled),true);assert.equal(canAccessChat("teacher",batch,enabled),true);
 assert.equal(permissionFor("new-general","studentRead",enabled,{"new-general":{studentRead:false}}),false);
 assert.equal(canAccessChat("student",{...batch,assignedPreview:false},enabled),false);
});
test("student cannot enter the staff room, even when centre defaults are enabled",()=>{
 const enabled={...defaultChatPermissions,access:{...defaultChatPermissions.access,student:true},features:{...defaultChatPermissions.features,studentRead:true}};
 assert.equal(canAccessChat("student",{id:"staff",permissionKey:"staffRoom",type:"staff"},enabled),false);
});
test("moderation blocks high-confidence threats, holds abuse/spam and allows ordinary text",()=>{
 assert.equal(moderateMessage("I will kill you").action,"block");assert.equal(moderateMessage("fuck you").action,"hold");
 assert.equal(moderateMessage("hello hello hello hello hello").action,"hold");assert.equal(moderateMessage("Please send the notes").action,"allow");
 assert.equal(moderateMessage("x".repeat(1501)).category,"Message length");
});
test("permission controls keep intrinsic checkbox sizing and labelled touch targets",async()=>{
 const css=await readFile(new URL('../src/components/ics/demo-workspaces.css',import.meta.url),'utf8');
 const source=await readFile(new URL('../src/components/ics/chatrooms-workspace.tsx',import.meta.url),'utf8');
 const intrinsicRule=css.match(/\.chat-permissions-panel input:is\([\s\S]*?\{([^}]+)\}/)?.[1];
 assert.ok(intrinsicRule);
 for(const declaration of ['width:18px','height:18px','min-width:18px','min-height:18px','padding:0','flex:none'])assert.ok(intrinsicRule.includes(declaration));
 assert.match(css,/\.chat-permission-toggle\s*\{[^}]*min-width:44px;[^}]*min-height:44px;/);
 assert.match(source,/<label className="chat-permission-toggle"><input type="checkbox" aria-label=/);
});
