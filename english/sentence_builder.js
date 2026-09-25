/* ركّب الجملة — 25 جملة (5-9 كلمات) متصاعدة بالطول: اضغط الكلمات بالترتيب.
   en_builder = {idx:{ok,tries}} */
const app = document.getElementById('app');
const BKEY = 'en_builder';
const MAXTRY = 3;

const SENTS = [
'I get up at six.',
'I wake up at seven.',
'She works as a doctor.',
'He runs like the wind.',
'Sara has a small cat.',
'Honesty is its own reward.',
'Did you make a mistake?',
'She got a present yesterday.',
'I walk to the bus stop.',
'The market is big and crowded.',
'I do my homework every day.',
'Can I go there by bus?',
'Excuse me, where is the museum?',
'Her manager was patient and kind.',
'He is on a business trip.',
'At first she made many mistakes.',
'I brush my teeth and wash my face.',
'Then I make a cup of coffee.',
'I eat bread and cheese for breakfast.',
'Omar found a wallet on the train.',
'It was full of money and cards.',
'The cat plays with a red ball.',
'She learned the work in two weeks.',
'Inside lay a letter he had never sent.',
'His hands trembled as he read the first line.',
];

function loadB(){ try{ return JSON.parse(localStorage.getItem(BKEY)||'{}'); }catch(e){ return {}; } }
function saveB(d){ localStorage.setItem(BKEY, JSON.stringify(d)); }
function rec(i){ return loadB()[i]||{ok:0,tries:0}; }
function hardest(){
  const d = loadB();
  return SENTS.map((s,i)=>{
    const r = d[i]||{ok:0,tries:0};
    return {i,s,n:r.tries, pct:r.tries? Math.round(r.ok/r.tries*100):100};
  }).filter(x=>x.n>=1 && x.pct<100).sort((a,b)=>a.pct-b.pct||b.n-a.n).slice(0,8);
}
function shuf(a){ const x=[...a]; for(let i=x.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; } return x; }
const ttsOK = () => window.speechSynthesis && speechSynthesis.getVoices().some(v=>/^en/i.test(v.lang));
function say(t){
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.95;
  speechSynthesis.speak(u);
}
if(window.speechSynthesis) speechSynthesis.onvoiceschanged = ()=>{};

