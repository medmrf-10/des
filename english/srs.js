/* جلسة مراجعة مفردات FSRS — المصدر: بنك الكلمات + كلمات التعرض — التخزين: en_srs */
const app = document.getElementById('app');
const $ = s => document.querySelector(s);
const SRS_KEY = 'en_srs';

function loadSrs(){ try{ return JSON.parse(localStorage.getItem(SRS_KEY)||'{}'); }catch(e){ return {}; } }
function saveSrs(s){ localStorage.setItem(SRS_KEY, JSON.stringify(s)); }

/* مفردات البطاقات: كلمة → {en,ar,clip} من بنك الكلمات + feedSeen محلولة عبر مقاطع المكتبة */
function wordMap(){
  const m = {};
  for(const c of CLIPS) for(const s of (c.sentences||[])) for(const [e,a] of (s.words||[])){
    const t = normTok(e);
    if(t.length>1 && !m[t]) m[t] = {en:e, ar:a||'', clip:c.id};
  }
  return m;
}
function pool(){
  const wm = wordMap(), p = {};
  Object.values(loadBank()).forEach(w=>{
    const t = normTok(w.en);
    if(t) p[t] = {en:w.en, ar:w.ar||'', clip:w.clip||''};
  });
  JSON.parse(localStorage.getItem(SEEN_KEY)||'[]').forEach(t=>{
    if(!p[t] && wm[t]) p[t] = {en:wm[t].en, ar:wm[t].ar, clip:wm[t].clip};
  });
  return p;
}
function dueTokens(srs, p){
  return Object.keys(p).filter(t=>{
    const c = srs[t];
    return !c || c.state==='new' || !c.lastReview || !c.nextReview || c.nextReview <= todayISO();
  }).sort((a,b)=>((srs[a]||{}).nextReview||'').localeCompare((srs[b]||{}).nextReview||''));
}

/* ---------- شاشة البداية ---------- */
function viewHome(){
  const srs = loadSrs(), p = pool();
  const due = dueTokens(srs, p);
  const learned = Object.values(srs).filter(c=>c.repetitions>0).length;
  const lapses = Object.values(srs).reduce((s,c)=>s+(c.lapses||0),0);
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>مراجعة المفردات (FSRS)</h2><span class="rstreak">مستحق اليوم: ${due.length}</span></div>
  <div class="q" style="text-align:center">
    <div class="rstats">
      <div class="rstat"><b>${Object.keys(p).length}</b><span>كلمة في المخزون</span></div>
      <div class="rstat"><b>${learned}</b><span>متعلَّمة</span></div>
      <div class="rstat"><b>${lapses}</b><span>سقوط</span></div>
    </div>
    ${due.length? `<button class="btn" style="font-size:16px;padding:14px 34px" onclick="startSession()">ابدأ الجلسة ← ${Math.min(due.length,25)} بطاقة</button>`
      : `<div class="empty">لا شيء مستحق اليوم — عُد غداً أو تعرّض لمقاطع جديدة في <a href="index.html#/short" style="color:var(--gold-soft)">ShortForm</a>.</div>`}
    <div class="rlnks" style="margin-top:20px">
      <a href="index.html#/bank">بنك الكلمات</a><a href="library.html">الفهرس</a><a href="routine.html">روتين اليوم</a>
    </div>
  </div></div>`;
}

/* ---------- الجلسة ---------- */
let Q = [], done = 0;
function startSession(){
  const srs = loadSrs(), p = pool();
  Q = dueTokens(srs, p).slice(0, 25).map(t=>({tok:t, ...p[t]}));
  done = 0;
  drawCard();
}
function drawCard(){
  const it = Q[0];
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>جلسة المراجعة</h2><span style="color:var(--muted)">متبقية: ${Q.length} · أُنجزت: ${done}</span></div>
  <div class="q" style="text-align:center">
    <div class="en" style="font-size:30px;margin:18px 0;direction:ltr">${esc(it.en)}</div>
    <div id="back" style="display:none">
      <div style="color:var(--gold-soft);font-size:19px;margin-bottom:8px">${esc(it.ar)||'—'}</div>
      <div class="grades">${[['سقط',1],['صعب',3],['جيد',4],['سهل',5]].map(([t,q])=>{
        const cur = loadSrs()[it.tok] || {repetitions:0,ease:2.5,interval:0,lastReview:null};
        const nx = window.FSRS.schedule({repetitions:cur.repetitions, ease:cur.ease, interval:cur.interval, lastReview:cur.lastReview, quality:q});
        return `<button class="btn" onclick="gradeSrs(${q})"><span style="display:block;font-size:11px;opacity:.75">${nx.newInterval}ي</span>${t}</button>`;
      }).join('')}</div>
    </div>
    <button class="btn" style="padding:12px 30px" onclick="document.getElementById('back').style.display='block';this.style.display='none'">أعرفها؟ اقلب البطاقة</button>
  </div></div>`;
}
function gradeSrs(q){
  const it = Q[0];
  const srs = loadSrs();
  const cur = srs[it.tok] || {en:it.en, ar:it.ar, clip:it.clip, repetitions:0, ease:2.5, interval:0, lastReview:null, lapses:0, state:'new'};
  const res = window.FSRS.schedule({repetitions:cur.repetitions, ease:cur.ease, interval:cur.interval, lastReview:cur.lastReview, quality:q}, {fuzz:true});
  srs[it.tok] = {en:it.en, ar:it.ar, clip:it.clip, repetitions:res.repetitions, ease:res.newEase, interval:res.newInterval,
    lastReview:todayISO(), nextReview:res.nextReview, lapses:res.lapses, state:res.state};
  saveSrs(srs);
  done++;
  Q.shift();
  if(!Q.length){ viewEnd(); return; }
  drawCard();
}
function viewEnd(){
  const srs = loadSrs(), p = pool();
  const left = dueTokens(srs, p).length;
  app.innerHTML = `<div class="quiz"><div class="score">أنجزت ${done} بطاقة</div>
  <div class="empty" style="text-align:center">
    ${left? `تبقّى مستحق: ${left} — <button class="btn" onclick="startSession()">جولة أخرى ←</button>` : 'أنهيت مستحق اليوم كلّه.'}
    <br><br><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewHome()">العودة ←</button>
  </div></div>`;
}

viewHome();
