/* Local simulation only: no email is transmitted. Skill graph is data-driven. */
(() => {
 'use strict';
 const SKILLS = [
  {id:'addresscopy',name:'이메일 주소 복사',icon:'▣',branch:0,cost:10,prices:[10],time:0,max:1,desc:'명단에 이메일 주소 복사 버튼을 추가합니다. 명단에 표시된 주소를 복사합니다.',req:['split']},
  {id:'ledger',name:'생명책 증보',icon:'▤',branch:1,row:4,cost:18,prices:[18, 30, 50],time:0,max:3,desc:'주소록 저장 한도 10 → 20 / 40 / 80명. 늘어난 빈자리는 잃은 양 찾기로 채웁니다.',req:[],anyReq:['transfer','batch']},
  {id:'seek',name:'목자의 발걸음',icon:'⌕',branch:2,row:4,cost:15,prices:[15, 25, 45],time:0,max:3,desc:'탐색 속도 향상: 기본 대비 1.67 / 3.33 / 10배. 외근 준비도 2 → 1.8 / 1.5 / 1.2초로 단축. 잔여 20% / 10% / 0명일 때 긴급 재모집 1 / 2 / 4초는 유지됩니다.',req:['expand']},
  {id:'autoseek',name:'순회 전도단',icon:'♧',branch:3,row:4,cost:110,prices:[110],time:4,max:1,desc:'빈자리를 한 명씩 자동 보충합니다. 자동 탐색 중에는 메일 업무를 계속할 수 있습니다.',req:['seek']},
  {id:'transfer',name:'선택 주소 연동',icon:'↗',branch:0,row:2,side:1,cost:35,prices:[35],time:0,max:1,desc:'명단에서 선택한 주소를 메일함에 바로 입력합니다. 한 명씩 자동 입력합니다. 다중 전도와 함께 배울 수 없습니다.',req:['addresscopy']},
  {id:'expand',name:'넓어진 시야',icon:'▣',branch:0,row:3,cost:12,prices:[12],time:0,max:1,desc:'아래 대리 천사 공간을 남기고 업무 창을 넓혀 명단을 더 많이 봅니다. 저장 한도는 생명책 증보로 늘립니다.',req:[]},
  {id:'copy', name:'복사의 은총', icon:'▣', branch:0, row:0, cost:8,prices:[8], time:0, max:1, desc:'오늘의 전도 문구에 본문 복사 버튼 생성. 붙여넣기는 직접.', req:[]},
  {id:'split', name:'두 개의 시선', icon:'◫', branch:0, row:1, cost:12,prices:[12], time:1, max:1, desc:'명단과 메일을 동시에 엽니다.', req:['copy']},
  {id:'template', name:'말씀 자동완성', icon:'¶', branch:0, row:1, side:1, cost:12,prices:[12], time:1, max:1, desc:'본문 자동 작성. 주소 입력만 남습니다.', req:['copy']},
  {id:'next', name:'다음 영혼', icon:'↪', branch:0, row:2, cost:100,prices:[100], time:3, max:1, desc:'두 경로 모두 플레이어가 최대 50명을 직접 선택하면 주소가 자동 입력됩니다. 매 발송마다 수신인을 다시 선택하세요.', req:['ledger']},
  {id:'batch', name:'다중 전도', icon:'✉', branch:1, row:0, cost:18,prices:[18, 45, 100, 200], time:0, max:4, desc:'3 / 8 / 20 / 50명을 선택하여 주소를 한꺼번에 복사합니다. 선택 주소 연동과 함께 배울 수 없습니다.', req:['addresscopy']},
  {id:'echo', name:'복음의 메아리', icon:'»', branch:1, row:2, cost:300,prices:[300, 1000, 3500], time:4, max:3, desc:'전송 1건이 2 / 4 / 8건으로 증폭. 실적·보상 모두 적용.', req:['safe','retry']},
  {id:'speed', name:'광속 회선', icon:'ϟ', branch:2, row:0, cost:10,prices:[10, 18, 24, 36], time:0, max:4, desc:'전송 대기 3.2초 → 1.9 / 0.9 / 0.35 / 0.1초.', req:[]},
  {id:'safe', name:'천사의 방화벽', icon:'♜', branch:2, row:1, cost:18,prices:[18, 32, 60], time:0, max:3, desc:'성공률 78% → 88 / 96 / 100%. 첫 3회는 기본 성공.', req:['speed']},
  {id:'retry', name:'끝까지 구원', icon:'⟳', branch:2, row:1, side:1, cost:40,prices:[40], time:2, max:1, desc:'실패 건 자동 재시도. 추가 대기 0.8초 후 모두 성공.', req:['speed']},
  {id:'combo', name:'성실의 배당', icon:'★', branch:2, row:2, cost:700,prices:[700, 2200, 6500], time:4, max:3, desc:'연속 성공 5회마다 보상 배율 증가. 최대 ×2 / ×3 / ×4.', req:['echo']},
  {id:'auto', name:'대리 천사', icon:'♧', branch:3, row:1, cost:35,prices:[35, 100, 260], time:3, max:3, desc:'전용 명단에서 5 / 2.5 / 1초마다 자동 발송. 내 주소록을 소모하지 않습니다.', req:[]},
  {id:'rapture', name:'전도 대각성', icon:'✦', branch:3, row:2, cost:2200,prices:[2200], time:8, max:1, desc:'자동 발송에도 다중 전도·메아리 적용. 긴 수련 동안 모든 업무 정지.', req:['auto']}
 ];
 const BRANCHES=['입력','전송','주소록 · 탐색','자동화'];
 const SKILL_GROUPS=[['copy','split','template','addresscopy','transfer','batch','ledger','next'],['speed','safe','retry','echo','combo'],['expand','seek','autoseek'],['auto','rapture']];
 SKILL_GROUPS.forEach((ids,branch)=>ids.forEach(id=>{SKILLS.find(k=>k.id===id).branch=branch;}));
 const $ = id => document.getElementById(id);
 let fxQueue=[], payout=null, lastFX=0;
 let s, timer, last, root, sound=false, reduced=matchMedia('(prefers-reduced-motion: reduce)').matches, audio, particles=[], frame=0;
 const fmt=n=>Math.floor(n).toLocaleString('ko-KR');
 function gameRandom(){s.rngState=(Math.imul(s.rngState,1664525)+1013904223)>>>0;return s.rngState/4294967296;}
 const level=id=>s.skills[id]||0;
 const mastered=id=>level(id)>=SKILLS.find(k=>k.id===id).max;
 const excluded=k=>(k.id==='batch'&&level('transfer'))||(k.id==='transfer'&&level('batch'));
 const eligible=k=>!excluded(k)&&k.req.every(mastered)&&(!k.anyReq||k.anyReq.some(mastered));
 const cost=k=>k.prices[level(k.id)];
 const capacity=()=>level('next')?50:[1,3,8,20,50][level('batch')];
 const delay=()=>[3.2,1.9,.9,.35,.1][level('speed')];
 const success=()=>[.78,.88,.96,1][level('safe')];
 const echo=()=>2**level('echo');
 const RECIPIENTS = [['단군', 'dangun'], ['이순신', 'sunshin.lee'], ['세종대왕', 'sejong'], ['허난설헌', 'nanseolheon'], ['장영실', 'yeongsil.jang'], ['신사임당', 'saimdang'], ['정약용', 'yakyong.jeong'], ['김홍도', 'hongdo.kim'], ['공자', 'kongzi'], ['노자', 'laozi'], ['장자', 'zhuangzi'], ['이백', 'li.bai'], ['두보', 'du.fu'], ['왕희지', 'wang.xizhi'], ['손오공', 'sun.wukong'], ['저팔계', 'zhu.bajie'], ['홍길동', 'gildong.hong'], ['심청', 'sim.cheong'], ['흥부', 'heungbu'], ['춘향', 'chunhyang'], ['길가메시', 'gilgamesh'], ['이시스', 'isis'], ['아누비스', 'anubis'], ['오디세우스', 'odysseus'], ['페넬로페', 'penelope'], ['아테나', 'athena'], ['아킬레우스', 'achilles'], ['셰에라자드', 'scheherazade'], ['알라딘', 'aladdin'], ['신드바드', 'sinbad'], ['아서왕', 'king.arthur'], ['멀린', 'merlin'], ['로빈 후드', 'robin.hood'], ['무라사키 시키부', 'murasaki'], ['오노노 고마치', 'komachi'], ['가구야 공주', 'kaguya'], ['모모타로', 'momotaro'], ['라마', 'rama'], ['시타', 'sita'], ['하누만', 'hanuman'], ['아난시', 'anansi'], ['순디아타', 'sundiata'], ['만사 무사', 'mansa.musa'], ['클레오파트라', 'cleopatra'], ['소크라테스', 'socrates'], ['히파티아', 'hypatia'], ['이븐 바투타', 'ibn.battuta'], ['루미', 'rumi'], ['소르 후아나', 'sor.juana'], ['파차쿠티', 'pachacuti']];
 const recipient=i=>RECIPIENTS[(i-1)%RECIPIENTS.length];
 const longAddress=i=>`${recipient(i)[1]}${i>RECIPIENTS.length?'.'+Math.ceil(i/RECIPIENTS.length):''}@${i%7===0?'glory-post.example':i%5===0?'mail.glory.example':'glory.example'}`;
 const address=i=>longAddress(i);
 const storageLimit=()=>[10,20,40,80][level('ledger')];
 const seekTime=()=>[1,.6,.3,.1][level('seek')];
 const searchPlan=()=>{
  const count=storageLimit()-s.book.length;
  const setup=[2,1.8,1.5,1.2][level('seek')],urgent=s.book.length===0?4:s.book.length/storageLimit()<=.1?2:s.book.length/storageLimit()<=.2?1:0;
  return {count,setup,urgent,total:count?setup+urgent+count*.5*seekTime():0};
 };
 const editSessions=new Map();
 function flushEdit(id){const entry=editSessions.get(id);if(entry){qa('field_edit',{field:id,seconds:+(s.elapsed-entry.start).toFixed(3),inputs:entry.inputs,pastes:entry.pastes});editSessions.delete(id);}}
 const BODY='교주님의 영광회로 오세요.';
 function qa(type,data={}){window.HeavenQA?.event(type,data);}
 function qaState(){return {elapsed:Number(s.elapsed.toFixed(3)),points:s.points,earned:s.earned,total:s.total,skills:{...s.skills},roster:s.book.length,capacity:capacity(),storage:storageLimit(),selected:s.selected.length,jobs:s.jobs.length,training:s.training?.id||null,searching:!!s.searching,feverLeft:s.feverLeft,combo:s.combo,started:s.started,finished:s.finished,paused:s.tutorialPaused||!!window.HeavenQA?.paused,bonusLeft:s.bonusLeft,bonusMultiplier:s.bonusLeft?s.bonusMult:1,view:s.tab,affordable:SKILLS.filter(k=>level(k.id)<k.max&&eligible(k)&&s.points>=cost(k)).map(k=>k.id)};}
 function start(name,options={}){
  if(window.HeavenNet?.active&&!options.remote){window.HeavenNet.join(name);return;}
  if(root) return;
  sound=true;
  s={name,rngSeed:options.seed??crypto.getRandomValues(new Uint32Array(1))[0],rngState:0,deliveries:0,angelCursor:-1,angelResults:{},bonusClock:0,bonusOffer:0,bonusLeft:0,bonusMult:1,bonusRound:0,bonusMotion:null,rushBeat:-1,jobSerial:0,settledJobs:new Set(),points:0,total:0,earned:0,elapsed:0,duration:300,skills:{},selected:[],cursor:11,book:Array.from({length:10},(_,i)=>i+1),searching:null,seekClock:0,tab:null,windows:{list:false,mail:false},jobs:[],training:null,autoClock:0,combo:0,fever:0,feverLeft:0,attempts:0,finished:false,started:false,active:true,tutorialSeen:false,tutorialPaused:false};
  s.rngState=s.rngSeed;
  window.HeavenQA?.start(qaState,{version:'selection-dvd-qa-10',skills:SKILLS,requireMaxPrerequisites:true,exclusivePairs:[['transfer','batch']],costGrowth:null,priceMode:'per-rank',seed:s.rngSeed,bonusEvery:12,bonusMultiplier:2,baseReward:10,searchSetup:[2,1.8,1.5,1.2],searchPerPerson:.5,independentAngels:true,bonusInterval:35,bonusOfferSeconds:6,bonusDuration:8,bonusMultipliers:[2,2,3],emergencyByRemainingRatio:{empty:4,tenPercent:2,twentyPercent:1}});
  document.body.classList.add('mail-mode');
  root=document.createElement('main');root.id='mail-game';
  root.innerHTML=`<div id="mg-deliveries" aria-hidden="true"></div><canvas id="mail-fx" popover="manual" aria-hidden="true"></canvas>
   <aside class="mg-profile"><div class="profile-heading">GLORY MEMBERS CLUB</div><div class="profile-photo"><img src="Resources/HeavenComponents/icons/dove.png" alt="비둘기 사원 프로필"><span>AUTHORIZED SOUL</span></div><h2 id="mg-worker"></h2><div class="profile-rank">BASIC 회원 <small>사원번호 0001</small></div><p class="profile-motto">오늘도 성실하게,<br>은총은 차곡차곡.</p><section class="profile-meters" aria-label="사원 능력치">
<div class="profile-meter" id="mg-wallet"><img src="Resources/HeavenComponents/icons/coins.png" alt=""><span><small>사용 가능한 은총</small><strong id="mg-points">0</strong><em id="mg-income"></em></span></div><div class="profile-meter" id="mg-record"><img src="Resources/HeavenComponents/icons/trophy.png" alt=""><span><small>누적 전도 실적</small><strong id="mg-total">0</strong><em id="mg-earned"></em></span></div><div class="profile-meter" id="mg-strength"><img src="Resources/HeavenComponents/icons/winged-mail.png" alt=""><span><small>전도력</small><strong id="mg-power">0</strong><em id="mg-capacity-note"></em></span></div><div class="profile-meter" id="mg-speed-card"><img src="Resources/HeavenComponents/icons/lightning.png" alt=""><span><small>전송 속도</small><strong id="mg-speed">0</strong><em id="mg-speed-note"></em></span></div><div class="profile-meter" id="mg-safe-card"><img src="Resources/HeavenComponents/icons/shield.png" alt=""><span><small>성공률</small><strong id="mg-safety">0</strong><em id="mg-auto-note"></em></span></div><div class="profile-meter" id="mg-clock"><img src="Resources/HeavenComponents/icons/hourglass.png" alt=""><span><small>중간 평가까지</small><strong id="mg-time">0</strong><em id="mg-clock-note"></em></span></div>
   </section><div class="profile-stamp">WORK / PRAY / REPEAT</div></aside>
   <section class="mg-fever" aria-label="은총 3배 보너스 충전"><img class="fever-emblem" src="Resources/HeavenComponents/icons/globe-cross.png" alt=""><span class="fever-slogan"><small>YOUR WORK WILL BE REWARDED!</small><b>은총 <em>×3</em> 충전소</b></span><span class="fever-info"><strong id="mg-fever-label"></strong><small>전송 성공으로 충전 · 100% → 12초간 획득 은총 3배</small></span><div class="fever-meter" role="progressbar" aria-label="은총 보너스 충전" aria-valuemin="0" aria-valuemax="100"><i id="mg-fever-fill"></i></div><span class="fever-seal">GRACE<br><b>BOOST!</b></span></section>
   <div class="mg-layout"><section class="mg-work"><div class="mg-window-title">✉ GLORY MAIL 98 </div>
    <nav class="mg-tabs mg-desktop-icons" aria-label="행정실 프로그램"><button id="mg-list-tab"><img src="Resources/HeavenComponents/office-icons/address-book.png" alt=""><span>이메일 목록</span><small>ADDRESS BOOK</small></button><button id="mg-mail-tab"><img src="Resources/HeavenComponents/icons/mailbox.png" alt=""><span>메일함</span><small>GLORY MAIL</small></button></nav>
    <div id="mg-panes"><div id="mg-desktop-empty"><div class="office-start-arrow" aria-hidden="true"><svg viewBox="0 0 240 180"><path d="M 222 148 L 76 40 L 125 19 L 12 8 L 24 119 L 57 68 L 200 175 Z"/></svg><span>여기부터!<br>이메일 목록</span></div><div class="office-ad"><span class="office-ad-new">전도<br>급구!</span><img src="Resources/HeavenComponents/icons/computer.png" alt=""><strong>GLORY<span>MAIL.net</span></strong><em>한 통 더! 한 영혼 더!</em><small>천국 직영 · 영혼 모집 · 연중무휴</small><b>① 이메일 목록부터 열어보세요 ↖</b><i>성실한 당신에게 더 많은 업무를 드립니다.</i></div></div>
     <section id="mg-list-pane" aria-label="이메일 목록 창"><div class="mg-app-title"><b>미전도 영혼 명단</b><button data-close="list" aria-label="이메일 목록 창 닫기">×</button></div><div class="mg-roster-toolbar"><strong id="mg-roster-count"></strong><button id="mg-seek">⌕ 잃은 양 찾기</button><small id="mg-roster-hint"></small></div><div class="mg-pane-head"></div><p id="mg-address-guide" class="mg-muted">주소를 직접 입력하거나 Ctrl+C로 복사한 뒤 메일함에서 Ctrl+V로 붙여넣으세요.</p><div id="mg-list"></div><div class="mg-script"><small>메일 본문에 아래 문구를 그대로 입력하세요 · Ctrl+C로 복사 가능</small><div class="mg-script-line"><p>${BODY}</p><button id="mg-copy-body" hidden>본문 복사</button></div></div><button id="mg-to-compose" class="mg-primary" hidden>메일함으로 →</button></section>
     <section id="mg-mail-pane" aria-label="메일함 창" hidden><div class="mg-app-title"><b>새로운 구원의 메시지</b><button data-close="mail" aria-label="메일함 창 닫기">×</button></div><label for="mg-address">받는 사람 </label><textarea id="mg-address" rows="2" spellcheck="false" placeholder="명단의 이메일 주소를 입력하세요"></textarea><label for="mg-body">말씀</label><textarea id="mg-body" rows="4" placeholder="명단에 적힌 전도 문구를 입력하세요"></textarea><div class="mg-send-meta"><span id="mg-send-info"></span><span id="mg-queue-info"></span></div><div id="mg-delivery-summary" role="status" aria-live="polite" hidden></div><button id="mg-send" class="mg-send">✉ 구원의 메일 전송</button><div class="mg-progress"><i id="mg-send-progress"></i></div></section>
    </div><div id="mg-bonus-clock" hidden></div><div id="mg-angel-dock" aria-label="대리 천사 전용 발송실"></div><p id="mg-message" role="status"></p></section>
    <aside class="mg-side"><div class="mg-window-title">✦ 당신의 성장 경로</div><div class="grace-ad"><div class="grace-ad-top">천국 공인 <b>NEW!!</b></div><div class="grace-orbit"><img src="Resources/HeavenComponents/icons/angel-wings.png" alt=""><span>LABOR<br>FREE?</span></div><h2>일은 누가 하고<br><em>은총은 누가 받나!</em></h2><div class="grace-sticker">당신의 노동을<br><strong>UPGRADE</strong></div><p>편의 / 물량 / 신뢰 / 자동화<br>축복을 골라 업무의 운명을 바꾸세요.</p><button id="mg-tree-open2" class="mg-primary"><div class="skill-callout"><b>은총의 스킬 트리</b><span>CLICK HERE! ↗</span></div></button><small class="grace-fine">※ 기적에도 선행 조건이 있습니다.</small></div><div id="mg-build"></div><div class="mg-live"><small>천국 우편국 · 실시간 처리</small><div id="mg-log">아직 발송된 메일이 없습니다.</div></div></aside></div>
   <footer class="mg-footer"><div class="mg-tools"><button id="mg-bgm">♫ 배경음악 재생</button></div><div><b>✟ JESUS SAVES</b> <b>MAIL 98</b> <b>BEST VIEWED IN HEAVEN</b> <b>NO REAL EMAIL</b></div><p>믿음은 마음속에. 실적은 숫자로. / MECHANIC PLAYTEST · 1인 테스트</p></footer>
   <div id="mg-skill-shade" hidden></div><dialog id="mg-first-skill" aria-labelledby="mg-first-skill-title"><div class="blessing-wire">★ HEAVEN SPECIAL REPORT ★ <span>업무 일시 정지</span></div><div class="blessing-chaos"><span class="blessing-new">긴급!<br>NEW</span><img class="blessing-wings" src="Resources/HeavenComponents/icons/angel-wings.png" alt=""><small class="blessing-transmission">DIRECT FROM HEAVEN / 수신 완료</small><h2 id="mg-first-skill-title">첫 번째 <em>축복!!</em></h2><div class="blessing-reward"><img src="Resources/HeavenComponents/icons/coins.png" alt=""><span>당신의 성실함이<br><b>구매력으로 돌아왔다!</b></span></div><div class="blessing-stickers" aria-hidden="true"><b>노동은 계속된다</b><i>SKILL<br>AVAILABLE</i><strong>은총 사용처<br>드디어 OPEN!</strong></div><div class="blessing-instruction"><span>01</span><p><b>이 안내를 닫으세요.</b><br>밝게 표시된 오른쪽 <strong>‘은총의 스킬 트리’</strong>를 누르고,<br>구매 가능한 스킬을 골라 <strong>‘습득하기’</strong>를 누르세요.</p></div><p class="blessing-clock">시간도 멈췄습니다. <b>첫 스킬을 배우면 업무가 재개됩니다.</b></p><button id="mg-first-skill-ok">축복 받으러 가기 <em>CLICK!! ↗</em><small>안내 닫기</small></button><div class="blessing-fine">본 축복은 현금으로 환급되지 않습니다. / GLORY BENEFITS DEPT.</div></div></dialog>
   <dialog id="mg-search" aria-labelledby="mg-search-title"><small>LOST SHEEP SEARCH / 외근 중</small><h2 id="mg-search-title">잃은 양을 찾고 있습니다</h2><img src="Resources/HeavenComponents/icons/globe-cross.png" alt=""><strong id="mg-search-count"></strong><div class="mg-progress"><i id="mg-search-progress"></i></div><p>외근마다 준비 시간이 필요합니다.<br>명단이 20% / 10% / 0명 남으면 긴급 재모집 1 / 2 / 4초가 추가됩니다.</p></dialog>
   <dialog id="mg-tree"><div class="mg-dialog-head"><div><small>THE BOOK OF BLESSINGS</small><h2>은총의 스킬 트리</h2></div><div><b id="mg-tree-points"></b><button id="mg-tree-close">← 전산실</button></div></div><p class="mg-tree-note">같은 줄은 같은 기능입니다. ‘필요’에 적힌 스킬을 모두 배우세요. 노란색: 구매 가능 · 초록색: 습득 · 더블클릭: 습득 / 수련</p><div class="mg-tree-scroll"><div id="mg-tree-map"></div></div><section id="mg-skill-detail"></section></dialog>
   <dialog id="mg-training"><div class="mg-training-rays"></div><div class="mg-training-orbit" aria-hidden="true">✉　✦　✉　✦　✉　✦</div><p>★ HEAVENLY KNOWLEDGE TRANSFER ★</p><div class="mg-training-symbol">✟</div><h2 id="mg-training-name"></h2><div class="mg-training-reels" aria-hidden="true"><span>✟</span><span>✉</span><span>✦</span></div><div id="mg-training-phase">천국 회선 연결 중</div><strong id="mg-training-count"></strong><div class="mg-progress"><i id="mg-training-progress"></i></div><p id="mg-training-loss"></p><button id="mg-training-cancel">수련 포기 · 은총 50% 반환</button></dialog>
   <dialog id="mg-intro" aria-labelledby="mg-welcome-title">
    <div class="welcome-chrome"><b>✟ Welcome to HeavenOffice.net</b><span class="welcome-chrome-blank" aria-hidden="true"></span></div>
    <div class="welcome-menu">File　Edit　View　Favorites　Help</div>
    <div class="welcome-page">
     <div class="welcome-kicker">YOUR SOUL IS NOW CONNECTED <span>ONLINE!</span></div>
     <h2 id="mg-welcome-title"><em>Welcome to</em><strong>Heaven<span>Office</span><sup>98</sup></strong></h2>
     <p class="welcome-receipt">서약이 접수되었습니다. <b>당신은 이제 BASIC 신도입니다.</b></p>
     <div class="welcome-mission"><b>당신의 임무는 이메일 전도입니다.</b><p>교주님의 영광회 신도가 된 당신은 더 많은 사람에게 영광회를 알려야 합니다. 전산실의 미전도 영혼 명단을 확인하고, 이메일로 <strong>“교주님의 영광회로 오세요.”</strong>라는 말씀을 보내세요.</p><p>전송에 성공하면 <strong>전도 실적과 은총</strong>이 쌓입니다. 은총으로 스킬을 배워 더 빠르게, 더 많은 사람에게 전도하세요. <b>당신이 한 통 더 보낼 때마다 우리의 편은 늘어나고, 영광회의 영향력은 더 커집니다. 영광회의 성장이 곧 당신의 축복입니다. 오늘의 헌신은 반드시 더 큰 영광으로 돌아올 것입니다!</b></p></div>
     <section class="welcome-programs" aria-label="업무 순서">
      <div class="welcome-program-title">✉ Getting Started — 천국 전산실 이용 안내</div>
      <ol>
       <li><img src="Resources/HeavenComponents/office-icons/address-book.png" alt=""><b>01. 이메일 목록</b><span>‘잃은 양 찾기’로 수신인을 모으고,<br>이메일 주소와 전도 문구를 확인하세요.</span></li>
       <li><img src="Resources/HeavenComponents/icons/mailbox.png" alt=""><b>02. 메일함</b><span>받는 사람의 주소와 본문을<br>직접 입력하거나 붙여넣고 전송하세요.</span></li>
       <li><img src="Resources/HeavenComponents/icons/angel-wings.png" alt=""><b>03. 은총 투자</b><span>전송 성공으로 모은 은총을<br>오른쪽 스킬 트리에서 사용하세요.</span></li>
      </ol>
      <div class="welcome-status">For New Believers Only <span>✦ 접수 완료 / BASIC</span></div>
     </section>
     <div class="welcome-ads" aria-hidden="true"><div class="welcome-ad-work"><i>NEW!</i><b>Work is Worship.</b><small>성실한 당신에게, 더 많은 업무를!</small></div><div class="welcome-ad-grace"><strong>100%</strong><span>은총 적립<br><b>GRACE INSIDE</b></span></div></div>
     <p class="welcome-roster-note">주소록에는 처음 10명이 있습니다. 발송하면 명단에서 빠집니다.<br>‘잃은 양 찾기’로 빈자리를 보충하세요. 탐색 중에는 메일 업무가 멈춥니다.</p><div class="welcome-entry"><label for="mg-duration">이번 근무 시간</label><select id="mg-duration"><option value="300" selected>5분 · 기본</option><option value="480">8분 · 긴 플레이</option><option value="600">10분 · 여유 있는 수련</option></select><button id="mg-begin" class="mg-primary">업무 시작 <span>ENTER →</span></button></div>
     <div class="welcome-bottom"><b>✟ 천국 메일링 행정실</b><small>실제 이메일은 보내지지 않습니다.</small><i>Best viewed with eternal devotion.</i></div>
    </div>
   </dialog>
   <dialog id="mg-result"><p class="mg-eyebrow">INTERIM PERFORMANCE REVIEW</p><h2>중간 평가</h2><div id="mg-result-body"></div><p>근무가 끝났습니다. 교주의 심판대에서 다음 배치를 결정합니다.</p><button id="mg-again" class="mg-primary">다른 빌드로 다시 근무</button></dialog>
   <div id="mg-payout" popover="manual" aria-hidden="true"><small>HEAVEN BONUS SYSTEM</small><strong id="mg-payout-title"></strong><div class="mg-payout-count" id="mg-payout-count"></div><em id="mg-payout-note"></em></div><div id="mg-burst" aria-hidden="true"></div>`;
  document.body.append(root);$('mg-worker').textContent=name+' 신도';
  $('mg-list-tab').onclick=()=>tab('list');$('mg-mail-tab').onclick=()=>tab('mail');$('mg-to-compose').onclick=()=>{if(!level('transfer'))return;if(s.selected.length){$('mg-address').value=s.selected.map(address).join(', ');window.HeavenNet?.saveMail(true);}tab('mail');};
  root.querySelectorAll('[data-close]').forEach(el=>el.onclick=()=>{s.windows[el.dataset.close]=false;render();});
  root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||['mg-sound','mg-send','mg-learn','mg-training-cancel','mg-reset','mg-again'].includes(b.id))return;sfx(b.matches('[data-close],#mg-tree-close')?'close':b.matches('#mg-list-tab,#mg-mail-tab,#mg-to-compose,#mg-tree-open,#mg-tree-open2')?'open':'click');});
  root.addEventListener('change',e=>{if(e.target.matches('[data-recipient]'))sfx('select');});
  root.addEventListener('focusin',e=>{if(e.target.matches('#mg-address,#mg-body')){editSessions.set(e.target.id,{start:s.elapsed,inputs:0,pastes:0});qa('field_focus',{field:e.target.id});}});
  root.addEventListener('focusout',e=>{if(e.target.matches('#mg-address,#mg-body'))flushEdit(e.target.id);});
  root.addEventListener('input',e=>{if(e.target.id==='mg-address'&&level('template')&&e.target.value.trim()&&!$('mg-body').value)$('mg-body').value=BODY;if(e.target.matches('textarea'))sfx('type');if(e.target.matches('#mg-address,#mg-body')){if(!editSessions.has(e.target.id))editSessions.set(e.target.id,{start:s.elapsed,inputs:0,pastes:0});const entry=editSessions.get(e.target.id);entry.inputs++;if(e.inputType==='insertFromPaste')entry.pastes++;}});
  $('mg-send').onclick=send;
  $('mg-seek').onclick=startSearch;
  $('mg-search').addEventListener('cancel',e=>e.preventDefault());
  $('mg-copy-body').onclick=()=>copy(BODY);
  ['mg-tree-open2'].forEach(id=>$(id).onclick=()=>{renderTree();qa('tree_open');$('mg-tree').showModal();});
  const dismissFirstSkill=()=>{$('mg-first-skill').close();$('mg-tree-open2').focus();};
  $('mg-first-skill-ok').onclick=dismissFirstSkill;
  $('mg-first-skill').addEventListener('cancel',e=>{e.preventDefault();dismissFirstSkill();});
  $('mg-tree-close').onclick=()=>$('mg-tree').close();
  $('mg-tree').addEventListener('close',()=>qa('tree_close'));
  $('mg-begin').onclick=()=>{s.duration=Number($('mg-duration').value);s.started=true;sfx('startup');qa('work_start',{duration:s.duration});$('mg-intro').close();last=performance.now();};
  $('mg-again').onclick=restart;
  const updateBgm=()=>{$('mg-bgm').textContent=window.HeavenMusic?.playing()?'♫ 배경음악 정지':'♫ 배경음악 재생';};
  $('mg-bgm').onclick=()=>{window.HeavenMusic?.toggle();updateBgm();};updateBgm();
  $('mg-training-cancel').onclick=()=>{if(window.HeavenNet?.active){window.HeavenNet.command({type:'cancelTraining'});return;}const refund=Math.floor(s.training.paid/2);s.points+=refund;qa('training_cancel',{skill:s.training.id,refund});s.training=null;$('mg-training').close();message('수련 중단. 지불한 은총의 50%가 반환되었습니다.');render();renderTree();};
  $('mg-training').addEventListener('cancel',e=>e.preventDefault());$('mg-intro').addEventListener('cancel',e=>e.preventDefault());$('mg-result').addEventListener('cancel',e=>e.preventDefault());
  root.classList.toggle('reduced',reduced);renderList();render();$('mg-intro').showModal();last=performance.now();timer=setInterval(tick,50);frame=requestAnimationFrame(draw);
 }
 function restart(){if(window.HeavenNet?.active)return;if(s)s.finished=true;transmissionSound();fxQueue=[];payout=null;lastFX=0;clearInterval(timer);cancelAnimationFrame(frame);const name=s.name;root.remove();root=null;editSessions.clear();particles=[];start(name,{sound});}
 function message(t){
  const bar=$('mg-message');if(!bar)return;
  bar.textContent=t;bar.classList.remove('mg-message-notice');void bar.offsetWidth;bar.classList.add('mg-message-notice');
 }

 function tab(t){if(t==='mail'&&level('template')&&$('mg-address').value.trim()&&!$('mg-body').value)$('mg-body').value=BODY;s.tab=t;qa('tab_open',{tab:t});if(!level('split'))s.windows={list:false,mail:false};s.windows[t]=true;render();}
 function syncSelectedAddress(){
  $('mg-address').value=s.selected.map(address).join(', ');window.HeavenNet?.saveMail(true);tab('mail');
  const field=$('mg-address');field.classList.remove('mg-address-flash');void field.offsetWidth;field.classList.add('mg-address-flash');sfx('select');
  qa('address_link',{count:s.selected.length});
 }
 function renderList(){

  $('mg-list').innerHTML=s.book.map(i=>{return `<div data-row="${i}" class="mg-recipient ${level('transfer')||level('next')?'mg-linked-row':''} ${(level('batch')||level('transfer')||level('next'))&&s.selected.includes(i)?'selected':''}">${capacity()>1?`<label><input type="checkbox" name="mg-recipient" data-recipient="${i}" ${s.selected.includes(i)?'checked':''}><span><b dir="auto">${recipient(i)[0]}</b></span></label>`:level('transfer')?`<button class="mg-person-select" data-person="${i}" aria-pressed="${s.selected.includes(i)}" dir="auto">${recipient(i)[0]}</button>`:`<b class="mg-recipient-name" dir="auto">${recipient(i)[0]}</b>`}<code class="mg-recipient-address">${address(i)}</code>${level('addresscopy')&&!level('transfer')&&!level('next')?`<button data-copy="${i}">${capacity()>1&&s.selected.length?'선택한 주소 모두 복사':'이메일 주소 복사'}</button>`:''}</div>`;}).join('')||'<p class="mg-empty-roster">명단이 비었습니다. ‘잃은 양 찾기’로 새 주소를 확보하세요.</p>';
  if(level('transfer')||level('next'))$('mg-list').querySelectorAll('[data-row]').forEach(row=>row.onclick=e=>{
   if(e.target.closest('[data-copy]'))return;
   if(capacity()>1){if(e.target.closest('label,input'))return;row.querySelector('input').click();return;}
   s.selected=[Number(row.dataset.row)];syncSelectedAddress();renderList();render();
  });
  $('mg-list').querySelectorAll('[data-recipient]').forEach(el=>el.onchange=()=>{const id=Number(el.dataset.recipient);if(el.checked){if(capacity()===1)s.selected=[];if(s.selected.length>=capacity()){el.checked=false;message(`한 번에 ${capacity()}명까지 선택할 수 있습니다.`);return;}s.selected.push(id);}else s.selected=s.selected.filter(i=>i!==id);if(level('transfer')||level('next'))syncSelectedAddress();renderList();render();});
  $('mg-list').querySelectorAll('[data-copy]').forEach(el=>el.onclick=()=>copy(capacity()>1&&s.selected.length?s.selected.map(address).join(', '):address(Number(el.dataset.copy))));
 }
 async function copy(text){try{await navigator.clipboard.writeText(text);qa('copy',{kind:text===BODY?'body':'address',count:text===BODY?0:text.split(',').length});message('복사 완료. 메일 창에 붙여넣으세요.',false);}catch{message('클립보드 접근이 제한되어 있습니다. 글자를 선택해 Ctrl+C로 복사하세요.');}}
 function render(){
  const affordable=SKILLS.filter(k=>level(k.id)<k.max&&eligible(k)&&s.points>=cost(k));
  const skillReady=affordable.length>0&&!s.finished&&!s.training;
  const treeButton=$('mg-tree-open2');
  treeButton.classList.toggle('mg-skill-ready',skillReady);
  treeButton.querySelector('span').textContent=skillReady?`✦ ${affordable.length}개 스킬 습득 가능! ↗`:'CLICK HERE! ↗';
  treeButton.setAttribute('aria-label',skillReady?`은총의 스킬 트리 · ${affordable.length}개 스킬 습득 가능`:'은총의 스킬 트리');

  $('mg-roster-count').textContent=`주소록 ${s.book.length} / ${storageLimit()}명`;
  const vacancies=storageLimit()-s.book.length;
  $('mg-seek').disabled=!vacancies||!!s.searching||!!s.training||s.tutorialPaused||s.finished||s.jobs.some(j=>!j.auto);
  const plan=searchPlan();
  $('mg-seek').textContent=vacancies?`${plan.urgent?'⚑ 긴급 재모집':'⌕ 잃은 양 찾기'} · ${vacancies}명 / ${plan.total.toFixed(1)}초`:'주소록 가득 참';
  $('mg-seek').title=`외근 준비 ${plan.setup}초 + 1명당 ${(seekTime()*.65).toFixed(2)}초. 잔여 20% / 10% / 소진 시 긴급 재모집 1 / 2 / 4초 추가. 외근 중에도 은총 3배 시간은 흐릅니다.`;
  $('mg-roster-hint').textContent=level('autoseek')?`순회 전도단 가동 · ${seekTime()}초마다 1명 자동 보충`:'';
  $('mg-roster-hint').hidden=!level('autoseek');
  root.classList.toggle('expanded-office',!!level('expand'));renderAngels();
  $('mg-total').textContent=fmt(s.total);$('mg-points').textContent=fmt(s.points);$('mg-power').textContent=`${fmt(capacity()*echo())}명 / 회`;
  $('mg-capacity-note').textContent=`${capacity()}명 동시 × 메아리 ${echo()}배`;
  $('mg-speed').textContent=`${delay()}초`;
  $('mg-speed-note').textContent=`기본 대비 ×${(3.2/delay()).toFixed(1)} 속도`;
  $('mg-safety').textContent=`${Math.round(success()*100)}%`;
  $('mg-auto-note').textContent=level('auto')?`대리 천사 ${[0,5,2.5,1][level('auto')]}초마다 발송`:'대리 천사 미고용';
  const rewardMultiplier=(1+Math.min(level('combo'),Math.floor(s.combo/5)*.25))*(s.feverLeft?3:1);
  $('mg-income').textContent=`전원 성공 시 +${fmt(Math.round(capacity()*echo()*10*rewardMultiplier))} / 회 · 배달 성공 12회마다 은총 ×2`;
  $('mg-earned').textContent=`누적 획득 ${fmt(s.earned)} 은총`;

  const sec=Math.max(0,Math.ceil(s.duration-s.elapsed));$('mg-time').textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
  $('mg-panes').classList.toggle('split',!!level('split'));$('mg-list-pane').hidden=!s.windows.list;$('mg-mail-pane').hidden=!s.windows.mail; $('mg-desktop-empty').hidden=s.windows.list||s.windows.mail;
  $('mg-list-tab').classList.toggle('mg-start-here',!s.windows.list&&!s.windows.mail);$('mg-list-tab').classList.toggle('active',s.windows.list);$('mg-mail-tab').classList.toggle('active',s.windows.mail);
  $('mg-to-compose').hidden=true;
  $('mg-address-guide').textContent=level('transfer')||level('next')?'수신인을 선택하면 메일함에 주소가 바로 입력됩니다.':level('batch')?'수신인을 체크하고 선택한 주소 모두 복사를 누른 뒤 메일함에 붙여넣으세요.':'주소를 직접 입력하거나 복사한 뒤 메일함에 붙여넣으세요.';
  $('mg-copy-body').hidden=!level('copy')||!!level('template');root.querySelector('.mg-script').classList.toggle('body-automated',!!level('template'));
  $('mg-send-info').textContent=`${delay()}초 / 성공률 ${Math.round(success()*100)}% / ${s.selected.length}명 선택`;
  $('mg-send').disabled=!!window.HeavenNet?.busy||!s.book.length||!!s.searching||!!s.training||s.finished||s.jobs.some(j=>!j.auto);
  $('mg-send').textContent='✉ 구원의 메일 전송';
  $('mg-queue-info').textContent=s.jobs.length?`${s.jobs.length}건 처리 중`:'';
  const job=s.jobs.find(j=>!j.auto);$('mg-send-progress').style.width=job?`${100*(1-job.left/job.duration)}%`:'0%';
  $('mg-fever-fill').style.width=`${s.feverLeft?s.feverLeft/12*100:s.fever}%`;
  $('mg-fever-label').textContent=s.feverLeft?`은총 3배 적용 중 · ${Math.ceil(s.feverLeft)}초 남음`:`충전 ${Math.floor(s.fever)}% · 연속 성공 ${s.combo}회`;
  root.classList.toggle('fever',s.feverLeft>0);
  const meter=root.querySelector('.fever-meter');
  meter.setAttribute('aria-valuenow',String(Math.round(s.feverLeft?s.feverLeft/12*100:s.fever)));
  meter.setAttribute('aria-label',s.feverLeft?'은총 3배 남은 시간':'은총 보너스 충전');
  $('mg-build').innerHTML=SKILLS.filter(k=>level(k.id)).map(k=>`<span>${k.icon} ${k.name} <b>${level(k.id)}</b></span>`).join('')||'<p class="mg-muted">아직 받은 축복이 없습니다.<br>첫 성공 1회면 첫 스킬을 고를 수 있습니다.</p>';
  if($('mg-tree').open)updateTree();
 }
 function send(){
  if(level('template')&&$('mg-address').value.trim()&&!$('mg-body').value)$('mg-body').value=BODY;
  if(window.HeavenNet?.active){window.HeavenNet.command({type:"send",address:$("mg-address").value,body:$("mg-body").value});return;}
  flushEdit('mg-address');flushEdit('mg-body');
  if(!s.started||window.HeavenQA?.paused||s.tutorialPaused||s.searching||s.training||s.finished||s.jobs.some(j=>!j.auto))return;
  const entered=$('mg-address').value.split(/[,;\n]+/).map(x=>x.trim().toLowerCase()).filter(Boolean);
  const available = s.book;
  const recipients = entered.map(email=>available.find(i=>address(i)===email));
  if(!entered.length||entered.length>capacity()||new Set(entered).size!==entered.length||new Set(recipients).size!==recipients.length||recipients.some(i=>i===undefined)){inputWarning('이메일 주소를 확인하세요.',`현재 명단의 주소를 ${capacity()}명까지 정확하게 입력하세요. 여러 주소는 쉼표로 구분하며, 같은 주소를 중복 입력할 수 없습니다.`);return;}
  const expected=recipients.map(address);
  if($('mg-body').value.trim()!==BODY){inputWarning('메일 본문이 일치하지 않습니다.','오늘의 전도 문구를 메일 본문에 그대로 적어주세요. 띄어쓰기와 마침표도 확인하세요.');return;}
  s.selected=recipients;
  sfx('send');
  const job={id:++s.jobSerial,recipients:[...recipients],count:expected.length,auto:false,duration:delay(),left:delay()};
  qa('send',{jobId:job.id,recipientIds:job.recipients,count:expected.length,automatic:false});
  root.querySelector('.mg-failure-toast')?.remove();$('mg-delivery-summary').hidden=false;$('mg-delivery-summary').textContent=`${expected.length}명에게 발송 중…`;
  s.jobs.push(job);message('천국 우편국과 연결 중…',false);
  s.book=s.book.filter(i=>!recipients.includes(i));
  s.selected=[];
  $('mg-address').value='';$('mg-body').value='';
  renderList();render();
 }
 function finishJob(j){
  if(j.settled||(j.id&&s.settledJobs.has(j.id)))return;
  j.settled=true;if(j.id)s.settledJobs.add(j.id);if(s.settledJobs.size>1024)s.settledJobs.delete(s.settledJobs.values().next().value);
  const beforePoints=s.points;
  s.attempts++;
  const passedIds=[],failedIds=[];
  for(let i=0;i<j.count;i++)(j.retry||s.attempts<=3||gameRandom()<success()?passedIds:failedIds).push(j.recipients?.[i]??null);
  const passed=passedIds.length,failed=failedIds.length;
  if(failed&&!passed&&!j.auto)showMailFailure(failed,0);
  else if(!j.auto)root.querySelector('.mg-failure-toast')?.remove();
  if(failed&&level('retry')){const retry={id:++s.jobSerial,recipients:failedIds,count:failed,auto:j.auto,retry:true,left:.8,duration:.8,parentId:j.id,angel:j.angel};s.jobs.push(retry);qa('retry_scheduled',{jobId:retry.id,parentId:j.id,recipientIds:failedIds,count:failed});}
  if(passed){
   s.combo++;const quantity=passed*(j.auto&&!level('rapture')?1:echo());
   const combo=1+Math.min(level('combo'),Math.floor(s.combo/5)*.25);const jackpot=++s.deliveries%12===0;const reward=Math.round(quantity*10*combo*(s.feverLeft?3:1)*(jackpot?2:1)*(s.bonusLeft?s.bonusMult:1));
   s.total+=quantity;s.points+=reward;s.earned+=reward;collectGrace(reward);delivery(quantity,reward);sfx('delivered');
   if(!s.feverLeft){s.fever=Math.min(100,s.fever+8+Math.min(8,passed));if(s.fever>=100){s.fever=0;s.feverLeft=12;sfx('fever');burst('GLORY FEVER ×3');}}
   emit(Math.min(140,28+quantity*3),jackpot);rewardBlast(quantity,reward,j.auto);if(jackpot)tone(1046);
   const label=`${jackpot?'★ 황금 봉투! ':''}+${fmt(quantity)} 전도 / +${fmt(reward)} 은총`;
   message(label+(failed?` · ${failed}건 실패${level('retry')?' (자동 재시도)':''}`:''),false);
   const log=document.createElement('div');log.textContent=label;if(!$('mg-log').children.length)$('mg-log').textContent='';$('mg-log').prepend(log);while($('mg-log').children.length>5)$('mg-log').lastChild.remove();
   if(quantity>=3||jackpot)celebrate(jackpot?'GOLDEN MAIL ×2':'MAIL RUSH!!',quantity,`+${fmt(reward)} 은총 · ${s.combo} COMBO`,jackpot);
  }else{s.combo=0;message(level('retry')?'전송 실패 · 자동으로 다시 연결합니다.':'전송 실패. 주소는 다음 명단으로 넘어갔습니다. 방화벽·재시도 스킬을 고려하세요.',false);tone(150);}
  if(j.auto)s.angelResults[j.angel||1]=`성공 ${passed} / 실패 ${failed} · +${fmt(s.points-beforePoints)} 은총`;
  if(!j.auto){
   const retryPending=failed&&level('retry');
   const status=$('mg-delivery-summary');status.hidden=false;status.textContent=`${j.retry?'재시도 완료 · ':''}성공 ${passed}명 / 실패 ${failed}명 · ${retryPending?'실패한 수신인만 재시도 중':s.selected.length?`직접 선택한 ${s.selected.length}명 준비됨`:`명단 ${s.book.length}명 남음`}`;
   renderList();
  }
  qa('delivery',{jobId:j.id,parentId:j.parentId,recipientIds:j.recipients,passedIds,failedIds,count:j.count,passed,failed,automatic:!!j.auto,retry:!!j.retry,reward:s.points-beforePoints});
 }
 let selectedSkill='copy',treeSignature='';
 function renderTree(){
  treeSignature='';
  const map=$('mg-tree-map');
  const layouts=[{copy:[75,60],split:[245,28],template:[245,92],addresscopy:[425,28],transfer:[585,28],batch:[585,92],ledger:[755,60],next:[925,60]},{speed:[75,60],safe:[245,28],retry:[245,92],echo:[650,60],combo:[925,60]},{expand:[150,60],seek:[500,60],autoseek:[850,60]},{auto:[250,60],rapture:[750,60]}];
  map.innerHTML=SKILL_GROUPS.map((ids,index)=>{
   const pos=layouts[index],half=index>=2,nodeHalf=half?130:55;
   const edges=ids.flatMap(id=>{const k=SKILLS.find(k=>k.id===id),[bx,by]=pos[id];return [...k.req,...(k.anyReq||[])].map(from=>{const [ax,ay]=pos[from],join=k.req.length>1?bx-nodeHalf-35:(ax+bx)/2;return `<path class="${k.anyReq?'skill-or-edge':''}" data-edge="${id}" data-from="${from}" d="M ${ax+nodeHalf} ${ay} H ${join} V ${by} H ${bx-nodeHalf}" marker-end="url(#skill-arrow-${index})"/>`;});}).join('');
   const joins=ids.filter(id=>SKILLS.find(k=>k.id===id).req.length>1).map(id=>{const [x,y]=pos[id];return `<g class="skill-join"><circle cx="${x-nodeHalf-35}" cy="${y}" r="4"/></g>`;}).join('');
   return `<section class="skill-family"><h3>0${index+1} / ${BRANCHES[index]}</h3><div class="skill-family-cards"><svg viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="skill-arrow-${index}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path class="arrow-tip" d="M0 0 L8 4 L0 8Z"/></marker></defs>${edges}${joins}</svg>${ids.map(id=>{const k=SKILLS.find(k=>k.id===id),[x,y]=pos[id];return `<button class="mg-node" data-skill="${id}" style="left:${x/10}%;top:${y/1.2}%"><span>${k.icon}</span><b>${k.name}</b><small data-level="${id}"></small></button>`;}).join('')}</div></section>`;
  }).join('');
  map.querySelectorAll('[data-skill]').forEach(el=>{el.onclick=()=>{selectedSkill=el.dataset.skill;updateTree();};el.ondblclick=()=>{selectedSkill=el.dataset.skill;learn(SKILLS.find(k=>k.id===selectedSkill));updateTree();};});updateTree();
 }

 function updateTree(){
  const netBusy=!!window.HeavenNet?.busy;
  const signature=JSON.stringify([selectedSkill,s.points,s.skills,s.training,s.searching,s.jobs.some(j=>!j.auto),s.finished,netBusy]);if(signature===treeSignature)return;treeSignature=signature;
  $('mg-tree-points').textContent=`✦ ${fmt(s.points)} 은총`;
  SKILLS.forEach(k=>{const el=$('mg-tree-map').querySelector(`[data-skill="${k.id}"]`);if(!el)return;const unlocked=eligible(k);el.classList.toggle('owned',!!level(k.id));el.classList.toggle('completed',level(k.id)>=k.max);el.disabled=level(k.id)>=k.max;el.classList.toggle('available',unlocked&&s.points>=cost(k)&&level(k.id)<k.max);el.classList.toggle('locked',!unlocked);el.classList.toggle('chosen',selectedSkill===k.id);el.querySelector('small').textContent=`${level(k.id)} / ${k.max} · ${level(k.id)>=k.max?'완료':cost(k)+' 은총'}`;});
  $('mg-tree-map').querySelectorAll('[data-edge]').forEach(el=>{el.classList.toggle('lit',mastered(el.dataset.from));el.classList.toggle('related',el.dataset.edge===selectedSkill||el.dataset.from===selectedSkill);});
  const selected=SKILLS.find(k=>k.id===selectedSkill);
  $('mg-tree-map').querySelectorAll('[data-skill]').forEach(el=>{el.classList.toggle('prerequisite',selected.req.includes(el.dataset.skill));el.setAttribute('aria-pressed',String(el.dataset.skill===selectedSkill));});
  const k=SKILLS.find(k=>k.id===selectedSkill),maxed=level(k.id)>=k.max,missing=[...k.req.filter(id=>!mastered(id)),...((k.anyReq&&!k.anyReq.some(mastered))?k.anyReq:[])];
  const unavailable=excluded(k)?'다른 경로 선택됨':maxed?'습득 완료':missing.length?'선행 스킬 필요':s.points<cost(k)?`은총 ${fmt(cost(k)-s.points)} 부족`:s.finished?'근무 종료':s.searching?'탐색 중':s.training?'수련 중':s.jobs.some(j=>!j.auto)?'발송 중':netBusy?'처리 확인 중…':'';
  $('mg-skill-detail').innerHTML=`<div class="mg-detail-icon">${k.icon}</div><div><h3>${k.name}</h3><p>${k.desc}</p><p class="mg-muted">${missing.length?'선행: '+missing.map(id=>SKILLS.find(x=>x.id===id).name).join(k.anyReq?' 또는 ':' + ')+(k.anyReq?' 중 하나 완료':' 최대 단계 필요'):(k.req.length?'선행: '+k.req.map(id=>SKILLS.find(x=>x.id===id).name).join(' + ')+' (충족)':(k.anyReq?'선행: '+k.anyReq.map(id=>SKILLS.find(x=>k.anyReq&&x.id===id).name).join(' 또는 ')+' (충족)':'선행 없음 · 시작 스킬'))} · ${k.time?`수련 ${k.time}초 / 모든 업무 중지`:'즉시 습득'}</p></div><button id="mg-learn" class="mg-primary" ${excluded(k)||maxed||missing.length||s.points<cost(k)||s.searching||s.training||s.jobs.some(j=>!j.auto)||s.finished||netBusy?'disabled':''}>${unavailable?`${maxed?'':`✦ ${fmt(cost(k))} 은총<br>`}${unavailable}`:`✦ ${fmt(cost(k))} 은총<br>${k.time?'수련 시작':'습득하기'}`}</button>`;
  if(s.jobs.some(j=>!j.auto))$('mg-skill-detail').querySelector('.mg-muted').textContent+=' · 발송 완료 후 습득 가능';
  $('mg-learn').onclick=()=>learn(k);
 }
 function learn(k){
  if(window.HeavenNet?.active){window.HeavenNet.command({type:"learn",skill:k.id});updateTree();return;}
  if(window.HeavenQA?.paused||s.finished||s.searching||s.training||s.jobs.some(j=>!j.auto)||level(k.id)>=k.max||s.points<cost(k)||!eligible(k))return;
  const paid=cost(k);s.points-=paid;qa('skill_purchase',{skill:k.id,paid,trainingSeconds:k.time});
  if(k.time){s.training={id:k.id,left:k.time,total:k.time,paid};$('mg-tree').close();$('mg-training-name').textContent=k.name;$('mg-training').dataset.stage='0';$('mg-training-phase').textContent='천국 회선 연결 중';$('mg-training').showModal();sfx('training-start');raiseFX();emit(70,true);}
  else unlock(k);render();updateTree();
 }
 function unlock(k){sfx('upgrade');if(s.tutorialPaused)finishFirstSkill();s.skills[k.id]=level(k.id)+1;if(k.id==='split'){s.windows={list:true,mail:true};s.tab='mail';}qa('skill_unlocked',{skill:k.id,rank:level(k.id)});if(k.id==='template')$('mg-body').value=BODY;burst(`${k.name} · 각성`);renderList();render();}
 function checkFirstSkill(){
  if(s.tutorialSeen||Object.values(s.skills).some(Boolean)||s.jobs.length||!SKILLS.some(k=>!k.req.length&&s.points>=cost(k)))return false;
  s.tutorialSeen=true;s.tutorialPaused=true;
  root.classList.add('first-skill-tour');$('mg-skill-shade').hidden=false;
  root.querySelectorAll('.mg-work,.mg-profile,.mg-fever,.mg-footer').forEach(el=>el.inert=true);
  $('mg-tree-open2').scrollIntoView({block:'center',behavior:'instant'});
  $('mg-first-skill').showModal();sfx('choir');return true;
 }
 function finishFirstSkill(){
  s.tutorialPaused=false;root.classList.remove('first-skill-tour');$('mg-skill-shade').hidden=true;
  root.querySelectorAll('.mg-work,.mg-profile,.mg-fever,.mg-footer').forEach(el=>el.inert=false);
  last=performance.now();
 }
 function startSearch(){
  if(window.HeavenNet?.active){window.HeavenNet.command({type:"search"});return;}
  const count=storageLimit()-s.book.length;
  if(!s.started||window.HeavenQA?.paused||s.finished||s.tutorialPaused||s.training||s.searching||s.jobs.some(j=>!j.auto)||count<=0)return;
  const plan=searchPlan();s.searching={...plan,left:plan.total};s.seekClock=0;qa('search_start',{...plan});
  $('mg-search-count').textContent=`${count}명 찾기 · ${s.searching.total.toFixed(1)}초`;
  $('mg-search-progress').style.width='0%';$('mg-search').showModal();sfx('sheep');render();
 }
 function replenish(count){
  const amount=Math.min(count,storageLimit()-s.book.length);
  for(let i=0;i<amount;i++)s.book.push(s.cursor++);qa('roster_refill',{count:amount,automatic:!s.searching});
  renderList();
 }
 function tick(){
  const now=performance.now(),dt=Math.min(.25,(now-last)/1000);last=now;transmissionSound();
  if(window.HeavenNet?.active){if(officeAudioActive&&!s.finished&&!document.hidden&&!s.tutorialPaused&&!window.HeavenQA?.paused){moveBonus(dt);if(s.feverLeft>0){const beat=Math.floor(performance.now()/130);if(beat!==s.rushBeat){s.rushBeat=beat;sfx('rush-note',[784,1047,988,1319,1175,988,1568,1319][beat%8]);}}}return;}
  // Active-play clock: hidden tabs pause every system consistently.
  if(!s.started||s.finished||document.hidden||window.HeavenQA?.paused||s.tutorialPaused)return;
  s.elapsed+=dt;tickRush(dt);window.HeavenQA?.sample();if(s.elapsed>=s.duration){end();return;}
  if(s.feverLeft>0)s.feverLeft=Math.max(0,s.feverLeft-dt);
  if(s.searching){const done=[];s.jobs.filter(j=>j.auto).forEach(j=>{j.left-=dt;if(j.left<=0)done.push(j);});s.jobs=s.jobs.filter(j=>!done.includes(j));done.forEach(finishJob);tickAngels(dt);const t=s.searching;t.left-=dt;
   const spent=t.total-t.left;
   const beat=Math.floor(spent/.65);if(t.soundBeat!==beat){t.soundBeat=beat;sfx(beat>0&&beat%8===0?'sheep':'pastoral',[392,440,494,587,523,494,440,392][beat%8]);}
   const phase=spent<t.urgent?'긴급 재모집':spent<t.urgent+t.setup?'외근 준비':`${t.count}명 찾기`;
   $('mg-search-count').textContent=`${phase} · ${Math.max(0,t.left).toFixed(1)}초 남음`;
   $('mg-search-progress').style.width=`${Math.min(100,100*(1-t.left/t.total))}%`;
   if(t.left<=0){replenish(t.count);s.searching=null;qa('search_complete');$('mg-search').close();sfx('delivered');message('잃은 양 찾기 완료. 주소록이 보충되었습니다.');}
   render();return;
  }
  if(s.training){const t=s.training;t.left-=dt;const beat=Math.floor((t.total-t.left)/.8);if(t.soundBeat!==beat){t.soundBeat=beat;sfx('training-step',[262,330,392,523,392,330][beat%6]);}$('mg-training-count').textContent=`${Math.ceil(Math.max(0,t.left))}초`;$('mg-training-progress').style.width=`${100*(1-t.left/t.total)}%`;$('mg-training-loss').textContent=`포기한 근무 시간 ${Math.floor(t.total-t.left)}초 · 은총 ${fmt(t.paid)} 투자`;trainingFX(t);if(t.left<=0){const k=SKILLS.find(k=>k.id===t.id);s.training=null;$('mg-training').close();unlock(k);}}
  else {
   const completed=[];s.jobs.forEach(j=>{j.left-=dt;if(j.left<=0)completed.push(j);});s.jobs=s.jobs.filter(j=>j.left>0);completed.forEach(finishJob);
   if(checkFirstSkill()){render();return;}
   if(level('autoseek')&&s.book.length<storageLimit()){s.seekClock+=dt;if(s.seekClock>=seekTime()){const n=Math.floor(s.seekClock/seekTime());s.seekClock-=n*seekTime();replenish(n);}}else s.seekClock=0;
   tickAngels(dt);
  }render();
 }

 function tickAngels(dt){
   if(level('auto')){s.autoClock+=dt;if(s.autoClock>=[0,5,2.5,1][level('auto')]){s.autoClock=0;
    const targets=Array.from({length:level('rapture')?capacity():1},()=>s.angelCursor--);
    if(targets.length){const job={id:++s.jobSerial,angel:(s.jobSerial%level('auto'))+1,recipients:[...targets],count:targets.length,auto:true,left:delay(),duration:delay()};qa('send',{jobId:job.id,recipientIds:job.recipients,count:targets.length,automatic:true});s.jobs.push(job);}
   }}
 }
 function renderAngels(){
  const dock=$('mg-angel-dock');if(!dock)return;
  if(dock.dataset.rank!==String(level('auto'))){dock.dataset.rank=String(level('auto'));dock.innerHTML=Array.from({length:level('auto')},(_,i)=>`<section class="angel-terminal"><header>✦ ANGEL POST / ${i+1}</header><img src="Resources/HeavenComponents/icons/angel-wings.png" alt=""><b>독립 발송실 ${i+1}</b><small>천사 전용 명단 · 내 명단 소모 없음</small><p data-angel-state="${i+1}"></p><div class="angel-meter"><i data-angel-progress="${i+1}"></i></div></section>`).join('');}
  dock.querySelectorAll('[data-angel-state]').forEach(el=>{const j=s.jobs.find(j=>j.auto&&j.angel===Number(el.dataset.angelState));el.textContent=j?`✉ ${j.count}명에게 보내는 중…`:s.angelResults[el.dataset.angelState]||'천국 회선 대기 중…';const bar=dock.querySelector(`[data-angel-progress="${el.dataset.angelState}"]`);bar.style.width=`${j?100*(1-j.left/j.duration):s.autoClock/[0,5,2.5,1][level('auto')]*100}%`;});
 }
 function rewardBlast(quantity,reward,automatic){
  if(automatic&&s.elapsed-(s.lastBlast||0)<.7)return;s.lastBlast=s.elapsed;
  const el=document.createElement('div');el.className='reward-blast';el.innerHTML=`<span>✦ ✧ ✦</span><b>+${fmt(quantity)} SOULS!</b><strong>+${fmt(reward)} 은총</strong>`;root.append(el);setTimeout(()=>el.remove(),900);
  while(root.querySelectorAll('.reward-blast').length>3)root.querySelector('.reward-blast').remove();
 }
 function moveBonus(dt){
  const el=$('mg-runaway-bonus'),m=s.bonusMotion;if(!el||!m)return;
  const maxX=Math.max(0,innerWidth-(el.offsetWidth||175)),maxY=Math.max(0,innerHeight-(el.offsetHeight||120));
  if(!reduced){m.x+=m.vx*dt;m.y+=m.vy*dt;let hit=false;
   if(m.x<0||m.x>maxX){m.x=m.x<0?-m.x:2*maxX-m.x;m.vx=m.x<maxX/2?Math.abs(m.vx):-Math.abs(m.vx);hit=true;}
   if(m.y<0||m.y>maxY){m.y=m.y<0?-m.y:2*maxY-m.y;m.vy=m.y<maxY/2?Math.abs(m.vy):-Math.abs(m.vy);hit=true;}
   if(hit)m.bounces++;
  }
  m.x=Math.max(0,Math.min(maxX,m.x));m.y=Math.max(0,Math.min(maxY,m.y));
  el.style.left=m.x+'px';el.style.top=m.y+'px';el.style.setProperty?.('--bonus-bg',['#ffff00','#7cffff','#ff9de9','#aaff60','#ffbf70','#c7b7ff'][m.bounces%6]);el.dataset.bounces=String(m.bounces);
 }
 function tickRush(dt){
  s.bonusLeft=Math.max(0,s.bonusLeft-dt);
  if(s.feverLeft>0){const beat=Math.floor(s.elapsed/.13);if(beat!==s.rushBeat){s.rushBeat=beat;sfx('rush-note',[784,1047,988,1319,1175,988,1568,1319,880,1175,1047,1397,1319,1047,1760,1568][beat%16]);}}
  if(!s.training&&!s.searching&&!$('mg-tree').open){s.bonusClock+=dt;if(s.bonusClock>=35&&!s.bonusOffer){s.bonusClock=0;s.bonusOffer=6;s.bonusRound++;const el=document.createElement('button');el.id='mg-runaway-bonus';el.className='runaway-bonus';el.innerHTML=`<small>천국 긴급 특혜!</small><b>은총 ×${s.bonusRound%3===0?3:2}</b><span>잡으면 8초! CLICK!!</span>`;el.onclick=()=>{if(!s.bonusOffer||window.HeavenQA?.paused||s.finished||s.tutorialPaused||s.training||s.searching)return;s.bonusOffer=0;s.bonusLeft=8;s.bonusMult=s.bonusRound%3===0?3:2;qa('bonus_claim',{multiplier:s.bonusMult,seconds:8});el.remove();sfx('fever');emit(120,true);};root.append(el);s.bonusMotion={x:innerWidth*.3,y:innerHeight*.25,vx:Math.max(180,innerWidth*.3),vy:Math.max(140,innerHeight*.3),bounces:0};moveBonus(0);qa('bonus_offer',{seconds:6});}}
  if(s.bonusOffer){moveBonus(dt);s.bonusOffer=Math.max(0,s.bonusOffer-dt);if(!s.bonusOffer){$('mg-runaway-bonus')?.remove();qa('bonus_escape');}}
  root.classList.toggle('bonus-active',s.bonusLeft>0);
  const label=$('mg-bonus-clock');if(label){label.hidden=!s.bonusLeft;label.textContent=`✦ 은총 ×${s.bonusMult} · ${Math.ceil(s.bonusLeft)}초${s.feverLeft?' / RUSH와 중첩!':''}`;}
 }

 function end(){qa('work_end');$('mg-runaway-bonus')?.remove();fxQueue=[];payout=null;if($('mg-payout').matches(':popover-open'))$('mg-payout').hidePopover();s.finished=true;transmissionSound();s.searching=null;s.jobs=[];clearInterval(timer);['mg-tree','mg-training','mg-search'].forEach(id=>$(id).close());$('mg-result-body').innerHTML=`<strong>${fmt(s.total)}</strong><p>전도 실적 · 누적 은총 ${fmt(s.earned)}</p><p>${SKILLS.filter(k=>level(k.id)).map(k=>`${k.name} ${level(k.id)}`).join(' · ')||'오직 수작업으로 이룬 성과'}</p>${s.training?'<p>평가 시간 도착으로 미완료 수련은 반영되지 않았습니다.</p>':''}`;$('mg-result').showModal();render();if(window.HeavenFlow){$('mg-result').close();window.HeavenFlow.review({id:String(s.rngSeed),name:s.name,score:s.total,earned:s.earned,duration:s.duration});}}
 function burst(text){$('mg-burst').textContent=text;$('mg-burst').classList.remove('show');void $('mg-burst').offsetWidth;$('mg-burst').classList.add('show');}
 let soundTimes={},noiseBuffer,soundBus,sendVoice,soundMaster,officeAudioActive=true;
 function setAudioActive(active){officeAudioActive=!!active;if(!active&&audio){if(soundMaster){soundMaster.gain.cancelScheduledValues(audio.currentTime);soundMaster.gain.setValueAtTime(0,audio.currentTime);}if(sendVoice){try{sendVoice.o.stop();}catch{}sendVoice=null;}}}

 function soundOutput(){if(!soundBus){soundBus=audio.createDynamicsCompressor();soundBus.threshold.value=-18;soundBus.ratio.value=6;soundMaster=audio.createGain();soundBus.connect(soundMaster);soundMaster.connect(audio.destination);}return soundBus;}
 function transmissionSound(){
  if(!audio)return;if(soundMaster)soundMaster.gain.setTargetAtTime(!officeAudioActive||s?.finished||document.hidden||window.HeavenQA?.paused?0:1,audio.currentTime,.015);const job=s?.jobs.find(j=>!j.auto)||s?.jobs[0];const on=officeAudioActive&&job&&s.started&&!s.finished&&!document.hidden&&!window.HeavenQA?.paused&&!s.tutorialPaused&&!s.training;
  if(!on){if(sendVoice){sendVoice.g.gain.setTargetAtTime(.0001,audio.currentTime,.025);sendVoice.o.stop(audio.currentTime+.15);sendVoice=null;}return;}
  if(!sendVoice){const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';g.gain.value=0;o.connect(g);g.connect(soundOutput());o.start();sendVoice={o,g};}
  const progress=Math.max(0,Math.min(1,1-job.left/job.duration));sendVoice.o.frequency.setTargetAtTime(180+progress*progress*1600,audio.currentTime,.04);sendVoice.g.gain.setTargetAtTime(job.auto?.018:.035,audio.currentTime,.025);
 }

 function sfx(kind,freq=660){
  if(!sound||!officeAudioActive||s?.finished||document.hidden||window.HeavenQA?.paused)return;
  const now=performance.now();if(now-(soundTimes[kind]||0)<(kind==='type'?38:kind==='delivered'?110:28))return;soundTimes[kind]=now;
  try{
   audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();
   const t=audio.currentTime;
   const note=(hz,dur=.08,offset=0,wave='sine',gain=.045,end=hz)=>{const o=audio.createOscillator(),g=audio.createGain();o.type=wave;o.frequency.setValueAtTime(hz,t+offset);o.frequency.exponentialRampToValueAtTime(Math.max(30,end),t+offset+dur);g.gain.setValueAtTime(.001,t+offset);g.gain.linearRampToValueAtTime(gain,t+offset+.004);g.gain.exponentialRampToValueAtTime(.001,t+offset+dur);o.connect(g);g.connect(soundOutput());o.start(t+offset);o.stop(t+offset+dur+.01);};
   const tap=(dur=.035,gain=.05,cutoff=1800)=>{if(!noiseBuffer){noiseBuffer=audio.createBuffer(1,audio.sampleRate*.3,audio.sampleRate);const d=noiseBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}const n=audio.createBufferSource(),g=audio.createGain(),filter=audio.createBiquadFilter();n.buffer=noiseBuffer;filter.type='lowpass';filter.frequency.value=cutoff;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);n.connect(filter);filter.connect(g);g.connect(soundOutput());n.start(t);n.stop(t+dur);};
   if(kind==='rush-note'){note(freq,.105,0,'square',.028);note(freq/2,.1,0,'triangle',.035);tap(.018,.018,2400);}
   else if(kind==='choir'){
    // Layered vowel formants and a diffuse tail imitate an open 'ah' choir.
    const reverb=audio.createConvolver(),length=Math.floor(audio.sampleRate*2.6),impulse=audio.createBuffer(2,length,audio.sampleRate);
    for(let c=0;c<2;c++){const data=impulse.getChannelData(c);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/length,3)*.24;}
    reverb.buffer=impulse;const wet=audio.createGain();wet.gain.value=.55;reverb.connect(wet);wet.connect(soundOutput());
    [130.81,196,261.63,329.63,392].forEach((hz,index)=>{
     const offset=index*.11,voice=audio.createOscillator(),envelope=audio.createGain(),vibrato=audio.createOscillator(),depth=audio.createGain();
     voice.type='sawtooth';voice.frequency.setValueAtTime(hz*.985,t+offset);voice.frequency.exponentialRampToValueAtTime(hz,t+offset+.6);voice.detune.value=(index%2?1:-1)*4;
     vibrato.frequency.value=4.5+index*.19;depth.gain.value=5;vibrato.connect(depth);depth.connect(voice.detune);
     envelope.gain.setValueAtTime(0,t+offset);envelope.gain.linearRampToValueAtTime(.038,t+offset+.65);envelope.gain.setValueAtTime(.032,t+2.1);envelope.gain.exponentialRampToValueAtTime(.0001,t+3.4);
     const filters=[[760,5,1],[1150,7,.55],[2700,9,.14]].map(([frequency,q,volume])=>{const f=audio.createBiquadFilter(),g=audio.createGain();f.type='bandpass';f.frequency.value=frequency;f.Q.value=q;g.gain.value=volume;voice.connect(f);f.connect(g);g.connect(envelope);return [f,g];});
     envelope.connect(soundOutput());envelope.connect(reverb);voice.start(t+offset);vibrato.start(t+offset);voice.stop(t+3.5);vibrato.stop(t+3.5);
     voice.onended=()=>{voice.disconnect();vibrato.disconnect();depth.disconnect();setTimeout(()=>{envelope.disconnect();filters.flat().forEach(n=>n.disconnect());},2800);};
    });setTimeout(()=>{reverb.disconnect();wet.disconnect();},6500);
   }
   else if(kind==='sheep'){
    const o=audio.createOscillator(),filter=audio.createBiquadFilter(),g=audio.createGain(),lfo=audio.createOscillator(),depth=audio.createGain();
    o.type='sawtooth';o.frequency.setValueAtTime(330,t);o.frequency.exponentialRampToValueAtTime(175,t+.62);filter.type='bandpass';filter.frequency.value=1250;filter.Q.value=2.5;
    lfo.frequency.value=13;depth.gain.value=32;lfo.connect(depth);depth.connect(o.frequency);
    g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(.11,t+.07);g.gain.exponentialRampToValueAtTime(.001,t+.7);
    o.connect(filter);filter.connect(g);g.connect(soundOutput());o.start(t);lfo.start(t);o.stop(t+.75);lfo.stop(t+.75);o.onended=()=>[o,filter,g,lfo,depth].forEach(n=>n.disconnect());
   }
   else if(kind==='pastoral'){note(freq,.53,0,'sine',.045);note(freq/2,.45,0,'triangle',.025);note(freq*1.5,.37,.08,'sine',.012);}
   else if(kind==='training-start'){[262,330,392].forEach((f,i)=>note(f,.6,i*.12,'sine',.04));}
   else if(kind==='training-step'){note(freq,.5,0,'triangle',.025);note(freq*2,.35,.08,'sine',.02);}
   else if(kind==='type'){tap(.025,.035,1100+Math.random()*1700);note(180+Math.random()*100,.035,0,'triangle',.02,90);}
   else if(kind==='select'){tap(.03,.04);note(700,.075,0,'sine',.06,1050);}
   else if(kind==='open'){note(420,.07,0,'triangle',.04,630);note(840,.10,.055,'sine',.04);}
   else if(kind==='close'){note(520,.08,0,'triangle',.035,230);}
   else if(kind==='send'){tap(.19,.06,4500);note(240,.19,0,'sine',.045,1500);note(1100,.09,.15,'triangle',.025);}
   else if(kind==='delivered'){tap(.055,.04,4200);[784,988,1175,1568].forEach((f,i)=>{note(f,.27,i*.065,'sine',.065);note(f*2,.19,i*.065,'sine',.018);});note(196,.28,0,'triangle',.05);}
   else if(kind==='error'){[660,440,660].forEach((f,i)=>note(f,.12,i*.15,'square',.035));}
   else if(kind==='failure'){tap(.14,.07,1300);[330,247,165].forEach((f,i)=>note(f,.2,i*.12,'sawtooth',.035,f*.8));}
   else if(kind==='startup'){[523,659,784,1047,1319,1568].forEach((f,i)=>{note(f,.24,i*.075,'triangle',.07);note(f*2,.18,i*.075,'sine',.025);});[262,330,392,523].forEach(f=>note(f,.65,.48,'sine',.035));tap(.12,.07,6000);}
   else if(kind==='upgrade'){[523,784,1047,1568,2093].forEach((f,i)=>note(f,.3,i*.065,'triangle',.055));}
   else if(kind==='fever'){[784,1047,784,1319,1568].forEach((f,i)=>note(f,.19,i*.1,'square',.035));}
   else if(kind==='spark')note(freq,.12,0,'triangle',.025,freq*1.3);
   else{tap(.025,.035,1400);note(320,.045,0,'sine',.025,180);}
  }catch{}
 }
 document.addEventListener('visibilitychange',()=>transmissionSound());
 function tone(freq){sfx('spark',freq);}
 function inputWarning(title, detail){qa('input_error',{reason:title});
  root.querySelector('.mg-input-warning')?.remove();
  const dialog=document.createElement('dialog');dialog.className='mg-input-warning';dialog.setAttribute('aria-label','전송되지 않았습니다');
  dialog.innerHTML='<div class="ad-window-title">Glory Mail — Message Check</div><div class="ad-input-page"><div class="ad-alert-heading"><i aria-hidden="true">!</i><h2>ACTION<br>REQUIRED</h2><i aria-hidden="true">!</i></div><div class="ad-input-subtitle">잠깐! 아직 보낼 수 없습니다.</div><strong class="ad-error-reason"></strong><p class="ad-error-detail"></p><button class="ad-fix-button">지금 수정하기 <span>CLICK HERE!</span></button><small>입력한 내용은 그대로 남아 있습니다.</small><div class="ad-bottom-slogan">CHECK YOUR MESSAGE!</div></div><div class="ad-window-status">✉ 전송 보류 · GLORY MAIL 98</div>';

  dialog.querySelector('strong').textContent=title;dialog.querySelector('p').textContent=detail;
  const close=()=>{dialog.close();dialog.remove();};dialog.querySelector('button').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});root.append(dialog);dialog.showModal();sfx('error');
 }
 function showMailFailure(failed, passed){
  root.querySelector('.mg-failure-toast')?.remove();
  const toast=document.createElement('section');toast.className='mg-failure-toast';toast.setAttribute('role','alert');
  toast.innerHTML=`<div class="ad-window-title">Heaven Post — Delivery Alert</div><div class="ad-failure-page"><div class="ad-failure-kicker">천국 우편국 긴급 속보</div><h2>DELIVERY<br><em>FAILED!</em></h2><div class="ad-failure-strip">${passed?'일부 메일이 도착하지 못했습니다!':'당신의 메일이 도착하지 못했습니다!'}</div><div class="ad-delivery-count"><span class="ad-stop" aria-hidden="true">STOP<br>!</span><strong>${fmt(failed)}건 실패${passed?`<small>${fmt(passed)}건은 배달 완료</small>`:''}</strong><img src="Resources/HeavenComponents/icons/winged-mail.png" alt=""></div><p>${level('retry')?'자동 재시도 중입니다.<br>천사가 다시 배달하고 있습니다!':'이번 수신인들은 명단에서 처리되었습니다.<br>실패한 메일에는 보상이 지급되지 않습니다.'}</p><div class="ad-failure-banner">${level('retry')?'TRY AGAIN! ↻':'NO DELIVERY. NO GLORY.'}</div></div><div class="ad-window-status">${level('retry')?'재연결 중…':'반송 통지 · 잠시 후 자동으로 닫힙니다.'}</div><div class="ad-expiry"><i style="animation-duration:${level('retry')?1800:3600}ms"></i></div>`;

  root.append(toast);sfx('failure');
  setTimeout(()=>toast.remove(),level('retry')?1800:3600);
 }
 function collectGrace(reward){
  const wallet=$('mg-wallet'), source=$('mg-send'), r=wallet.getBoundingClientRect();
  const origin=source.getBoundingClientRect();
  const chip=document.createElement('div');chip.className='grace-pickup';chip.setAttribute('aria-hidden','true');
  chip.innerHTML=`<img src="Resources/HeavenComponents/icons/coins.png" alt=""><b>+${fmt(reward)}</b>`;
  const x=origin.width&&origin.top>0?Math.min(innerWidth-110,origin.x+origin.width*.55):innerWidth*.55;
  const y=origin.width&&origin.top>0?Math.min(innerHeight-80,origin.y):innerHeight*.5;
  chip.style.left=x+'px';chip.style.top=y+'px';root.append(chip);
  while(root.querySelectorAll('.grace-pickup').length>8)root.querySelector('.grace-pickup').remove();
  const destinationX=Math.max(0,Math.min(innerWidth-80,r.x+24));
  const destinationY=Math.max(0,Math.min(innerHeight-50,r.y+16));
  const animation=chip.animate(reduced?[
   {opacity:1},{opacity:0}
  ]:[{transform:'translate(0,0) scale(.7)',opacity:0},{transform:'translate(0,-35px) scale(1.15)',opacity:1,offset:.2},{transform:'translate(0,-45px) scale(1)',opacity:1,offset:.48},{transform:`translate(${destinationX-x}px,${destinationY-y}px) scale(.35)`,opacity:.8}],{duration:reduced?550:1000,easing:'ease-in',fill:'forwards'});
  animation.onfinish=()=>{chip.remove();if(!wallet.isConnected)return;wallet.animate([{filter:'brightness(1)',transform:'scale(1)'},{filter:'brightness(1.35)',transform:'scale(1.045)'},{filter:'brightness(1)',transform:'scale(1)'}],{duration:reduced?0:260});};
 }
 function delivery(count,reward){
  // Visual variety must not consume the random sequence used for delivery success.
  const serial=s.deliverySerial=(s.deliverySerial||0)+1;
  const variants=[['dove','crown','비둘기 부장님 납시오!','특급 승진? 아니, 특급 배송!'],['winged-mail','trumpet','봉투가 나팔을 분다!','한 통 더! 한 영혼 더!'],['trophy','angel-wings','실적이 날아오른다!','축하합니다! 다음 업무가 도착했습니다.']];
  const [actor,hat,title,note]=variants[(serial-1)%variants.length];
  const existing=root.querySelectorAll('.mg-mail-parade');
  // Keep rapid automatic deliveries readable instead of stacking a wall of effects.
  if(existing.length>=2){const newest=existing[existing.length-1];newest.dataset.count=Number(newest.dataset.count)+count;newest.querySelector('.parade-count').textContent=fmt(Number(newest.dataset.count))+'통 배달 완료!';return;}
  const parade=document.createElement('div');parade.className='mg-mail-parade parade-'+actor;parade.dataset.count=count;parade.setAttribute('aria-hidden','true');
  parade.style.top=(serial%2?48:65)+'%';
  parade.innerHTML=`<div class="parade-trail">✦　✧　✦</div><div class="parade-mascot"><img class="parade-actor" src="Resources/HeavenComponents/icons/${actor}.png" alt=""><img class="parade-hat" src="Resources/HeavenComponents/icons/${hat}.png" alt=""></div><div class="parade-shout"><small>${title}</small><b class="parade-count">${fmt(count)}통 배달 완료!</b><em>${note}</em></div><span class="parade-stars">✧<br>✦</span>`;
  root.append(parade);
  const distance=Math.min(innerWidth-30,650);
  const animation=parade.animate(reduced?[{opacity:0},{opacity:1,offset:.15},{opacity:1,offset:.8},{opacity:0}]:[
   {transform:`translate(-${distance}px,25px) rotate(-9deg) scale(.7)`,opacity:0},
   {transform:'translate(-50%,0) rotate(3deg) scale(1.06)',opacity:1,offset:.22},
   {transform:'translate(-48%,-12px) rotate(-2deg) scale(1)',opacity:1,offset:.7},
   {transform:`translate(${innerWidth/2+80}px,-65px) rotate(10deg) scale(.8)`,opacity:0}
  ],{duration:reduced?1300:2700,easing:'ease-in-out',fill:'forwards'});
  animation.onfinish=()=>parade.remove();setTimeout(()=>parade.remove(),3000);
 }

 function raiseFX(){const c=$('mail-fx');if(c.showPopover){if(c.matches(':popover-open'))c.hidePopover();c.showPopover();}}
 function celebrate(title,count,note,gold){
  const now=performance.now();
  if(now-lastFX<180&&!gold)return;
  lastFX=now;raiseFX();
  payout={start:now,end:now+1500,count,title};
  $('mg-payout-title').textContent=title;$('mg-payout-note').textContent=note;
  $('mg-payout').classList.toggle('big',!reduced&&(gold||count>=20));
  if(!$('mg-payout').matches(':popover-open'))$('mg-payout').showPopover();
  const hits=reduced?2:Math.min(16,4+Math.ceil(Math.log2(count+1))*2);
  for(let i=0;i<hits&&fxQueue.length<60;i++)fxQueue.push({at:now+i*55,n:reduced?2:10+Math.min(count,18),gold:gold||i%3===0,freq:330+[0,4,7,12,16,19][i%6]*35});
  if(!reduced){const w=root.querySelector('.mg-work');w.classList.remove('impact');void w.offsetWidth;w.classList.add('impact');}
  burst(title);
 }
 function trainingFX(t){
  const progress=1-t.left/t.total,stage=Math.min(3,Math.floor(progress*4));
  $('mg-training').dataset.stage=String(stage);
  const words=['CONNECT · 천국 회선 접속','DOWNLOAD · 은총 수신 중','REACH!! · 각성 임박','SUPER REACH!! · 설치 완료 직전'];
  $('mg-training-phase').textContent=words[stage];
  const beat=Math.floor((t.total-t.left)*(reduced?2:5+stage*4));
  if(t.beat!==beat){t.beat=beat;const chars=['✟','✉','7','✦','★'];$('mg-training').querySelectorAll('.mg-training-reels span').forEach((el,i)=>el.textContent=t.left<.7?'7':chars[(beat+i*2)%chars.length]);if(!reduced)emit(3+stage*2,stage>1);}
  const second=Math.ceil(t.left);if(t.second!==second){t.second=second;tone(330+stage*220);}
 }
 function emit(n,gold){if(reduced)n=Math.min(n,4);for(let i=0;i<n&&particles.length<420;i++)particles.push({x:innerWidth*(.2+Math.random()*.6),y:innerHeight*(.48+Math.random()*.15),vx:(Math.random()-.5)*1200,vy:-180-Math.random()*800,life:.7+Math.random(),age:0,gold});}
 let drawLast=0;
 function draw(now){
  if(!document.hidden){const ready=fxQueue.filter(e=>e.at<=now);fxQueue=fxQueue.filter(e=>e.at>now);ready.forEach(e=>{emit(e.n,e.gold);tone(e.freq);});}else{fxQueue=[];}
  if(payout){$('mg-payout-count').textContent=fmt(payout.count*Math.min(1,(now-payout.start)/550));if(now>=payout.end){$('mg-payout').hidePopover();payout=null;}}
  const c=$('mail-fx');if(!c)return;const ctx=c.getContext('2d');const dt=Math.min(.04,(now-drawLast)/1000||.016);drawLast=now;if(c.width!==innerWidth||c.height!==innerHeight){c.width=innerWidth;c.height=innerHeight;}ctx.clearRect(0,0,c.width,c.height);particles=particles.filter(p=>p.age<p.life);for(const p of particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=400*dt;ctx.globalAlpha=1-p.age/p.life;ctx.fillStyle=p.gold?'#ffcb42':'#e9fbff';ctx.shadowColor=p.gold?'#ffad00':'#73aaff';ctx.shadowBlur=12;ctx.font=p.gold?'bold 30px Courier New':'bold 26px Courier New';ctx.fillText(p.gold?'✦':'✉',p.x,p.y);}ctx.globalAlpha=1;frame=requestAnimationFrame(draw);}

 let onlineBook='',onlineSkill='',onlineEvent=0,onlineFirstHint=false;
 function applyOnline(snapshot,events){
  if(!root){start(snapshot.name,{remote:true,seed:snapshot.rngSeed});$('mg-intro').close();sfx('startup');}
  window.HeavenNet?.restoreMail();const previousSkills={...s.skills},windows={...s.windows},tabName=s.tab,selected=s.selected.filter(id=>snapshot.book.includes(id)),motion=s.bonusMotion;
  const tourActive=root.classList.contains('first-skill-tour');s={...snapshot,settledJobs:new Set(snapshot.settledJobs),windows,tab:tabName,selected,bonusMotion:motion};s.tutorialPaused=tourActive;
  if(s.skills.split&&!previousSkills.split){s.windows={list:true,mail:true};s.tab='mail';}
  if(s.skills.template&&!previousSkills.template)$('mg-body').value=BODY;
  const bookKey=JSON.stringify([s.book,s.skills,s.selected]);if(bookKey!==onlineBook){onlineBook=bookKey;renderList();}
  for(const e of events){if(e.seq<=onlineEvent)continue;onlineEvent=e.seq;
   if(e.type==='input_error'){window.HeavenNet?.rejectSend(e);inputWarning(e.reason,e.detail);}
   if(e.type==='send'){window.HeavenNet?.sent(e);s.selected=[];renderList();sfx('send');}
   if(e.type==='delivery'){if(e.passed){const quantity=e.passed*(e.automatic&&!level('rapture')?1:echo());collectGrace(e.reward);delivery(quantity,e.reward);rewardBlast(quantity,e.reward,e.automatic);emit(65,true);sfx('delivered');message(`+${quantity} 전도 / +${e.reward} 은총`);}else if(!e.automatic)showMailFailure(e.failed,0);if(!e.automatic){$('mg-delivery-summary').hidden=false;$('mg-delivery-summary').textContent=`성공 ${e.passed}명 / 실패 ${e.failed}명`;}}
   if(e.type==='skill_unlocked'){sfx('upgrade');if(e.skill==='template')$('mg-body').value=BODY;}
   if(e.type==='search_start')sfx('sheep');if(e.type==='bonus_claim'){sfx('fever');emit(120,true);}
  }
  const hasSkill=Object.values(s.skills).some(Boolean);
  if((hasSkill||s.finished)&&root.classList.contains('first-skill-tour')){$('mg-first-skill').close();finishFirstSkill();}
  if(!s.finished&&!hasSkill&&!root.classList.contains('first-skill-tour')&&!onlineFirstHint&&!s.training&&!s.searching&&!s.jobs.length&&SKILLS.some(k=>eligible(k)&&s.points>=cost(k))){s.tutorialSeen=false;onlineFirstHint=true;if($('mg-tree').open)$('mg-tree').close();checkFirstSkill();$('mg-first-skill').querySelector('.blessing-wire span').textContent='첫 스킬 안내';$('mg-first-skill').querySelector('.blessing-clock').innerHTML='첫 스킬을 배우면 업무를 계속할 수 있습니다.<br><b>멀티플레이의 공용 근무 시간은 계속 흐릅니다.</b>';}
  if(s.searching){const t=s.searching;$('mg-search-count').textContent=`${t.count}명 찾기 · ${Math.max(0,t.left).toFixed(1)}초`;$('mg-search-progress').style.width=`${100*(1-t.left/t.total)}%`;if(!$('mg-search').open)$('mg-search').showModal();}else $('mg-search').close();
  if(s.training){const t=s.training;$('mg-tree').close();$('mg-training-name').textContent=SKILLS.find(k=>k.id===t.id).name;$('mg-training-count').textContent=`${Math.ceil(t.left)}초`;$('mg-training-progress').style.width=`${100*(1-t.left/t.total)}%`;if(!$('mg-training').open){$('mg-training').showModal();sfx('training-start');}}else $('mg-training').close();
  if(s.bonusOffer&&!$('mg-runaway-bonus')){const b=document.createElement('button');b.id='mg-runaway-bonus';b.className='runaway-bonus';b.innerHTML=`<small>천국 긴급 특혜!</small><b>은총 ×${s.bonusRound%3===0?3:2}</b><span>잡으면 8초! CLICK!!</span>`;b.onclick=()=>window.HeavenNet.command({type:'bonus'});root.append(b);s.bonusMotion={x:innerWidth*.3,y:innerHeight*.25,vx:innerWidth*.3,vy:innerHeight*.3,bounces:0};}else if(!s.bonusOffer)$('mg-runaway-bonus')?.remove();
  root.classList.toggle('bonus-active',s.bonusLeft>0);$('mg-bonus-clock').hidden=!s.bonusLeft;$('mg-bonus-clock').textContent=`✦ 은총 ×${s.bonusMult} · ${Math.ceil(s.bonusLeft)}초`;render();
 }
 window.HeavenMail={start};
 if(window.HeavenMail)window.HeavenMail.setAudioActive=setAudioActive;
 if(window.HeavenMail)window.HeavenMail.applyOnline=applyOnline;
})();


