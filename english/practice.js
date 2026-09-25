/* تمرين اليوم — قمرة التدريب: ثلاث مهام يومية
   (1) قلّد جملة قصة (TTS + تسجيل + تقييم ذاتي) (2) 5 بطاقات en_srs مستحقة (3) مقطع مكتبة
   الإنجاز يُسجَّل في en_routine[اليوم].t = {sh,srs,seg} — لا يمس حقول v,d,r الخاصة بروتين اليوم */
const app = document.getElementById('app');
const $ = s => document.querySelector(s);
const SRS_KEY = 'en_srs';

function loadR(){ try{ return JSON.parse(localStorage.getItem(ROUTINE_KEY)||'{}'); }catch(e){ return {}; } }
function saveR(r){ localStorage.setItem(ROUTINE_KEY, JSON.stringify(r)); }
function taskState(){
  const r = loadR();
  const d = r[todayISO()] || {};
  return d.t || {};
}
function markTask(k, v){
  const r = loadR();
  const d = (r[todayISO()] ||= {v:0,d:0,r:0});
  (d.t ||= {})[k] = v===undefined ? 1 : v;
  saveR(r);
}
function loadSrs(){ try{ return JSON.parse(localStorage.getItem(SRS_KEY)||'{}'); }catch(e){ return {}; } }
function saveSrs(s){ localStorage.setItem(SRS_KEY, JSON.stringify(s)); }
function ttsOn(){ try{ return speechSynthesis.getVoices().some(v=>/^en([-_]|$)/i.test(v.lang)); }catch(e){ return false; } }
function speak(t){ try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=0.9; speechSynthesis.speak(u); }catch(e){} }

/* مخزون SRS — نفس منطق srs.js (بنك الكلمات + feedSeen) */
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
  Object.values(loadBank()).forEach(w=>{ const t=normTok(w.en); if(t) p[t]={en:w.en, ar:w.ar||'', prio:w.prio||0}; });
  JSON.parse(localStorage.getItem(SEEN_KEY)||'[]').forEach(t=>{ if(!p[t]&&wm[t]) p[t]={en:wm[t].en, ar:wm[t].ar, prio:0}; });
  return p;
}
function dueTokens(srs, p){
  return Object.keys(p).filter(t=>{ const c=srs[t]; return !c || c.state==='new' || !c.nextReview || c.nextReview<=todayISO(); })
    .sort((a,b)=>((p[b].prio||0)-(p[a].prio||0)) || ((srs[a]||{}).nextReview||'').localeCompare((srs[b]||{}).nextReview||''));
}
/* مقطع اليوم: الأعلى كلمات غير مرئية في feedSeen */
function pickClip(){
  const seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'));
  let best = CLIPS[0], bu = -1;
  for(const c of CLIPS){
    const ws = new Set();
    (c.sentences||[]).forEach(s=>(s.words||[]).forEach(w=>{const t=normTok(w[0]); if(t.length>1) ws.add(t)}));
    const un = [...ws].filter(t=>!seen.has(t)).length;
    if(un > bu){ bu = un; best = c; }
  }
  return best;
}

/* ---------- الرئيسية ---------- */
function viewHome(){
  const t = taskState();
  const done = (t.sh?1:0)+(t.seg?1:0)+(t.srs>=5?1:0);
  const srsDue = dueTokens(loadSrs(), pool()).length;
  const card = (title, desc, n, ok, onclick) => `<div class="card"><div class="body">
    <h3>${title} ${ok?'<span style="color:var(--ok)">✓</span>':''}</h3>
    <div class="meta"><span>${desc}</span><span>${n}</span></div>
    <button class="btn" style="margin-top:8px" ${ok?'disabled style="margin-top:8px;opacity:.5"':''} onclick="${onclick}">${ok?'أُنجزت':'ابدأ'} ${ok?'':'←'}</button>
  </div></div>`;
  app.innerHTML = `<div class="head"><h2>مهام اليوم</h2><span class="rstreak">${done}/3 مكتملة</span></div>
  ${done===3? `<div class="card"><div class="body" style="text-align:center;color:var(--ok)">أنجزت قمرة اليوم — عُد غداً.</div></div>`:''}
  <div class="grid">
    ${card('قلّد جملة','جملة قصة — استمع وسجّل وقيّم', '~2د', !!t.sh, 'taskShadow()')}
    ${card('راجع مفردات','بطاقات en_srs مستحقة', `${Math.min(t.srs||0,5)}/5 · مستحق ${srsDue}`, (t.srs||0)>=5, 'taskSrs()')}
    ${card('شاهد مقطعاً','مقطع المكتبة الأقل مشاهدة', '~1د', !!t.seg, 'taskSeg()')}
  </div>
  <div class="rlnks" style="margin-top:18px"><a href="mimic.html">قلّد</a><a href="srs.html">مفردات SRS</a><a href="library.html">الفهرس</a><a href="story.html">القصص</a></div>`;
}

