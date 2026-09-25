/* مختبر الأزواج الدنيا — 30 زوجاً صوتياً: تسمع كلمة عشوائية من الزوج (TTS) وتختار أيهما.
   10 جولات. en_pairs = {pairs:{key:{n,ok}}, days:{date:{n,ok}}} — أضعف 5 كمخطط أعمدة. */
const app = document.getElementById('app');
const PKEY = 'en_pairs';
const ROUNDS = 10;

const PAIRS = [
 ['ship','sheep'],['bat','bet'],['light','right'],['bit','beat'],['cat','cut'],
 ['full','fool'],['hair','here'],['bad','bed'],['man','men'],['pen','pan'],
 ['live','leave'],['tin','thin'],['day','they'],['sank','thank'],['walk','work'],
 ['coat','caught'],['pull','pool'],['vest','west'],['fan','van'],['rice','lice'],
 ['ship','chip'],['bat','pat'],['seat','sit'],['fear','fair'],['law','low'],
 ['heart','hurt'],['cap','cup'],['dog','dock'],['wine','vine'],['sale','shell'],
];

function loadP(){ try{ return JSON.parse(localStorage.getItem(PKEY)||'{}'); }catch(e){ return {}; } }
function saveP(p){ localStorage.setItem(PKEY, JSON.stringify(p)); }
function ttsOn(){ try{ return speechSynthesis.getVoices().some(v=>/^en([-_]|$)/i.test(v.lang)); }catch(e){ return false; } }
function speak(t){ try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.8; speechSynthesis.speak(u); }catch(e){} }
function weakest(){
  const p = loadP().pairs || {};
  return Object.entries(p).filter(([,v])=>v.n>=2)
    .map(([k,v])=>({k, n:v.n, ok:v.ok, pct:Math.round(v.ok/v.n*100)}))
    .sort((a,b)=>a.pct-b.pct || b.n-a.n).slice(0,5);
}

let rq = [], ri = 0, rscore = 0, cur = null;
function viewHome(){
  const p = loadP(); const day = (p.days||{})[todayISO()]||{n:0,ok:0};
  const w = weakest();
  app.innerHTML = `<div class="head"><h2>الأزواج الدنيا</h2><span class="rstreak">اليوم ${day.ok}/${day.n} صحيح · ${Object.keys(p.pairs||{}).length} زوجاً مجرَّباً</span></div>
  <div class="quiz"><div class="q" style="text-align:center">
    <div class="empty">جولة من ${ROUNDS} كلمات — تسمع كلمة من زوج وتختار أيهما سمعت.</div>
    ${ttsOn()? '' : '<div style="color:var(--gold);font-size:12px;margin-top:6px">النطق غير متاح بجهازك — فعّل أصوات النظام لهذا التمرين.</div>'}
    <button class="btn" style="padding:12px 30px;margin-top:8px" onclick="startRound()">ابدأ الجولة ←</button>
  </div></div>
  ${w.length? `<div class="head" style="margin-top:18px"><h2>أضعف ${w.length} أزواج</h2></div>
  <div class="card"><div class="body">${w.map(x=>`<div class="pbar"><span class="pw">${esc(x.k)}</span><span class="ptr"><span class="pfl" style="width:${100-x.pct}%"></span></span><span class="pv">${x.pct}% (${x.n})</span></div>`).join('')}</div></div>`:''}
  <div class="rlnks" style="margin-top:18px"><a href="dictation.html">إملاء صوتي</a><a href="mimic.html">قلّد</a><a href="practice.html">تمرين اليوم</a></div>`;
}
function startRound(){
  rq = [];
  const idx = new Set();
  while(rq.length < ROUNDS && idx.size < PAIRS.length){
    const i = Math.floor(Math.random()*PAIRS.length);
    if(idx.has(i)) continue;
    idx.add(i); rq.push(i);
  }
  ri = 0; rscore = 0;
  nextPair();
}
function nextPair(){
  const pi = rq[ri];
  const pair = PAIRS[pi];
  const heard = Math.floor(Math.random()*2);
  cur = {pair, heard, key: `${pair[0]}/${pair[1]}`};
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>كلمة ${ri+1}/${rq.length}</h2><span style="color:var(--muted)">صحي�� ${rscore}</span></div>
  <div class="q" style="text-align:center">
    <div class="empty">استمع ثم اختر ما سمعت:</div>
    <button class="btn" style="padding:10px 24px;margin:8px 0" onclick="speak(PAIRS[${pi}][${heard}])">🔊 شغّل الكلمة</button>
    <div class="opts" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px">
      ${pair.map((w,i)=>`<button class="btn" style="padding:16px;font-size:20px;direction:ltr" onclick="ansPair(${i},this)">${w}</button>`).join('')}
    </div>
    <div id="pRes"></div>
  </div></div>`;
  setTimeout(()=>speak(PAIRS[pi][heard]), 150);
}
function ansPair(i, btn){
  const ok = i === cur.heard;
  const p = loadP();
  const day = ((p.days ||= {})[todayISO()] ||= {n:0,ok:0});
  day.n++; if(ok) day.ok++;
  const wp = ((p.pairs ||= {})[cur.key] ||= {n:0,ok:0});
  wp.n++; if(ok) wp.ok++;
  saveP(p);
  document.querySelectorAll('#app .opts .btn').forEach(b=>b.disabled=true);
  btn.style.background = ok?'var(--ok)':'var(--bad)';
  if(ok) rscore++;
  document.getElementById('pRes').innerHTML = `<div style="margin-top:10px;color:${ok?'var(--ok)':'var(--bad)'};font-size:14px">
    ${ok?'صحيح ✓':`سمعت «<b dir="ltr">${esc(cur.pair[cur.heard])}</b>» لا «<b dir="ltr">${esc(cur.pair[i])}</b>»`}
    <button class="btn" style="display:block;margin:10px auto 0" onclick="skipPair()">${ri+1<rq.length?'التالية ←':'النتيجة ←'}</button></div>`;
}
function skipPair(){
  ri++;
  if(ri < rq.length){ nextPair(); return; }
  const pct = Math.round(rscore/rq.length*100);
  const w = weakest();
  app.innerHTML = `<div class="quiz"><div class="q" style="text-align:center">
    <div class="empty">النتيجة: ${rscore}/${rq.length} (${pct}%)</div>
    <div class="grades"><button class="btn" onclick="viewHome()">المختبر ←</button><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="startRound()">جولة أخرى</button></div>
  </div></div>
  ${w.length? `<div class="head" style="margin-top:16px"><h2>أضعف ${w.length} أزواج</h2></div>
  <div class="card"><div class="body">${w.map(x=>`<div class="pbar"><span class="pw">${esc(x.k)}</span><span class="ptr"><span class="pfl" style="width:${100-x.pct}%"></span></span><span class="pv">${x.pct}% (${x.n})</span></div>`).join('')}</div></div>`:''}`;
}

viewHome();
