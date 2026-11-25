import test from 'node:test';
import assert from 'node:assert/strict';
// Node 24 runs the TypeScript source directly.
// @ts-expect-error Node uses the source extension at runtime.
import {normalizeDays} from '../lib/phone/usage.ts';
const day=new Date(Date.now()-3*86400000).toISOString().slice(0,10);
function sample(){return {day,timezone:'America/Argentina/Buenos_Aires',complete:true,observed_until:day+'T23:59:00Z',payload:{total:60000,sessions:2,notifications:null,hours:Array.from({length:24},(_,i)=>i===15?60000:0),apps:[{id:'com.example',name:'Example',ms:60000}]}};}
test('keeps zero usage distinct from missing and notifications optional',()=>{const row=sample();row.payload.total=0;row.payload.hours.fill(0);row.payload.apps=[];row.payload.sessions=0;assert.equal(normalizeDays({days:[row]})[0].payload.total,0);assert.equal(normalizeDays({days:[row]})[0].payload.notifications,null);});
test('imports an observed day with consistent totals',()=>{const actual=normalizeDays({days:[sample()]})[0];assert.equal(actual.payload.total,60000);assert.equal(actual.day,day);});
test('rejects malformed values, duplicate dates, inconsistent totals and timezones',()=>{for(const edit of [(d:any)=>d.payload.total=-1,(d:any)=>d.payload.hours.pop(),(d:any)=>d.payload.apps[0].ms=200,(d:any)=>d.day='2026-02-30',(d:any)=>d.timezone='unknown/zone',(d:any)=>d.complete='true',(d:any)=>d.payload.sessions='2']){const row=sample();edit(row);assert.throws(()=>normalizeDays({days:[row]}));}assert.throws(()=>normalizeDays({days:[sample(),sample()]}));});
test('never invents days or accepts an oversized batch',()=>{assert.throws(()=>normalizeDays({days:[]}));assert.throws(()=>normalizeDays({days:Array(32).fill(sample())}));});
