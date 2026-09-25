/* سلسلة الظل — 30 جملة قصيرة من الكوربس: استمع ← اكتب ← قيّم (سهل/صعب/أعد).
   en_shadow.chain = {idx:{box:أيام,last:ms,acc:[1|0...]}} — يتعايش مع بيانات التظليل في نفس المفتاح. */
const app = document.getElementById('app');
const SKEY = 'en_shadow';
const DAY = 86400000;

const CHAIN = [
'Did you make a mistake?',
'We made a decision together.',
'I get up at six.',
'She got a present yesterday.',
'We get home late.',
'The journey took three days.',
'He is on a business trip.',
'How was your trip to London?',
'He runs like the wind.',
'Three birds sat there.',
'I want to speak fluently.',
'What is it about?',
'I wake up at seven.',
'I eat bread and cheese for breakfast.',
'The bus is often late.',
'I read a book on the bus.',
'It wakes up when it is hungry.',
'Can I go there by bus?',
'Excuse me, where is the museum?',
'The market is big and crowded.',
'I pay the man ten dirhams.',
'Then I walk home slowly.',
'Omar found a wallet on the train.',
'It was full of money and cards.',
'He looked inside for a name.',
'Not really. I sleep very late.',
'Her colleagues welcomed her warmly.',
'At first she made many mistakes.',
'Inside lay a letter he had never sent.',
'Some words must be said, even late.',
];

function loadS(){ try{ return JSON.parse(localStorage.getItem(SKEY)||'{}'); }catch(e){ return {}; } }
function saveS(d){ localStorage.setItem(SKEY, JSON.stringify(d)); }
function rec(i){ const d=loadS(); return (d.chain||{})[i]||{box:0,last:0,acc:[]}; }
function writeRec(i, ok){
  const d = loadS(); (d.chain ||= {});
  const r = d.chain[i] ||= {box:0,last:0,acc:[]};
  r.acc = (r.acc||[]).concat(ok?1:0).slice(-8);
  r.last = Date.now();
  r.box = ok ? 2 : 0;
  saveS(d);
}
const dueIdx = () => CHAIN.map((_,i)=>i).filter(i=>{ const r=rec(i); return !r.last || Date.now()-r.last >= r.box*DAY; });
function weakestIdx(){
  const d = loadS();
  return CHAIN.map((_,i)=>{
    const r = (d.chain||{})[i];
    const a = r && r.acc && r.acc.length ? r.acc : null;
    return {i, n: a?a.length:0, pct: a? Math.round(a.reduce((s,x)=>s+x,0)/a.length*100):100};
  }).filter(x=>x.n>=1 && x.pct<100).sort((a,b)=>a.pct-b.pct||b.n-a.n).slice(0,8).map(x=>x.i);
}
function shuf(a){ const x=[...a]; for(let i=x.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; } return x; }
const ttsOK = () => window.speechSynthesis && speechSynthesis.getVoices().some(v=>/^en/i.test(v.lang));
function say(t){
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.95;
  speechSynthesis.speak(u);
}
if(window.speechSynthesis) speechSynthesis.onvoiceschanged = ()=>{};