let queue = [], qi = 0, score = 0, cur = -1, tries = 0, pool = [], built = [];
function viewHome(){
  const d = loadB();
  const seen = Object.keys(d).length;
  const totOk = Object.values(d).reduce((s,r)=>s+(r.ok||0),0);
  const totTr = Object.values(d).reduce((s,r)=>s+(r.tries||0),0);
  const h = hardest();
  app.innerHTML = `<div class="head"><h2>ركّب الجملة — ${SENTS.length} جملة</h2><span class="rstreak">${totTr?`نجاح ${totOk}/${totTr}`:''}</span></div>
  <div class="card"><div class="body" style="text-align:center">
    اضغط الكلمات المخلوطة بترتيبها الصحيح — ${MAXTRY} محاولات لكل جملة، وتصعّد تلقائي بالطول. ${seen?`أنجزت ${seen}/${SENTS.length}.`:''}
    <div class="grades" style="justify-content:center">
      <button class="btn" onclick="startSB()">ابدأ ←</button>
      ${h.length?`<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="startSB(true)">أصعب ${h.length} ←</button>`:''}
    </div></div></div>
  ${h.length?`<div class="head"><h2>أصعب الجمل عندك</h2></div>
  <div class="card"><div class="body">${h.map(x=>`<div class="cbar"><span class="cw" dir="ltr">${esc(x.s.slice(0,26))}${x.s.length>26?'…':''}</span><span class="ctr"><span class="cfl" style="width:${100-x.pct}%"></span></span><span class="cv">${x.pct}% (${x.n})</span></div>`).join('')}</div></div>`:''}`;
}
function startSB(hard){
  score = 0;
  const untried = SENTS.map((_,i)=>i).filter(i=>!rec(i).tries);
  queue = hard ? hardest().map(x=>x.i) : (untried.length? untried : SENTS.map((_,i)=>i));
  qi = 0;
  drawSB();
}
function drawSB(){
  cur = queue[qi]; tries = 0;
  pool = shuf(SENTS[cur].split(/\s+/).map((w,k)=>[w,k]));
  built = [];
  renderSB();
}
function renderSB(res){
  const s = SENTS[cur];
  app.innerHTML = `<div class="head"><h2>الجملة ${qi+1}/${queue.length} <span class="muted">(${s.split(' ').length} كلمات)</span></h2><span class="muted">مضبوطة ${score}</span></div>
  <div class="quiz"><div class="q">
    <div dir="ltr" style="display:flex;flex-wrap:wrap;gap:6px;min-height:44px;padding:8px;background:var(--navy-3);border-radius:10px;margin-bottom:10px">
      ${built.map(([w,k],x)=>`<button class="fc-chip" onclick="unbuild(${x})" style="cursor:pointer">${esc(w)}</button>`).join('')||'<span style="color:var(--muted);font-size:13px">← اضغط الكلمات بالترتيب</span>'}
    </div>
    <div dir="ltr" style="display:flex;flex-wrap:wrap;gap:6px">
      ${pool.map(([w,k],x)=>`<button class="fc-chip" onclick="build(${x})" style="cursor:pointer">${esc(w)}</button>`).join('')}
    </div>
    <div id="sbRes">${res||''}</div>
    <div class="muted" style="margin-top:8px;font-size:12px">المحاولة ${tries+1}/${MAXTRY}</div>
  </div></div>`;
}
function build(x){
  built.push(pool.splice(x,1)[0]);
  if(!pool.length) checkSB();
  else renderSB();
}
function unbuild(x){
  pool.push(built.splice(x,1)[0]);
  renderSB();
}
function checkSB(){
  tries++;
  const s = SENTS[cur];
  const ok = built.map(b=>b[0]).join(' ') === s;
  const d = loadB();
  const r = d[cur] ||= {ok:0,tries:0};
  r.tries++; if(ok) r.ok++;
  saveB(d);
  if(ok){
    score++;
    renderSB(`<div dir="ltr" style="margin-top:12px;text-align:left;font-size:16px;color:var(--ok)">✓ ${esc(s)}</div>
    ${ttsOK()?'<button class="btn" style="margin-top:8px" onclick="say(SENTS[cur])">استمع 🔊</button>':''}
    <button class="btn" style="display:block;margin:8px auto 0" onclick="nextSB()">${qi+1<queue.length?'التالي ←':'النتيجة ←'}</button>`);
    if(ttsOK()) say(s);
  } else {
    const left = MAXTRY - tries;
    if(left>0){
      renderSB(`<div dir="ltr" style="margin-top:12px;text-align:left;font-size:16px"><span style="color:var(--bad)">✗ ${esc(built.map(b=>b[0]).join(' '))}</span></div>
      <div dir="ltr" style="text-align:left;font-size:14px;color:var(--muted);margin-top:4px">الصحيحة: ${esc(s)}</div>
      <button class="btn" style="display:block;margin:8px auto 0" onclick="resetSB()">حاول ثانية (${left} متبقية) ⟲</button>`);
    } else {
      renderSB(`<div dir="ltr" style="margin-top:12px;text-align:left;font-size:16px"><span style="color:var(--bad)">✗ ${esc(built.map(b=>b[0]).join(' '))}</span></div>
      <div dir="ltr" style="text-align:left;font-size:15px;margin-top:4px">الصحيحة: <b style="color:var(--ok)">${esc(s)}</b></div>
      ${ttsOK()?'<button class="btn" style="margin-top:8px" onclick="say(SENTS[cur])">استمع 🔊</button>':''}
      <button class="btn" style="display:block;margin:8px auto 0" onclick="nextSB()">${qi+1<queue.length?'التالي ←':'النتيجة ←'}</button>`);
      if(ttsOK()) say(s);
    }
  }
}
function resetSB(){
  pool = shuf(pool.concat(built));
  built = [];
  renderSB();
}
function nextSB(){
  qi++;
  if(qi >= queue.length) endSB(); else drawSB();
}
function endSB(){
  const h = hardest();
  app.innerHTML = `<div class="quiz"><div class="q" style="text-align:center">
    <div class="empty">انتهت — مضبوطة ${score}/${queue.length}</div>
    <div class="grades"><button class="btn" onclick="viewHome()">ركّب الجملة ←</button><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="startSB()">جولة أخرى</button></div>
  </div></div>
  ${h.length?`<div class="head" style="margin-top:14px"><h2>أصعب ${h.length} جمل</h2></div>
  <div class="card"><div class="body">${h.map(x=>`<div class="cbar"><span class="cw" dir="ltr">${esc(x.s.slice(0,26))}${x.s.length>26?'…':''}</span><span class="ctr"><span class="cfl" style="width:${100-x.pct}%"></span></span><span class="cv">${x.pct}% (${x.n})</span></div>`).join('')}
  <div class="grades"><button class="btn" onclick="startSB(true)">راجعها ←</button></div></div></div>`:''}`;
}

viewHome();
