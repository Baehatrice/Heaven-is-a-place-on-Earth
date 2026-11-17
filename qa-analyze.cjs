// node qa-analyze.cjs <export.json> [more exports...]
const fs=require('node:fs');
if(process.argv.length<3){console.error('Usage: node qa-analyze.cjs <heaven-qa.json>');process.exit(1);}
let bad=false;
for(const file of process.argv.slice(2)){
 const data=JSON.parse(fs.readFileSync(file,'utf8'));if(data.schema!==1)throw Error('Unsupported schema');
 for(const run of data.runs){let balance=run.events[0]?.state.points||0,success=0,failed=0,search=0,training=0,empty=0,opportunity=0,last=null;const issues=[],path=[],sentIds=new Set(),paidIds=new Set(),settledIds=new Set(),jobs=new Map();
 for(const e of run.events){const state=e.state;
 if(e.type==='send'&&e.recipientIds){for(const id of e.recipientIds){if(sentIds.has(id))issues.push('Recipient dispatched twice: '+id);sentIds.add(id);}jobs.set(e.jobId,e.recipientIds);}
 if(e.type==='retry_scheduled'&&e.recipientIds)jobs.set(e.jobId,e.recipientIds);
 if(e.type==='delivery'&&e.jobId){if(settledIds.has(e.jobId))issues.push('Job settled twice: '+e.jobId);settledIds.add(e.jobId);const ids=e.passedIds||[];if(ids.length!==e.passed)issues.push('Recipient success count mismatch');for(const id of ids){if(paidIds.has(id))issues.push('Recipient rewarded twice: '+id);paidIds.add(id);}if(jobs.has(e.jobId)&&JSON.stringify([...(e.passedIds||[]),...(e.failedIds||[])].sort())!==JSON.stringify([...jobs.get(e.jobId)].sort()))issues.push('Job recipient mismatch: '+e.jobId);}

 if(e.type==='skill_purchase'){balance-=e.paid;const k=run.config.skills.find(k=>k.id===e.skill);const complete=id=>(state.skills[id]||0)>=(run.config.requireMaxPrerequisites?run.config.skills.find(x=>x.id===id).max:1);if(!k||!k.req.every(complete)||(k.anyReq&&!k.anyReq.some(complete))||(run.config.exclusivePairs||[]).some(pair=>pair.includes(e.skill)&&pair.some(id=>id!==e.skill&&state.skills[id]>0)))issues.push('Invalid prerequisite: '+e.skill);if(k&&e.paid!==(k.prices?.[state.skills[k.id]||0]??Math.ceil(k.cost*2.6**(state.skills[k.id]||0))))issues.push('Invalid price: '+e.skill);}
 if(e.type==='training_cancel')balance+=e.refund;
 if(e.type==='delivery'){balance+=e.reward;success+=e.passed;failed+=e.failed;if(e.passed+e.failed!==e.count)issues.push('Delivery count mismatch');}
 if(balance!==state.points)issues.push('Balance mismatch at event '+e.seq);
 if(state.points<0||state.roster<0||state.roster>state.storage)issues.push('Invalid resource bounds at '+e.seq);
 if(e.type==='skill_unlocked')path.push({seconds:state.elapsed,skill:e.skill,rank:e.rank});
 if(e.type==='sample'){if(last){const dt=Math.max(0,state.elapsed-last.elapsed);if(last.searching)search+=dt;if(last.training)training+=dt;if(!last.roster)empty+=dt;if(last.affordable.length)opportunity+=dt;}last=state;}
 }
 const final=run.events.at(-1)?.state||{};bad||=issues.length>0;
 console.log(JSON.stringify({file,session:run.id,version:run.config.version,seconds:final.elapsed,earned:final.earned-(run.events[0]?.state.earned||0),gracePerMinute:(final.elapsed-(run.events[0]?.state.elapsed||0))>0?+((final.earned-(run.events[0]?.state.earned||0))/(final.elapsed-(run.events[0]?.state.elapsed||0))*60).toFixed(2):0,remaining:final.points,delivered:success,failedAttempts:failed,inputErrors:run.events.filter(e=>e.type==='input_error').length,approxSeconds:{search,training,emptyRoster:empty,skillAffordable:opportunity},skillPath:path,notes:run.events.filter(e=>e.type==='note').map(e=>e.text),checks:issues.length?issues:'PASS'},null,2));
 }
}
process.exitCode=bad?2:0;
