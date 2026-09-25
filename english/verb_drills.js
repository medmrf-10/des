/* أفعال شاذة — 40 فعلاً بثلاثة أوضاع: بطاقة ← كتابة ← جملة
   en_verbs: {verbs:{base:{n,ok}}, days:{date:{n,ok}}} + طابور أضعف 8 */
const app = document.getElementById('app');
const $ = s => document.querySelector(s);
const VB_LS = 'en_verbs';

const VERBS = [
['go','went','gone','ذهب'],['eat','ate','eaten','أكل'],['see','saw','seen','رأى'],['take','took','taken','أخذ'],
['come','came','come','جاء'],['get','got','gotten','حصل على'],['give','gave','given','أعطى'],['know','knew','known','عرف'],
['think','thought','thought','فكّر'],['find','found','found','وجد'],['tell','told','told','أخبر'],['become','became','become','أصبح'],
['leave','left','left','غادر'],['feel','felt','felt','شعر'],['put','put','put','وضع'],['bring','brought','brought','أحضر'],
['begin','began','begun','بدأ'],['keep','kept','kept','احتفظ'],['hold','held','held','أمسك'],['write','wrote','written','كتب'],
['stand','stood','stood','وقف'],['hear','heard','heard','سمع'],['let','let','let','ترك/سمح'],['mean','meant','meant','قصد'],
['set','set','set','ثبّت/وضع'],['meet','met','met','قابل'],['run','ran','run','ركض'],['pay','paid','paid','دفع'],
['sit','sat','sat','جلس'],['speak','spoke','spoken','تحدّث'],['lie','lay','lain','استلقى'],['lead','led','led','قاد'],
['read','read','read','قرأ'],['grow','grew','grown','نما'],['lose','lost','lost','خسر'],['fall','fell','fallen','سقط'],
['send','sent','sent','أرسل'],['build','built','built','بنى'],['understand','understood','understood','فهم'],['buy','bought','bought','اشترى']
];

function loadV(){ try{ return JSON.parse(localStorage.getItem(VB_LS)||'{}'); }catch(e){ return {}; } }
function saveV(s){ localStorage.setItem(VB_LS, JSON.stringify(s)); }
function ttsOn(){ try{ return speechSynthesis.getVoices().some(v=>/^en([-_]|$)/i.test(v.lang)); }catch(e){ return false; } }
function speak(t){ if(!ttsOn()) return; try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.9; speechSynthesis.speak(u); }catch(e){} }
function toastMsg(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),1800); }
const tok = s => normTok(s);

function record(base, ok){
  const d = loadV();
  (d.verbs ||= {}); (d.days ||= {});
  const v = d.verbs[base] ||= {n:0,ok:0};
  v.n++; if(ok) v.ok++;
  const day = d.days[todayISO()] ||= {n:0,ok:0};
  day.n++; if(ok) day.ok++;
  saveV(d);
}
function weakest(){
  const d = loadV();
  return VERBS.map(v=>{
    const r = (d.verbs||{})[v[0]] || {n:0,ok:0};
    return {v, n:r.n, pct:r.n? Math.round(r.ok/r.n*100) : 100};
  }).filter(x=>x.n>=1 && x.pct<100).sort((a,b)=>a.pct-b.pct || b.n-a.n).slice(0,8);
}

/* ---------- حالة الجلسة ---------- */
let queue = [], qi = 0, mode = '', flipped = false;

