import {test} from "node:test";
import assert from "node:assert/strict";
import {normalizeHexColor} from "../src/components/ics/color-picker-model.mjs";
import {positionPicker} from "../src/components/ics/picker-position.mjs";
test("custom color parser accepts six digit hex and rejects malformed or non-hex values",()=>{
 assert.equal(normalizeHexColor("#7896FF"),"#7896ff");
 for(const value of ["blue","#fff","#12345678","123456","#12gg56",""])assert.equal(normalizeHexColor(value),null);
});
test("a color editor near the right edge stays inside narrow visual viewports and above the dock",()=>{
 for(const viewportWidth of [320,360,390,430]){
  const viewportLeft=8,viewportTop=12,pickerWidth=270,pickerHeight=220,dockTop=640;
  const position=positionPicker({viewportLeft,viewportTop,viewportWidth,viewportHeight:740,pickerWidth,pickerHeight,trigger:{top:540,bottom:576},mobile:true,dockTop});
  assert.ok(position.left>=viewportLeft+12);
  assert.ok(position.left+pickerWidth<=viewportLeft+viewportWidth-12);
  assert.ok(position.top>=viewportTop+12);
  assert.ok(position.top+pickerHeight<=dockTop-10);
 }
});
