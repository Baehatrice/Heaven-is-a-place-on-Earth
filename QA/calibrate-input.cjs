const fs=require('fs');const data=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const buckets={},reading=[];const median=a=>{a=[...a].sort((a,b)=>a-b);return a.length?(a[Math.floor(a.length/2)]+a[Math.floor((a.length-1)/2)])/2:null};
for(const run of data.runs){const ev=run.events;if(Math.max(...ev.map(e=>e.state?.elapsed||0))<299)continue;let prev=null,between=[],opened=null;
 for(const e of ev){if(e.type==='tree_open')opened=e;if(e.type==='skill_purchase'&&opened){reading.push(e.state.elapsed-opened.state.elapsed);opened=null;}
 if(e.type==='send'&&!e.automatic){if(prev){const sk=e.state.skills,ps=prev.state.skills;const blocked=between.some(x=>['tree_open','search_start','skill_purchase','input_error'].includes(x.type));if(!blocked&&JSON.stringify(sk)===JSON.stringify(ps)){const gap=e.state.elapsed-prev.state.elapsed;const wait=[3.2,1.9,.9,.35,.1][ps.speed||0];const residual=gap-wait;if(residual>0&&residual<30){const key=sk.transfer?'linked':sk.template?'template':sk.split?'split':sk.copy?'copy':'manual';(buckets[key]??=[]).push(residual);}}}prev=e;between=[];}else between.push(e);}
}
console.log(JSON.stringify({method:'Consecutive manual sends, same skills; exclude tree/search/purchase/input-error intervals. Subtract programmed transmission delay. Includes interaction/decision time, not pure typing.',stages:Object.fromEntries(Object.entries(buckets).map(([k,a])=>[k,{n:a.length,medianSeconds:+median(a).toFixed(3)}])),reading:{n:reading.length,medianSeconds:+median(reading).toFixed(3)}},null,2));

