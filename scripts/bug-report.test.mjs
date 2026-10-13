import {test} from "node:test";
import assert from "node:assert/strict";
import {validateBugReport} from "../src/components/ics/bug-report-model.mjs";
const valid={title:"Search focus moves",happened:"Focus leaves the search field.",expected:"Focus should stay in search.",category:"Accessibility",steps:"Open page and press Ctrl K."};
test("bug report requires short descriptions and valid category",()=>{assert.deepEqual(validateBugReport(valid),{});assert.ok(validateBugReport({...valid,title:"x"}).title);assert.ok(validateBugReport({...valid,category:"Credentials"}).category);});
test("bug report attachment accepts only bounded image metadata",()=>{assert.deepEqual(validateBugReport({...valid,attachment:{type:"image/png",size:1024}}),{});assert.ok(validateBugReport({...valid,attachment:{type:"image/svg+xml",size:10}}).attachment);assert.ok(validateBugReport({...valid,attachment:{type:"image/png",size:5_000_001}}).attachment);});