function shuffled(arr){ const a=[...arr]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

/* ---------- الرئيسية ---------- */
function viewHome(){
  const d = loadV();
  const today = (d.days||{})[todayISO()] || {n:0,ok:0};
  const w = weakest();
  const seen = Object.keys(d.verbs||{}).length;
  app.innerHTML = `
  <div class="head"><h2>الأفعال الشاذة</h2><span class="muted">اليوم: ${today.ok} صحيحة · ${today.n} محاولة</span></div>
  <div class="card"><div class="body" style="text-align:center">
    احفظ تصريفات <b>40 فعلاً شاذاً</b> على ٣ مراحل: بطاقة للحفظ ← كتابة الماضي والتصريف ← فراغ في جملة.
    <div class="muted" style="font-size:13px;margin-top:8px">مثال محلول:</div>
    <div dir="ltr" style="background:var(--navy-3);border-radius:10px;padding:8px 14px;display:inline-block;font-size:16px;margin-top:2px">
      <b style="color:var(--gold)">go</b> → <b>went</b> → <b>gone</b> <span class="muted">= ذهب</span>
    </div>
    ${seen?`<div class="muted" style="font-size:13px;margin-top:6px">غطّيت ${seen}/40 فعلاً.</div>`:''}
    ${!ttsOn()?'<div class="muted" style="color:var(--warn);margin-top:6px">النطق غير متاح بجهازك — البطاقات تعمل بصرياً فقط.</div>':''}
    <div class="grades" style="justify-content:center;margin-top:10px">
      <button class="btn" style="font-size:16px;padding:12px 30px" onclick="startSession('flash')">ابدأ — بطاقات ←</button>
    </div>
    <div class="muted" style="font-size:13px;margin-top:6px">أو تدرّب مباشرة:
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft);font-size:13px;padding:6px 12px" onclick="startSession('type')">اكتب التصريف (10)</button>
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft);font-size:13px;padding:6px 12px" onclick="startSession('sent')">أكمل الجملة (10)</button>
    </div>
  </div></div>
  ${w.length?`
  <div class="head"><h2>أضعف ${w.length} أفعال — طابور مراجعة</h2></div>
  <div class="card"><div class="body">
    ${w.map(x=>`<div class="vbar"><span class="vw" dir="ltr">${x.v[0]} / ${x.v[1]} / ${x.v[2]}</span><span class="vtr"><span class="vfl" style="width:${100-x.pct}%"></span></span><span class="vv">${x.pct}% (${x.n})</span></div>`).join('')}
    <div class="grades"><button class="btn" onclick="startReview()">راجع أضعف ${w.length} ←</button></div>
  </div></div>`:''}`;
}

/* ---------- الجلسة ---------- */
function startSession(m, verbs){
  mode = m;
  const pool = verbs || shuffled(VERBS);
  queue = m==='flash' ? pool : pool.slice(0, Math.min(10, pool.length));
  qi = 0; nextVerb();
}
function startReview(){
  const w = weakest();
  if(!w.length){ toastMsg('لا أفعال ضعيفة بعد'); return; }
  startSession('type', w.map(x=>x.v));
}

function nextVerb(){
  if(qi >= queue.length){ endSession(); return; }
  const v = queue[qi];
  flipped = false;
  if(mode==='flash') renderFlash(v);
  else if(mode==='type') renderType(v);
  else renderSent(v);
}

/* بطاقة */
function renderFlash(v){
  app.innerHTML = `
  <div class="head"><h2>بطاقة ${qi+1}/${queue.length}</h2><span class="muted">اقلب البطاقة وقيّم نفسك</span></div>
  <div class="quiz"><div class="q" style="text-align:center">
    <div dir="ltr" style="font-size:30px;font-weight:700;color:var(--gold)">${esc(v[0])}</div>
    <div class="muted" style="margin:4px 0">${esc(v[3])}</div>
    <div id="vFlip"></div>
    <div class="grades">
      <button class="btn" id="vShow" onclick="flipVerb()">اكشف التصريفات</button>
      ${ttsOn()?`<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="speak('${v[0]}, ${v[1]}, ${v[2]}')">🔊</button>`:''}
    </div>
  </div></div>`;
}
function flipVerb(){
  const v = queue[qi]; flipped = true;
  document.getElementById('vFlip').innerHTML = `
    <div dir="ltr" style="font-size:20px;margin:10px 0"><span class="vform">${esc(v[1])}</span> · <span class="vform">${esc(v[2])}</span></div>`;
  document.getElementById('vShow').outerHTML = `
    <button class="btn" style="background:var(--ok);color:#081018" onclick="gradeFlash(1)">عرفتها ✓</button>
    <button class="btn" style="background:var(--bad);color:#fff" onclick="gradeFlash(0)">لم أعرف ✗</button>`;
}
function gradeFlash(ok){ record(queue[qi][0], !!ok); qi++; nextVerb(); }

/* كتابة */
function renderType(v){
  app.innerHTML = `
  <div class="head"><h2>تصريف ${qi+1}/${queue.length}</h2><span class="muted">اكتب الماضي والتصريف الثالث</span></div>
  <div class="quiz"><div class="q" style="text-align:center">
    <div dir="ltr" style="font-size:28px;font-weight:700;color:var(--gold)">${esc(v[0])}</div>
    <div class="muted" style="margin:4px 0">${esc(v[3])}</div>
    <div style="display:flex;gap:10px;justify-content:center;margin:14px 0;direction:ltr">
      <input class="inp" id="vPast" placeholder="past" autocomplete="off">
      <input class="inp" id="vPp" placeholder="past participle" autocomplete="off">
    </div>
    <div class="grades"><button class="btn" onclick="checkType()">تحقق</button></div>
    <div id="vRes"></div>
  </div></div>`;
  const f = document.getElementById('vPast'); f.focus();
  ['vPast','vPp'].forEach(id=>document.getElementById(id).addEventListener('keydown',e=>{ if(e.key==='Enter') checkType(); }));
}
function checkType(){
  const v = queue[qi];
  const p = document.getElementById('vPast'), pp = document.getElementById('vPp');
  if(p.disabled) return;
  const mp = wmatch(tok(v[1]), tok(p.value));
  const mq = wmatch(tok(v[2]), tok(pp.value));
  p.disabled = pp.disabled = true;
  p.style.borderColor = mp===1?'var(--ok)': mp===0.5?'var(--warn)':'var(--bad)';
  pp.style.borderColor = mq===1?'var(--ok)': mq===0.5?'var(--warn)':'var(--bad)';
  const ok = mp>=0.5 && mq>=0.5;
  record(v[0], ok);
  document.getElementById('vRes').innerHTML = `<div style="margin-top:10px;color:${ok?'var(--ok)':'var(--bad)'};font-size:14px">
    ${ok?'صحيح ✓':`الصحيح: <b dir="ltr">${esc(v[0])} / ${esc(v[1])} / ${esc(v[2])}</b>`}
    <button class="btn" style="display:block;margin:10px auto 0" onclick="nextVerb()">${qi+1<queue.length?'التالي ←':'النتيجة ←'}</button></div>`;
}

/* جملة */
const SENT_TPL_PAST = ['Yesterday he ___ before sunset.','Last week she ___ it twice.','They ___ early that morning.','He ___ and then left.'];
const SENT_TPL_PP = ['I have ___ it before.','She has ___ everything.','They had ___ by then.','He has ___ already.'];
function sentFrame(v){
  for(const st of STORIES) for(const s of st.sentences){
    const ws = s.en.match(/[a-zA-Z']+/g)||[];
    for(let k=0;k<ws.length;k++){
      if(tok(ws[k])===tok(v[1]) || tok(ws[k])===tok(v[2])){
        const ms=[...s.en.matchAll(/[a-zA-Z']+/g)]; const m=ms[k];
        return {text:s.en.slice(0,m.index)+'___'+s.en.slice(m.index+m[0].length), form:tok(ws[k])===tok(v[1])?v[1]:v[2], clue:s.ar, src:'القصص'};
      }
    }
  }
  for(const c of CLIPS) for(const s of c.sentences){
    const ws = s.text.match(/[a-zA-Z']+/g)||[];
    for(let k=0;k<ws.length;k++){
      if(tok(ws[k])===tok(v[1]) || tok(ws[k])===tok(v[2])){
        const ms=[...s.text.matchAll(/[a-zA-Z']+/g)]; const m=ms[k];
        return {text:s.text.slice(0,m.index)+'___'+s.text.slice(m.index+m[0].length), form:tok(ws[k])===tok(v[1])?v[1]:v[2], clue:'', src:c.title};
      }
    }
  }
  const past = Math.random()<0.6;
  const tpl = past? SENT_TPL_PAST[qi%SENT_TPL_PAST.length] : SENT_TPL_PP[qi%SENT_TPL_PP.length];
  return {text:tpl, form:past?v[1]:v[2], clue:'', src:''};
}
function renderSent(v){
  const f = sentFrame(v);
  window._vf = f;
  app.innerHTML = `
  <div class="head"><h2>أكمل الجملة ${qi+1}/${queue.length}</h2><span class="muted">${esc(v[0])} — ${esc(v[3])}</span></div>
  <div class="quiz"><div class="q">
    <div dir="ltr" style="font-size:18px;margin:6px 0">${esc(f.text)}</div>
    ${f.clue?`<div class="muted" style="font-size:13px">${esc(f.clue)}</div>`:''}
    <div style="display:flex;gap:10px;align-items:center;margin-top:12px">
      <input class="inp" dir="ltr" id="vSent" placeholder="التصريف المناسب؟" autocomplete="off" style="flex:1;max-width:200px">
      <span class="muted">«${esc(v[0])}»</span>
    </div>
    <div class="grades"><button class="btn" onclick="checkSent()">تحقق</button></div>
    <div id="vRes"></div>
  </div></div>`;
  const i = document.getElementById('vSent'); i.focus();
  i.addEventListener('keydown',e=>{ if(e.key==='Enter') checkSent(); });
}
function checkSent(){
  const v = queue[qi], f = window._vf;
  const i = document.getElementById('vSent');
  if(i.disabled) return;
  const m = wmatch(tok(f.form), tok(i.value));
  i.disabled = true;
  i.style.borderColor = m===1?'var(--ok)': m===0.5?'var(--warn)':'var(--bad)';
  const ok = m>=0.5;
  record(v[0], ok);
  if(!ok) i.value = f.form;
  document.getElementById('vRes').innerHTML = `<div style="margin-top:10px;color:${ok?'var(--ok)':'var(--bad)'};font-size:14px">
    ${ok?'صحيح ✓':`الصحيح: <b dir="ltr">${esc(f.form)}</b> (${esc(v[0])} / ${esc(v[1])} / ${esc(v[2])})`}
    <button class="btn" style="display:block;margin:10px auto 0" onclick="nextVerb()">${qi+1<queue.length?'التالية ←':'النتيجة ←'}</button></div>`;
}

/* ---------- النهاية ---------- */
function endSession(){
  const w = weakest();
  app.innerHTML = `
  <div class="quiz"><div class="q" style="text-align:center">
    <div class="empty">انتهت الجولة — ${queue.length} فعلاً</div>
    <div class="grades"><button class="btn" onclick="viewHome()">الرئيسية ←</button><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="startSession('${mode}')">جولة أخرى</button></div>
  </div></div>
  ${w.length? `<div class="head" style="margin-top:16px"><h2>أضعف ${w.length} أفعال الآن</h2></div>
  <div class="card"><div class="body">${w.map(x=>`<div class="vbar"><span class="vw" dir="ltr">${x.v[0]} / ${x.v[1]} / ${x.v[2]}</span><span class="vtr"><span class="vfl" style="width:${100-x.pct}%"></span></span><span class="vv">${x.pct}% (${x.n})</span></div>`).join('')}</div></div>`:''}`;
}

viewHome();
