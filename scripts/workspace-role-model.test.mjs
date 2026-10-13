import {test} from "node:test";
import assert from "node:assert/strict";
import {parseWorkspaceRole,workspaceRoleLanding,DEMO_IDENTITIES,roleForDemoIdentity} from "../src/components/ics/workspace-role-model.ts";
import {roleFeatures,workspaceCommands} from "../src/components/ics/workspace-roles.ts";
test("role preview recognizes only the five agreed roles and routes each to its workspace",()=>{
 assert.deepEqual(["platform-owner","admin","manager","teacher","student"].map(value=>workspaceRoleLanding(parseWorkspaceRole(value))),["/developer","/","/","/teacher-dashboard","/student-portal"]);
 assert.equal(parseWorkspaceRole("unknown"),"admin");
});
test("demo Student A and Student B have distinct identities under the same role",()=>{
 const a=DEMO_IDENTITIES.find(item=>item.id==="demo-student-a"),b=DEMO_IDENTITIES.find(item=>item.id==="demo-student-b");
 assert.ok(a&&b);assert.notEqual(a.id,b.id);assert.equal(roleForDemoIdentity(a.id),"student");assert.equal(roleForDemoIdentity(b.id),"student");
});
test("command registry contains only each role's available pages and the shared safe bug action is presented separately",()=>{
 const student=workspaceCommands("student");assert.ok(student.every(item=>item.href==="/settings"||item.href==="/chatrooms"||item.href.startsWith("/student-portal")));
 const teacher=workspaceCommands("teacher");assert.ok(teacher.some(item=>item.href==="/attendance"));assert.ok(!teacher.some(item=>["/fees","/staff","/ledger"].includes(item.href)));
 const owner=roleFeatures("platform-owner");assert.ok(owner.some(item=>item.href==="/developer#chat-moderation"));assert.ok(owner.every(item=>!item.href?.startsWith("/students")&&!item.href?.startsWith("/fees")));
 assert.ok(owner.some(item=>item.href==="/settings"));
 assert.ok(roleFeatures("teacher").some(item=>item.href==="/settings"));
});
