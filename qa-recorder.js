/* Local-only human QA recordings; no network requests or recipient text. */
(() => {
 if(location.protocol!=='file:'){window.HeavenQA={paused:false,start(){},event(kind,data={}){if(['field_edit','copy','tab_open','tree_open','tree_close'].includes(kind))window.HeavenNet?.command({type:'telemetry',kind,field:data.field,seconds:data.seconds,inputs:data.inputs,pastes:data.pastes});},sample(){}};return;}
 const KEY='heaven-qa-v1';let runs=[],run=null,getState=null,lastSave=0,lastSample=-1,storageOK=true;
 try{runs=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(runs))runs=[];}catch{storageOK=false;}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(runs));storageOK=true;}catch{storageOK=false;}lastSave=Date.now();}
 function event(type,data={}){if(!run)return;run.events.push({seq:run.events.length,wallMs:Date.now()-Date.parse(run.startedAt),type,...data,state:getState()});if(type!=='sample'||Date.now()-lastSave>5000)save();}
 function download(){event('export');const blob=new Blob([JSON.stringify({schema:1,exportedAt:new Date().toISOString(),runs},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='heaven-qa-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
 function reset(){
  if(!confirm('저장된 모든 QA 기록과 메모를 삭제할까요? 현재 게임 진행은 유지되며, 지금부터 새 기록을 남깁니다.'))return;
  const config=run?.config;
  runs=[];run=null;lastSample=-1;
  if(getState&&config){run={id:crypto.randomUUID(),startedAt:new Date().toISOString(),config,resetDuringPlay:true,events:[]};runs.push(run);event('session_start',{reason:'qa_reset'});}else save();
  document.getElementById('qa-note').value='';
  document.getElementById('qa-status').textContent=storageOK?'이전 QA 기록을 지웠습니다. 현재 상태부터 새로 기록합니다.':'기록은 초기화했지만 브라우저 저장에 실패했습니다. 기록 파일을 다운로드하세요.';
 }
 function panel(){let d=document.getElementById('qa-panel');if(!d){d=document.createElement('dialog');d.id='qa-panel';d.innerHTML='<h2>QA 플레이 기록</h2><p id="qa-status"></p><label>이번 플레이 메모<textarea id="qa-note" rows="3" placeholder="시험한 스킬 경로, 막힌 부분, 체감 속도 등"></textarea></label><p><button id="qa-save-note">메모 남기기</button> <button id="qa-download">전체 기록 다운로드</button> <button id="qa-reset">전체 기록 초기화</button> <button id="qa-close">닫기</button></p><small>최근 10회 기록을 이 브라우저에 저장합니다. QA 후 파일을 다운로드해 주세요.</small>';document.body.append(d);d.querySelector('#qa-close').onclick=()=>d.close();d.querySelector('#qa-download').onclick=download;d.querySelector('#qa-reset').onclick=reset;d.querySelector('#qa-save-note').onclick=()=>{const t=d.querySelector('textarea');if(t.value.trim()){event('note',{text:t.value.trim()});t.value='';d.querySelector('#qa-status').textContent='메모를 저장했습니다.';}};}d.querySelector('#qa-status').textContent=(storageOK?'브라우저에 자동 저장 중':'브라우저 저장 불가 — 창을 닫기 전에 다운로드하세요')+' · '+runs.length+'회 기록';d.showModal();}
 window.HeavenQA={paused:false,start(snapshot,config){window.HeavenQA.paused=false;document.body.classList.remove('qa-paused');getState=snapshot;run={id:crypto.randomUUID(),startedAt:new Date().toISOString(),config,events:[]};runs.push(run);runs=runs.slice(-10);lastSample=-1;event('session_start');document.getElementById('qa-open')?.remove();const b=document.createElement('button');b.id='qa-open';b.textContent='QA 기록 · 다운로드';b.onclick=panel;document.body.append(b);document.getElementById('qa-pause')?.remove();const pause=document.createElement('button');pause.id='qa-pause';pause.textContent='QA 일시정지';pause.onclick=()=>{window.HeavenQA.paused=!window.HeavenQA.paused;document.body.classList.toggle('qa-paused',window.HeavenQA.paused);pause.textContent=window.HeavenQA.paused?'▶ QA 계속하기':'Ⅱ QA 일시정지';event(window.HeavenQA.paused?'qa_pause':'qa_resume');};document.body.append(pause);},event,sample(){if(!run)return;const second=Math.floor(getState().elapsed);if(second!==lastSample){lastSample=second;event('sample');}},download};
 addEventListener('pagehide',()=>event('page_leave'));
 document.addEventListener('visibilitychange',()=>event(document.hidden?'tab_hidden':'tab_visible'));
})();
