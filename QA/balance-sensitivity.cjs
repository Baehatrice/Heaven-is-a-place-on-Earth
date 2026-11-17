const fs=require('fs'),path=require('path');
const base=__dirname;
const {simulate,profiles}=require(base+'/balance-core.cjs');
const paths=require(base+'/balance-paths.cjs');
const cfg=require(base+'/balance-delivery-7.json');
const rows=[];
for(const read of [4,10,15]){profiles.sensitivity={scale:1.45,read,initial:18,error:.09};for(const strategy of ['batch','hybrid']){const runs=Array.from({length:50},(_,i)=>simulate(cfg,'sensitivity',paths[strategy],600,i+101));const scores=runs.map(x=>x.score).sort((a,b)=>a-b);rows.push({readSeconds:read,strategy,score:scores[25],p10:scores[5],p90:scores[45],completed:runs.filter(x=>x.complete).length+'/50',errors:Math.max(...runs.map(x=>x.errors))});}}
fs.writeFileSync(path.join(__dirname,'sensitivity-results.json'),JSON.stringify(rows,null,2));console.table(rows);
