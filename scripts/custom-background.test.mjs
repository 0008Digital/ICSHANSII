import {test} from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_CUSTOM,parseCustomBackground,validateWallpaper,storageMessage} from "../src/components/ics/appearance/custom-background.ts";
import {wallpaperTransaction} from "../src/components/ics/appearance/wallpaper-storage.ts";
import {createThemeStore,APPEARANCE_STORAGE_KEY} from "../src/app/theme-preference.ts";
test("custom settings reject executable CSS and invalid URLs and clamp resource controls",()=>{
 const value=parseCustomBackground({type:"url",mediaId:"https://example.com/a",colors:["url(https://example.com)","#ff0088","red"],speed:100,dim:-1,blur:Infinity,fit:"stretch",position:"left"});
 assert.equal(value.type,"gradient");assert.equal(value.mediaId,"");assert.deepEqual(value.colors,[DEFAULT_CUSTOM.colors[0],"#ff0088",DEFAULT_CUSTOM.colors[2]]);assert.equal(value.speed,2);assert.equal(value.dim,0);assert.equal(value.blur,0);assert.equal(value.fit,"cover");assert.equal(value.position,"center");
});
test("accepted media signatures match their MIME types",async()=>{
 const entries=[["image/jpeg",[255,216,255,224]],["image/png",[137,80,78,71,13,10,26,10]],["image/webp",[82,73,70,70,0,0,0,0,87,69,66,80]],["video/mp4",[0,0,0,20,102,116,121,112,105,115,111,109]],["video/webm",[26,69,223,163]]];
 for(const [type,bytes] of entries)assert.equal(await validateWallpaper(new Blob([new Uint8Array(bytes)],{type})),type.startsWith("image")?"image":"video");
 await assert.rejects(validateWallpaper(new Blob(["bad png"],{type:"image/png"})),/contents/);
 await assert.rejects(validateWallpaper(new Blob(["<svg/>"],{type:"image/svg+xml"})),/Choose/);
 await assert.rejects(validateWallpaper(new Blob([],{type:"video/mp4"})),/60 MB/);
 await assert.rejects(validateWallpaper({type:"image/jpeg",size:21*1024*1024}),/20 MB/);
 await assert.rejects(validateWallpaper({type:"video/mp4",size:61*1024*1024}),/60 MB/);
});
test("custom metadata persists without media bytes",()=>{
 const values=new Map();const browser={localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)},addEventListener(){},removeEventListener(){}};
 const store=createThemeStore(browser);const custom={...DEFAULT_CUSTOM,type:"video",mediaId:"01234567-89ab-4cde-8f01-23456789abcd",speed:1.5};
 assert.equal(store.update({scene:"custom",custom}),true);assert.deepEqual(createThemeStore(browser).getSettingsSnapshot().custom,custom);assert.equal(createThemeStore(browser).getSettingsSnapshot().scene,"custom");
 const saved=values.get(APPEARANCE_STORAGE_KEY);assert.ok(saved.length<1000);assert.equal(saved.includes("data:"),false);assert.equal(saved.includes("blob:"),false);
});
test("storage denial is reported while ordinary preferences remain usable in memory",async()=>{
 const browser={localStorage:{getItem(){return null;},setItem(){throw new DOMException("full","QuotaExceededError");}},addEventListener(){},removeEventListener(){}};
 const store=createThemeStore(browser);assert.equal(store.update({preference:"dark"}),false);assert.equal(store.getSnapshot(),"dark");
 await assert.rejects(wallpaperTransaction("readonly",()=>{},undefined),/unavailable/);
 await assert.rejects(wallpaperTransaction("readwrite",()=>{},{open(){throw new DOMException("full","QuotaExceededError");}}),{name:"QuotaExceededError"});
 assert.match(storageMessage(new DOMException("full","QuotaExceededError")),/storage is full/);assert.match(storageMessage(new Error("blocked")),/previous saved wallpaper/);
});

test("failed preference writes cannot replace previously saved media metadata",()=>{
 const old=JSON.stringify({scene:"custom",custom:{...DEFAULT_CUSTOM,type:"image",mediaId:"01234567-89ab-4cde-8f01-23456789abcd"}});
 const values=new Map([[APPEARANCE_STORAGE_KEY,old]]);
 const browser={localStorage:{getItem:key=>values.get(key)??null,setItem(key,value){if(key!==APPEARANCE_STORAGE_KEY)throw new Error("blocked");values.set(key,value);}},addEventListener(){},removeEventListener(){}};
 assert.equal(createThemeStore(browser).update({custom:DEFAULT_CUSTOM}),false);
 assert.equal(values.get(APPEARANCE_STORAGE_KEY),old);
});