/* ---------- مهمة 1: تقليد جملة قصة ---------- */
let sh = null, stream = null, rec = null, chunks = [];
function taskShadow(){
  const st = STORIES[Math.floor(Math.random()*STORIES.length)];
  const i = Math.floor(Math.random()*st.sentences.length);
  sh = {st, i, s: st.sentences[i]};
  const sent = sh.s;
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>قلّد الجملة — ${esc(st.titleAr)}</h2><span style="color:var(--muted)">استمع ثم سجّل إعادتك</span></div>
  <div class="q">
    <div class="en" dir="ltr" style="font-size:20px;margin:14px 0;text-align:left">${esc(sent.en)}</div>
    <div style="color:var(--gold-soft);font-size:14px;margin-bottom:10px">${esc(sent.ar)}</div>
    <div class="grades">
      ${ttsOn()? `<button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="speak(sh.s.en)">🔊 استمع</button>`:''}
      <button class="btn" id="recb" onclick="toggleRecP()">⏺ سجّل إعادتك</button>
    </div>
    <div id="recZone" style="margin-top:10px"></div>
    <div id="gradeZone" style="display:none;margin-top:12px">
      <div style="color:var(--muted);font-size:12px;margin-bottom:6px">قيّم تقليدك — ممتاز/متوسط يُنهي المهمة:</div>
      <div class="grades">
        <button class="btn" onclick="gradeShadow('x')">ممتاز ←</button>
        <button class="btn" onclick="gradeShadow('m')">متوسط ←</button>
        <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="taskShadow()">جملة أخرى</button>
      </div>
    </div>
    <div class="grades" style="margin-top:12px"><button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewHome()">المهام ←</button></div>
  </div></div>`;
}
async function toggleRecP(){
  const b = $('#recb');
  if(rec && rec.state==='recording'){ rec.stop(); return; }
  if(!stream){
    try{ stream = await navigator.mediaDevices.getUserMedia({audio:true}); }
    catch(e){
      $('#recZone').innerHTML = `<div class="empty">الميكروفون غير متاح — يمكنك التقييم الذاتي بعد الاستماع.</div>`;
      $('#gradeZone').style.display = 'block';
      return;
    }
  }
  chunks = [];
  rec = new MediaRecorder(stream);
  rec.ondataavailable = e => chunks.push(e.data);
  rec.onstop = ()=>{
    const blob = new Blob(chunks, {type: rec.mimeType || 'audio/webm'});
    const url = URL.createObjectURL(blob);
    $('#recZone').innerHTML = `<div style="display:flex;align-items:center;gap:8px"><span style="color:var(--muted);font-size:12px">تسجيلك:</span><audio controls src="${url}" style="height:34px"></audio></div>`;
    $('#gradeZone').style.display = 'block';
    b.textContent = '⏺ سجّل مجدداً';
  };
  rec.start();
  b.textContent = '⏹ أوقف التسجيل';
  $('#gradeZone').style.display = 'none';
}
function gradeShadow(g){
  /* سجّل في en_mimic أيضاً بمفتاح story: — كي لا يصطدم بمفاتيح مقاطع المكتبة */
  try{
    const m = JSON.parse(localStorage.getItem('en_mimic')||'{}');
    m[`story:${sh.st.id}:${sh.i}`] = {g, n:1, ts:Date.now()};
    localStorage.setItem('en_mimic', JSON.stringify(m));
  }catch(e){}
  if(g==='x'||g==='m'){ markTask('sh'); viewHome(); }
}

/* ---------- مهمة 2: 5 بطاقات SRS ---------- */
let sq = [], sdone = 0;
function taskSrs(){
  const p = pool();
  sq = dueTokens(loadSrs(), p).slice(0,5).map(t=>({tok:t, ...p[t]}));
  sdone = taskState().srs || 0;
  if(!sq.length){ app.innerHTML = `<div class="quiz"><div class="empty">لا بطاقات مستحقة.</div><button class="btn" onclick="viewHome()">المهام ←</button></div>`; return; }
  drawPCard();
}
function drawPCard(){
  const it = sq[0];
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>راجع مفردات</h2><span style="color:var(--muted)">متبقية: ${sq.length} · أُنجزت اليوم: ${sdone}/5</span></div>
  <div class="q" style="text-align:center">
    <div class="en" style="font-size:30px;margin:18px 0;direction:ltr">${esc(it.en)}</div>
    <div id="back" style="display:none">
      <div style="color:var(--gold-soft);font-size:19px;margin-bottom:8px">${esc(it.ar)||'—'}</div>
      <div class="grades">${[['سقط',1],['صعب',3],['جيد',4],['سهل',5]].map(([t,q])=>`<button class="btn" onclick="gradePCard(${q})">${t}</button>`).join('')}</div>
    </div>
    <button class="btn" style="padding:12px 30px" onclick="document.getElementById('back').style.display='block';this.style.display='none'">أعرفها؟ اقلب البطاقة</button>
  </div></div>`;
}
function gradePCard(q){
  const it = sq[0];
  const srs = loadSrs();
  const cur = srs[it.tok] || {repetitions:0, ease:2.5, interval:0, lastReview:null, lapses:0, state:'new'};
  const res = window.FSRS.schedule({repetitions:cur.repetitions, ease:cur.ease, interval:cur.interval, lastReview:cur.lastReview, quality:q}, {fuzz:true});
  srs[it.tok] = {en:it.en, ar:it.ar, repetitions:res.repetitions, ease:res.newEase, interval:res.newInterval,
    lastReview:todayISO(), nextReview:res.nextReview, lapses:res.lapses, state:res.state};
  saveSrs(srs);
  /* أولوية الإملاء تُستهلك */
  const b = loadBank(); if(b[it.tok]?.prio){ delete b[it.tok].prio; localStorage.setItem(BANK_LS, JSON.stringify(b)); }
  sdone++; markTask('srs', Math.min(sdone,5));
  sq.shift();
  if(!sq.length){ viewHome(); return; }
  drawPCard();
}

