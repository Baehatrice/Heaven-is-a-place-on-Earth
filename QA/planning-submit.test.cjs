'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),os=require('node:os');
const source=fs.readFileSync(path.join(__dirname,'../planning.js'),'utf8');
const submit=source.slice(source.indexOf('async function submitReport('),source.indexOf('function setMode('));
let checks=0;const ok=(v,msg)=>{assert(v,msg);checks++;};
function client(api){
 const nodes=new Map();const $=id=>{if(!nodes.has(id))nodes.set(id,{disabled:false,hidden:true,textContent:'',scrollIntoView(){}});return nodes.get(id);};
 $('planning-form').elements={confirmed:{checked:true}};
 const storage=new Map(),calls=[];let notices=0;
 const ctx={$,console,clearTimeout,confirm:()=>true,values:()=>({title:'짧은 제목',confirmed:true}),backup:()=>storage.set('planning-draft-s','draft'),showError:async()=>{},reportNotice:()=>notices++,sessionStorage:{removeItem:k=>storage.delete(k)},window:{HeavenNet:{planning:async data=>{calls.push(data);return api(data);}}}};
 vm.createContext(ctx);vm.runInContext("let session='s',submitted=false,submitting=false,loaded=true,saveTimer,chain=Promise.resolve(),lastView={status:'writing'},lastPaused=false;"+submit,ctx);
 return {ctx,$,storage,calls,get notices(){return notices;},run:()=>vm.runInContext('submitReport({preventDefault(){}})',ctx),state:()=>vm.runInContext('({submitted,submitting})',ctx)};
}
(async()=>{
 let release;const pending=new Promise(r=>release=r);const burst=client(async()=>{await pending;return {submitted:true};});const first=burst.run();await Promise.resolve();await burst.run();ok(burst.calls.length===1,'double click sends once');release();await first;ok(burst.state().submitted&&burst.notices===1,'success confirms once');ok(!burst.storage.size,'confirmed receipt clears backup');
 const lost=client(async data=>{if(data)throw Error('response lost');return {sessionId:'s',submitted:true};});await lost.run();ok(lost.state().submitted&&lost.calls.length===2,'lost POST response reconciles with server receipt');
 let broken=true;const failed=client(async data=>{if(data&&broken)throw Error('offline');return data?{submitted:true}:{sessionId:'s',submitted:false};});await failed.run();ok(!failed.state().submitted&&!failed.$('report-fields').disabled&&!failed.$('report-submit').disabled,'failure immediately unlocks form and retry');ok(failed.storage.size===1&&!failed.$('report-submit-error').hidden,'failure preserves text and displays nearby error');broken=false;await failed.run();ok(failed.state().submitted,'retry succeeds');
 const wrong=client(async data=>{if(data)throw Error('lost');return {sessionId:'new',submitted:true};});await wrong.run();ok(!wrong.state().submitted,'another session receipt cannot confirm this report');
 const update=source.slice(source.indexOf('function update('),source.indexOf('window.HeavenPlanning='));
 const ctx=burst.ctx;ctx.load=()=>{};ctx.saveDraft=()=>Promise.resolve();ctx.Date=Date;vm.runInContext("let lastAttempt=0,version=0,savedVersion=0,revision=0;"+update,ctx);
 vm.runInContext("update({player:{name:'test'},room:{paused:false},planning:{id:'s',submitted:false,status:'writing',duration:300,elapsed:0}})",ctx);
 ok(burst.state().submitted&&burst.$('report-fields').disabled,'stale polling cannot undo confirmed submission');
 const make=require('../server/planning.cjs');
 for(const data of [{confirmed:true},{title:'짧게',proposal:'개선',confirmed:true},{inputMode:'external',external:'한 줄 보고서',confirmed:true},{inputMode:'external',external:'',confirmed:true}]){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'heaven-submit-'));try{const player={id:'a',name:'test',scene:'planning'},room={round:'r',duration:300,paused:false,players:[player]},mod=make({dataDir:dir,getRoom:()=>room});mod.start(300);mod.tick(301,false);const sessionId=mod.view(player).id;const receipt=mod.submit(player,{sessionId,data});ok(mod.report(receipt.reportId).eligible,'partial/blank/short report accepted after timer');ok(mod.submit(player,{sessionId,data}).reportId===receipt.reportId,'retry returns same report');}finally{fs.rmSync(dir,{recursive:true,force:true});}
 }
 console.log('PASS '+checks+' report submission assertions');
})().catch(e=>{console.error(e);process.exitCode=1;});
