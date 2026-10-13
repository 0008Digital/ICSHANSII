import {test} from "node:test";
import assert from "node:assert/strict";
import {lockDocumentScroll} from "../src/components/ics/document-scroll-lock.mjs";

function fixture({overflow="",padding="",gutter="stable",gap=16}={}) {
 const properties=new Map();
 if(overflow)properties.set("overflow",[overflow,"important"]);
 if(padding)properties.set("padding-right",[padding,""]);
 const style={getPropertyValue:name=>properties.get(name)?.[0]??"",getPropertyPriority:name=>properties.get(name)?.[1]??"",setProperty:(name,value,priority="")=>properties.set(name,[value,priority]),removeProperty:name=>properties.delete(name)};
 const doc={documentElement:{style,clientWidth:1000}};
 const win={innerWidth:1000+gap,getComputedStyle:()=>({scrollbarGutter:gutter,paddingRight:padding||"0px"})};
 return {doc,win,style};
}

test("nested modal locks preserve the gutter and release only after the final dialog",()=>{
 const {doc,win,style}=fixture();
 const outer=lockDocumentScroll(doc,win),inner=lockDocumentScroll(doc,win);
 assert.equal(style.getPropertyValue("overflow"),"hidden");
 assert.equal(style.getPropertyValue("padding-right"),"");
 outer();outer();
 assert.equal(style.getPropertyValue("overflow"),"hidden");
 inner();
 assert.equal(style.getPropertyValue("overflow"),"");
});

test("scroll lock restores existing inline overflow, priority and compensated padding",()=>{
 const {doc,win,style}=fixture({overflow:"auto",padding:"3px",gutter:"auto"});
 const unlock=lockDocumentScroll(doc,win);
 assert.equal(style.getPropertyValue("padding-right"),"19px");
 unlock();
 assert.equal(style.getPropertyValue("overflow"),"auto");
 assert.equal(style.getPropertyPriority("overflow"),"important");
 assert.equal(style.getPropertyValue("padding-right"),"3px");
});

test("separate documents do not share lock ownership",()=>{
 const first=fixture(),second=fixture();
 const unlockFirst=lockDocumentScroll(first.doc,first.win),unlockSecond=lockDocumentScroll(second.doc,second.win);
 unlockFirst();
 assert.equal(first.style.getPropertyValue("overflow"),"");
 assert.equal(second.style.getPropertyValue("overflow"),"hidden");
 unlockSecond();
});