let queue = [], qi = 0, score = 0, listened = false;
function viewHome(){
  const due = dueIdx().length;
  const d = loadS();
  const seen = Object.values(d.chain||{}).filter(r=>r.last).length;
  const w = weakestIdx();
  const tt = ttsOK();
  app.innerHTML = `<div class="head"><h2>سلسلة الظل — ${CHAIN.length} جملة</h2><span class="rstreak">مستحقة: ${due}</span></div>
  ${!tt?'<div class="card"><div class="body" style="color:var(--warn);text-align:center">النطق غير متاح بجهازك — فعّل أصوات النظام للاستفادة الكاملة.</div></div>':''}
  <div class="card"><div class="body" style="text-align:center">
    استمع للجملة بلا نص ← اكتبها ← قيّم نفسك. «سهل» يؤجّلها يومين، «صعب» يعيدها بنفس الجلسة، «أعد» تسمعها فوراً من جديد. ${seen?`مررت بـ ${seen}/${CHAIN.length}.`:''}
    <div class="grades" style="justify-content:center">
      <button class="btn" onclick="startChain(false)">ابدأ (${Math.min(due||CHAIN.length,15)})</button>
      ${w.length?`<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="startChain(true)">راجع الأضعف ${w.length} ←</button>`:''}
    </div></div></div>
  ${w.length?`<div class="card"><div class="body">${w.map(i=>{
    const r=rec(i); const pct=Math.round(r.acc.reduce((s,x)=>s+x,0)/r.acc.length*100);
    return `<div class="cbar"><span class="cw" dir="ltr">${esc(CHAIN[i].slice(0,26))}${CHAIN[i].length>26?'…':''}</span><span class="ctr"><span class="cfl" style="width:${100-pct}%"></span></span><span class="cv">${pct}% (${r.acc.length})</span></div>`;
  }).join('')}</div></div>`:''}`;
}
function startChain(weak){
  score = 0;
  queue = weak ? weakestIdx() : (dueIdx().length? dueIdx() : shuf(CHAIN.map((_,i)=>i))).slice(0,15);
  qi = 0;
  drawListen();
}
function drawListen(){
  const i = queue[qi];
  listened = false;
  app.innerHTML = `<div class="head"><h2>الجملة ${qi+1}/${queue.length}</h2><span class="muted">ناجحة ${score}</span></div>
  <div class="quiz"><div class="q" style="text-align:center">
    <div class="muted">استمع ثم اكتب ما سمعت — النص مخفي</div>
    ${ttsOK()?'<button class="btn" style="margin:10px auto;display:block" onclick="playCur()">استمع 🔊</button>':'<div style="color:var(--warn);margin:10px">النطق غير متاح — اكتب الجملة من ذاكرتك إن كنت تعرفها</div>'}
    <input class="inp" dir="ltr" id="cIn" autocomplete="off" style="width:100%;max-width:420px;margin-top:8px" placeholder="اكتب الجملة كاملة…">
    <button class="btn" style="margin-top:10px" onclick="checkC()">كشف وقارن</button>
    <div id="cRes"></div>
  </div></div>`;
  const el = document.getElementById('cIn');
  el.onkeydown = e=>{ if(e.key==='Enter') checkC(); };
  if(ttsOK()) say(CHAIN[i]);
}
function playCur(){ say(CHAIN[queue[qi]]); }
function checkC(){
  const i = queue[qi];
  const el = document.getElementById('cIn');
  if(el.disabled) return;
  const d = dictDiff(CHAIN[i], el.value);
  el.disabled = true;
  const color = d.pct>=90?'var(--ok)': d.pct>=60?'var(--warn)':'var(--bad)';
  document.getElementById('cRes').innerHTML = `<div dir="ltr" style="text-align:left;margin-top:14px;font-size:17px;line-height:1.9">${d.html}</div>
  <div style="margin-top:6px;font-size:14px">الدقة: <b style="color:${color}">${d.pct}%</b>${d.extra?` · ${d.extra} زائدة`:''}</div>
  ${d.missed.length?`<div style="font-size:13px;color:var(--bad)">ناقصة: ${d.missed.map(x=>`<b dir="ltr">${esc(x)}</b>`).join(' ')}</div>`:''}
  <div class="grades" style="justify-content:center;margin-top:12px">
    <button class="btn" onclick="gradeC(1)">سهل ✓</button>
    <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="gradeC(0)">صعب</button>
    <button class="btn" style="background:var(--navy-3);color:var(--warn)" onclick="gradeC(-1)">أعد ⟲</button>
  </div>`;
}
function gradeC(g){
  const i = queue[qi];
  if(g===1){ writeRec(i,true); score++; qi++; }
  else if(g===0){ writeRec(i,false); queue.push(i); qi++; }
  else { drawListen(); return; }
  if(qi >= queue.length) endChain(); else drawListen();
}
function endChain(){
  const w = weakestIdx();
  app.innerHTML = `<div class="quiz"><div class="q" style="text-align:center">
    <div class="empty">انتهت السلسلة — ناجحة ${score}/${queue.length}</div>
    <div class="grades"><button class="btn" onclick="viewHome()">السلسلة ←</button><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="startChain(false)">جولة أخرى</button></div>
  </div></div>
  ${w.length?`<div class="head" style="margin-top:14px"><h2>أضعف ${w.length} الآن</h2></div>
  <div class="card"><div class="body">${w.map(i=>{
    const r=rec(i); const pct=Math.round(r.acc.reduce((s,x)=>s+x,0)/r.acc.length*100);
    return `<div class="cbar"><span class="cw" dir="ltr">${esc(CHAIN[i].slice(0,26))}${CHAIN[i].length>26?'…':''}</span><span class="ctr"><span class="cfl" style="width:${100-pct}%"></span></span><span class="cv">${pct}% (${r.acc.length})</span></div>`;
  }).join('')}<div class="grades"><button class="btn" onclick="startChain(true)">راجعها ←</button></div></div></div>`:''}`;
}

viewHome();