/* ---------- مهمة 3: مقطع المكتبة ---------- */
function taskSeg(){
  const c = pickClip();
  const ws = new Set();
  (c.sentences||[]).forEach(s=>(s.words||[]).forEach(w=>{const t=normTok(w[0]); if(t.length>1) ws.add(t)}));
  app.innerHTML = `<div class="quiz">
  <div class="head"><h2>شاهد المقطع — ${esc(c.title)}</h2><span style="color:var(--muted)">${c.sentences.length} جمل · ${ws.size} كلمة</span></div>
  <div class="q">
    <div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/${c.id}" title="watch" allowfullscreen></iframe></div>
    <div class="grades" style="margin-top:12px">
      <button class="btn" onclick="segDone('${c.id}')">شاهدته ←</button>
      <button class="btn" style="background:var(--navy-3);color:var(--gold-soft)" onclick="viewHome()">المهام ←</button>
    </div>
  </div></div>`;
}
function segDone(cid){
  const c = CLIPS.find(x=>x.id===cid);
  /* سجّل كلمات المقطع كتعرّض — مثل markFeedCard في feed */
  try{
    const seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'));
    (c.sentences||[]).forEach(s=>(s.words||[]).forEach(w=>{const t=normTok(w[0]); if(t.length>1) seen.add(t)}));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  }catch(e){}
  markTask('seg');
  viewHome();
}

viewHome();
