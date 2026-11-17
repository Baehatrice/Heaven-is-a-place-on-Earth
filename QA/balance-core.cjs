const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync(require('path').join(__dirname,'../mail-game.js'),'utf8');
function engine(config,seed=1){let clock=0,rng=seed>>>0;const elements=new Map(),events=[];const element=()=>({value:'',textContent:'',innerHTML:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},children:[],querySelector(){return element()},querySelectorAll(){return[]},append(){},prepend(){},remove(){},showModal(){},close(){},matches(){return false},setAttribute(){}});const el=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
 const context={console,Math:Object.assign(Object.create(Math),{random(){rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296}}),performance:{now:()=>clock},matchMedia:()=>({matches:true}),document:{hidden:false,addEventListener(){},getElementById:el,createElement:element},window:{},clearInterval(){},setTimeout(){},innerWidth:1280,innerHeight:720};
 context.window.HeavenQA={sample(){},event(type,data){events.push({type,...data})}};
 let code=source.replace("const cost=k=>Math.ceil(k.cost*Math.pow(2.6,level(k.id)));","const cost=k=>k.prices?.[level(k.id)]??Math.ceil(k.cost*Math.pow(2.6,level(k.id)));");
 if(config?.jackpot!==2)code=code.replace('const jackpot=++s.deliveries%12===0','const jackpot=gameRandom()<.07').replace('(jackpot?2:1)','(jackpot?5:1)');
 // Only presentation is stubbed. send, tick, learn, rewards, refill and validation are production code.
 const init=source.match(/s=\{name,.*?\};/)[0];
 code=code.replace('window.HeavenMail={start};',`window.core={init(config){const name='bot',options={seed:config.testSeed};${init} s.rngState=s.rngSeed;s.duration=10000;s.started=true;s.tutorialSeen=true;root=document.createElement('div');for(const k of SKILLS){if(config?.[k.id])Object.assign(k,config[k.id]);}render=renderList=updateTree=message=sfx=transmissionSound=emit=celebrate=delivery=collectGrace=burst=trainingFX=raiseFX=showMailFailure=()=>{};checkFirstSkill=()=>false;inputWarning=(reason)=>{s.errors=(s.errors||0)+1;};last=performance.now();},step(){tick()},state(){return {t:s.elapsed,points:s.points,earned:s.earned,score:s.total,book:[...s.book],skills:{...s.skills},jobs:s.jobs.map(j=>({...j})),training:s.training&&{...s.training},searching:s.searching&&{...s.searching},cap:capacity(),storage:storageLimit(),errors:s.errors||0,selected:[...s.selected]};},patch(data){Object.assign(s,data)},eligible(id){const k=SKILLS.find(k=>k.id===id);return level(id)<k.max&&eligible(k)},price(id){return cost(SKILLS.find(k=>k.id===id))},learn(id){learn(SKILLS.find(k=>k.id===id))},search(){startSearch()},prepare(ids){s.selected=ids;$('mg-address').value=ids.map(address).join(', ');$('mg-body').value=BODY;},send(){send()},skills:SKILLS};`);
 vm.runInNewContext(code,context);const core=context.window.core;core.init({...config,testSeed:seed});return{core,events,step(dt=.1){clock+=dt*1000;core.step()}};
}
const profiles={expert:{scale:.65,read:.7,initial:2,error:.01},observed:{scale:1,read:2.57,initial:6,error:.04},novice:{scale:1.45,read:7,initial:18,error:.09}};
function simulate(config,profile,path,seconds,seed=1){const e=engine(config,seed),c=e.core,P=profiles[profile];let action=null,at=0,first=null,complete=null,trace=[],ranks=0,searchTime=0,emptyTime=0;let inputRng=seed*17;const rand=()=>{inputRng=(Math.imul(inputRng,1664525)+1013904223)>>>0;return inputRng/4294967296};action={kind:'idle',left:P.initial};
 for(let n=0;n<seconds*10;n++){e.step();const s=c.state();if(at>=path.length&&!s.training)complete??=s.t;if(s.searching){searchTime+=.1;continue}if(s.training)continue;if(!s.book.length)emptyTime+=.1;
 if(action){action.left-=.1;if(action.left>0)continue;const a=action;action=null;if(a.kind==='read'){const before=c.state().points;c.learn(a.id);if(c.state().points<before){at++;ranks++;trace.push({id:a.id,t:+s.t.toFixed(1)});first??=s.t;}continue;}if(a.kind==='input'){c.send();continue;}}
 if(s.jobs.some(j=>!j.auto))continue;
 const id=path[at];if(id&&c.eligible(id)&&s.points>=c.price(id)){action={kind:'read',id,left:P.read};continue;}
 if(!s.skills.autoseek&&s.book.length<=Math.max(2,Math.min(s.cap,s.storage*.3))&&!s.jobs.length){c.search();continue;}
 if(!s.book.length)continue;
 const ids=s.book.slice(0,s.cap);const k=s.skills;
 let input=k.next?.8:k.transfer?1.82:k.addresscopy?1.3:k.template?1.64:k.split?1.8:k.copy?3.6:4.4;
 if(ids.length>1)input+=(ids.length-1)*.24; // Every recipient now needs a player selection, including next.
 if(rand()<P.error)input+=3.5;
 c.prepare(ids);action={kind:'input',left:input*P.scale};
 }
 const s=c.state();return {score:s.score,earned:s.earned,remaining:s.points,first:Math.round(first||0),complete:complete?+complete.toFixed(1):null,ranks:Object.values(s.skills).reduce((a,b)=>a+b,0),errors:s.errors,searchTime:Math.round(searchTime),emptyTime:Math.round(emptyTime),trace};
}
function suite(config,strategies,seeds=30){const rows=[];for(const profile of Object.keys(profiles))for(const seconds of [300,600])for(const[strategy,path]of Object.entries(strategies)){const runs=Array.from({length:seeds},(_,i)=>simulate(config,profile,path,seconds,i+1));const sorted=key=>runs.map(r=>r[key]).sort((a,b)=>a-b),median=key=>sorted(key)[Math.floor(seeds/2)],completed=runs.filter(r=>r.complete).sort((a,b)=>a.complete-b.complete);rows.push({profile,seconds,strategy,score:median('score'),p10:sorted('score')[Math.floor(seeds*.1)],p90:sorted('score')[Math.floor(seeds*.9)],ranks:median('ranks'),completed:completed.length+'/'+seeds,completeMedian:completed[Math.floor(completed.length/2)]?.complete||null,errors:Math.max(...runs.map(r=>r.errors)),first:median('first')});}return rows;}
module.exports={engine,simulate,suite,profiles};
if(require.main===module){const config=JSON.parse(fs.readFileSync(process.argv[2]||require('path').join(__dirname,'balance-delivery-7.json'),'utf8'));const strategies=require('./balance-paths.cjs');const rows=suite(config,strategies,Number(process.argv[3])||20);fs.writeFileSync(process.argv[4]||require('path').join(__dirname,'simulation-latest.json'),JSON.stringify(rows,null,2));console.table(rows);}

