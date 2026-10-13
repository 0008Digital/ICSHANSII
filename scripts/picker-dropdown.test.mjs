import {test} from "node:test";
import assert from "node:assert/strict";
import {edgeEnabledIndex,findEnabledPrefix,nextEnabledIndex} from "../src/components/ics/choice-select-model.mjs";
import {positionPicker} from "../src/components/ics/picker-position.mjs";

const options=[{label:"All",disabled:true},{label:"Active"},{label:"Pending",disabled:true},{label:"Expired"}];
test("dropdown keyboard movement skips disabled choices and supports Home, End and typeahead",()=>{
 assert.equal(nextEnabledIndex(options,1,1),3);
 assert.equal(nextEnabledIndex(options,3,1),1);
 assert.equal(nextEnabledIndex(options,3,-1),1);
 assert.equal(edgeEnabledIndex(options,"start"),1);
 assert.equal(edgeEnabledIndex(options,"end"),3);
 assert.equal(findEnabledPrefix(options,"ex"),3);
 assert.equal(findEnabledPrefix(options,"al"),-1);
});

test("desktop dropdown centers within workspace and stays below its trigger when space allows",()=>{
 const result=positionPicker({viewportWidth:1280,viewportHeight:800,pickerWidth:330,pickerHeight:320,trigger:{top:356,bottom:400},mainLeft:240,mainRight:1280});
 assert.deepEqual(result,{left:589,top:406,lower:788});
});

test("mobile dropdown remains inside narrow viewport and above the floating dock",()=>{
 const result=positionPicker({viewportWidth:320,viewportHeight:720,pickerWidth:296,pickerHeight:470,trigger:{top:540,bottom:584},mobile:true,dockTop:620});
 assert.equal(result.left,12);
 assert.equal(result.top,64);
 assert.ok(result.left>=0&&result.left+296<=320);
 assert.ok(result.top+470<=result.lower);
});

test("short viewports prefer the space above a trigger when the dock limits space below",()=>{
 const result=positionPicker({viewportWidth:390,viewportHeight:550,pickerWidth:330,pickerHeight:320,trigger:{top:440,bottom:480},mobile:true,dockTop:510});
 assert.equal(result.top,114);
 assert.ok(result.top+320<=result.lower);
});
