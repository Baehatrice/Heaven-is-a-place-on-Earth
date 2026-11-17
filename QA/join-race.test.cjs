'use strict';
const assert=require('node:assert/strict');
const http=require('node:http'),net=require('node:net'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'heaven-join-race-'));
let server,base,cookie='',checks=0;
const heldRequests=new Set();
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function ok(value,message){assert(value,message);checks++;}
async function request(route,data,token){
 const response=await fetch(base+route,{method:data?'POST':'GET',headers:{'Content-Type':'application/json',Cookie:cookie,...(token?{Authorization:'Bearer '+token}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(5000)});
 return {status:response.status,value:await response.json(),cookie:response.headers.get('set-cookie')};
}
const action=(type)=>request('/api/admin/action',{type});
function holdJoin(name){
 const body=JSON.stringify({name});let resolve,reject,readyResolve,readyReject;
 const done=new Promise((yes,no)=>{resolve=yes;reject=no;});done.catch(()=>{});
 const ready=new Promise((yes,no)=>{readyResolve=yes;readyReject=no;});
 const req=http.request(base+'/api/join',{method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body),Expect:'100-continue'}},res=>{
  let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>{heldRequests.delete(req);try{resolve({status:res.statusCode,value:JSON.parse(text)});}catch(e){reject(e);}});
 });
 heldRequests.add(req);req.on('error',e=>{readyReject(e);reject(e);});req.setTimeout(10000,()=>req.destroy(Error('held join timeout')));
 req.once('continue',()=>{req.write(body.slice(0,1));readyResolve();});req.flushHeaders();
 return {ready,finish:()=>req.end(body.slice(1)),done};
}
async function boot(){
 const probe=net.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));base='http://127.0.0.1:'+port;
 server=spawn(process.execPath,['server/server.cjs'],{cwd:root,env:{...process.env,HOST:'127.0.0.1',PORT:String(port),HEAVEN_DATA_DIR:dir,HEAVEN_ADMIN_PASSWORD:'join-race-test',HEAVEN_TRUST_PROXY:'0'},stdio:['ignore','pipe','pipe']});server.stderr.on('data',chunk=>process.stderr.write(chunk));
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('startup timeout')),5000);server.stdout.once('data',()=>{clearTimeout(timer);resolve();});server.once('error',e=>{clearTimeout(timer);reject(e);});server.once('exit',code=>{clearTimeout(timer);reject(Error('server exited: '+code));});});
 cookie=(await request('/api/admin/login',{password:'join-race-test'})).cookie.split(';')[0];
}
(async()=>{try{
 await boot();
 const joins=Array.from({length:9},(_,i)=>holdJoin('simultaneous-'+i));await Promise.all(joins.map(j=>j.ready));joins.forEach(j=>j.finish());const responses=await Promise.all(joins.map(j=>j.done));
 ok(responses.filter(r=>r.status===200).length===8,'exactly eight overlapping joins accepted');
 ok(responses.filter(r=>r.status===409).length===1,'ninth overlapping join rejected');
 ok((await request('/api/admin/state')).value.players.length===8,'roster never exceeds eight');
 await action('reset');
 const first=(await request('/api/join',{name:'first'})).value;
 const round=(await request('/api/admin/state')).value.round;
 const late=holdJoin('slow-player');await late.ready;
 ok((await action('start')).status===200,'approve existing participant');
 ok((await request('/api/action',{type:'instructionsRead',id:'read',round},first.token)).status===200,'existing participant confirms');
 ok((await action('begin')).status===200,'countdown starts while old join body is incomplete');
 late.finish();ok((await late.done).status===400,'join completing after countdown starts rejected');
 ok((await request('/api/admin/state')).value.players.length===1,'late request cannot add a participant without an engine');
 await sleep(4300);const me=(await request('/api/me',null,first.token)).value;
 ok(me.room.phase==='running'&&me.player.scene==='office'&&!!me.game,'accepted participant has a working game');
 await action('reset');const duplicates=[holdJoin('same-name'),holdJoin('same-name')];await Promise.all(duplicates.map(j=>j.ready));duplicates.forEach(j=>j.finish());const duplicateResults=await Promise.all(duplicates.map(j=>j.done));
 ok(duplicateResults.filter(r=>r.status===200).length===1&&duplicateResults.filter(r=>r.status===400).length===1,'overlapping duplicate names remain rejected');
 console.log('PASS '+checks+' concurrent join assertions');
 }finally{for(const req of heldRequests)req.destroy();if(server&&server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill();});}
})().catch(e=>{console.error(e);process.exitCode=1;});
